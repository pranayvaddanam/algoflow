"""Full deployment script for AlgoFlow — creates PAYUSD ASA, deploys PayrollStream, configures clawback.

Usage:
    python scripts/deploy.py --network localnet
    python scripts/deploy.py --network testnet

Steps:
    1. Connect to algod
    2. Get deployer account (KMD for localnet, DEPLOYER_MNEMONIC for testnet)
    3. Create PAYUSD ASA
    4. Deploy PayrollStream contract (create call with asset ID)
    5. Fund contract with ALGO (MBR + inner txn fees)
    6. Contract opts into ASA
    7. Reconfigure ASA clawback to contract address
    8. Fund contract with PAYUSD tokens
    9. Write APP_ID and ASSET_ID to .env
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

# Token constants (mirrored from smart_contracts/helpers/constants.py)
SALARY_TOKEN_TOTAL_SUPPLY = 1_000_000_000_000  # 1M tokens with 6 decimals
SALARY_TOKEN_DECIMALS = 6
SALARY_TOKEN_UNIT_NAME = "PAYUSD"
SALARY_TOKEN_NAME = "AlgoFlow USD"

# Contract funding amounts
CONTRACT_ALGO_FUND = 2  # 2 ALGO for MBR + inner txn fees
CONTRACT_PAYUSD_FUND = 500_000_000_000  # 500k PAYUSD (half of total supply)

# ARC56 spec path
APP_SPEC_PATH = PROJECT_ROOT / "smart_contracts" / "payroll_stream" / "PayrollStream.arc56.json"

# Confirmation rounds
TX_CONFIRMATION_ROUNDS = 4


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Deploy AlgoFlow — PAYUSD ASA + PayrollStream contract"
    )
    parser.add_argument(
        "--network",
        choices=["localnet", "testnet"],
        default="localnet",
        help="Target network (default: localnet)",
    )
    return parser.parse_args()


def get_algorand_client(network: str) -> AlgorandClient:
    """Create an AlgorandClient for the given network.

    Args:
        network: 'localnet' or 'testnet'.

    Returns:
        Configured AlgorandClient instance.
    """
    if network == "localnet":
        return AlgorandClient.default_localnet()
    else:
        return AlgorandClient.testnet()


def get_deployer(algorand: AlgorandClient, network: str):
    """Get the deployer account.

    For localnet: uses the default localnet dispenser.
    For testnet: derives from DEPLOYER_MNEMONIC env var.

    Args:
        algorand: The AlgorandClient.
        network: 'localnet' or 'testnet'.

    Returns:
        Signing account for the deployer.
    """
    if network == "localnet":
        return algorand.account.localnet_dispenser()
    else:
        deployer_mnemonic = os.environ.get("DEPLOYER_MNEMONIC", "")
        if not deployer_mnemonic:
            print("ERROR: DEPLOYER_MNEMONIC environment variable is required for testnet.", file=sys.stderr)
            sys.exit(1)
        return algorand.account.from_mnemonic(mnemonic=deployer_mnemonic)


def create_payusd_asa(algorand: AlgorandClient, deployer) -> int:
    """Create the PAYUSD salary token ASA.

    Args:
        algorand: The AlgorandClient.
        deployer: The deployer signing account.

    Returns:
        The created ASA ID.
    """
    print("\n[1/8] Creating PAYUSD ASA...")

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
            note=f"algoflow:asa-create-{uuid.uuid4()}".encode(),
        )
    )

    asset_id = result.asset_id
    print(f"    PAYUSD ASA created: ID = {asset_id}")
    print(f"    Name: {SALARY_TOKEN_NAME}")
    print(f"    Unit: {SALARY_TOKEN_UNIT_NAME}")
    print(f"    Decimals: {SALARY_TOKEN_DECIMALS}")
    print(f"    Total supply: {SALARY_TOKEN_TOTAL_SUPPLY} base units ({SALARY_TOKEN_TOTAL_SUPPLY // 10**SALARY_TOKEN_DECIMALS:,} tokens)")
    return asset_id


def deploy_contract(algorand: AlgorandClient, deployer, asset_id: int):
    """Deploy the PayrollStream contract.

    Args:
        algorand: The AlgorandClient.
        deployer: The deployer signing account.
        asset_id: The PAYUSD ASA ID.

    Returns:
        The AppClient for the deployed contract.
    """
    print("\n[2/8] Deploying PayrollStream contract...")

    if not APP_SPEC_PATH.exists():
        print(f"ERROR: ARC56 spec not found at {APP_SPEC_PATH}", file=sys.stderr)
        print("Run: algokit compile python smart_contracts/payroll_stream/contract.py", file=sys.stderr)
        sys.exit(1)

    with open(APP_SPEC_PATH) as f:
        app_spec = Arc56Contract.from_json(f.read())

    factory = AppFactory(
        AppFactoryParams(
            algorand=algorand,
            app_spec=app_spec,
            default_sender=deployer.address,
        )
    )

    app_client, result = factory.send.create(
        AppFactoryCreateMethodCallParams(
            method="create",
            args=[asset_id],
            note=f"algoflow:deploy-{uuid.uuid4()}".encode(),
        )
    )

    print(f"    App ID: {app_client.app_id}")
    print(f"    App Address: {app_client.app_address}")
    return app_client


def fund_contract_algo(algorand: AlgorandClient, deployer, app_client) -> None:
    """Fund the contract with ALGO for MBR and inner transaction fees.

    Args:
        algorand: The AlgorandClient.
        deployer: The deployer signing account.
        app_client: The deployed AppClient.
    """
    print("\n[3/8] Funding contract with ALGO...")

    algorand.send.payment(
        PaymentParams(
            sender=deployer.address,
            receiver=app_client.app_address,
            amount=AlgoAmount.from_algo(CONTRACT_ALGO_FUND),
            note=f"algoflow:mbr-fund-{uuid.uuid4()}".encode(),
        )
    )

    print(f"    Sent {CONTRACT_ALGO_FUND} ALGO to {app_client.app_address}")


def opt_contract_into_asa(app_client) -> None:
    """Call opt_in_asset() on the contract so it can hold PAYUSD.

    Args:
        app_client: The deployed AppClient.
    """
    print("\n[4/8] Opting contract into PAYUSD ASA...")

    app_client.send.call(
        AppClientMethodCallParams(
            method="opt_in_asset",
            extra_fee=AlgoAmount.from_micro_algo(1000),
            note=f"algoflow:opt-in-asa-{uuid.uuid4()}".encode(),
        )
    )

    print("    Contract opted into PAYUSD ASA")


def reconfigure_clawback(algorand: AlgorandClient, deployer, asset_id: int, contract_address: str) -> None:
    """Reconfigure the ASA clawback address to the contract.

    Args:
        algorand: The AlgorandClient.
        deployer: The deployer signing account.
        asset_id: The PAYUSD ASA ID.
        contract_address: The contract application address.
    """
    print("\n[5/8] Reconfiguring ASA clawback to contract address...")

    sp = algorand.client.algod.suggested_params()
    txn = AssetConfigTxn(
        sender=deployer.address,
        sp=sp,
        index=asset_id,
        manager=deployer.address,
        reserve=deployer.address,
        freeze=deployer.address,
        clawback=contract_address,
        note=f"algoflow:clawback-reconfig-{uuid.uuid4()}".encode(),
        strict_empty_address_check=False,
    )

    signed_txn = txn.sign(deployer.private_key)
    txid = algorand.client.algod.send_transaction(signed_txn)
    wait_for_confirmation(algorand.client.algod, txid, TX_CONFIRMATION_ROUNDS)

    print(f"    Clawback set to: {contract_address}")


def fund_contract_payusd(algorand: AlgorandClient, deployer, app_client, asset_id: int) -> None:
    """Fund the contract with PAYUSD tokens via the fund() ABI method.

    Args:
        algorand: The AlgorandClient.
        deployer: The deployer signing account.
        app_client: The deployed AppClient.
        asset_id: The PAYUSD ASA ID.
    """
    print("\n[6/8] Funding contract with PAYUSD tokens...")

    sp = algorand.client.algod.suggested_params()
    axfer_txn = AssetTransferTxn(
        sender=deployer.address,
        sp=sp,
        receiver=app_client.app_address,
        amt=CONTRACT_PAYUSD_FUND,
        index=asset_id,
        note=f"algoflow:fund-payusd-{uuid.uuid4()}".encode(),
    )
    signer = algorand.account.get_signer(deployer.address)

    app_client.send.call(
        AppClientMethodCallParams(
            method="fund",
            args=[TransactionWithSigner(txn=axfer_txn, signer=signer)],
            note=f"algoflow:fund-call-{uuid.uuid4()}".encode(),
        )
    )

    display_amount = CONTRACT_PAYUSD_FUND / 10**SALARY_TOKEN_DECIMALS
    print(f"    Sent {display_amount:,.6f} PAYUSD to contract")


def update_env_file(app_id: int, asset_id: int, network: str = "localnet") -> None:
    """Write APP_ID, ASSET_ID, and network-specific VITE vars to .env file.

    Args:
        app_id: The deployed application ID.
        asset_id: The created ASA ID.
        network: Target network ('localnet' or 'testnet').
    """
    print("\n[7/8] Updating .env file...")

    env_path = PROJECT_ROOT / ".env"
    if env_path.exists():
        content = env_path.read_text()
    else:
        content = ""

    # Update APP_ID
    if re.search(r"^APP_ID=", content, re.MULTILINE):
        content = re.sub(r"^APP_ID=.*$", f"APP_ID={app_id}", content, flags=re.MULTILINE)
    else:
        content += f"\nAPP_ID={app_id}\n"

    # Update ASSET_ID
    if re.search(r"^ASSET_ID=", content, re.MULTILINE):
        content = re.sub(r"^ASSET_ID=.*$", f"ASSET_ID={asset_id}", content, flags=re.MULTILINE)
    else:
        content += f"\nASSET_ID={asset_id}\n"

    # Update VITE_ equivalents
    if re.search(r"^VITE_APP_ID=", content, re.MULTILINE):
        content = re.sub(r"^VITE_APP_ID=.*$", f"VITE_APP_ID={app_id}", content, flags=re.MULTILINE)
    else:
        content += f"\nVITE_APP_ID={app_id}\n"

    if re.search(r"^VITE_ASSET_ID=", content, re.MULTILINE):
        content = re.sub(r"^VITE_ASSET_ID=.*$", f"VITE_ASSET_ID={asset_id}", content, flags=re.MULTILINE)
    else:
        content += f"\nVITE_ASSET_ID={asset_id}\n"

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
    print(f"    .env updated: APP_ID={app_id}, ASSET_ID={asset_id}, VITE_NETWORK={network}")


def print_summary(app_id: int, asset_id: int, contract_address: str, deployer_address: str) -> None:
    """Print deployment summary.

    Args:
        app_id: The deployed application ID.
        asset_id: The created ASA ID.
        contract_address: The contract application address.
        deployer_address: The deployer/employer address.
    """
    print("\n[8/8] Deployment complete!")
    print("=" * 60)
    print("  AlgoFlow Deployment Summary")
    print("=" * 60)
    print(f"  App ID:           {app_id}")
    print(f"  Asset ID:         {asset_id}")
    print(f"  Employer Address: {deployer_address}")
    print(f"  Contract Address: {contract_address}")
    print(f"  Token:            {SALARY_TOKEN_NAME} ({SALARY_TOKEN_UNIT_NAME})")
    print(f"  Decimals:         {SALARY_TOKEN_DECIMALS}")
    print(f"  Total Supply:     {SALARY_TOKEN_TOTAL_SUPPLY // 10**SALARY_TOKEN_DECIMALS:,} PAYUSD")
    print(f"  Contract Funded:  {CONTRACT_PAYUSD_FUND // 10**SALARY_TOKEN_DECIMALS:,} PAYUSD")
    print("=" * 60)
    print()
    print("  NOTE: The employer address stored in the contract is the")
    print(f"  deployer address above. In the browser, KMD may connect a")
    print(f"  different account by default. The frontend auto-switches to")
    print(f"  the employer account if it's in the same KMD wallet.")
    print(f"  If Access Denied appears, use the account selector to pick")
    print(f"  the employer address manually.")
    print()


def main() -> None:
    """Run the full deployment pipeline."""
    args = parse_args()
    network = args.network

    print(f"AlgoFlow Deployment — target: {network}")
    print("-" * 40)

    # Step 0: Load .env
    env_path = PROJECT_ROOT / ".env"
    if env_path.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv(env_path)
        except ImportError:
            # dotenv not installed — read manually for essential vars
            for line in env_path.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    os.environ.setdefault(key.strip(), value.strip())

    # Step 1: Connect
    algorand = get_algorand_client(network)
    print(f"Connected to {network} algod")

    # Step 2: Get deployer
    deployer = get_deployer(algorand, network)
    print(f"Deployer: {deployer.address}")

    # Step 3: Create PAYUSD ASA
    asset_id = create_payusd_asa(algorand, deployer)

    # Step 4: Deploy contract
    app_client = deploy_contract(algorand, deployer, asset_id)

    # Step 5: Fund contract with ALGO
    fund_contract_algo(algorand, deployer, app_client)

    # Step 6: Opt contract into ASA
    opt_contract_into_asa(app_client)

    # Step 7: Reconfigure clawback
    reconfigure_clawback(algorand, deployer, asset_id, app_client.app_address)

    # Step 8: Fund contract with PAYUSD
    fund_contract_payusd(algorand, deployer, app_client, asset_id)

    # Step 9: Write to .env
    update_env_file(app_client.app_id, asset_id, network)

    # Step 10: Summary
    print_summary(app_client.app_id, asset_id, app_client.app_address, deployer.address)


if __name__ == "__main__":
    main()
