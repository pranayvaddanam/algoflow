"""Demo reset script — deploys a fresh ASA + contract and updates .env.

Usage:
    python scripts/reset.py --network localnet
    python scripts/reset.py --network testnet

Does NOT try to clean up old deployments. Simply:
    1. Create a fresh PAYUSD ASA
    2. Deploy a fresh PayrollStream contract
    3. Fund contract with ALGO (MBR)
    4. Opt contract into ASA
    5. Reconfigure clawback
    6. Fund contract with PAYUSD
    7. Update .env with new IDs
"""

# Standard library
import argparse
import os
import re
import sys
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
    AppClientMethodCallParams,
    AssetCreateParams,
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

# Contract funding
CONTRACT_ALGO_FUND = 2  # 2 ALGO for MBR + inner txn fees
CONTRACT_PAYUSD_FUND = 500_000_000_000  # 500k PAYUSD

# ARC56 spec path
APP_SPEC_PATH = PROJECT_ROOT / "smart_contracts" / "payroll_stream" / "PayrollStream.arc56.json"

# Confirmation rounds
TX_CONFIRMATION_ROUNDS = 4


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Reset AlgoFlow demo — fresh ASA + contract"
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


def update_env_file(app_id: int, asset_id: int, network: str) -> None:
    """Write APP_ID, ASSET_ID, and network VITE vars to .env file."""
    env_path = PROJECT_ROOT / ".env"
    if env_path.exists():
        content = env_path.read_text()
    else:
        content = ""

    # Update core IDs
    for key, value in [
        ("APP_ID", str(app_id)),
        ("ASSET_ID", str(asset_id)),
        ("VITE_APP_ID", str(app_id)),
        ("VITE_ASSET_ID", str(asset_id)),
    ]:
        if re.search(rf"^{key}=", content, re.MULTILINE):
            content = re.sub(rf"^{key}=.*$", f"{key}={value}", content, flags=re.MULTILINE)
        else:
            content += f"\n{key}={value}\n"

    # Update network-specific VITE vars
    network_configs = {
        "localnet": {
            "VITE_ALGOD_SERVER": "http://localhost:4001",
            "VITE_ALGOD_TOKEN": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "VITE_INDEXER_SERVER": "http://localhost:8980",
            "VITE_INDEXER_TOKEN": "",
            "VITE_NETWORK": "localnet",
        },
        "testnet": {
            "VITE_ALGOD_SERVER": "https://testnet-api.algonode.cloud",
            "VITE_ALGOD_TOKEN": "",
            "VITE_INDEXER_SERVER": "https://testnet-idx.algonode.cloud",
            "VITE_INDEXER_TOKEN": "",
            "VITE_NETWORK": "testnet",
        },
    }
    for key, value in network_configs.get(network, {}).items():
        if re.search(rf"^{key}=", content, re.MULTILINE):
            content = re.sub(rf"^{key}=.*$", f"{key}={value}", content, flags=re.MULTILINE)
        else:
            content += f"\n{key}={value}\n"

    env_path.write_text(content)
    print(f"  .env updated: APP_ID={app_id}, ASSET_ID={asset_id}, VITE_NETWORK={network}")


def run_reset(network: str) -> None:
    """Deploy fresh ASA + contract and update .env."""
    print("=" * 60)
    print("  AlgoFlow Demo Reset")
    print(f"  Network: {network}")
    print("=" * 60)

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

    # Step 1: Create fresh PAYUSD ASA
    print("[1/7] Creating fresh PAYUSD ASA...")
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
            note=f"algoflow:reset-asa-{uuid.uuid4()}".encode(),
        )
    )
    asset_id = result.asset_id
    print(f"  PAYUSD ASA ID: {asset_id}")

    # Step 2: Deploy fresh contract
    print("\n[2/7] Deploying fresh PayrollStream contract...")
    factory = AppFactory(
        AppFactoryParams(
            algorand=algorand,
            app_spec=app_spec,
            default_sender=deployer.address,
        )
    )

    app_client, _create_result = factory.send.create(
        AppFactoryCreateMethodCallParams(
            method="create",
            args=[asset_id],
            note=f"algoflow:reset-deploy-{uuid.uuid4()}".encode(),
        )
    )
    app_id = app_client.app_id
    contract_address = app_client.app_address
    print(f"  App ID: {app_id}")
    print(f"  App Address: {contract_address}")

    # Step 3: Fund contract with ALGO
    print("\n[3/7] Funding contract with ALGO (MBR)...")
    algorand.send.payment(
        PaymentParams(
            sender=deployer.address,
            receiver=contract_address,
            amount=AlgoAmount.from_algo(CONTRACT_ALGO_FUND),
            note=f"algoflow:reset-mbr-{uuid.uuid4()}".encode(),
        )
    )
    print(f"  Sent {CONTRACT_ALGO_FUND} ALGO")

    # Step 4: Opt contract into ASA
    print("\n[4/7] Opting contract into PAYUSD ASA...")
    app_client.send.call(
        AppClientMethodCallParams(
            method="opt_in_asset",
            extra_fee=AlgoAmount.from_micro_algo(1000),
            note=f"algoflow:reset-opt-in-{uuid.uuid4()}".encode(),
        )
    )
    print("  Contract opted into PAYUSD")

    # Step 5: Reconfigure clawback
    print("\n[5/7] Reconfiguring clawback to contract...")
    sp = algorand.client.algod.suggested_params()
    clawback_txn = AssetConfigTxn(
        sender=deployer.address,
        sp=sp,
        index=asset_id,
        manager=deployer.address,
        reserve=deployer.address,
        freeze=deployer.address,
        clawback=contract_address,
        note=f"algoflow:reset-clawback-{uuid.uuid4()}".encode(),
        strict_empty_address_check=False,
    )
    signed_txn = clawback_txn.sign(deployer.private_key)
    txid = algorand.client.algod.send_transaction(signed_txn)
    wait_for_confirmation(algorand.client.algod, txid, TX_CONFIRMATION_ROUNDS)
    print(f"  Clawback set to {contract_address}")

    # Step 6: Fund contract with PAYUSD
    print("\n[6/7] Funding contract with PAYUSD...")
    sp = algorand.client.algod.suggested_params()
    axfer_txn = AssetTransferTxn(
        sender=deployer.address,
        sp=sp,
        receiver=contract_address,
        amt=CONTRACT_PAYUSD_FUND,
        index=asset_id,
        note=f"algoflow:reset-fund-{uuid.uuid4()}".encode(),
    )
    signer = algorand.account.get_signer(deployer.address)

    app_client.send.call(
        AppClientMethodCallParams(
            method="fund",
            args=[TransactionWithSigner(txn=axfer_txn, signer=signer)],
            note=f"algoflow:reset-fund-call-{uuid.uuid4()}".encode(),
        )
    )
    display_amount = CONTRACT_PAYUSD_FUND / 10**SALARY_TOKEN_DECIMALS
    print(f"  Funded with {display_amount:,.6f} PAYUSD")

    # Step 7: Update .env
    print("\n[7/7] Updating .env...")
    update_env_file(app_id, asset_id, network)

    # Summary
    print("\n" + "=" * 60)
    print("  Reset Complete!")
    print("=" * 60)
    print(f"  App ID:           {app_id}")
    print(f"  Asset ID:         {asset_id}")
    print(f"  Contract Address: {contract_address}")
    print(f"  Network:          {network}")
    print("=" * 60)
    print("\nReady for a fresh demo run.")


def main() -> None:
    """Entry point."""
    args = parse_args()
    load_env()
    run_reset(args.network)


if __name__ == "__main__":
    main()
