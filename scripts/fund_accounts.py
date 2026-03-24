"""Account setup script — funds KMD wallet accounts, opts them in, registers them as employees.

Usage:
    python scripts/fund_accounts.py --network localnet --app-id <ID> --asset-id <ID>

Uses accounts from the KMD `unencrypted-default-wallet`:
    - Account[1] is the employer (SVKR6Q...) — skipped
    - Account[0] and Account[2] are registered as employees

Steps per employee:
    1. Fund with ALGO from dispenser (for MBR + fees)
    2. Opt into PAYUSD ASA (asset transfer of 0 to self)
    3. Opt into PayrollStream app (bare OptIn call)
    4. Register with employer (register_employee call)
"""

# Standard library
import argparse
import os
import sys
import uuid
from pathlib import Path

# AlgoKit utilities
from algokit_utils import (
    AlgorandClient,
    AlgoAmount,
    AppClient,
    AppClientParams,
    AppClientMethodCallParams,
    AppClientBareCallParams,
    AssetOptInParams,
    Arc56Contract,
)

# Project root
PROJECT_ROOT = Path(__file__).parent.parent

# ARC56 spec path
APP_SPEC_PATH = PROJECT_ROOT / "smart_contracts" / "payroll_stream" / "PayrollStream.arc56.json"

# Employee configuration: (kmd_account_index, label, hourly_rate_in_base_units)
# Account[0] and Account[2] are employees; Account[1] is the employer
EMPLOYEE_CONFIGS = [
    (0, "Alice", 100_000_000),   # 100.000000 PAYUSD/hr
    (2, "Bob", 75_000_000),      # 75.000000 PAYUSD/hr
]

# ALGO funding per employee (for MBR + opt-ins + fees)
EMPLOYEE_ALGO_FUND = 5  # 5 ALGO

# Token decimals for display
PAYUSD_DECIMALS = 6

# KMD wallet name and password
KMD_WALLET_NAME = "unencrypted-default-wallet"
KMD_WALLET_PASSWORD = ""


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Fund and register KMD wallet accounts as employees for AlgoFlow"
    )
    parser.add_argument(
        "--network",
        choices=["localnet", "testnet"],
        default="localnet",
        help="Target network (default: localnet)",
    )
    parser.add_argument(
        "--app-id",
        type=int,
        required=True,
        help="Deployed PayrollStream application ID",
    )
    parser.add_argument(
        "--asset-id",
        type=int,
        required=True,
        help="PAYUSD ASA ID",
    )
    return parser.parse_args()


def get_algorand_client(network: str) -> AlgorandClient:
    """Create an AlgorandClient for the given network."""
    if network == "localnet":
        return AlgorandClient.default_localnet()
    else:
        return AlgorandClient.testnet()


def get_kmd_accounts(algorand: AlgorandClient):
    """Get all accounts from the KMD unencrypted-default-wallet.

    Args:
        algorand: The AlgorandClient.

    Returns:
        List of account addresses from the KMD wallet.
    """
    kmd_client = algorand.client.kmd

    # List wallets and find the default one
    wallets = kmd_client.list_wallets()
    wallet_id = None
    for wallet in wallets:
        if wallet["name"] == KMD_WALLET_NAME:
            wallet_id = wallet["id"]
            break

    if wallet_id is None:
        print(f"ERROR: KMD wallet '{KMD_WALLET_NAME}' not found.", file=sys.stderr)
        sys.exit(1)

    # Get wallet handle and list keys
    handle = kmd_client.init_wallet_handle(wallet_id, KMD_WALLET_PASSWORD)
    addresses = kmd_client.list_keys(handle)
    kmd_client.release_wallet_handle(handle)

    return addresses


def get_employer(algorand: AlgorandClient, network: str):
    """Get the employer/deployer account.

    Args:
        algorand: The AlgorandClient.
        network: 'localnet' or 'testnet'.

    Returns:
        SigningAccount for the employer.
    """
    if network == "localnet":
        return algorand.account.localnet_dispenser()
    else:
        deployer_mnemonic = os.environ.get("DEPLOYER_MNEMONIC", "")
        if not deployer_mnemonic:
            print("ERROR: DEPLOYER_MNEMONIC environment variable is required for testnet.", file=sys.stderr)
            sys.exit(1)
        return algorand.account.from_mnemonic(mnemonic=deployer_mnemonic)


def get_app_client(algorand: AlgorandClient, app_id: int, employer_address: str) -> AppClient:
    """Load the AppClient for an existing deployed contract.

    Args:
        algorand: The AlgorandClient.
        app_id: The deployed application ID.
        employer_address: The employer's address (default sender).

    Returns:
        AppClient instance.
    """
    if not APP_SPEC_PATH.exists():
        print(f"ERROR: ARC56 spec not found at {APP_SPEC_PATH}", file=sys.stderr)
        sys.exit(1)

    with open(APP_SPEC_PATH) as f:
        app_spec = Arc56Contract.from_json(f.read())

    return AppClient(
        AppClientParams(
            algorand=algorand,
            app_spec=app_spec,
            app_id=app_id,
            default_sender=employer_address,
        )
    )


def get_employee_signer(algorand: AlgorandClient, employee_address: str):
    """Get a signing account for a KMD wallet address.

    Args:
        algorand: The AlgorandClient.
        employee_address: The employee's Algorand address.

    Returns:
        SigningAccount that can sign transactions for this address.
    """
    return algorand.account.from_kmd(
        name=KMD_WALLET_NAME,
        predicate=lambda acct: acct["address"] == employee_address,
    )


def fund_employee(algorand: AlgorandClient, employer, employee_address: str, label: str) -> None:
    """Fund an employee account with ALGO.

    Args:
        algorand: The AlgorandClient.
        employer: The employer signing account (funds source).
        employee_address: The employee's Algorand address.
        label: Human-readable label for the employee.
    """
    algorand.account.ensure_funded(
        employee_address,
        employer.address,
        AlgoAmount.from_algo(EMPLOYEE_ALGO_FUND),
    )
    print(f"        Funded with {EMPLOYEE_ALGO_FUND} ALGO")


def opt_employee_into_asa(algorand: AlgorandClient, employee_address: str, asset_id: int, label: str) -> None:
    """Opt an employee into the PAYUSD ASA.

    The transaction must be signed by the employee. We retrieve the signer
    from KMD since the account lives in the default wallet.

    Args:
        algorand: The AlgorandClient.
        employee_address: The employee's Algorand address.
        asset_id: The PAYUSD ASA ID.
        label: Human-readable label for the employee.
    """
    try:
        algorand.send.asset_opt_in(
            AssetOptInParams(
                sender=employee_address,
                asset_id=asset_id,
            )
        )
        print(f"        {label} opted into PAYUSD ASA (ID: {asset_id})")
    except Exception as e:
        if "already opted in" in str(e).lower() or "has already" in str(e).lower():
            print(f"        {label} already opted into ASA (skipped)")
        else:
            raise


def opt_employee_into_app(
    app_client: AppClient,
    employee_address: str,
    label: str,
) -> None:
    """Opt an employee into the PayrollStream app.

    The transaction must be signed by the employee. We clone the app client
    with the employee as sender (KMD signer is auto-resolved by AlgoKit).

    Args:
        app_client: The employer's AppClient.
        employee_address: The employee's Algorand address.
        label: Human-readable label for the employee.
    """
    employee_client = app_client.clone(default_sender=employee_address)
    try:
        employee_client.send.bare.opt_in(
            AppClientBareCallParams(
                note=f"algoflow:emp-optin-{label}-{uuid.uuid4()}".encode(),
            )
        )
        print(f"        {label} opted into PayrollStream app (ID: {app_client.app_id})")
    except Exception as e:
        if "already opted in" in str(e).lower() or "has already" in str(e).lower():
            print(f"        {label} already opted into app (skipped)")
        else:
            raise


def register_employee(
    app_client: AppClient,
    employee_address: str,
    rate: int,
    label: str,
) -> None:
    """Register an employee with the PayrollStream contract.

    Args:
        app_client: The employer's AppClient.
        employee_address: The employee's Algorand address.
        rate: Hourly salary rate in base units.
        label: Human-readable label for the employee.
    """
    try:
        app_client.send.call(
            AppClientMethodCallParams(
                method="register_employee",
                args=[employee_address, rate],
                note=f"algoflow:register-{label}-{uuid.uuid4()}".encode(),
            )
        )
        display_rate = rate / 10**PAYUSD_DECIMALS
        print(f"        {label} registered at {display_rate:,.6f} PAYUSD/hr")
    except Exception as e:
        if "already registered" in str(e).lower() or "Already registered" in str(e):
            print(f"        {label} already registered (skipped)")
        else:
            raise


def main() -> None:
    """Run the account setup pipeline using KMD wallet accounts."""
    args = parse_args()
    network = args.network
    app_id = args.app_id
    asset_id = args.asset_id

    print(f"AlgoFlow Account Setup (KMD Wallet) — target: {network}")
    print(f"  App ID:   {app_id}")
    print(f"  Asset ID: {asset_id}")
    print("-" * 50)

    # Load .env
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

    # Connect
    algorand = get_algorand_client(network)
    print(f"Connected to {network}")

    # Get all KMD accounts
    kmd_addresses = get_kmd_accounts(algorand)
    print(f"\nKMD wallet accounts ({len(kmd_addresses)} total):")
    for i, addr in enumerate(kmd_addresses):
        print(f"  [{i}] {addr}")

    # Get employer
    employer = get_employer(algorand, network)
    print(f"\nEmployer (dispenser): {employer.address}")

    # Identify employer in KMD (Account[1])
    if len(kmd_addresses) < 3:
        print(f"ERROR: KMD wallet has only {len(kmd_addresses)} accounts, need at least 3.", file=sys.stderr)
        sys.exit(1)

    # Get AppClient
    app_client = get_app_client(algorand, app_id, employer.address)

    # Register each employee's KMD signer with the AlgorandClient
    # so that cloned AppClients can auto-sign for them
    for kmd_index, label, rate in EMPLOYEE_CONFIGS:
        employee_address = kmd_addresses[kmd_index]
        signer = get_employee_signer(algorand, employee_address)
        print(f"\n  Loaded KMD signer for {label}: {signer.address}")

    # Process each employee
    employees = []
    print("\nRegistering KMD accounts as employees:")
    print("=" * 50)

    for kmd_index, label, rate in EMPLOYEE_CONFIGS:
        employee_address = kmd_addresses[kmd_index]
        print(f"\n  Employee: {label} (KMD account[{kmd_index}])")
        print(f"  Address:  {employee_address}")
        print(f"  {'─' * 40}")

        # Fund with ALGO
        fund_employee(algorand, employer, employee_address, label)

        # Opt into ASA (signed by employee via KMD)
        opt_employee_into_asa(algorand, employee_address, asset_id, label)

        # Opt into app (signed by employee via KMD)
        opt_employee_into_app(app_client, employee_address, label)

        # Register with contract (signed by employer)
        register_employee(app_client, employee_address, rate, label)

        employees.append({
            "label": label,
            "kmd_index": kmd_index,
            "address": employee_address,
            "rate": rate,
        })

    # Summary
    print("\n" + "=" * 60)
    print("  Employee Setup Summary (KMD Wallet Accounts)")
    print("=" * 60)
    for emp in employees:
        display_rate = emp["rate"] / 10**PAYUSD_DECIMALS
        print(f"  {emp['label']:10s} | KMD[{emp['kmd_index']}] | {emp['address']} | {display_rate:>12,.6f} PAYUSD/hr")
    print("=" * 60)
    print(f"\n  Total employees registered: {len(employees)}")
    print(f"  App ID: {app_id}")
    print(f"  Asset ID: {asset_id}")
    print(f"\n  These accounts are in the KMD wallet — connect via KMD in the browser to use them.")
    print("\nDone!")


if __name__ == "__main__":
    main()
