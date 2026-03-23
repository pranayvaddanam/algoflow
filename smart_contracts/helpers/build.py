"""Build helpers for compiling Algorand Python smart contracts.

Provides utilities for compiling contract.py to TEAL via the AlgoKit
toolchain. Used by deployment scripts and CI/CD pipelines.
"""

import subprocess
import sys
from pathlib import Path


def compile_contract(contract_path: Path) -> None:
    """Compile an Algorand Python contract to TEAL using AlgoKit CLI.

    Args:
        contract_path: Path to the .py contract file.

    Raises:
        subprocess.CalledProcessError: If compilation fails.
    """
    result = subprocess.run(
        ["algokit", "compile", "python", str(contract_path)],
        capture_output=True,
        text=True,
        check=False,
    )

    if result.returncode != 0:
        print(f"Compilation failed:\n{result.stderr}", file=sys.stderr)
        raise subprocess.CalledProcessError(result.returncode, result.args)

    print(f"Compiled {contract_path} successfully.")
    if result.stdout:
        print(result.stdout)


if __name__ == "__main__":
    # Default: compile the PayrollStream contract
    project_root = Path(__file__).parent.parent.parent
    contract = project_root / "smart_contracts" / "payroll_stream" / "contract.py"
    compile_contract(contract)
