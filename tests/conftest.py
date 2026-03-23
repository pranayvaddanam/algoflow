"""Shared pytest fixtures for AlgoFlow smart contract tests.

Provides reusable fixtures for the Algod client, test accounts,
application client, and common test setup.
"""

# Standard library
import time
import uuid

# Third-party
import pytest
import algosdk
from algosdk.atomic_transaction_composer import TransactionWithSigner

# AlgoKit utilities
from algokit_utils import (
    AlgorandClient,
    AppFactory,
    AppFactoryParams,
    AppFactoryCreateMethodCallParams,
    AppClientMethodCallParams,
    AppClientBareCallParams,
    Arc56Contract,
    AlgoAmount,
    AssetCreateParams,
    AssetOptInParams,
    PaymentParams,
    AppClient,
)

# Path to compiled contract spec
APP_SPEC_PATH = "smart_contracts/payroll_stream/PayrollStream.arc56.json"

# Token configuration
PAYUSD_TOTAL_SUPPLY = 1_000_000_000_000  # 1M tokens with 6 decimals
PAYUSD_DECIMALS = 6
CONTRACT_FUND_AMOUNT = 10_000_000_000  # 10k PAYUSD (conservative to avoid employer running out)
EMPLOYEE_HOURLY_RATE = 3_600_000_000  # 3600 PAYUSD/hr = 1_000_000 PAYUSD/sec (for fast testing)


# ------------------------------------------------------------------ #
#  Fixture: Algorand Client
# ------------------------------------------------------------------ #

@pytest.fixture(scope="session")
def algorand() -> AlgorandClient:
    """Create an AlgorandClient connected to LocalNet."""
    return AlgorandClient.default_localnet()


# ------------------------------------------------------------------ #
#  Fixture: Dispenser Account
# ------------------------------------------------------------------ #

@pytest.fixture(scope="session")
def dispenser(algorand: AlgorandClient):
    """Get the LocalNet dispenser account."""
    return algorand.account.localnet_dispenser()


# ------------------------------------------------------------------ #
#  Fixture: Employer Account
# ------------------------------------------------------------------ #

@pytest.fixture(scope="session")
def employer(algorand: AlgorandClient, dispenser):
    """Create and fund the employer account."""
    account = algorand.account.random()
    algorand.account.ensure_funded(
        account.address, dispenser.address, AlgoAmount.from_algo(1000)
    )
    return account


# ------------------------------------------------------------------ #
#  Fixture: PAYUSD Asset
# ------------------------------------------------------------------ #

@pytest.fixture(scope="session")
def asset_id(algorand: AlgorandClient, employer) -> int:
    """Create the PAYUSD salary token ASA."""
    result = algorand.send.asset_create(
        AssetCreateParams(
            sender=employer.address,
            total=PAYUSD_TOTAL_SUPPLY,
            decimals=PAYUSD_DECIMALS,
            unit_name="PAYUSD",
            asset_name="AlgoFlow USD",
            default_frozen=False,
        )
    )
    return result.asset_id


# ------------------------------------------------------------------ #
#  Fixture: App Spec
# ------------------------------------------------------------------ #

@pytest.fixture(scope="session")
def app_spec() -> Arc56Contract:
    """Load the compiled ARC56 app spec."""
    with open(APP_SPEC_PATH) as f:
        return Arc56Contract.from_json(f.read())


# ------------------------------------------------------------------ #
#  Fixture: Employee Accounts (3)
# ------------------------------------------------------------------ #

@pytest.fixture(scope="session")
def employee_accounts(algorand: AlgorandClient, dispenser):
    """Create and fund 3 employee accounts."""
    employees = []
    for _ in range(3):
        account = algorand.account.random()
        algorand.account.ensure_funded(
            account.address, dispenser.address, AlgoAmount.from_algo(10)
        )
        employees.append(account)
    return employees


# ------------------------------------------------------------------ #
#  Fixture: Non-employer account
# ------------------------------------------------------------------ #

@pytest.fixture(scope="session")
def non_employer(algorand: AlgorandClient, dispenser):
    """Create and fund an unauthorized (non-employer) account."""
    account = algorand.account.random()
    algorand.account.ensure_funded(
        account.address, dispenser.address, AlgoAmount.from_algo(10)
    )
    return account


# ------------------------------------------------------------------ #
#  Helper: Deploy a fresh app
# ------------------------------------------------------------------ #

def deploy_fresh_app(
    algorand: AlgorandClient,
    employer,
    asset_id: int,
    app_spec: Arc56Contract,
    fund_amount: int = CONTRACT_FUND_AMOUNT,
) -> AppClient:
    """Deploy a fresh PayrollStream contract.

    Creates the app, funds it with ALGO, opts it into the ASA,
    and funds it with PAYUSD.
    """
    factory = AppFactory(
        AppFactoryParams(
            algorand=algorand,
            app_spec=app_spec,
            default_sender=employer.address,
        )
    )

    # Create the contract with a unique note to avoid tx collisions
    app_client, _ = factory.send.create(
        AppFactoryCreateMethodCallParams(
            method="create",
            args=[asset_id],
            note=f"deploy-{uuid.uuid4()}".encode(),
        )
    )

    # Fund contract with ALGO for MBR
    algorand.send.payment(
        PaymentParams(
            sender=employer.address,
            receiver=app_client.app_address,
            amount=AlgoAmount.from_algo(1),
            note=f"mbr-{uuid.uuid4()}".encode(),
        )
    )

    # Opt contract into the salary ASA
    app_client.send.call(
        AppClientMethodCallParams(
            method="opt_in_asset",
            extra_fee=AlgoAmount.from_micro_algo(1000),
            note=f"optin-{uuid.uuid4()}".encode(),
        )
    )

    # Fund contract with PAYUSD
    sp = algorand.client.algod.suggested_params()
    axfer_txn = algosdk.transaction.AssetTransferTxn(
        sender=employer.address,
        sp=sp,
        receiver=app_client.app_address,
        amt=fund_amount,
        index=asset_id,
        note=f"fund-{uuid.uuid4()}".encode(),
    )
    signer = algorand.account.get_signer(employer.address)
    app_client.send.call(
        AppClientMethodCallParams(
            method="fund",
            args=[TransactionWithSigner(txn=axfer_txn, signer=signer)],
            note=f"fund-call-{uuid.uuid4()}".encode(),
        )
    )

    return app_client


# ------------------------------------------------------------------ #
#  Fixture: Deployed App (fresh per test function)
# ------------------------------------------------------------------ #

@pytest.fixture
def deployed_app(
    algorand: AlgorandClient,
    employer,
    asset_id: int,
    app_spec: Arc56Contract,
) -> AppClient:
    """Deploy a fresh PayrollStream contract for each test."""
    return deploy_fresh_app(algorand, employer, asset_id, app_spec)


# ------------------------------------------------------------------ #
#  Fixture: Registered Employee
# ------------------------------------------------------------------ #

@pytest.fixture
def registered_employee(
    algorand: AlgorandClient,
    deployed_app: AppClient,
    employee_accounts,
    asset_id: int,
    employer,
):
    """Register the first employee account into the deployed app.

    Returns:
        Tuple of (employee_signing_account, employee_app_client).
    """
    employee = employee_accounts[0]

    # Employee opts into the ASA (idempotent)
    try:
        algorand.send.asset_opt_in(
            AssetOptInParams(sender=employee.address, asset_id=asset_id)
        )
    except Exception:
        pass

    # Employee opts into the app
    employee_client = deployed_app.clone(default_sender=employee.address)
    employee_client.send.bare.opt_in(
        AppClientBareCallParams(
            note=f"emp-optin-{uuid.uuid4()}".encode(),
        )
    )

    # Employer registers the employee
    deployed_app.send.call(
        AppClientMethodCallParams(
            method="register_employee",
            args=[employee.address, EMPLOYEE_HOURLY_RATE],
            note=f"register-{uuid.uuid4()}".encode(),
        )
    )

    return employee, employee_client


# ------------------------------------------------------------------ #
#  Helper: Advance blocks to accumulate time
# ------------------------------------------------------------------ #

def advance_time(algorand: AlgorandClient, sender_address: str, seconds: int = 5):
    """Send dummy transactions to advance block time on LocalNet."""
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
