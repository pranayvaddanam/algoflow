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
    Global,
    GlobalState,
    LocalState,
    Txn,
    UInt64,
    arc4,
    gtxn,
    itxn,
    op,
    subroutine,
)


class PayrollStream(ARC4Contract):
    """Decentralized payroll streaming contract.

    Employers register employees with hourly salary rates. The contract
    mathematically computes accrued salary based on elapsed time, and
    employees withdraw on demand via inner asset transfers.
    """

    def __init__(self) -> None:
        # Global state declarations
        self.employer = GlobalState(Account)
        self.salary_asset = GlobalState(Asset)
        self.total_employees = GlobalState(UInt64(0))
        self.total_streamed = GlobalState(UInt64(0))
        self.is_paused = GlobalState(UInt64(0))

        # Local state declarations (per employee)
        self.salary_rate = LocalState(UInt64, key="salary_rate")
        self.stream_start = LocalState(UInt64, key="stream_start")
        self.last_withdrawal = LocalState(UInt64, key="last_withdrawal")
        self.total_withdrawn = LocalState(UInt64, key="total_withdrawn")
        self.is_active = LocalState(UInt64, key="is_active")

    # ------------------------------------------------------------------ #
    #  STORY-1-002: Core Methods (4 methods)
    # ------------------------------------------------------------------ #

    @arc4.abimethod(create="require")
    def create(self, asset: Asset) -> None:
        """Initialize contract with salary ASA.

        Stores the deployer as employer, links the salary token, and
        initializes all counters to zero.

        Args:
            asset: The PAYUSD salary ASA ID.
        """
        self.employer.value = Txn.sender
        self.salary_asset.value = asset
        self.total_employees.value = UInt64(0)
        self.total_streamed.value = UInt64(0)
        self.is_paused.value = UInt64(0)

    @arc4.abimethod
    def opt_in_asset(self) -> None:
        """Opt the contract into the salary ASA.

        Must be called by the employer after creation. Executes an inner
        AssetTransfer of 0 to self, which is the opt-in mechanism.
        """
        assert Txn.sender == self.employer.value, "Only employer can opt in asset"

        itxn.AssetTransfer(
            xfer_asset=self.salary_asset.value,
            asset_receiver=Global.current_application_address,
            asset_amount=0,
            fee=0,
        ).submit()

    @arc4.abimethod
    def fund(self, axfer: gtxn.AssetTransferTransaction) -> None:
        """Validate a preceding asset transfer that funds the contract.

        The actual token transfer happens in the preceding transaction
        within the atomic group. This method validates that the transfer
        is correct.

        Args:
            axfer: The preceding AssetTransfer transaction in the group.
        """
        assert Txn.sender == self.employer.value, "Only employer can fund"
        assert axfer.xfer_asset == self.salary_asset.value, "Wrong asset"
        assert (
            axfer.asset_receiver == Global.current_application_address
        ), "Must send to contract"
        assert axfer.asset_amount > 0, "Must fund with positive amount"

    @arc4.baremethod(allow_actions=["OptIn"])
    def opt_in(self) -> None:
        """Allow any account to opt into the application.

        This allocates local state for the sender. The employee must
        call this before the employer can register them.
        """

    @arc4.abimethod
    def register_employee(self, employee: Account, rate: arc4.UInt64) -> None:
        """Register a new employee with an hourly salary rate.

        The employee must have already opted into the application via
        opt_in(). Sets all local state fields and starts the streaming clock.

        Args:
            employee: The employee's Algorand account address.
            rate: Hourly salary rate in base units (e.g., 100_000_000 = 100 PAYUSD/hr).
        """
        assert Txn.sender == self.employer.value, "Only employer can register"
        assert self.salary_rate.get(employee, default=UInt64(0)) == 0, "Already registered"
        assert rate.native > 0, "Rate must be positive"

        self.salary_rate[employee] = rate.native
        self.stream_start[employee] = Global.latest_timestamp
        self.last_withdrawal[employee] = Global.latest_timestamp
        self.total_withdrawn[employee] = UInt64(0)
        self.is_active[employee] = UInt64(1)

        self.total_employees.value += UInt64(1)

    # ------------------------------------------------------------------ #
    #  STORY-1-003: Streaming Engine (3 methods)
    # ------------------------------------------------------------------ #

    @arc4.abimethod
    def withdraw(self) -> UInt64:
        """Withdraw all accrued salary tokens.

        Calculates the amount owed based on elapsed time and salary rate,
        then sends tokens via inner AssetTransfer. Includes overdraft
        protection: if the contract balance is insufficient, sends the
        available balance and pauses the stream.

        Returns:
            The amount of tokens sent to the employee.
        """
        employee = Txn.sender

        assert self.is_active.get(employee, default=UInt64(0)) == UInt64(1), "Stream not active"
        assert self.is_paused.value == UInt64(0), "Contract is paused"

        accrued = self._calculate_accrued(employee)
        assert accrued >= UInt64(1000), "Below minimum withdrawal (0.001 PAYUSD)"

        # Overdraft protection: check contract balance
        balance, _exists = op.AssetHoldingGet.asset_balance(
            Global.current_application_address, self.salary_asset.value
        )

        sent: UInt64
        if balance >= accrued:
            sent = accrued
        else:
            # Partial withdrawal — send available balance and pause stream
            sent = balance
            self.is_active[employee] = UInt64(0)

        itxn.AssetTransfer(
            xfer_asset=self.salary_asset.value,
            asset_receiver=employee,
            asset_amount=sent,
            fee=0,
        ).submit()

        self.last_withdrawal[employee] = Global.latest_timestamp
        self.total_withdrawn[employee] += sent
        self.total_streamed.value += sent

        return sent

    @arc4.abimethod(readonly=True)
    def get_accrued(self, account: Account) -> UInt64:
        """Read-only: view the accrued (unclaimed) balance for an employee.

        Args:
            account: The employee's Algorand account address.

        Returns:
            The accrued token amount in base units (0 if inactive).
        """
        if self.is_active.get(account, default=UInt64(0)) == UInt64(0):
            return UInt64(0)

        return self._calculate_accrued(account)

    @subroutine
    def _calculate_accrued(self, employee: Account) -> UInt64:
        """Calculate accrued salary for an employee.

        Formula: rate * (now - last_withdrawal) / 3600

        Args:
            employee: The employee account.

        Returns:
            Accrued tokens in base units.
        """
        rate = self.salary_rate[employee]
        elapsed = Global.latest_timestamp - self.last_withdrawal[employee]
        # NOTE: Integer division rounds down. For rates < 3600 base units/hr,
        # accrual may be 0 for short elapsed times. Minimum practical rate is
        # 3600 base units/hr (0.0036 PAYUSD/hr) for per-second granularity.
        return rate * elapsed // UInt64(3600)

    @subroutine
    def _settle(self, employee: Account) -> UInt64:
        """Settle accrued salary for an employee via inner AssetTransfer.

        Used by update_rate, pause_stream, and remove_employee to pay out
        what's owed before modifying the employee's state.

        Args:
            employee: The employee account.

        Returns:
            The amount settled (0 if nothing accrued).
        """
        accrued = self._calculate_accrued(employee)
        if accrued > 0:
            itxn.AssetTransfer(
                xfer_asset=self.salary_asset.value,
                asset_receiver=employee,
                asset_amount=accrued,
                fee=0,
            ).submit()
            self.total_withdrawn[employee] += accrued
            self.total_streamed.value += accrued
        self.last_withdrawal[employee] = Global.latest_timestamp
        return accrued

    # ------------------------------------------------------------------ #
    #  STORY-1-004: Management Methods (5 methods + pause_all)
    # ------------------------------------------------------------------ #

    @arc4.abimethod
    def update_rate(self, employee: Account, new_rate: arc4.UInt64) -> None:
        """Update an employee's hourly salary rate.

        Settles all accrued salary at the old rate first, then applies
        the new rate going forward.

        Args:
            employee: The employee account.
            new_rate: New hourly salary rate in base units.
        """
        assert Txn.sender == self.employer.value, "Only employer can update rate"
        assert self.salary_rate.get(employee, default=UInt64(0)) > 0, "Employee not registered"
        assert self.is_active.get(employee, default=UInt64(0)) == UInt64(1), "Stream not active"

        _settled = self._settle(employee)
        self.salary_rate[employee] = new_rate.native

    @arc4.abimethod
    def pause_stream(self, employee: Account) -> None:
        """Pause an individual employee's salary stream.

        Settles all accrued salary first, then deactivates the stream.
        No further accrual until resume_stream is called.

        Args:
            employee: The employee account.
        """
        assert Txn.sender == self.employer.value, "Only employer can pause"
        assert self.is_active.get(employee, default=UInt64(0)) == UInt64(1), "Stream not active"

        _settled = self._settle(employee)
        self.is_active[employee] = UInt64(0)

    @arc4.abimethod
    def resume_stream(self, employee: Account) -> None:
        """Resume a paused employee's salary stream.

        Resets the streaming clock to now. No retroactive accrual for
        the paused period. No settlement or inner transaction.

        Args:
            employee: The employee account.
        """
        assert Txn.sender == self.employer.value, "Only employer can resume"
        assert self.salary_rate.get(employee, default=UInt64(0)) > 0, "Employee not registered"
        assert self.is_active.get(employee, default=UInt64(0)) == UInt64(0), "Stream already active"

        self.is_active[employee] = UInt64(1)
        self.stream_start[employee] = Global.latest_timestamp
        self.last_withdrawal[employee] = Global.latest_timestamp

    @arc4.abimethod
    def remove_employee(self, employee: Account) -> None:
        """Remove an employee with final payout.

        Settles any accrued salary, clears all local state, and
        decrements the employee count.

        Args:
            employee: The employee account.
        """
        assert Txn.sender == self.employer.value, "Only employer can remove"
        assert self.salary_rate.get(employee, default=UInt64(0)) > 0, "Employee not registered"

        # Settle if active and has accrued
        if self.is_active.get(employee, default=UInt64(0)) == UInt64(1):
            _settled = self._settle(employee)

        # Clear all local state
        self.salary_rate[employee] = UInt64(0)
        self.stream_start[employee] = UInt64(0)
        self.last_withdrawal[employee] = UInt64(0)
        self.total_withdrawn[employee] = UInt64(0)
        self.is_active[employee] = UInt64(0)

        self.total_employees.value -= UInt64(1)

    @arc4.abimethod
    def milestone_pay(self, employee: Account, amount: arc4.UInt64) -> None:
        """Send a one-time milestone payment to an employee.

        Does not affect the employee's streaming rate or timestamps.
        Simply transfers the specified amount from the contract pool.

        Args:
            employee: The employee account.
            amount: Token amount to send in base units.
        """
        assert Txn.sender == self.employer.value, "Only employer can send milestone"
        assert self.salary_rate.get(employee, default=UInt64(0)) > 0, "Employee not registered"
        assert amount.native > 0, "Amount must be positive"

        # Check contract has sufficient balance
        balance, _exists = op.AssetHoldingGet.asset_balance(
            Global.current_application_address, self.salary_asset.value
        )
        assert balance >= amount.native, "Insufficient contract balance"

        itxn.AssetTransfer(
            xfer_asset=self.salary_asset.value,
            asset_receiver=employee,
            asset_amount=amount.native,
            fee=0,
        ).submit()

        self.total_streamed.value += amount.native

    @arc4.abimethod
    def pause_all(self) -> None:
        """Emergency pause all active streams.

        Sets the global is_paused flag to 1. All withdraw() calls will
        be rejected. Individual employee states are NOT modified — no
        settlements are triggered.
        """
        assert Txn.sender == self.employer.value, "Only employer can pause all"

        self.is_paused.value = UInt64(1)
