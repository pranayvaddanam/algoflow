"""End-to-end integration tests for the AlgoFlow payroll streaming system.

Validates the full lifecycle: deploy -> fund -> register -> stream -> withdraw.
Each test in TestFullFlow runs the entire flow from scratch, ensuring all
components work together correctly.
"""

# Standard library
import time
import uuid

# Third-party
import pytest
import algosdk
from algosdk.transaction import (
    AssetConfigTxn,
    wait_for_confirmation,
)
from algosdk.atomic_transaction_composer import TransactionWithSigner

# AlgoKit utilities
from algokit_utils import (
    AlgorandClient,
    AlgoAmount,
    AppFactory,
    AppFactoryParams,
    AppFactoryCreateMethodCallParams,
    AppClient,
    AppClientMethodCallParams,
    AppClientBareCallParams,
    Arc56Contract,
    AssetCreateParams,
    AssetOptInParams,
    PaymentParams,
)

# Path to compiled contract spec
APP_SPEC_PATH = "smart_contracts/payroll_stream/PayrollStream.arc56.json"

# Token configuration
PAYUSD_TOTAL_SUPPLY = 1_000_000_000_000  # 1M tokens with 6 decimals
PAYUSD_DECIMALS = 6
CONTRACT_FUND_AMOUNT = 100_000_000_000  # 100k PAYUSD
EMPLOYEE_HOURLY_RATE = 3_600_000_000  # 3600 PAYUSD/hr = 1M PAYUSD/sec for fast testing
MILESTONE_AMOUNT = 5_000_000  # 5 PAYUSD
NEW_HOURLY_RATE = 7_200_000_000  # 7200 PAYUSD/hr (doubled)

# Confirmation rounds
TX_CONFIRMATION_ROUNDS = 4


def advance_time(algorand: AlgorandClient, sender_address: str, seconds: int = 5):
    """Send dummy transactions to advance block time on LocalNet.

    Args:
        algorand: The AlgorandClient.
        sender_address: Address to send self-payments from.
        seconds: Number of seconds to advance (1 tx + 1s sleep per second).
    """
    for i in range(seconds):
        algorand.send.payment(
            PaymentParams(
                sender=sender_address,
                receiver=sender_address,
                amount=AlgoAmount.from_micro_algo(0),
                note=f"tick-{time.time()}-{i}-{uuid.uuid4()}".encode(),
            )
        )
        time.sleep(1)


class TestFullFlow:
    """Integration test: deploy -> fund -> register -> stream -> withdraw.

    This test validates the ENTIRE story of AlgoFlow in one continuous flow.
    """

    @pytest.fixture(scope="class")
    def algorand(self) -> AlgorandClient:
        """Create an AlgorandClient connected to LocalNet."""
        return AlgorandClient.default_localnet()

    @pytest.fixture(scope="class")
    def dispenser(self, algorand: AlgorandClient):
        """Get the LocalNet dispenser account."""
        return algorand.account.localnet_dispenser()

    @pytest.fixture(scope="class")
    def employer(self, algorand: AlgorandClient, dispenser):
        """Create and fund the employer account."""
        acct = algorand.account.random()
        algorand.account.ensure_funded(
            acct.address, dispenser.address, AlgoAmount.from_algo(1000)
        )
        return acct

    @pytest.fixture(scope="class")
    def app_spec(self) -> Arc56Contract:
        """Load the compiled ARC56 app spec."""
        with open(APP_SPEC_PATH) as f:
            return Arc56Contract.from_json(f.read())

    def test_full_payroll_flow(
        self,
        algorand: AlgorandClient,
        dispenser,
        employer,
        app_spec: Arc56Contract,
    ):
        """End-to-end test of the full payroll lifecycle.

        Steps:
            1.  Create PAYUSD ASA
            2.  Deploy PayrollStream contract
            3.  Fund contract with ALGO
            4.  Contract opts into ASA
            5.  Reconfigure clawback to contract
            6.  Fund contract with PAYUSD
            7.  Create employee, opt into ASA and app
            8.  Register employee with 3600 PAYUSD/hr
            9.  Wait for accrual
            10. Employee withdraws
            11. Verify employee received tokens
            12. Employer sends milestone payment
            13. Employer pauses stream
            14. Employer resumes stream
            15. Employer updates rate
            16. Employee withdraws again
            17. Employer removes employee with final payout
        """
        # ----------------------------------------------------------- #
        # Step 1: Create PAYUSD ASA
        # ----------------------------------------------------------- #
        result = algorand.send.asset_create(
            AssetCreateParams(
                sender=employer.address,
                total=PAYUSD_TOTAL_SUPPLY,
                decimals=PAYUSD_DECIMALS,
                unit_name="PAYUSD",
                asset_name="AlgoFlow USD",
                default_frozen=False,
                manager=employer.address,
                reserve=employer.address,
                freeze=employer.address,
                clawback=employer.address,
                note=f"integ:asa-create-{uuid.uuid4()}".encode(),
            )
        )
        asset_id = result.asset_id
        assert asset_id > 0, "ASA creation failed"

        # Verify ASA metadata
        asset_info = algorand.client.algod.asset_info(asset_id)
        params = asset_info["params"]
        assert params["name"] == "AlgoFlow USD"
        assert params["unit-name"] == "PAYUSD"
        assert params["decimals"] == PAYUSD_DECIMALS
        assert params["total"] == PAYUSD_TOTAL_SUPPLY
        assert params["clawback"] == employer.address

        # ----------------------------------------------------------- #
        # Step 2: Deploy PayrollStream contract
        # ----------------------------------------------------------- #
        factory = AppFactory(
            AppFactoryParams(
                algorand=algorand,
                app_spec=app_spec,
                default_sender=employer.address,
            )
        )

        app_client, _ = factory.send.create(
            AppFactoryCreateMethodCallParams(
                method="create",
                args=[asset_id],
                note=f"integ:deploy-{uuid.uuid4()}".encode(),
            )
        )
        assert app_client.app_id > 0, "Contract deployment failed"
        contract_address = app_client.app_address

        # Verify global state
        global_state = app_client.get_global_state()
        assert global_state["total_employees"].value == 0
        assert global_state["total_streamed"].value == 0
        assert global_state["is_paused"].value == 0

        # ----------------------------------------------------------- #
        # Step 3: Fund contract with ALGO
        # ----------------------------------------------------------- #
        algorand.send.payment(
            PaymentParams(
                sender=employer.address,
                receiver=contract_address,
                amount=AlgoAmount.from_algo(2),
                note=f"integ:mbr-{uuid.uuid4()}".encode(),
            )
        )

        acct_info = algorand.client.algod.account_info(contract_address)
        assert acct_info["amount"] >= 2_000_000, "Contract ALGO funding failed"

        # ----------------------------------------------------------- #
        # Step 4: Contract opts into ASA
        # ----------------------------------------------------------- #
        app_client.send.call(
            AppClientMethodCallParams(
                method="opt_in_asset",
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"integ:opt-in-{uuid.uuid4()}".encode(),
            )
        )

        asset_holding = algorand.client.algod.account_asset_info(
            contract_address, asset_id
        )
        assert asset_holding["asset-holding"]["asset-id"] == asset_id

        # ----------------------------------------------------------- #
        # Step 5: Reconfigure clawback to contract address
        # ----------------------------------------------------------- #
        sp = algorand.client.algod.suggested_params()
        config_txn = AssetConfigTxn(
            sender=employer.address,
            sp=sp,
            index=asset_id,
            manager=employer.address,
            reserve=employer.address,
            freeze=employer.address,
            clawback=contract_address,
            strict_empty_address_check=False,
            note=f"integ:clawback-{uuid.uuid4()}".encode(),
        )
        signed_config = config_txn.sign(employer.private_key)
        txid = algorand.client.algod.send_transaction(signed_config)
        wait_for_confirmation(algorand.client.algod, txid, TX_CONFIRMATION_ROUNDS)

        # Verify clawback was updated
        asset_info = algorand.client.algod.asset_info(asset_id)
        assert asset_info["params"]["clawback"] == contract_address

        # ----------------------------------------------------------- #
        # Step 6: Fund contract with PAYUSD
        # ----------------------------------------------------------- #
        sp = algorand.client.algod.suggested_params()
        axfer_txn = algosdk.transaction.AssetTransferTxn(
            sender=employer.address,
            sp=sp,
            receiver=contract_address,
            amt=CONTRACT_FUND_AMOUNT,
            index=asset_id,
            note=f"integ:fund-payusd-{uuid.uuid4()}".encode(),
        )
        signer = algorand.account.get_signer(employer.address)
        app_client.send.call(
            AppClientMethodCallParams(
                method="fund",
                args=[TransactionWithSigner(txn=axfer_txn, signer=signer)],
                note=f"integ:fund-call-{uuid.uuid4()}".encode(),
            )
        )

        contract_balance = algorand.client.algod.account_asset_info(
            contract_address, asset_id
        )
        assert contract_balance["asset-holding"]["amount"] == CONTRACT_FUND_AMOUNT

        # ----------------------------------------------------------- #
        # Step 7: Create employee, opt into ASA and app
        # ----------------------------------------------------------- #
        employee = algorand.account.random()
        algorand.account.ensure_funded(
            employee.address, dispenser.address, AlgoAmount.from_algo(10)
        )

        # Opt into ASA
        algorand.send.asset_opt_in(
            AssetOptInParams(sender=employee.address, asset_id=asset_id)
        )

        # Opt into app
        employee_client = app_client.clone(default_sender=employee.address)
        employee_client.send.bare.opt_in(
            AppClientBareCallParams(
                note=f"integ:emp-optin-{uuid.uuid4()}".encode(),
            )
        )

        # ----------------------------------------------------------- #
        # Step 8: Register employee with 3600 PAYUSD/hr
        # ----------------------------------------------------------- #
        app_client.send.call(
            AppClientMethodCallParams(
                method="register_employee",
                args=[employee.address, EMPLOYEE_HOURLY_RATE],
                note=f"integ:register-{uuid.uuid4()}".encode(),
            )
        )

        local_state = app_client.get_local_state(employee.address)
        assert local_state["salary_rate"].value == EMPLOYEE_HOURLY_RATE
        assert local_state["is_active"].value == 1
        assert local_state["stream_start"].value > 0
        assert local_state["total_withdrawn"].value == 0

        global_state = app_client.get_global_state()
        assert global_state["total_employees"].value == 1

        # ----------------------------------------------------------- #
        # Step 9: Wait for accrual (advance time)
        # ----------------------------------------------------------- #
        advance_time(algorand, employer.address, seconds=3)

        # ----------------------------------------------------------- #
        # Step 10: Employee withdraws
        # ----------------------------------------------------------- #
        result = employee_client.send.call(
            AppClientMethodCallParams(
                method="withdraw",
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"integ:withdraw1-{uuid.uuid4()}".encode(),
            )
        )
        first_withdrawal = result.abi_return
        assert first_withdrawal > 0, "First withdrawal should be positive"

        # ----------------------------------------------------------- #
        # Step 11: Verify employee received tokens
        # ----------------------------------------------------------- #
        emp_balance = algorand.client.algod.account_asset_info(
            employee.address, asset_id
        )
        assert emp_balance["asset-holding"]["amount"] == first_withdrawal

        local_state = app_client.get_local_state(employee.address)
        assert local_state["total_withdrawn"].value == first_withdrawal

        global_state = app_client.get_global_state()
        assert global_state["total_streamed"].value == first_withdrawal

        # ----------------------------------------------------------- #
        # Step 12: Employer sends milestone payment
        # ----------------------------------------------------------- #
        streamed_before_milestone = global_state["total_streamed"].value

        app_client.send.call(
            AppClientMethodCallParams(
                method="milestone_pay",
                args=[employee.address, MILESTONE_AMOUNT],
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"integ:milestone-{uuid.uuid4()}".encode(),
            )
        )

        emp_balance = algorand.client.algod.account_asset_info(
            employee.address, asset_id
        )
        assert emp_balance["asset-holding"]["amount"] == first_withdrawal + MILESTONE_AMOUNT

        global_state = app_client.get_global_state()
        assert global_state["total_streamed"].value == streamed_before_milestone + MILESTONE_AMOUNT

        # ----------------------------------------------------------- #
        # Step 13: Employer pauses stream
        # ----------------------------------------------------------- #
        advance_time(algorand, employer.address, seconds=2)

        app_client.send.call(
            AppClientMethodCallParams(
                method="pause_stream",
                args=[employee.address],
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"integ:pause-{uuid.uuid4()}".encode(),
            )
        )

        local_state = app_client.get_local_state(employee.address)
        assert local_state["is_active"].value == 0
        pause_withdrawn = local_state["total_withdrawn"].value
        assert pause_withdrawn > first_withdrawal, "Pause should settle accrued tokens"

        # Verify employee cannot withdraw while paused
        with pytest.raises(Exception):
            employee_client.send.call(
                AppClientMethodCallParams(
                    method="withdraw",
                    extra_fee=AlgoAmount.from_micro_algo(1000),
                    note=f"integ:withdraw-paused-{uuid.uuid4()}".encode(),
                )
            )

        # ----------------------------------------------------------- #
        # Step 14: Employer resumes stream
        # ----------------------------------------------------------- #
        advance_time(algorand, employer.address, seconds=2)

        app_client.send.call(
            AppClientMethodCallParams(
                method="resume_stream",
                args=[employee.address],
                note=f"integ:resume-{uuid.uuid4()}".encode(),
            )
        )

        local_state = app_client.get_local_state(employee.address)
        assert local_state["is_active"].value == 1

        # Verify no retroactive accrual during paused period
        assert local_state["total_withdrawn"].value == pause_withdrawn

        # ----------------------------------------------------------- #
        # Step 15: Employer updates rate
        # ----------------------------------------------------------- #
        advance_time(algorand, employer.address, seconds=3)

        app_client.send.call(
            AppClientMethodCallParams(
                method="update_rate",
                args=[employee.address, NEW_HOURLY_RATE],
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"integ:update-rate-{uuid.uuid4()}".encode(),
            )
        )

        local_state = app_client.get_local_state(employee.address)
        assert local_state["salary_rate"].value == NEW_HOURLY_RATE
        rate_change_withdrawn = local_state["total_withdrawn"].value
        assert rate_change_withdrawn > pause_withdrawn, "Rate change should settle accrued tokens"

        # ----------------------------------------------------------- #
        # Step 16: Employee withdraws again (at new rate)
        # ----------------------------------------------------------- #
        advance_time(algorand, employer.address, seconds=3)

        result = employee_client.send.call(
            AppClientMethodCallParams(
                method="withdraw",
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"integ:withdraw2-{uuid.uuid4()}".encode(),
            )
        )
        second_withdrawal = result.abi_return
        assert second_withdrawal > 0, "Second withdrawal should be positive"

        local_state = app_client.get_local_state(employee.address)
        assert local_state["total_withdrawn"].value == rate_change_withdrawn + second_withdrawal

        # ----------------------------------------------------------- #
        # Step 17: Employer removes employee with final payout
        # ----------------------------------------------------------- #
        advance_time(algorand, employer.address, seconds=2)

        global_before = app_client.get_global_state()
        emp_count_before = global_before["total_employees"].value

        app_client.send.call(
            AppClientMethodCallParams(
                method="remove_employee",
                args=[employee.address],
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"integ:remove-{uuid.uuid4()}".encode(),
            )
        )

        # Verify employee state is cleared
        local_state = app_client.get_local_state(employee.address)
        assert local_state["salary_rate"].value == 0
        assert local_state["is_active"].value == 0
        assert local_state["stream_start"].value == 0
        assert local_state["total_withdrawn"].value == 0

        # Verify employee count decremented
        global_state = app_client.get_global_state()
        assert global_state["total_employees"].value == emp_count_before - 1

        # Verify employee received final payout (total balance > 0)
        emp_final_balance = algorand.client.algod.account_asset_info(
            employee.address, asset_id
        )
        assert emp_final_balance["asset-holding"]["amount"] > 0

        # ----------------------------------------------------------- #
        # Final assertions: contract state is consistent
        # ----------------------------------------------------------- #
        assert global_state["total_employees"].value == 0
        assert global_state["total_streamed"].value > 0

    def test_pause_all_blocks_all_withdrawals(
        self,
        algorand: AlgorandClient,
        dispenser,
        employer,
        app_spec: Arc56Contract,
    ):
        """Verify pause_all blocks all employee withdrawals."""
        # Deploy fresh contract
        result = algorand.send.asset_create(
            AssetCreateParams(
                sender=employer.address,
                total=PAYUSD_TOTAL_SUPPLY,
                decimals=PAYUSD_DECIMALS,
                unit_name="PAYUSD",
                asset_name="AlgoFlow USD",
                default_frozen=False,
                note=f"integ:pa-asa-{uuid.uuid4()}".encode(),
            )
        )
        asset_id = result.asset_id

        factory = AppFactory(
            AppFactoryParams(
                algorand=algorand,
                app_spec=app_spec,
                default_sender=employer.address,
            )
        )
        app_client, _ = factory.send.create(
            AppFactoryCreateMethodCallParams(
                method="create",
                args=[asset_id],
                note=f"integ:pa-deploy-{uuid.uuid4()}".encode(),
            )
        )

        # Fund and setup
        algorand.send.payment(
            PaymentParams(
                sender=employer.address,
                receiver=app_client.app_address,
                amount=AlgoAmount.from_algo(2),
                note=f"integ:pa-mbr-{uuid.uuid4()}".encode(),
            )
        )
        app_client.send.call(
            AppClientMethodCallParams(
                method="opt_in_asset",
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"integ:pa-optin-{uuid.uuid4()}".encode(),
            )
        )

        sp = algorand.client.algod.suggested_params()
        axfer_txn = algosdk.transaction.AssetTransferTxn(
            sender=employer.address, sp=sp,
            receiver=app_client.app_address,
            amt=CONTRACT_FUND_AMOUNT, index=asset_id,
            note=f"integ:pa-fund-{uuid.uuid4()}".encode(),
        )
        signer = algorand.account.get_signer(employer.address)
        app_client.send.call(
            AppClientMethodCallParams(
                method="fund",
                args=[TransactionWithSigner(txn=axfer_txn, signer=signer)],
                note=f"integ:pa-fund-call-{uuid.uuid4()}".encode(),
            )
        )

        # Register employee
        employee = algorand.account.random()
        algorand.account.ensure_funded(
            employee.address, dispenser.address, AlgoAmount.from_algo(10)
        )
        algorand.send.asset_opt_in(
            AssetOptInParams(sender=employee.address, asset_id=asset_id)
        )
        employee_client = app_client.clone(default_sender=employee.address)
        employee_client.send.bare.opt_in(
            AppClientBareCallParams(
                note=f"integ:pa-emp-optin-{uuid.uuid4()}".encode(),
            )
        )
        app_client.send.call(
            AppClientMethodCallParams(
                method="register_employee",
                args=[employee.address, EMPLOYEE_HOURLY_RATE],
                note=f"integ:pa-register-{uuid.uuid4()}".encode(),
            )
        )

        # Pause all
        app_client.send.call(
            AppClientMethodCallParams(
                method="pause_all",
                note=f"integ:pa-pauseall-{uuid.uuid4()}".encode(),
            )
        )

        global_state = app_client.get_global_state()
        assert global_state["is_paused"].value == 1

        # Advance time and verify withdrawal is blocked
        advance_time(algorand, employer.address, seconds=2)

        with pytest.raises(Exception):
            employee_client.send.call(
                AppClientMethodCallParams(
                    method="withdraw",
                    extra_fee=AlgoAmount.from_micro_algo(1000),
                    note=f"integ:pa-withdraw-blocked-{uuid.uuid4()}".encode(),
                )
            )

    def test_clawback_enables_inner_transfers(
        self,
        algorand: AlgorandClient,
        dispenser,
        employer,
        app_spec: Arc56Contract,
    ):
        """Verify that setting contract as clawback enables inner asset transfers.

        This directly validates STORY-1-001 AC: the contract can execute inner
        AssetTransfer without requiring the receiver's signature on the asset side.
        """
        # Create ASA with employer as clawback
        result = algorand.send.asset_create(
            AssetCreateParams(
                sender=employer.address,
                total=PAYUSD_TOTAL_SUPPLY,
                decimals=PAYUSD_DECIMALS,
                unit_name="PAYUSD",
                asset_name="AlgoFlow USD",
                default_frozen=False,
                manager=employer.address,
                reserve=employer.address,
                freeze=employer.address,
                clawback=employer.address,
                note=f"integ:cb-asa-{uuid.uuid4()}".encode(),
            )
        )
        asset_id = result.asset_id

        # Deploy contract
        factory = AppFactory(
            AppFactoryParams(
                algorand=algorand,
                app_spec=app_spec,
                default_sender=employer.address,
            )
        )
        app_client, _ = factory.send.create(
            AppFactoryCreateMethodCallParams(
                method="create",
                args=[asset_id],
                note=f"integ:cb-deploy-{uuid.uuid4()}".encode(),
            )
        )
        contract_address = app_client.app_address

        # Fund, opt in, reconfigure clawback, fund PAYUSD
        algorand.send.payment(
            PaymentParams(
                sender=employer.address,
                receiver=contract_address,
                amount=AlgoAmount.from_algo(2),
                note=f"integ:cb-mbr-{uuid.uuid4()}".encode(),
            )
        )
        app_client.send.call(
            AppClientMethodCallParams(
                method="opt_in_asset",
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"integ:cb-optin-{uuid.uuid4()}".encode(),
            )
        )

        # Reconfigure clawback to contract
        sp = algorand.client.algod.suggested_params()
        config_txn = AssetConfigTxn(
            sender=employer.address, sp=sp, index=asset_id,
            manager=employer.address, reserve=employer.address,
            freeze=employer.address, clawback=contract_address,
            strict_empty_address_check=False,
            note=f"integ:cb-reconfig-{uuid.uuid4()}".encode(),
        )
        signed_config = config_txn.sign(employer.private_key)
        txid = algorand.client.algod.send_transaction(signed_config)
        wait_for_confirmation(algorand.client.algod, txid, TX_CONFIRMATION_ROUNDS)

        # Verify clawback
        asset_info = algorand.client.algod.asset_info(asset_id)
        assert asset_info["params"]["clawback"] == contract_address

        # Fund contract with PAYUSD
        sp = algorand.client.algod.suggested_params()
        axfer_txn = algosdk.transaction.AssetTransferTxn(
            sender=employer.address, sp=sp,
            receiver=contract_address,
            amt=CONTRACT_FUND_AMOUNT, index=asset_id,
            note=f"integ:cb-fund-{uuid.uuid4()}".encode(),
        )
        signer = algorand.account.get_signer(employer.address)
        app_client.send.call(
            AppClientMethodCallParams(
                method="fund",
                args=[TransactionWithSigner(txn=axfer_txn, signer=signer)],
                note=f"integ:cb-fund-call-{uuid.uuid4()}".encode(),
            )
        )

        # Register employee and withdraw — proves clawback works
        employee = algorand.account.random()
        algorand.account.ensure_funded(
            employee.address, dispenser.address, AlgoAmount.from_algo(10)
        )
        algorand.send.asset_opt_in(
            AssetOptInParams(sender=employee.address, asset_id=asset_id)
        )
        employee_client = app_client.clone(default_sender=employee.address)
        employee_client.send.bare.opt_in(
            AppClientBareCallParams(
                note=f"integ:cb-emp-optin-{uuid.uuid4()}".encode(),
            )
        )
        app_client.send.call(
            AppClientMethodCallParams(
                method="register_employee",
                args=[employee.address, EMPLOYEE_HOURLY_RATE],
                note=f"integ:cb-register-{uuid.uuid4()}".encode(),
            )
        )

        advance_time(algorand, employer.address, seconds=3)

        # Employee withdraws — inner AssetTransfer succeeds because contract is clawback
        result = employee_client.send.call(
            AppClientMethodCallParams(
                method="withdraw",
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"integ:cb-withdraw-{uuid.uuid4()}".encode(),
            )
        )
        withdrawn = result.abi_return
        assert withdrawn > 0, "Withdrawal with contract-as-clawback should succeed"

        emp_balance = algorand.client.algod.account_asset_info(
            employee.address, asset_id
        )
        assert emp_balance["asset-holding"]["amount"] == withdrawn

    def test_multiple_employees_independent_streams(
        self,
        algorand: AlgorandClient,
        dispenser,
        employer,
        app_spec: Arc56Contract,
    ):
        """Verify multiple employees accrue and withdraw independently."""
        # Deploy fresh contract
        result = algorand.send.asset_create(
            AssetCreateParams(
                sender=employer.address,
                total=PAYUSD_TOTAL_SUPPLY,
                decimals=PAYUSD_DECIMALS,
                unit_name="PAYUSD",
                asset_name="AlgoFlow USD",
                default_frozen=False,
                note=f"integ:multi-asa-{uuid.uuid4()}".encode(),
            )
        )
        asset_id = result.asset_id

        factory = AppFactory(
            AppFactoryParams(
                algorand=algorand,
                app_spec=app_spec,
                default_sender=employer.address,
            )
        )
        app_client, _ = factory.send.create(
            AppFactoryCreateMethodCallParams(
                method="create",
                args=[asset_id],
                note=f"integ:multi-deploy-{uuid.uuid4()}".encode(),
            )
        )

        algorand.send.payment(
            PaymentParams(
                sender=employer.address,
                receiver=app_client.app_address,
                amount=AlgoAmount.from_algo(2),
                note=f"integ:multi-mbr-{uuid.uuid4()}".encode(),
            )
        )
        app_client.send.call(
            AppClientMethodCallParams(
                method="opt_in_asset",
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"integ:multi-optin-{uuid.uuid4()}".encode(),
            )
        )

        sp = algorand.client.algod.suggested_params()
        axfer_txn = algosdk.transaction.AssetTransferTxn(
            sender=employer.address, sp=sp,
            receiver=app_client.app_address,
            amt=CONTRACT_FUND_AMOUNT, index=asset_id,
            note=f"integ:multi-fund-{uuid.uuid4()}".encode(),
        )
        signer = algorand.account.get_signer(employer.address)
        app_client.send.call(
            AppClientMethodCallParams(
                method="fund",
                args=[TransactionWithSigner(txn=axfer_txn, signer=signer)],
                note=f"integ:multi-fund-call-{uuid.uuid4()}".encode(),
            )
        )

        # Register 3 employees with different rates
        rates = [100_000_000, 75_000_000, 50_000_000]  # 100, 75, 50 PAYUSD/hr
        employees = []
        employee_clients = []

        for i, rate in enumerate(rates):
            emp = algorand.account.random()
            algorand.account.ensure_funded(
                emp.address, dispenser.address, AlgoAmount.from_algo(10)
            )
            algorand.send.asset_opt_in(
                AssetOptInParams(sender=emp.address, asset_id=asset_id)
            )
            emp_client = app_client.clone(default_sender=emp.address)
            emp_client.send.bare.opt_in(
                AppClientBareCallParams(
                    note=f"integ:multi-emp{i}-optin-{uuid.uuid4()}".encode(),
                )
            )
            app_client.send.call(
                AppClientMethodCallParams(
                    method="register_employee",
                    args=[emp.address, rate],
                    note=f"integ:multi-reg{i}-{uuid.uuid4()}".encode(),
                )
            )
            employees.append(emp)
            employee_clients.append(emp_client)

        global_state = app_client.get_global_state()
        assert global_state["total_employees"].value == 3

        # Advance time
        advance_time(algorand, employer.address, seconds=5)

        # Each employee withdraws
        withdrawals = []
        for i, (emp, emp_client) in enumerate(zip(employees, employee_clients)):
            result = emp_client.send.call(
                AppClientMethodCallParams(
                    method="withdraw",
                    extra_fee=AlgoAmount.from_micro_algo(1000),
                    note=f"integ:multi-withdraw{i}-{uuid.uuid4()}".encode(),
                )
            )
            withdrawals.append(result.abi_return)

        # All should have received tokens
        for w in withdrawals:
            assert w > 0

        # Higher-rate employees should have received more (approximately proportional)
        # Due to block time granularity, just verify ordering
        assert withdrawals[0] >= withdrawals[1], "Higher rate should earn more or equal"
        assert withdrawals[1] >= withdrawals[2], "Higher rate should earn more or equal"
