"""Application-wide constants for AlgoFlow smart contracts.

All monetary values use base units. With 6 decimals, 1_000_000 base units
equals 1.000000 display tokens.
"""

from typing import Final

# Salary token (PAYUSD) configuration
SALARY_TOKEN_TOTAL_SUPPLY: Final[int] = 1_000_000_000_000  # 1M tokens (6 decimals)
SALARY_TOKEN_DECIMALS: Final[int] = 6
SALARY_TOKEN_UNIT_NAME: Final[str] = "PAYUSD"
SALARY_TOKEN_NAME: Final[str] = "AlgoFlow USD"

# Algorand minimum balance requirement
MIN_BALANCE_REQUIREMENT: Final[int] = 100_000  # 0.1 ALGO

# Transaction confirmation
TX_CONFIRMATION_ROUNDS: Final[int] = 4

# Streaming calculation
SECONDS_PER_HOUR: Final[int] = 3600
