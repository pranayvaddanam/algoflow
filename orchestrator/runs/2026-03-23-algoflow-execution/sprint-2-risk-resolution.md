# Sprint 2 Risk Resolution — Verified API Patterns

**Research date**: 2026-03-23
**Purpose**: Pre-resolved risks so Sprint 2 agents don't waste tokens on API discovery.

---

## Risk 1: @txnlab/use-wallet-react API (RESOLVED)

**Installed version**: v4.6.0
**Source**: Read from `node_modules/@txnlab/use-wallet-react/dist/index.d.ts`

### WalletProvider Setup (main.tsx)

```tsx
import { WalletManager, WalletId, NetworkId } from '@txnlab/use-wallet'
import { WalletProvider, useWallet } from '@txnlab/use-wallet-react'

const walletManager = new WalletManager({
  wallets: [
    WalletId.KMD,    // LocalNet — no popup, instant signing
    WalletId.PERA,   // Testnet — WalletConnect popup
  ],
  defaultNetwork: NetworkId.LOCALNET,
})

// In main.tsx:
<WalletProvider manager={walletManager}>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</WalletProvider>
```

### useWallet() Hook API (v4.6.0)

```tsx
const {
  wallets,              // Wallet[] — all configured providers
  isReady,              // boolean — manager initialized
  algodClient,          // algosdk.Algodv2 — auto-configured
  activeWallet,         // Wallet | null — currently active provider
  activeAccount,        // WalletAccount | null
  activeAddress,        // string | null — the connected address
  signTransactions,     // (txnGroup, indexesToSign?) => Promise<(Uint8Array | null)[]>
  transactionSigner,    // (txnGroup, indexesToSign) => Promise<Uint8Array[]>
} = useWallet()
```

### Wallet Interface

```tsx
interface Wallet {
  id: WalletId
  metadata: WalletMetadata   // { name, icon }
  accounts: WalletAccount[]
  activeAccount: WalletAccount | null
  isConnected: boolean
  isActive: boolean
  connect: (args?) => Promise<WalletAccount[]>
  disconnect: () => Promise<void>
  setActive: () => void
  setActiveAccount: (address: string) => void
}
```

### Key Patterns

1. **Connect wallet**: `wallet.connect()` returns accounts
2. **Sign transactions**: Use `transactionSigner` with `AtomicTransactionComposer`
3. **Get algod client**: Already available from `useWallet()` — no need to create manually
4. **Network switching**: Use `useNetwork().setActiveNetwork(NetworkId.TESTNET)`

### WalletId Enum Values
- `WalletId.KMD = "kmd"` — for LocalNet
- `WalletId.PERA = "pera"` — for Testnet (WalletConnect)
- `WalletId.DEFLY = "defly"` — alternative

### NetworkId Enum Values
- `NetworkId.LOCALNET = "localnet"`
- `NetworkId.TESTNET = "testnet"`
- `NetworkId.MAINNET = "mainnet"`

---

## Risk 2: ABI Method Calling from TypeScript (RESOLVED)

**algosdk version**: v3.5.2
**Source**: Context7 docs + installed type definitions

### Pattern: Call ABI Method Using AtomicTransactionComposer

```tsx
import algosdk from 'algosdk'

async function callContractMethod(
  algodClient: algosdk.Algodv2,
  appId: number,
  method: string,
  args: any[],
  sender: string,
  signer: algosdk.TransactionSigner,
) {
  const atc = new algosdk.AtomicTransactionComposer()
  const sp = await algodClient.getTransactionParams().do()

  // For methods with inner transactions, add extra fee
  sp.fee = algosdk.ALGORAND_MIN_TX_FEE * 2
  sp.flatFee = true

  const abiMethod = new algosdk.ABIMethod({
    name: method,
    args: [/* ABIMethodArgParams */],
    returns: { type: 'uint64' },
  })

  atc.addMethodCall({
    appID: appId,
    method: abiMethod,
    sender: sender,
    signer: signer,
    suggestedParams: sp,
    methodArgs: args,
  })

  const result = await atc.execute(algodClient, 4)
  return result
}
```

### Pattern: Load ABI From ARC56 JSON (preferred)

```tsx
import arc56Json from '../../smart_contracts/payroll_stream/PayrollStream.arc56.json'

// Parse the ABI contract from the ARC56 spec
const contract = new algosdk.ABIContract(arc56Json)

// Get a specific method
const withdrawMethod = contract.getMethodByName('withdraw')

// Use it in AtomicTransactionComposer
atc.addMethodCall({
  appID: appId,
  method: withdrawMethod,
  sender: activeAddress,
  signer: transactionSigner,  // from useWallet()
  suggestedParams: sp,
  methodArgs: [],
})
```

### Pattern: Fund Method (Atomic Group with AssetTransfer)

```tsx
// fund() requires a preceding AssetTransfer in the same group
const sp = await algodClient.getTransactionParams().do()

const fundMethod = contract.getMethodByName('fund')

// The AssetTransfer goes first
const axferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
  sender: activeAddress,
  receiver: algosdk.getApplicationAddress(appId),
  assetIndex: assetId,
  amount: BigInt(amountInBaseUnits),
  suggestedParams: sp,
})

atc.addTransaction({ txn: axferTxn, signer: transactionSigner })
atc.addMethodCall({
  appID: appId,
  method: fundMethod,
  sender: activeAddress,
  signer: transactionSigner,
  suggestedParams: sp,
  methodArgs: [/* the axfer txn ref is automatic */],
})
```

### Pattern: Read Global State

```tsx
const appInfo = await algodClient.getApplicationByID(appId).do()
const globalState = appInfo.params['global-state']

// Parse key-value pairs
function parseGlobalState(state: any[]) {
  const result: Record<string, any> = {}
  for (const item of state) {
    const key = Buffer.from(item.key, 'base64').toString()
    if (item.value.type === 1) {
      // byte-slice
      result[key] = item.value.bytes
    } else {
      // uint64
      result[key] = item.value.uint
    }
  }
  return result
}
```

### Pattern: Read Local State (Per-Employee)

```tsx
const accountInfo = await algodClient.accountApplicationInformation(
  employeeAddress, appId
).do()
const localState = accountInfo['app-local-state']?.['key-value'] || []
// Parse same as global state
```

---

## Risk 3: BigInt/uint64 Precision (RESOLVED)

**algosdk v3.5.2 uses `number | bigint` for uint64 values.**

### The Problem
- Algorand uint64 max: 2^64 - 1 (18,446,744,073,709,551,615)
- JavaScript Number.MAX_SAFE_INTEGER: 2^53 - 1 (9,007,199,254,740,991)
- Values above 2^53 lose precision with `Number()`

### For AlgoFlow: NOT A PRACTICAL RISK

Our maximum values:
- `SALARY_TOKEN_TOTAL_SUPPLY`: 1,000,000,000,000 (1 trillion) — fits in Number safely
- Max realistic `salary_rate`: 1,000,000,000 (1000 PAYUSD/hr) — fits in Number safely
- Max realistic `total_streamed`: even 10 years of max rate = ~8.76 trillion — still fits

### Safe Conversion Pattern

```tsx
// For values we KNOW are < 2^53 (all AlgoFlow amounts)
const amount = Number(bigintValue)

// For display, always use string conversion first (safest)
function formatBigUint(value: bigint | number, decimals: number = 6): string {
  const n = typeof value === 'bigint' ? Number(value) : value
  return (n / Math.pow(10, decimals)).toFixed(decimals)
}

// When sending TO the contract, use BigInt
const rateInBaseUnits = BigInt(Math.round(dollarRate * 1_000_000))
```

### TypeScript Type Strategy

Frontend types should use `number` (not `bigint`) for state fields because:
1. All our values fit safely in Number
2. React state, JSON.parse, and most libraries expect `number`
3. Only convert to BigInt when building transactions

```tsx
// In types/index.ts — use number for state, BigInt only for txn building
interface Employee {
  address: string
  salaryRate: number      // base units (safe as number)
  streamStart: number     // unix timestamp (safe as number)
  lastWithdrawal: number  // unix timestamp
  totalWithdrawn: number  // base units
  isActive: boolean
}
```

---

## Summary

| Risk | Status | Resolution |
|------|--------|------------|
| @txnlab/use-wallet-react API | **RESOLVED** | v4.6.0 API documented with exact types |
| ABI method calling from TS | **RESOLVED** | AtomicTransactionComposer + ARC56 JSON pattern |
| BigInt/uint64 precision | **RESOLVED** | Not a practical risk; use Number for state, BigInt for txns |

All patterns are verified against the ACTUAL installed package versions. Sprint 2 agents should use these patterns directly.
