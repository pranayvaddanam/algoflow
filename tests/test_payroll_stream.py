"""Unit tests for the PayrollStream smart contract.

Tests all 12 MVP contract methods with positive, negative, and edge cases.
Each test deploys a fresh contract instance via the deployed_app fixture.
"""

# Third-party
import uuid

import pytest
import algosdk
from algosdk.atomic_transaction_composer import TransactionWithSigner

# AlgoKit utilities
import algokit_utils
from algokit_utils import (
    AlgorandClient,
    AppClient,
    AppClientMethodCallParams,
    AppClientBareCallParams,
    AppFactory,
    AppFactoryParams,
    AppFactoryCreateMethodCallParams,
    AlgoAmount,
    AssetOptInParams,
    PaymentParams,
    Arc56Contract,
)

# Constants (mirrored from conftest)
EMPLOYEE_HOURLY_RATE = 3_600_000_000  # 3600 PAYUSD/hr
CONTRACT_FUND_AMOUNT = 10_000_000_000  # 10k PAYUSD


def advance_time(algorand, sender_address, seconds=5):
    """Send dummy transactions to advance block time on LocalNet."""
    import time as _time

    for i in range(seconds):
        algorand.send.payment(
            PaymentParams(
                sender=sender_address,
                receiver=sender_address,
                amount=AlgoAmount.from_micro_algo(0),
                note=f"advance-{_time.time()}-{i}-{uuid.uuid4()}".encode(),
            )
        )
        _time.sleep(1)


def decode_address(hex_value: str) -> str:
    """Decode hex-encoded bytes to Algorand base32 address."""
    return algosdk.encoding.encode_address(bytes.fromhex(hex_value))


APP_SPEC_PATH = "smart_contracts/payroll_stream/PayrollStream.arc56.json"


def deploy_app_with_funding(
    algorand: AlgorandClient,
    employer,
    asset_id: int,
    app_spec: Arc56Contract,
    fund_amount: int = CONTRACT_FUND_AMOUNT,
) -> AppClient:
    """Deploy a fresh PayrollStream contract with custom funding."""
    factory = AppFactory(AppFactoryParams(
        algorand=algorand, app_spec=app_spec,
        default_sender=employer.address,
    ))

    app_client, _ = factory.send.create(AppFactoryCreateMethodCallParams(
        method="create", args=[asset_id],
        note=f"deploy-{uuid.uuid4()}".encode(),
    ))

    algorand.send.payment(PaymentParams(
        sender=employer.address, receiver=app_client.app_address,
        amount=AlgoAmount.from_algo(1),
        note=f"mbr-{uuid.uuid4()}".encode(),
    ))

    app_client.send.call(AppClientMethodCallParams(
        method="opt_in_asset",
        extra_fee=AlgoAmount.from_micro_algo(1000),
        note=f"optin-{uuid.uuid4()}".encode(),
    ))

    sp = algorand.client.algod.suggested_params()
    axfer_txn = algosdk.transaction.AssetTransferTxn(
        sender=employer.address, sp=sp,
        receiver=app_client.app_address,
        amt=fund_amount, index=asset_id,
        note=f"fund-{uuid.uuid4()}".encode(),
    )
    signer = algorand.account.get_signer(employer.address)
    app_client.send.call(AppClientMethodCallParams(
        method="fund",
        args=[TransactionWithSigner(txn=axfer_txn, signer=signer)],
        note=f"fund-call-{uuid.uuid4()}".encode(),
    ))

    return app_client


# ================================================================== #
#  STORY-1-002: Core Methods — create, opt_in_asset, fund, register
# ================================================================== #


class TestCreate:
    """Tests for the create() method."""

    def test_create_initializes_global_state(
        self,
        deployed_app: AppClient,
        employer,
        asset_id: int,
    ):
        """Verify create() sets employer, salary_asset, and counters."""
        global_state = deployed_app.get_global_state()

        # employer is stored as hex-encoded raw bytes
        employer_addr = decode_address(global_state["employer"].value)
        assert employer_addr == employer.address
        assert global_state["salary_asset"].value == asset_id
        assert global_state["total_employees"].value == 0
        assert global_state["total_streamed"].value == 0
        assert global_state["is_paused"].value == 0


class TestOptInAsset:
    """Tests for the opt_in_asset() method."""

    def test_opt_in_asset_succeeds_for_employer(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        asset_id: int,
    ):
        """Verify the contract holds the salary ASA after opt_in_asset."""
        info = algorand.client.algod.account_asset_info(
            deployed_app.app_address, asset_id
        )
        assert info["asset-holding"]["asset-id"] == asset_id

    def test_opt_in_asset_rejects_non_employer(
        self,
        algorand: AlgorandClient,
        non_employer,
        app_spec: Arc56Contract,
        employer,
        asset_id: int,
    ):
        """Verify non-employer cannot call opt_in_asset."""
        from algokit_utils import AppFactory, AppFactoryParams, AppFactoryCreateMethodCallParams

        factory = AppFactory(
            AppFactoryParams(
                algorand=algorand, app_spec=app_spec,
                default_sender=employer.address,
            )
        )
        app_client, _ = factory.send.create(
            AppFactoryCreateMethodCallParams(
                method="create", args=[asset_id],
                note=f"auth-test-{uuid.uuid4()}".encode(),
            )
        )

        # Fund with ALGO
        algorand.send.payment(PaymentParams(
            sender=employer.address, receiver=app_client.app_address,
            amount=AlgoAmount.from_algo(1),
            note=f"mbr-auth-{uuid.uuid4()}".encode(),
        ))

        # Non-employer tries opt_in_asset
        non_emp_client = app_client.clone(default_sender=non_employer.address)
        with pytest.raises(Exception):
            non_emp_client.send.call(AppClientMethodCallParams(
                method="opt_in_asset",
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"bad-optin-{uuid.uuid4()}".encode(),
            ))


class TestFund:
    """Tests for the fund() method."""

    def test_fund_increases_contract_balance(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        asset_id: int,
    ):
        """Verify the contract's PAYUSD balance reflects funding."""
        info = algorand.client.algod.account_asset_info(
            deployed_app.app_address, asset_id
        )
        assert info["asset-holding"]["amount"] == CONTRACT_FUND_AMOUNT

    def test_fund_rejects_non_employer(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        non_employer,
        asset_id: int,
        employer,
    ):
        """Verify non-employer cannot call fund()."""
        # Opt non_employer into ASA if not already
        try:
            algorand.send.asset_opt_in(AssetOptInParams(
                sender=non_employer.address, asset_id=asset_id,
            ))
        except Exception:
            pass

        # Fund non_employer with some PAYUSD
        try:
            algorand.send.asset_transfer(algokit_utils.AssetTransferParams(
                sender=employer.address, receiver=non_employer.address,
                asset_id=asset_id, amount=1_000_000,
                note=f"fund-ne-{uuid.uuid4()}".encode(),
            ))
        except Exception:
            pass

        sp = algorand.client.algod.suggested_params()
        axfer_txn = algosdk.transaction.AssetTransferTxn(
            sender=non_employer.address, sp=sp,
            receiver=deployed_app.app_address, amt=1_000_000,
            index=asset_id,
            note=f"bad-fund-{uuid.uuid4()}".encode(),
        )
        signer = algorand.account.get_signer(non_employer.address)

        non_emp_client = deployed_app.clone(default_sender=non_employer.address)
        with pytest.raises(Exception):
            non_emp_client.send.call(AppClientMethodCallParams(
                method="fund",
                args=[TransactionWithSigner(txn=axfer_txn, signer=signer)],
                note=f"bad-fund-call-{uuid.uuid4()}".encode(),
            ))


class TestRegisterEmployee:
    """Tests for the register_employee() method."""

    def test_register_employee_sets_local_state(
        self,
        deployed_app: AppClient,
        registered_employee,
    ):
        """Verify local state is correctly initialized after registration."""
        employee, _ = registered_employee
        local_state = deployed_app.get_local_state(employee.address)

        assert local_state["salary_rate"].value == EMPLOYEE_HOURLY_RATE
        assert local_state["stream_start"].value > 0
        assert local_state["last_withdrawal"].value > 0
        assert local_state["total_withdrawn"].value == 0
        assert local_state["is_active"].value == 1

    def test_register_employee_increments_total(
        self,
        deployed_app: AppClient,
        registered_employee,
    ):
        """Verify total_employees is incremented after registration."""
        global_state = deployed_app.get_global_state()
        assert global_state["total_employees"].value == 1

    def test_register_rejects_duplicate_employee(
        self,
        deployed_app: AppClient,
        registered_employee,
    ):
        """Verify cannot register the same employee twice."""
        employee, _ = registered_employee
        with pytest.raises(Exception):
            deployed_app.send.call(AppClientMethodCallParams(
                method="register_employee",
                args=[employee.address, EMPLOYEE_HOURLY_RATE],
                note=f"dup-reg-{uuid.uuid4()}".encode(),
            ))

    def test_register_rejects_non_employer(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        employee_accounts,
        non_employer,
        asset_id: int,
    ):
        """Verify non-employer cannot register employees."""
        employee = employee_accounts[1]

        # Opt employee into ASA and app
        try:
            algorand.send.asset_opt_in(
                AssetOptInParams(sender=employee.address, asset_id=asset_id)
            )
        except Exception:
            pass
        emp_client = deployed_app.clone(default_sender=employee.address)
        emp_client.send.bare.opt_in(AppClientBareCallParams(
            note=f"emp1-optin-{uuid.uuid4()}".encode(),
        ))

        # Non-employer tries to register
        non_emp_client = deployed_app.clone(default_sender=non_employer.address)
        with pytest.raises(Exception):
            non_emp_client.send.call(AppClientMethodCallParams(
                method="register_employee",
                args=[employee.address, EMPLOYEE_HOURLY_RATE],
                note=f"bad-reg-{uuid.uuid4()}".encode(),
            ))


# ================================================================== #
#  STORY-1-003: Streaming Engine — withdraw, get_accrued, overdraft
# ================================================================== #


class TestWithdraw:
    """Tests for the withdraw() method."""

    def test_withdraw_sends_accrued_tokens(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        registered_employee,
        employer,
        asset_id: int,
    ):
        """Verify withdraw sends accrued tokens to the employee."""
        employee, employee_client = registered_employee

        advance_time(algorand, employer.address, seconds=3)

        result = employee_client.send.call(AppClientMethodCallParams(
            method="withdraw",
            extra_fee=AlgoAmount.from_micro_algo(1000),
            note=f"withdraw-{uuid.uuid4()}".encode(),
        ))
        withdrawn = result.abi_return
        assert withdrawn > 0

        info = algorand.client.algod.account_asset_info(employee.address, asset_id)
        assert info["asset-holding"]["amount"] > 0

    def test_withdraw_updates_state(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        registered_employee,
        employer,
    ):
        """Verify withdraw updates last_withdrawal and totals."""
        employee, employee_client = registered_employee

        advance_time(algorand, employer.address, seconds=2)

        result = employee_client.send.call(AppClientMethodCallParams(
            method="withdraw",
            extra_fee=AlgoAmount.from_micro_algo(1000),
            note=f"withdraw-state-{uuid.uuid4()}".encode(),
        ))
        withdrawn = result.abi_return

        local_state = deployed_app.get_local_state(employee.address)
        assert local_state["total_withdrawn"].value > 0

        global_state = deployed_app.get_global_state()
        assert global_state["total_streamed"].value > 0

    def test_withdraw_rejects_paused_employee(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        registered_employee,
        employer,
    ):
        """Verify paused employee cannot withdraw."""
        employee, employee_client = registered_employee

        advance_time(algorand, employer.address, seconds=2)
        deployed_app.send.call(AppClientMethodCallParams(
            method="pause_stream",
            args=[employee.address],
            extra_fee=AlgoAmount.from_micro_algo(1000),
            note=f"pause-for-reject-{uuid.uuid4()}".encode(),
        ))

        with pytest.raises(Exception):
            employee_client.send.call(AppClientMethodCallParams(
                method="withdraw",
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"withdraw-paused-{uuid.uuid4()}".encode(),
            ))

    def test_withdraw_rejects_global_pause(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        registered_employee,
        employer,
    ):
        """Verify withdraw is blocked when contract is globally paused."""
        employee, employee_client = registered_employee

        deployed_app.send.call(AppClientMethodCallParams(
            method="pause_all",
            note=f"pause-all-{uuid.uuid4()}".encode(),
        ))

        advance_time(algorand, employer.address, seconds=2)

        with pytest.raises(Exception):
            employee_client.send.call(AppClientMethodCallParams(
                method="withdraw",
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"withdraw-gpaused-{uuid.uuid4()}".encode(),
            ))

    def test_withdraw_rejects_unregistered(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        non_employer,
    ):
        """Verify unregistered account cannot withdraw."""
        non_emp_client = deployed_app.clone(default_sender=non_employer.address)
        try:
            non_emp_client.send.bare.opt_in(AppClientBareCallParams(
                note=f"ne-optin-{uuid.uuid4()}".encode(),
            ))
        except Exception:
            pass

        with pytest.raises(Exception):
            non_emp_client.send.call(AppClientMethodCallParams(
                method="withdraw",
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"unreg-withdraw-{uuid.uuid4()}".encode(),
            ))


class TestGetAccrued:
    """Tests for the get_accrued() method."""

    def test_get_accrued_returns_correct_amount(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        registered_employee,
        employer,
    ):
        """Verify get_accrued returns a positive value after time passes."""
        employee, _ = registered_employee

        advance_time(algorand, employer.address, seconds=3)

        result = deployed_app.send.call(AppClientMethodCallParams(
            method="get_accrued",
            args=[employee.address],
        ))
        assert result.abi_return > 0

    def test_get_accrued_returns_zero_for_paused(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        registered_employee,
        employer,
    ):
        """Verify get_accrued returns 0 for a paused employee."""
        employee, _ = registered_employee

        advance_time(algorand, employer.address, seconds=2)
        deployed_app.send.call(AppClientMethodCallParams(
            method="pause_stream",
            args=[employee.address],
            extra_fee=AlgoAmount.from_micro_algo(1000),
            note=f"pause-accrued-{uuid.uuid4()}".encode(),
        ))

        result = deployed_app.send.call(AppClientMethodCallParams(
            method="get_accrued",
            args=[employee.address],
        ))
        assert result.abi_return == 0


class TestOverdraft:
    """Tests for overdraft protection in withdraw()."""

    def test_overdraft_sends_available_and_pauses_stream(
        self,
        algorand: AlgorandClient,
        employer,
        asset_id: int,
        app_spec: Arc56Contract,
        employee_accounts,
    ):
        """Verify overdraft: sends available balance and pauses stream."""
        # Deploy with minimal funding (just 1 PAYUSD)
        app_client = deploy_app_with_funding(
            algorand, employer, asset_id, app_spec, fund_amount=1_000_000
        )

        # Register employee with extremely high rate
        employee = employee_accounts[2]
        try:
            algorand.send.asset_opt_in(
                AssetOptInParams(sender=employee.address, asset_id=asset_id)
            )
        except Exception:
            pass

        emp_client = app_client.clone(default_sender=employee.address)
        emp_client.send.bare.opt_in(AppClientBareCallParams(
            note=f"od-optin-{uuid.uuid4()}".encode(),
        ))

        # Rate: 3.6T base units/hr = 1B base units/sec
        app_client.send.call(AppClientMethodCallParams(
            method="register_employee",
            args=[employee.address, 3_600_000_000_000],
            note=f"od-reg-{uuid.uuid4()}".encode(),
        ))

        # Advance time so accrued >> available
        advance_time(algorand, employer.address, seconds=3)

        # Withdraw triggers overdraft
        result = emp_client.send.call(AppClientMethodCallParams(
            method="withdraw",
            extra_fee=AlgoAmount.from_micro_algo(1000),
            note=f"od-withdraw-{uuid.uuid4()}".encode(),
        ))
        withdrawn = result.abi_return

        # Should have sent at most 1 PAYUSD
        assert withdrawn <= 1_000_000

        # Stream should now be paused
        local_state = app_client.get_local_state(employee.address)
        assert local_state["is_active"].value == 0


# ================================================================== #
#  STORY-1-004: Management Methods
# ================================================================== #


class TestUpdateRate:
    """Tests for the update_rate() method."""

    def test_update_rate_settles_and_applies_new_rate(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        registered_employee,
        employer,
        asset_id: int,
    ):
        """Verify update_rate settles at old rate and applies new rate."""
        employee, _ = registered_employee

        advance_time(algorand, employer.address, seconds=3)

        new_rate = EMPLOYEE_HOURLY_RATE * 2
        deployed_app.send.call(AppClientMethodCallParams(
            method="update_rate",
            args=[employee.address, new_rate],
            extra_fee=AlgoAmount.from_micro_algo(1000),
            note=f"uprate-{uuid.uuid4()}".encode(),
        ))

        local_state = deployed_app.get_local_state(employee.address)
        assert local_state["salary_rate"].value == new_rate
        assert local_state["total_withdrawn"].value > 0

        info = algorand.client.algod.account_asset_info(employee.address, asset_id)
        assert info["asset-holding"]["amount"] > 0


class TestPauseStream:
    """Tests for the pause_stream() method."""

    def test_pause_stream_settles_and_deactivates(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        registered_employee,
        employer,
        asset_id: int,
    ):
        """Verify pause_stream settles accrued and sets is_active=0."""
        employee, _ = registered_employee

        advance_time(algorand, employer.address, seconds=3)

        deployed_app.send.call(AppClientMethodCallParams(
            method="pause_stream",
            args=[employee.address],
            extra_fee=AlgoAmount.from_micro_algo(1000),
            note=f"pause-settle-{uuid.uuid4()}".encode(),
        ))

        local_state = deployed_app.get_local_state(employee.address)
        assert local_state["is_active"].value == 0
        assert local_state["total_withdrawn"].value > 0

        info = algorand.client.algod.account_asset_info(employee.address, asset_id)
        assert info["asset-holding"]["amount"] > 0

    def test_pause_stream_rejects_already_paused(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        registered_employee,
        employer,
    ):
        """Verify cannot pause an already-paused stream."""
        employee, _ = registered_employee

        advance_time(algorand, employer.address, seconds=2)

        deployed_app.send.call(AppClientMethodCallParams(
            method="pause_stream",
            args=[employee.address],
            extra_fee=AlgoAmount.from_micro_algo(1000),
            note=f"pause1-{uuid.uuid4()}".encode(),
        ))

        with pytest.raises(Exception):
            deployed_app.send.call(AppClientMethodCallParams(
                method="pause_stream",
                args=[employee.address],
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"pause2-{uuid.uuid4()}".encode(),
            ))


class TestResumeStream:
    """Tests for the resume_stream() method."""

    def test_resume_stream_reactivates_without_retroactive_accrual(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        registered_employee,
        employer,
    ):
        """Verify resume_stream reactivates and resets clock."""
        employee, employee_client = registered_employee

        advance_time(algorand, employer.address, seconds=2)

        # Pause
        deployed_app.send.call(AppClientMethodCallParams(
            method="pause_stream",
            args=[employee.address],
            extra_fee=AlgoAmount.from_micro_algo(1000),
            note=f"pause-resume-{uuid.uuid4()}".encode(),
        ))

        tokens_after_pause = deployed_app.get_local_state(
            employee.address
        )["total_withdrawn"].value

        # Wait during pause
        advance_time(algorand, employer.address, seconds=3)

        # Resume
        deployed_app.send.call(AppClientMethodCallParams(
            method="resume_stream",
            args=[employee.address],
            note=f"resume-{uuid.uuid4()}".encode(),
        ))

        local_state = deployed_app.get_local_state(employee.address)
        assert local_state["is_active"].value == 1
        assert local_state["total_withdrawn"].value == tokens_after_pause

    def test_resume_rejects_active_stream(
        self,
        deployed_app: AppClient,
        registered_employee,
    ):
        """Verify cannot resume an already-active stream."""
        employee, _ = registered_employee

        with pytest.raises(Exception):
            deployed_app.send.call(AppClientMethodCallParams(
                method="resume_stream",
                args=[employee.address],
                note=f"bad-resume-{uuid.uuid4()}".encode(),
            ))


class TestRemoveEmployee:
    """Tests for the remove_employee() method."""

    def test_remove_employee_final_payout_and_decrements(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        registered_employee,
        employer,
        asset_id: int,
    ):
        """Verify remove_employee settles, clears state, and decrements count."""
        employee, _ = registered_employee

        advance_time(algorand, employer.address, seconds=3)

        global_before = deployed_app.get_global_state()
        emp_count_before = global_before["total_employees"].value

        deployed_app.send.call(AppClientMethodCallParams(
            method="remove_employee",
            args=[employee.address],
            extra_fee=AlgoAmount.from_micro_algo(1000),
            note=f"remove-{uuid.uuid4()}".encode(),
        ))

        global_after = deployed_app.get_global_state()
        assert global_after["total_employees"].value == emp_count_before - 1

        local_state = deployed_app.get_local_state(employee.address)
        assert local_state["salary_rate"].value == 0
        assert local_state["is_active"].value == 0

        info = algorand.client.algod.account_asset_info(employee.address, asset_id)
        assert info["asset-holding"]["amount"] > 0

    def test_remove_rejects_unregistered(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        non_employer,
        employer,
    ):
        """Verify cannot remove an unregistered employee."""
        ne_client = deployed_app.clone(default_sender=non_employer.address)
        try:
            ne_client.send.bare.opt_in(AppClientBareCallParams(
                note=f"ne-optin-rm-{uuid.uuid4()}".encode(),
            ))
        except Exception:
            pass

        with pytest.raises(Exception):
            deployed_app.send.call(AppClientMethodCallParams(
                method="remove_employee",
                args=[non_employer.address],
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"bad-remove-{uuid.uuid4()}".encode(),
            ))


class TestMilestonePay:
    """Tests for the milestone_pay() method."""

    def test_milestone_pay_sends_correct_amount(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        registered_employee,
        employer,
        asset_id: int,
    ):
        """Verify milestone_pay sends exact amount and updates total_streamed."""
        employee, _ = registered_employee

        milestone_amount = 5_000_000  # 5 PAYUSD

        global_before = deployed_app.get_global_state()
        streamed_before = global_before["total_streamed"].value

        deployed_app.send.call(AppClientMethodCallParams(
            method="milestone_pay",
            args=[employee.address, milestone_amount],
            extra_fee=AlgoAmount.from_micro_algo(1000),
            note=f"milestone-{uuid.uuid4()}".encode(),
        ))

        global_after = deployed_app.get_global_state()
        assert global_after["total_streamed"].value == streamed_before + milestone_amount

        info = algorand.client.algod.account_asset_info(employee.address, asset_id)
        assert info["asset-holding"]["amount"] >= milestone_amount

    def test_milestone_pay_rejects_insufficient_balance(
        self,
        algorand: AlgorandClient,
        employer,
        asset_id: int,
        app_spec: Arc56Contract,
        employee_accounts,
    ):
        """Verify milestone_pay fails when contract has insufficient balance."""
        # Deploy with minimal funding
        app_client = deploy_app_with_funding(
            algorand, employer, asset_id, app_spec, fund_amount=1_000_000
        )

        # Register employee
        employee = employee_accounts[1]
        try:
            algorand.send.asset_opt_in(
                AssetOptInParams(sender=employee.address, asset_id=asset_id)
            )
        except Exception:
            pass
        emp_client = app_client.clone(default_sender=employee.address)
        emp_client.send.bare.opt_in(AppClientBareCallParams(
            note=f"ms-optin-{uuid.uuid4()}".encode(),
        ))
        app_client.send.call(AppClientMethodCallParams(
            method="register_employee",
            args=[employee.address, EMPLOYEE_HOURLY_RATE],
            note=f"ms-reg-{uuid.uuid4()}".encode(),
        ))

        # Try milestone pay for more than available
        with pytest.raises(Exception):
            app_client.send.call(AppClientMethodCallParams(
                method="milestone_pay",
                args=[employee.address, 100_000_000],  # 100 PAYUSD > 1 available
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"ms-bad-{uuid.uuid4()}".encode(),
            ))


class TestPauseAll:
    """Tests for the pause_all() method."""

    def test_pause_all_blocks_withdrawals(
        self,
        algorand: AlgorandClient,
        deployed_app: AppClient,
        registered_employee,
        employer,
    ):
        """Verify pause_all sets is_paused=1 and blocks withdrawals."""
        employee, employee_client = registered_employee

        deployed_app.send.call(AppClientMethodCallParams(
            method="pause_all",
            note=f"pause-all-test-{uuid.uuid4()}".encode(),
        ))

        global_state = deployed_app.get_global_state()
        assert global_state["is_paused"].value == 1

        advance_time(algorand, employer.address, seconds=2)

        with pytest.raises(Exception):
            employee_client.send.call(AppClientMethodCallParams(
                method="withdraw",
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"withdraw-after-pa-{uuid.uuid4()}".encode(),
            ))

    def test_pause_all_rejects_non_employer(
        self,
        deployed_app: AppClient,
        non_employer,
    ):
        """Verify non-employer cannot call pause_all."""
        non_emp_client = deployed_app.clone(default_sender=non_employer.address)
        with pytest.raises(Exception):
            non_emp_client.send.call(AppClientMethodCallParams(
                method="pause_all",
                note=f"bad-pa-{uuid.uuid4()}".encode(),
            ))
