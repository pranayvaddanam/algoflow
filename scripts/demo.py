"""Automated 9-step demo script for AlgoFlow.

Usage:
    python scripts/demo.py --network localnet
    python scripts/demo.py --network testnet

Steps:
    1. Create PAYUSD ASA
    2. Deploy PayrollStream contract
    3. Fund contract with 100,000 PAYUSD
    4. Register Employee A at $100/hr
    5. Register Employees B+C ($75/hr, $50/hr)
    6. Wait 10 seconds for accrual
    7. Employee A withdraws
    8. Update Employee B rate to $200/hr
    9. Pause Employee C stream

On failure: prints which step failed with error details and halts.
On success: prints summary with all transaction IDs.
"""

# Standard library
import argparse
import os
import sys
import time
import uuid
from pathlib import Path

# Third-party
from algosdk.transaction import (
    AssetConfigTxn,
    AssetTransferTxn,
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
    AppClientParams,
    AppClientMethodCallParams,
    AppClientBareCallParams,
    AssetCreateParams,
    AssetOptInParams,
    PaymentParams,
    Arc56Contract,
)

# Project root
PROJECT_ROOT = Path(__file__).parent.parent

# Token constants
SALARY_TOKEN_TOTAL_SUPPLY = 1_000_000_000_000  # 1M tokens with 6 decimals
SALARY_TOKEN_DECIMALS = 6
SALARY_TOKEN_UNIT_NAME = "PAYUSD"
SALARY_TOKEN_NAME = "AlgoFlow USD"

# Demo funding amounts
DEMO_PAYUSD_FUND = 100_000_000_000  # 100k PAYUSD
CONTRACT_ALGO_FUND = 2  # 2 ALGO for MBR + inner txn fees
EMPLOYEE_ALGO_FUND = 5  # 5 ALGO per employee

# Employee configuration: (label, hourly_rate_base_units)
EMPLOYEE_CONFIGS = [
    ("Employee A (Alice)", 100_000_000),  # 100.000000 PAYUSD/hr
    ("Employee B (Bob)", 75_000_000),     # 75.000000 PAYUSD/hr
    ("Employee C (Charlie)", 50_000_000), # 50.000000 PAYUSD/hr
]

# Updated rate for Employee B (step 8)
EMPLOYEE_B_NEW_RATE = 200_000_000  # 200.000000 PAYUSD/hr

# ARC56 spec path
APP_SPEC_PATH = PROJECT_ROOT / "smart_contracts" / "payroll_stream" / "PayrollStream.arc56.json"

# Confirmation rounds
TX_CONFIRMATION_ROUNDS = 4

# Accrual wait time in seconds (step 6)
ACCRUAL_WAIT_SECONDS = 10


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="AlgoFlow automated 9-step demo"
    )
    parser.add_argument(
        "--network",
        choices=["localnet", "testnet"],
        default="localnet",
        help="Target network (default: localnet)",
    )
    return parser.parse_args()


def load_env() -> None:
    """Load environment variables from .env file."""
    env_path = PROJECT_ROOT / ".env"
    if env_path.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv(env_path)
        except ImportError:
            for line in env_path.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    os.environ.setdefault(key.strip(), value.strip())


def get_algorand_client(network: str) -> AlgorandClient:
    """Create an AlgorandClient for the given network."""
    if network == "localnet":
        return AlgorandClient.default_localnet()
    else:
        return AlgorandClient.testnet()


def get_deployer(algorand: AlgorandClient, network: str):
    """Get the deployer/employer account."""
    if network == "localnet":
        return algorand.account.localnet_dispenser()
    else:
        deployer_mnemonic = os.environ.get("DEPLOYER_MNEMONIC", "")
        if not deployer_mnemonic:
            print("ERROR: DEPLOYER_MNEMONIC required for testnet.", file=sys.stderr)
            sys.exit(1)
        return algorand.account.from_mnemonic(mnemonic=deployer_mnemonic)


def run_demo(network: str) -> None:
    """Execute the full 9-step demo pipeline."""
    print("=" * 60)
    print("  AlgoFlow Demo Script")
    print(f"  Network: {network}")
    print("=" * 60)

    # Track all transaction IDs for summary
    tx_log: list[tuple[str, str]] = []

    # Connect and get deployer
    algorand = get_algorand_client(network)
    deployer = get_deployer(algorand, network)
    print(f"\nDeployer: {deployer.address}\n")

    # Load ARC56 spec
    if not APP_SPEC_PATH.exists():
        print(f"ERROR: ARC56 spec not found at {APP_SPEC_PATH}", file=sys.stderr)
        print("Run: algokit compile python smart_contracts/payroll_stream/contract.py", file=sys.stderr)
        sys.exit(1)

    with open(APP_SPEC_PATH) as f:
        app_spec = Arc56Contract.from_json(f.read())

    # ------------------------------------------------------------------
    # Step 1: Create PAYUSD ASA
    # ------------------------------------------------------------------
    print("[Step 1/9] Creating PAYUSD ASA...")
    try:
        result = algorand.send.asset_create(
            AssetCreateParams(
                sender=deployer.address,
                total=SALARY_TOKEN_TOTAL_SUPPLY,
                decimals=SALARY_TOKEN_DECIMALS,
                unit_name=SALARY_TOKEN_UNIT_NAME,
                asset_name=SALARY_TOKEN_NAME,
                default_frozen=False,
                manager=deployer.address,
                reserve=deployer.address,
                freeze=deployer.address,
                clawback=deployer.address,
                note=f"algoflow:demo-asa-create-{uuid.uuid4()}".encode(),
            )
        )
        asset_id = result.asset_id
        tx_log.append(("Create PAYUSD ASA", result.tx_id))
        print(f"  PAYUSD ASA created: ID = {asset_id}")
    except Exception as e:
        print(f"\n  FAILED at Step 1: {e}", file=sys.stderr)
        sys.exit(1)

    # ------------------------------------------------------------------
    # Step 2: Deploy PayrollStream contract
    # ------------------------------------------------------------------
    print("\n[Step 2/9] Deploying PayrollStream contract...")
    try:
        factory = AppFactory(
            AppFactoryParams(
                algorand=algorand,
                app_spec=app_spec,
                default_sender=deployer.address,
            )
        )

        app_client, create_result = factory.send.create(
            AppFactoryCreateMethodCallParams(
                method="create",
                args=[asset_id],
                note=f"algoflow:demo-deploy-{uuid.uuid4()}".encode(),
            )
        )

        app_id = app_client.app_id
        contract_address = app_client.app_address
        tx_log.append(("Deploy contract", create_result.tx_id))
        print(f"  App ID: {app_id}")
        print(f"  App Address: {contract_address}")

        # Fund contract with ALGO for MBR
        algorand.send.payment(
            PaymentParams(
                sender=deployer.address,
                receiver=contract_address,
                amount=AlgoAmount.from_algo(CONTRACT_ALGO_FUND),
                note=f"algoflow:demo-mbr-fund-{uuid.uuid4()}".encode(),
            )
        )

        # Opt contract into ASA
        app_client.send.call(
            AppClientMethodCallParams(
                method="opt_in_asset",
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"algoflow:demo-opt-in-asa-{uuid.uuid4()}".encode(),
            )
        )

        # Reconfigure clawback to contract address
        sp = algorand.client.algod.suggested_params()
        clawback_txn = AssetConfigTxn(
            sender=deployer.address,
            sp=sp,
            index=asset_id,
            manager=deployer.address,
            reserve=deployer.address,
            freeze=deployer.address,
            clawback=contract_address,
            note=f"algoflow:demo-clawback-{uuid.uuid4()}".encode(),
            strict_empty_address_check=False,
        )
        signed_clawback = clawback_txn.sign(deployer.private_key)
        clawback_txid = algorand.client.algod.send_transaction(signed_clawback)
        wait_for_confirmation(algorand.client.algod, clawback_txid, TX_CONFIRMATION_ROUNDS)
        tx_log.append(("Reconfigure clawback", clawback_txid))

        print(f"  Contract funded with {CONTRACT_ALGO_FUND} ALGO, opted into ASA, clawback set")
    except Exception as e:
        print(f"\n  FAILED at Step 2: {e}", file=sys.stderr)
        sys.exit(1)

    # ------------------------------------------------------------------
    # Step 3: Fund contract with 100,000 PAYUSD
    # ------------------------------------------------------------------
    print("\n[Step 3/9] Funding contract with 100,000 PAYUSD...")
    try:
        sp = algorand.client.algod.suggested_params()
        axfer_txn = AssetTransferTxn(
            sender=deployer.address,
            sp=sp,
            receiver=contract_address,
            amt=DEMO_PAYUSD_FUND,
            index=asset_id,
            note=f"algoflow:demo-fund-payusd-{uuid.uuid4()}".encode(),
        )
        signer = algorand.account.get_signer(deployer.address)

        fund_result = app_client.send.call(
            AppClientMethodCallParams(
                method="fund",
                args=[TransactionWithSigner(txn=axfer_txn, signer=signer)],
                note=f"algoflow:demo-fund-call-{uuid.uuid4()}".encode(),
            )
        )

        tx_log.append(("Fund 100k PAYUSD", fund_result.tx_id))
        display_amount = DEMO_PAYUSD_FUND / 10**SALARY_TOKEN_DECIMALS
        print(f"  Funded with {display_amount:,.6f} PAYUSD")
    except Exception as e:
        print(f"\n  FAILED at Step 3: {e}", file=sys.stderr)
        sys.exit(1)

    # ------------------------------------------------------------------
    # Step 4: Register Employee A at $100/hr
    # ------------------------------------------------------------------
    print("\n[Step 4/9] Registering Employee A at $100/hr...")
    employees = []
    try:
        label, rate = EMPLOYEE_CONFIGS[0]
        emp_account = algorand.account.random()
        employees.append({"label": label, "address": emp_account.address, "rate": rate, "account": emp_account})

        # Fund employee with ALGO
        algorand.account.ensure_funded(
            emp_account.address,
            deployer.address,
            AlgoAmount.from_algo(EMPLOYEE_ALGO_FUND),
        )

        # Opt employee into ASA
        algorand.send.asset_opt_in(
            AssetOptInParams(sender=emp_account.address, asset_id=asset_id)
        )

        # Opt employee into app
        emp_client = app_client.clone(default_sender=emp_account.address)
        emp_client.send.bare.opt_in(
            AppClientBareCallParams(
                note=f"algoflow:demo-emp-optin-A-{uuid.uuid4()}".encode(),
            )
        )
        employees[0]["client"] = emp_client

        # Register with employer
        reg_result = app_client.send.call(
            AppClientMethodCallParams(
                method="register_employee",
                args=[emp_account.address, rate],
                note=f"algoflow:demo-register-A-{uuid.uuid4()}".encode(),
            )
        )

        tx_log.append(("Register Employee A", reg_result.tx_id))
        display_rate = rate / 10**SALARY_TOKEN_DECIMALS
        print(f"  {label}: {emp_account.address}")
        print(f"  Rate: {display_rate:,.6f} PAYUSD/hr")
    except Exception as e:
        print(f"\n  FAILED at Step 4: {e}", file=sys.stderr)
        sys.exit(1)

    # ------------------------------------------------------------------
    # Step 5: Register Employees B+C ($75/hr, $50/hr)
    # ------------------------------------------------------------------
    print("\n[Step 5/9] Registering Employees B and C...")
    try:
        for i in range(1, len(EMPLOYEE_CONFIGS)):
            label, rate = EMPLOYEE_CONFIGS[i]
            emp_account = algorand.account.random()
            employees.append({"label": label, "address": emp_account.address, "rate": rate, "account": emp_account})

            # Fund employee with ALGO
            algorand.account.ensure_funded(
                emp_account.address,
                deployer.address,
                AlgoAmount.from_algo(EMPLOYEE_ALGO_FUND),
            )

            # Opt employee into ASA
            algorand.send.asset_opt_in(
                AssetOptInParams(sender=emp_account.address, asset_id=asset_id)
            )

            # Opt employee into app
            emp_client = app_client.clone(default_sender=emp_account.address)
            emp_client.send.bare.opt_in(
                AppClientBareCallParams(
                    note=f"algoflow:demo-emp-optin-{i}-{uuid.uuid4()}".encode(),
                )
            )
            employees[i]["client"] = emp_client

            # Register with employer
            reg_result = app_client.send.call(
                AppClientMethodCallParams(
                    method="register_employee",
                    args=[emp_account.address, rate],
                    note=f"algoflow:demo-register-{i}-{uuid.uuid4()}".encode(),
                )
            )

            tx_log.append((f"Register {label}", reg_result.tx_id))
            display_rate = rate / 10**SALARY_TOKEN_DECIMALS
            print(f"  {label}: {emp_account.address} at {display_rate:,.6f} PAYUSD/hr")
    except Exception as e:
        print(f"\n  FAILED at Step 5: {e}", file=sys.stderr)
        sys.exit(1)

    # ------------------------------------------------------------------
    # Step 6: Wait for accrual
    # ------------------------------------------------------------------
    print(f"\n[Step 6/9] Waiting {ACCRUAL_WAIT_SECONDS} seconds for salary accrual...")
    for remaining in range(ACCRUAL_WAIT_SECONDS, 0, -1):
        sys.stdout.write(f"\r  {remaining} seconds remaining...")
        sys.stdout.flush()
        time.sleep(1)
    print("\r  Accrual period complete.          ")

    # ------------------------------------------------------------------
    # Step 7: Employee A withdraws
    # ------------------------------------------------------------------
    print("\n[Step 7/9] Employee A withdraws accrued salary...")
    try:
        emp_a_client: AppClient = employees[0]["client"]
        withdraw_result = emp_a_client.send.call(
            AppClientMethodCallParams(
                method="withdraw",
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"algoflow:demo-withdraw-A-{uuid.uuid4()}".encode(),
            )
        )

        return_value = withdraw_result.abi_return
        withdrawn_amount = int(return_value) if return_value is not None else 0
        display_withdrawn = withdrawn_amount / 10**SALARY_TOKEN_DECIMALS
        tx_log.append(("Employee A withdraw", withdraw_result.tx_id))
        print(f"  Withdrawn: {display_withdrawn:,.6f} PAYUSD")
    except Exception as e:
        print(f"\n  FAILED at Step 7: {e}", file=sys.stderr)
        sys.exit(1)

    # ------------------------------------------------------------------
    # Step 8: Update Employee B rate to $200/hr
    # ------------------------------------------------------------------
    print("\n[Step 8/9] Updating Employee B rate to $200/hr...")
    try:
        emp_b_address = employees[1]["address"]
        update_result = app_client.send.call(
            AppClientMethodCallParams(
                method="update_rate",
                args=[emp_b_address, EMPLOYEE_B_NEW_RATE],
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"algoflow:demo-update-rate-B-{uuid.uuid4()}".encode(),
            )
        )

        tx_log.append(("Update Employee B rate", update_result.tx_id))
        display_new_rate = EMPLOYEE_B_NEW_RATE / 10**SALARY_TOKEN_DECIMALS
        print(f"  Employee B new rate: {display_new_rate:,.6f} PAYUSD/hr")
    except Exception as e:
        print(f"\n  FAILED at Step 8: {e}", file=sys.stderr)
        sys.exit(1)

    # ------------------------------------------------------------------
    # Step 9: Pause Employee C stream
    # ------------------------------------------------------------------
    print("\n[Step 9/9] Pausing Employee C stream...")
    try:
        emp_c_address = employees[2]["address"]
        pause_result = app_client.send.call(
            AppClientMethodCallParams(
                method="pause_stream",
                args=[emp_c_address],
                extra_fee=AlgoAmount.from_micro_algo(1000),
                note=f"algoflow:demo-pause-C-{uuid.uuid4()}".encode(),
            )
        )

        tx_log.append(("Pause Employee C", pause_result.tx_id))
        print(f"  Employee C stream paused")
    except Exception as e:
        print(f"\n  FAILED at Step 9: {e}", file=sys.stderr)
        sys.exit(1)

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("  Demo Complete!")
    print("=" * 60)
    print(f"\n  App ID:           {app_id}")
    print(f"  Asset ID:         {asset_id}")
    print(f"  Contract Address: {contract_address}")
    print(f"  Network:          {network}")
    print(f"\n  Employees:")
    for emp in employees:
        display_rate = emp["rate"] / 10**SALARY_TOKEN_DECIMALS
        print(f"    {emp['label']}: {emp['address'][:12]}... at {display_rate:,.6f} PAYUSD/hr")
    print(f"\n  Transaction Log ({len(tx_log)} transactions):")
    print("  " + "-" * 56)
    for label, txid in tx_log:
        print(f"    {label:30s} {txid[:20]}...")
    print("  " + "-" * 56)
    print("\nDemo complete.")


def main() -> None:
    """Entry point."""
    args = parse_args()
    load_env()
    run_demo(args.network)


if __name__ == "__main__":
    main()
