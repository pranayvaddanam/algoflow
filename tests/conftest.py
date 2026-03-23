"""Shared pytest fixtures for AlgoFlow smart contract tests.

Provides reusable fixtures for the Algod client, test accounts,
application client, and common test setup. Fixtures will be fully
implemented once the PayrollStream contract methods are added in Sprint 1.
"""

# Standard library
# import os

# Third-party
# import pytest
# from algosdk.v2client import algod
# from algosdk import account, mnemonic

# AlgoKit utilities
# from algokit_utils import (
#     ApplicationClient,
#     get_localnet_default_account,
# )

# Local project
# from smart_contracts.payroll_stream.contract import PayrollStream


# ------------------------------------------------------------------ #
#  Fixture: Algod Client
# ------------------------------------------------------------------ #

# @pytest.fixture(scope="session")
# def algod_client() -> algod.AlgodClient:
#     """Create an Algod client connected to LocalNet.
#
#     Returns:
#         Configured AlgodClient instance.
#     """
#     server = os.environ.get("ALGOD_SERVER", "http://localhost:4001")
#     token = os.environ.get(
#         "ALGOD_TOKEN",
#         "a" * 64,
#     )
#     return algod.AlgodClient(algod_token=token, algod_address=server)


# ------------------------------------------------------------------ #
#  Fixture: Deployer Account
# ------------------------------------------------------------------ #

# @pytest.fixture(scope="session")
# def deployer(algod_client: algod.AlgodClient):
#     """Get the default LocalNet deployer account.
#
#     Returns:
#         Account with funded ALGO balance on LocalNet.
#     """
#     return get_localnet_default_account(algod_client)


# ------------------------------------------------------------------ #
#  Fixture: Application Client
# ------------------------------------------------------------------ #

# @pytest.fixture
# def app_client(algod_client: algod.AlgodClient, deployer):
#     """Deploy a fresh PayrollStream contract for each test.
#
#     Returns:
#         ApplicationClient instance connected to the deployed app.
#     """
#     # Will be implemented once contract ABI methods exist.
#     pass


# ------------------------------------------------------------------ #
#  Fixture: Employee Account
# ------------------------------------------------------------------ #

# @pytest.fixture
# def employee_account():
#     """Generate a fresh Algorand account for use as an employee.
#
#     Returns:
#         Tuple of (private_key, address).
#     """
#     private_key, address = account.generate_account()
#     return private_key, address
