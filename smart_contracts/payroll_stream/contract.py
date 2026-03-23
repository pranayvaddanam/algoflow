"""PayrollStream — ARC4 smart contract for real-time payroll streaming on Algorand.

Employers fund the contract with tokenized salary units (ASAs), which stream
continuously to employees. Employees withdraw accrued earnings at any time
with instant settlement.

State Schema:
    Global: 4 UInt64 + 1 byte-slice (Account)
    Local:  5 UInt64
"""

from algopy import (
    ARC4Contract,
    Account,
    Asset,
    GlobalState,
    LocalState,
    UInt64,
)


class PayrollStream(ARC4Contract):
    """Decentralized payroll streaming contract.

    Employers register employees with hourly salary rates. The contract
    mathematically computes accrued salary based on elapsed time, and
    employees withdraw on demand via inner asset transfers.

    Global state (5 keys):
        employer       — Address of the employer who created the contract (byte-slice)
        salary_asset   — ASA ID of the PAYUSD salary token (uint64)
        total_employees — Count of currently registered employees (uint64)
        total_streamed — Cumulative tokens disbursed to all employees (uint64)
        is_paused      — Global emergency pause flag: 0 = active, 1 = paused (uint64)

    Local state per employee (5 keys):
        salary_rate     — Tokens per hour in base units (uint64)
        stream_start    — Unix timestamp when streaming began (uint64)
        last_withdrawal — Unix timestamp of last withdrawal (uint64)
        total_withdrawn — Cumulative tokens withdrawn (uint64)
        is_active       — Stream status: 0 = paused, 1 = active (uint64)
    """

    # ------------------------------------------------------------------ #
    #  Global State Declarations
    # ------------------------------------------------------------------ #

    employer: GlobalState[Account]
    """Algorand address of the employer who deployed the contract.
    Immutable after create(). Used as the authorization anchor for all
    employer-only methods. Stored as a 32-byte byte-slice on the AVM."""

    salary_asset: GlobalState[Asset]
    """ASA ID of the PAYUSD salary token. Immutable after create().
    Referenced in every inner AssetTransfer."""

    total_employees: GlobalState[UInt64]
    """Count of currently registered (not removed) employees.
    Includes both active and individually paused employees."""

    total_streamed: GlobalState[UInt64]
    """Cumulative lifetime tokens disbursed across all employees.
    Monotonically increasing — never decreases."""

    is_paused: GlobalState[UInt64]
    """Global emergency pause flag. When 1, all withdraw() calls
    are rejected. Individual stream pauses are independent."""

    # ------------------------------------------------------------------ #
    #  Local State Declarations (per employee)
    # ------------------------------------------------------------------ #

    salary_rate: LocalState[UInt64]
    """Hourly token rate for this employee's salary stream.
    Stored in base units (6 decimals). e.g., 100_000_000 = 100.000000 PAYUSD/hr."""

    stream_start: LocalState[UInt64]
    """Unix timestamp marking when the current streaming period began.
    Reset on registration, resume, and rate update."""

    last_withdrawal: LocalState[UInt64]
    """Unix timestamp of the most recent withdrawal or settlement.
    The accrual formula uses (now - last_withdrawal) as elapsed time."""

    total_withdrawn: LocalState[UInt64]
    """Cumulative lifetime tokens withdrawn by this employee.
    Monotonically increasing — never decreases."""

    is_active: LocalState[UInt64]
    """Whether this employee's stream is currently active.
    0 = paused or pending removal. 1 = actively accruing."""

    # ------------------------------------------------------------------ #
    #  Contract methods will be implemented in subsequent sprints.
    #  Sprint 1: create, opt_in_asset, fund, register_employee, withdraw,
    #            get_accrued
    #  Sprint 2: update_rate, pause_stream, resume_stream, remove_employee,
    #            pause_all, milestone_pay
    #  Stretch:  resume_all, drain_funds
    # ------------------------------------------------------------------ #
