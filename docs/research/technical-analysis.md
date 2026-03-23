# AlgoFlow Technical Analysis

> Real-Time Programmable Payroll Infrastructure on Algorand
> Research Date: 2026-03-23 | Stack: Algorand Python (algopy), AlgoKit CLI 2.10.2, py-algorand-sdk, React 19, Vite, Tailwind CSS 4, Pera Wallet

---

## 1. Algorand Python (algopy) -- Smart Contract Development

### 1.1 ARC4Contract Class

All AlgoFlow smart contracts should inherit from `ARC4Contract`, which is the base class conforming to the ARC-4 ABI specification. This provides automatic routing of method calls, ABI encoding/decoding, and structured approval/clear programs.

```python
from algopy import ARC4Contract, arc4, subroutine, UInt64, String, Bytes, GlobalState, LocalState, Txn, Account

class PayrollContract(ARC4Contract):
    """ARC4-compliant payroll streaming contract."""

    def __init__(self) -> None:
        # State is initialized in __init__
        self.employer = GlobalState(Account)
        self.total_disbursed = GlobalState(UInt64, key="total_disbursed")
        self.stream_count = GlobalState(UInt64, key="stream_count")
        self.employee_balance = LocalState(UInt64, key="balance")

    @arc4.abimethod(create="require")
    def create(self, employer: Account) -> None:
        self.employer.value = employer
        self.total_disbursed.value = UInt64(0)
        self.stream_count.value = UInt64(0)

    @arc4.abimethod
    def disburse(self, employee: Account, amount: UInt64) -> UInt64:
        assert Txn.sender == self.employer.value, "Only employer can disburse"
        self.employee_balance[employee] = amount
        self.total_disbursed.value += amount
        return self.total_disbursed.value

    @arc4.abimethod(readonly=True)
    def get_balance(self, employee: Account) -> UInt64:
        return self.employee_balance[employee]
```

Key points:
- `@arc4.abimethod(create="require")` marks a method as the creation entry point.
- `@arc4.abimethod` exposes methods as externally callable ABI endpoints.
- `@arc4.abimethod(readonly=True)` marks read-only methods (no state changes).
- `@arc4.abimethod(allow_actions=["NoOp", "OptIn"])` restricts allowed OnComplete actions.
- The `name` parameter on `@arc4.abimethod(name="external_name")` overrides the ABI method name.

### 1.2 GlobalState and LocalState Declarations

**GlobalState** is application-scoped storage shared across all users. **LocalState** is per-account storage requiring opt-in.

```python
from algopy import GlobalState, LocalState, UInt64, Bytes, String, Account

class MyContract(ARC4Contract):
    def __init__(self) -> None:
        # GlobalState -- typed, keyed, with optional description
        self.admin = GlobalState(Account, key="admin")
        self.rate_per_second = GlobalState(UInt64, key="rate")
        self.contract_name = GlobalState(String, key="name", description="Human-readable name")

        # LocalState -- per-account, requires user opt-in
        self.user_start_time = LocalState(UInt64, key="start_time", description="Stream start timestamp")
        self.user_claimed = LocalState(UInt64, key="claimed")
```

**LocalState access patterns:**

```python
# Check if account has data
account in self.user_start_time

# Read value
value = self.user_start_time[account_ref]

# Write value
self.user_start_time[account_ref] = UInt64(12345)

# Delete entry
del self.user_start_time[account_ref]

# Safe read with default
value = self.user_start_time.get(account_ref, default_value)

# Maybe pattern (returns tuple of value and exists bool)
value, exists = self.user_start_time.maybe(account_ref)
```

**Schema considerations for AlgoFlow:**
- Global state: max 64 key-value pairs (combined uint + byte-slice)
- Local state: max 16 key-value pairs per account per app
- Key names: max 64 bytes
- Values: UInt64 (8 bytes) or byte-slice (max 128 bytes)

### 1.3 Inner Transactions (itxn) -- Sending ASA Transfers from Contracts

Inner transactions allow smart contracts to issue transactions on-chain. This is critical for AlgoFlow's payroll disbursement logic.

```python
from algopy.itxn import AssetTransfer, Payment, InnerTransaction
from algopy import Asset, Account, UInt64, TransactionType

# Send an ASA transfer from the contract to an employee
AssetTransfer(
    xfer_asset=Asset(12345),          # ASA ID (e.g., payroll token)
    asset_receiver=Account("EMPLOYEE_ADDR"),
    asset_amount=UInt64(1000),        # Amount in base units
).submit()

# Send an ALGO payment from the contract
Payment(
    receiver=Account("EMPLOYEE_ADDR"),
    amount=UInt64(1_000_000),         # 1 ALGO in microAlgos
).submit()

# Generic inner transaction with explicit type
InnerTransaction(
    type=TransactionType.AssetTransfer,
    xfer_asset=Asset(12345),
    asset_amount=UInt64(10),
    sender=Account("CONTRACT_ADDR"),
    receiver=Account("EMPLOYEE_ADDR"),
).submit()

# Application call inner transaction (for composability)
InnerTransaction(
    type=TransactionType.ApplicationCall,
    app_id=UInt64(67890),
    on_completion=OnCompleteAction.NoOp,
    app_args=("arg1", "arg2"),
).submit()
```

**Important for payroll streaming:**
- The contract must hold the ASA (be opted in) before it can transfer.
- Each inner transaction consumes opcode budget (approx 700 per txn from the pool).
- Inner transactions cost a minimum fee of 0.001 ALGO each (covered by outer transaction fee pooling).
- Changes from inner transactions are observable immediately after `submit()`.

### 1.4 Subroutines -- Helper Functions

The `@subroutine` decorator marks reusable logic within contracts. Subroutines compile to TEAL subroutines, reducing program size.

```python
from algopy import subroutine, UInt64, ARC4Contract, arc4, Txn

class PayrollContract(ARC4Contract):
    @arc4.abimethod
    def process_payment(self, employee: arc4.Address, amount: arc4.UInt64) -> arc4.String:
        validated_amount = self._validate_amount(amount.native)
        self._check_authorization()
        return arc4.String("Payment processed")

    @subroutine
    def _validate_amount(self, amount: UInt64) -> UInt64:
        assert amount > UInt64(0), "Amount must be positive"
        assert amount <= UInt64(1_000_000_000), "Amount exceeds maximum"
        return amount

    @subroutine
    def _check_authorization(self) -> None:
        assert Txn.sender == self.employer.value, "Unauthorized"
```

Subroutines can also be standalone (not methods):

```python
@subroutine
def calculate_stream_amount(rate: UInt64, elapsed: UInt64) -> UInt64:
    return rate * elapsed
```

### 1.5 Rekeying in Algorand Python Contracts

Rekeying changes the authorizing private key for an account. After rekeying, the original private key can no longer sign transactions -- only the new authority can.

**How it works:**
1. Account A sends a transaction with `rekey_to` set to Account B's address.
2. After confirmation, Account B's private key authorizes all transactions from Account A.
3. Account A's address remains unchanged; only the signing authority changes.

**In algopy (inner transactions):**

```python
from algopy.itxn import Payment
from algopy import Account

# Rekey the contract's account to a new authority
Payment(
    receiver=Account("SELF_ADDRESS"),
    amount=UInt64(0),
    rekey_to=Account("NEW_AUTHORITY_ADDRESS"),
).submit()
```

**Using algokit-utils (Python, off-chain):**

```python
# Rekey account_a so account_b signs for it
algorand.account.rekey_account(
    account=account_a,
    rekey_to=account_b
)

# After rekeying, create a rekeyed account reference
rekeyed = algorand.account.rekeyed(
    rekeyed_sender_address=account_a.address,
    signer=account_b_signer
)
```

**AlgoFlow relevance:** Rekeying could be used to delegate payroll disbursement authority to a smart contract or a multisig arrangement, enabling employer account control patterns without exposing private keys.

**Warning:** Rekeying is irreversible unless re-rekeyed. Incorrect rekeying can lead to permanent loss of account control.

---

## 2. AlgoKit CLI

### 2.1 Project Scaffolding

```bash
# Install AlgoKit
pipx install algokit

# Initialize a Python smart contract project
algokit init -t python
# Interactive prompts: project name, contract name, template preset (Starter/Production), deployment language

# Initialize a React frontend project
algokit init -t react
# Includes: Tailwind CSS, DaisyUI, use-wallet integration, Pera/Defly/Exodus support

# Or use interactive mode
algokit init
# Select template type, language, and configuration interactively
```

The Python template generates:
- Smart contract source in `smart_contracts/`
- Build configuration
- Deployment scripts (Python or TypeScript)
- Test scaffolding
- `.env` and `algokit.toml` configuration

### 2.2 Local Network Management

```bash
# Start local Algorand network (Docker required)
algokit localnet start

# Stop the local network
algokit localnet stop

# Reset network state (wipe all data, fresh chain)
algokit localnet reset
```

The localnet provides:
- Algod node at `http://localhost:4001` (token: `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`)
- KMD (Key Management Daemon) for dev account management
- Indexer for querying historical data
- Pre-funded accounts for testing

### 2.3 Compilation and Build

```bash
# Compile Algorand Python contracts to TEAL
algokit compile python

# Full project build (compile + generate artifacts)
algokit project run build
```

The compiler (Puya) transforms Python code into optimized TEAL bytecode. It supports:
- Python 3.12+ syntax
- Type checking at compile time
- Source-level debugging
- ARC-4 ABI specification compliance
- ARC-32 application specification output

### 2.4 Deployment

```bash
# Deploy to local network
algokit project deploy localnet

# Deploy to testnet
algokit project deploy testnet

# Deploy to mainnet
algokit project deploy mainnet
```

### 2.5 Testing with AlgoKit Utils

AlgoKit provides a testing framework that emulates AVM execution in Python:

```python
import algopy

class SimpleVotingContract(algopy.ARC4Contract):
    def __init__(self) -> None:
        self.topic = algopy.GlobalState(algopy.Bytes(b"default_topic"), key="topic")
        self.votes = algopy.GlobalState(algopy.UInt64(0), key="votes")
        self.voted = algopy.LocalState(algopy.UInt64, key="voted")

    @algopy.arc4.abimethod(create="require")
    def create(self, initial_topic: algopy.Bytes) -> None:
        self.topic.value = initial_topic
        self.votes.value = algopy.UInt64(0)

    @algopy.arc4.abimethod
    def vote(self) -> algopy.UInt64:
        assert self.voted[algopy.Txn.sender] == algopy.UInt64(0), "Already voted"
        self.votes.value += algopy.UInt64(1)
        self.voted[algopy.Txn.sender] = algopy.UInt64(1)
        return self.votes.value

# --- Test code ---
contract = SimpleVotingContract()
contract.voted[context.default_sender] = algopy.UInt64(0)

# Create
contract.create(algopy.Bytes(b"initial_topic"))
assert contract.topic.value == algopy.Bytes(b"initial_topic")
assert contract.votes.value == algopy.UInt64(0)

# Vote
result = contract.vote()
assert result == algopy.UInt64(1)
assert contract.votes.value == algopy.UInt64(1)
assert contract.voted[context.default_sender] == algopy.UInt64(1)

# Verify transaction was emitted
assert len(context.txn.last_group.txns) == 1
```

Testing features:
- Direct contract instantiation and method invocation
- Global and local state manipulation via Python attributes
- Transaction context emulation
- AVM opcode patching (e.g., `op.Global.min_txn_fee`)
- Assertion on emitted transaction groups

---

## 3. algosdk (Python SDK)

### 3.1 Transaction Types

**AssetCreateTxn -- Create a payroll token (ASA):**

```python
from algosdk.transaction import AssetCreateTxn, SuggestedParams

create_txn = AssetCreateTxn(
    sender=sender_address,
    sp=suggested_params,
    total=1_000_000_000,          # Total supply
    decimals=6,                    # 6 decimal places (like USDC)
    default_frozen=False,
    manager=sender_address,        # Can reconfigure
    reserve=sender_address,        # Holds uncirculated supply
    freeze=sender_address,         # Can freeze accounts
    clawback=sender_address,       # Can clawback tokens
    unit_name="PAYUSD",
    asset_name="AlgoFlow USD",
    url="https://algoflow.app/token",
    metadata_hash=None,
)
signed = create_txn.sign(private_key)
```

**AssetTransferTxn -- Transfer payroll tokens:**

```python
from algosdk.transaction import AssetTransferTxn

transfer_txn = AssetTransferTxn(
    sender=employer_address,
    sp=suggested_params,
    receiver=employee_address,
    amt=50_000_000,               # 50 tokens (with 6 decimals)
    index=asset_id,               # ASA ID
)
signed = transfer_txn.sign(private_key)
```

**AssetConfigTxn -- Reconfigure an existing ASA:**

```python
from algosdk.transaction import AssetConfigTxn

config_txn = AssetConfigTxn(
    sender=manager_address,
    sp=suggested_params,
    index=asset_id,
    manager=new_manager,
    reserve=new_reserve,
    freeze=new_freeze,
    clawback=new_clawback,
)
```

**ApplicationCallTxn -- Call a smart contract:**

```python
from algosdk.transaction import ApplicationCallTxn

app_call = ApplicationCallTxn(
    sender=sender_address,
    sp=suggested_params,
    index=app_id,
    on_complete=0,                         # NoOp
    app_args=["disburse".encode(), amount_bytes],
    accounts=[employee_address],
    foreign_apps=[related_app_id],
    foreign_assets=[payroll_token_id],
)
signed = app_call.sign(private_key)
```

### 3.2 Atomic Transaction Groups

Atomic groups ensure all-or-nothing execution -- critical for payroll where token transfer and state update must succeed together.

```python
from algosdk import transaction

# Create individual transactions
txn1 = transaction.PaymentTxn(sender, sp, receiver, 1_000_000)
txn2 = transaction.AssetTransferTxn(sender, sp, receiver, 100, asset_id)
txn3 = transaction.ApplicationCallTxn(sender, sp, app_id, 0)

# Assign group ID (modifies transactions in-place)
group = [txn1, txn2, txn3]
transaction.assign_group_id(group)

# Sign each transaction
signed1 = txn1.sign(private_key)
signed2 = txn2.sign(private_key)
signed3 = txn3.sign(private_key)

# Submit as a group
algod_client.send_transactions([signed1, signed2, signed3])

# Alternative: calculate group ID without assigning
group_id = transaction.calculate_group_id([txn1, txn2, txn3])
```

**AlgoFlow use case:** Batch payroll disbursement -- group multiple employee payments into a single atomic transaction to guarantee all payments succeed or none do. Maximum 16 transactions per atomic group.

### 3.3 Account Management

```python
from algosdk import account, mnemonic

# Generate a new account
private_key, address = account.generate_account()

# Convert between formats
mnemonic_phrase = mnemonic.from_private_key(private_key)
recovered_key = mnemonic.to_private_key(mnemonic_phrase)

# Using algokit-utils
from algokit_utils import Account
acct = algorand.account.from_mnemonic(mnemonic_phrase)
```

### 3.4 Client Setup

```python
from algosdk.v2client import algod, indexer

# Local development (AlgoKit localnet)
algod_client = algod.AlgodClient(
    algod_token="a" * 64,
    algod_address="http://localhost:4001"
)

# TestNet (AlgoNode -- free, no API key)
algod_client = algod.AlgodClient(
    algod_token="",
    algod_address="https://testnet-api.algonode.cloud"
)

# MainNet
algod_client = algod.AlgodClient(
    algod_token="",
    algod_address="https://mainnet-api.algonode.cloud"
)

# Indexer client (historical queries)
indexer_client = indexer.IndexerClient(
    indexer_token="",
    indexer_address="https://testnet-idx.algonode.cloud"
)
```

### 3.5 Wait for Confirmation

```python
from algosdk import transaction

# Send and wait
txid = algod_client.send_transaction(signed_txn)

# Wait for confirmation with timeout
try:
    confirmed = transaction.wait_for_confirmation(
        algod_client,
        txid,
        wait_rounds=5    # Max rounds to wait
    )
    print(f"Confirmed in round: {confirmed['confirmed-round']}")
except Exception as e:
    print(f"Transaction failed: {e}")
```

---

## 4. Pera Wallet / use-wallet React Integration

### 4.1 Setup and Installation

The official Algorand React frontend template includes `@txnlab/use-wallet` for wallet integration with Pera, Defly, and Exodus wallets.

```bash
# Scaffold with AlgoKit
algokit init -t react

# Or manually install
npm install @txnlab/use-wallet-react @perawallet/connect
```

### 4.2 WalletProvider Configuration

```tsx
// src/App.tsx
import { WalletProvider, useInitializeProviders, PROVIDER_ID } from '@txnlab/use-wallet-react'
import { PeraWalletConnect } from '@perawallet/connect'

function App() {
  const providers = useInitializeProviders({
    providers: [
      { id: PROVIDER_ID.PERA, clientStatic: PeraWalletConnect },
      // Add more providers as needed:
      // { id: PROVIDER_ID.DEFLY },
      // { id: PROVIDER_ID.EXODUS },
    ],
    nodeConfig: {
      network: 'testnet',
      nodeServer: 'https://testnet-api.algonode.cloud',
      nodeToken: '',
      nodePort: '443',
    },
  })

  return (
    <WalletProvider value={providers}>
      <PayrollDashboard />
    </WalletProvider>
  )
}
```

### 4.3 useWallet Hook -- Connect, Sign, Transact

```tsx
import { useWallet } from '@txnlab/use-wallet-react'
import algosdk from 'algosdk'

function PayrollDashboard() {
  const {
    providers,        // Available wallet providers
    activeAddress,    // Currently connected address (string | null)
    activeAccount,    // Full account object
    signTransactions, // Sign transaction(s)
    sendTransactions, // Sign and send
    isActive,         // Whether a wallet is connected
    isReady,          // Whether providers are initialized
  } = useWallet()

  // Connect wallet
  const connectWallet = async () => {
    const peraProvider = providers?.find(p => p.metadata.id === 'pera')
    if (peraProvider) {
      await peraProvider.connect()
    }
  }

  // Disconnect
  const disconnectWallet = async () => {
    const peraProvider = providers?.find(p => p.metadata.id === 'pera')
    if (peraProvider) {
      await peraProvider.disconnect()
    }
  }

  // Sign and send a transaction
  const sendPayment = async (receiver: string, amount: number) => {
    if (!activeAddress) return

    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '443')
    const suggestedParams = await algodClient.getTransactionParams().do()

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: activeAddress,
      to: receiver,
      amount: amount,
      suggestedParams,
    })

    // Encode for signing
    const encodedTxn = algosdk.encodeUnsignedTransaction(txn)

    // Request wallet signature (Pera popup appears)
    const signedTxns = await signTransactions([encodedTxn])

    // Submit to network
    const { txId } = await algodClient.sendRawTransaction(signedTxns).do()
    await algosdk.waitForConfirmation(algodClient, txId, 4)

    return txId
  }

  return (
    <div>
      {isActive ? (
        <div>
          <p>Connected: {activeAddress}</p>
          <button onClick={disconnectWallet}>Disconnect</button>
          <button onClick={() => sendPayment('RECV_ADDR', 1000000)}>
            Send 1 ALGO
          </button>
        </div>
      ) : (
        <button onClick={connectWallet}>Connect Pera Wallet</button>
      )}
    </div>
  )
}
```

### 4.4 Transaction Signing Flow (ARC-0001)

The wallet signing API follows ARC-0001:

```typescript
// WalletTransaction interface
interface WalletTransaction {
  txn: string          // Base64 msgpack-encoded unsigned transaction
  signers?: string[]   // Addresses expected to sign (empty = skip)
  message?: string     // Display message for user confirmation
  authAddr?: string    // Auth address if account is rekeyed
}

// Sign multiple transactions (e.g., atomic group)
const signedTxns = await signTransactions([
  { txn: encodedTxn1, signers: [activeAddress] },
  { txn: encodedTxn2, signers: [] },  // Signed by another party
])
```

### 4.5 Local Development with KMD Provider

For local testing without Pera mobile app:

```tsx
// use-wallet supports KMD provider for algokit localnet
providers: [
  { id: PROVIDER_ID.KMD, clientOptions: {
    host: 'http://localhost:4002',
    token: 'a'.repeat(64),
    wallet: 'unencrypted-default-wallet',
    password: '',
  }},
  { id: PROVIDER_ID.PERA, clientStatic: PeraWalletConnect },
]
```

---

## 5. Known Limitations and Gotchas

### 5.1 AVM Opcode Budget

| Constraint | Limit | Impact on AlgoFlow |
|---|---|---|
| Base opcode budget per transaction | 700 | Single contract calls are constrained |
| Pooled budget (group of 16 txns) | 700 x 16 = 11,200 | Use transaction groups for complex logic |
| Inner transaction cost | ~700 from pool per itxn | Each payroll disbursement consumes budget |
| Max inner transactions per group | 256 | Caps batch payroll size |

**Mitigation:** Use `OpUp` (operational budget increase) by adding dummy app calls to the group to increase the pooled budget. AlgoKit provides `OpUpFeeSource` for this pattern.

### 5.2 State Storage Limits

| Storage Type | Max Keys | Value Size | MBR Cost |
|---|---|---|---|
| Global State (uint) | 64 total | 8 bytes | 28,500 microAlgo per key |
| Global State (bytes) | 64 total | 128 bytes | 50,000 microAlgo per key |
| Local State (uint) | 16 per account | 8 bytes | 28,500 microAlgo per key |
| Local State (bytes) | 16 per account | 128 bytes | 50,000 microAlgo per key |
| Box Storage | Unlimited count | 32,768 bytes per box | 2,500 + 400 per byte |

**MBR (Minimum Balance Requirement) formulas:**

```
Global Storage MBR:
  100,000 * (1 + ExtraProgramPages)
  + (25,000 + 3,500) * schema.NumUint
  + (25,000 + 25,000) * schema.NumByteSlice

Local Storage MBR (per opt-in):
  100,000
  + (25,000 + 3,500) * schema.NumUint
  + (25,000 + 25,000) * schema.NumByteSlice
```

**AlgoFlow implication:** With 16 local state keys per account, each employee's streaming state (rate, start_time, last_claim, token_id, etc.) must fit within this limit. For richer data, use Box Storage.

### 5.3 Program Size Limits

| Constraint | Limit |
|---|---|
| Approval + Clear program combined | 8,192 bytes (base) |
| Extra program pages | Up to 3 additional pages |
| Maximum total program size | 8,192 * 4 = 32,768 bytes |
| LogicSig program size | 1,000 bytes |

### 5.4 Transaction Constraints

| Constraint | Limit |
|---|---|
| Max transactions per atomic group | 16 |
| Transaction note field | 1,024 bytes |
| Max foreign references per txn | 8 accounts, 8 assets, 8 apps |
| Transaction validity window | 1,000 rounds (~55 minutes) |
| Minimum transaction fee | 0.001 ALGO (1,000 microAlgo) |
| Byte string concatenation limit | 4,096 bytes |

### 5.5 Algorand Python Compiler Quirks

1. **No dynamic typing:** All variables must have statically determinable types. Python's dynamic features (eval, getattr, dynamic imports) are not supported.

2. **Limited Python standard library:** Only `algopy` types are available on-chain. No `datetime`, `json`, `math`, `os`, etc. All math must use `UInt64` (unsigned 64-bit integers only -- no negative numbers, no floats).

3. **No loops over dynamic ranges:** Loops must have compile-time-determinable bounds. Use `urange()` and `uenumerate()` instead of `range()` and `enumerate()`.

4. **String handling:** On-chain strings use `algopy.String` or `arc4.String` (ABI-encoded). Standard Python `str` is only for compile-time constants.

5. **Integer overflow:** `UInt64` wraps at 2^64 - 1. No built-in overflow protection -- manual checks required for payroll amount calculations.

6. **No recursion:** TEAL does not support recursive subroutine calls. All algorithms must be iterative.

7. **Constructor pattern:** `__init__` is ONLY called during contract creation (first deployment). It is NOT called on subsequent application calls. State initialization must account for this.

### 5.6 Common First-Time Mistakes

1. **Forgetting opt-in:** Accounts must opt in to an ASA before receiving it. The contract itself must also opt in to hold ASAs. Payroll disbursement will fail if employees have not opted in to the payroll token.

2. **Insufficient MBR:** Every state allocation (global, local, box, ASA opt-in) increases the account's minimum balance. Transactions that would drop the balance below MBR are rejected.

3. **Fee pooling misunderstanding:** Inner transaction fees come from the outer transaction's fee. If the outer fee is only 0.001 ALGO but the contract issues 3 inner transactions, the outer fee must be at least 0.004 ALGO.

4. **Foreign reference limits:** Each transaction can reference at most 8 foreign accounts, 8 foreign assets, and 8 foreign apps. Batch payroll to more than 8 employees requires multiple transaction groups.

5. **Atomic group ordering:** Transactions in a group execute in order. A contract call that reads state modified by a previous transaction in the same group will see the updated state.

6. **Rekeying pitfalls:** Rekeying is permanent until reversed. If the new authority key is lost, the account is permanently inaccessible. Never rekey to an address you do not control.

7. **LocalState requires opt-in transaction:** Users must send an OptIn application call before the contract can write to their local state. The AlgoFlow frontend must guide users through this step.

8. **Box references:** Boxes must be explicitly referenced in the transaction's `boxes` array. Forgetting this causes runtime failures even if the box exists.

---

## 6. Architecture Recommendations for AlgoFlow

### 6.1 Contract Design Pattern

```
PayrollFactory (ARC4Contract)
  |-- Creates PayrollStream contracts per employer
  |-- Tracks all active streams in box storage
  |-- Manages payroll token (ASA) creation

PayrollStream (ARC4Contract)
  |-- GlobalState: employer, token_id, total_funded, stream_count
  |-- LocalState: employee rate, start_time, last_claim, total_claimed
  |-- Methods: create_stream, claim, pause, cancel, update_rate
  |-- Inner txns: ASA transfers to employees on claim
```

### 6.2 Recommended Storage Strategy

| Data | Storage | Rationale |
|---|---|---|
| Employer config | GlobalState (5-8 keys) | Shared, rarely changes |
| Employee stream params | LocalState (6-8 keys) | Per-account, within 16-key limit |
| Historical records | Box Storage | Unlimited, variable size |
| Stream metadata | Box Storage | Complex structures beyond 128 bytes |
| Token references | GlobalState | Shared across all streams |

### 6.3 Frontend Architecture

```
React 19 + Vite + Tailwind CSS 4
  |-- WalletProvider (use-wallet-react)
  |    |-- Pera Wallet (production)
  |    |-- KMD (local development)
  |-- AlgorandClient (algokit-utils)
  |    |-- Algod connection
  |    |-- Contract client (type-safe, generated)
  |-- Components
       |-- ConnectWallet
       |-- EmployerDashboard (create streams, fund, manage)
       |-- EmployeeDashboard (view streams, claim payments)
       |-- StreamViewer (real-time balance calculation)
```

---

## 7. Technical Risk Register

| # | Risk | Severity | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R1 | **Opcode budget exhaustion** during batch payroll disbursement | High | High | Payroll transactions fail for large employee counts | Limit batch size to 4-6 employees per group; use OpUp pattern for budget increase; split large payrolls across multiple groups |
| R2 | **Local state 16-key limit** insufficient for complex stream parameters | Medium | Medium | Cannot store all required per-employee data on-chain | Use Box Storage for overflow data; minimize local state to essential fields (rate, start, last_claim, token_id) |
| R3 | **ASA opt-in UX friction** -- employees must opt in before receiving payments | High | High | Employees cannot receive first payment without manual action | Frontend guides opt-in flow; consider clawback-enabled ASA for employer-controlled distribution; use atomic groups (opt-in + first payment) |
| R4 | **MBR costs escalate** with many employees opting in | Medium | High | Employer must fund increasing minimum balances | Calculate and display MBR requirements upfront; provide MBR estimation tool in frontend; consider Box Storage to shift MBR to contract account |
| R5 | **Algorand Python compiler limitations** block desired logic | Medium | Medium | Features like dynamic dispatch or complex math cannot compile | Design contracts with static patterns; pre-compute complex values off-chain and pass as arguments; use multiple contracts for separation of concerns |
| R6 | **Pera Wallet mobile-only limitation** for transaction signing | Medium | Low | Desktop users cannot sign transactions easily | Support multiple wallet providers (Defly, Exodus); KMD for development; consider WalletConnect v2 for broader compatibility |
| R7 | **Atomic group 16-txn limit** caps batch payroll size | Medium | High | Cannot pay more than ~14 employees in one atomic group (2 txns reserved for app calls + fee budget) | Implement multi-group batching in frontend; queue and process groups sequentially; provide progress feedback to employer |
| R8 | **Rekeying security risk** if used for delegation | High | Low | Permanent loss of account access if mishandled | Avoid rekeying in v1; use smart contract escrow patterns instead; if rekeying is needed, implement multi-step confirmation with timelock |
| R9 | **Foreign reference limit (8 accounts per txn)** constrains inner transactions | Medium | High | Contract cannot send payments to more than 8 employees in a single app call | Batch payments across multiple app calls within an atomic group; use box storage to queue payments for multi-step processing |
| R10 | **TestNet/MainNet behavioral differences** | Low | Medium | Contracts behave differently across networks | Test on localnet and testnet before mainnet; use AlgoKit deployment pipeline; maintain separate configs per environment |
| R11 | **Real-time streaming precision** -- AVM has no sub-second timestamps | Medium | Medium | Payroll streaming granularity limited to block timestamps (~3.3 seconds) | Accept block-level granularity; calculate accrued amounts based on `latest_timestamp` in contract; display estimated real-time balance in frontend using client-side interpolation |
| R12 | **No negative numbers in UInt64** -- cannot represent deductions or adjustments | Low | Medium | Payroll adjustments (deductions, refunds) require workaround | Track deductions as separate positive values; compute net amount off-chain or use paired state variables (gross, deductions) |
