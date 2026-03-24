# AlgoFlow -- Hackathon Presentation (5 Slides)

---

## SLIDE 1: Team Name

**ON THE SLIDE:**

# AlgoFlow

**Real-Time Programmable Payroll on Algorand**

Built by: Pranay Vaddanam
Infinova Hackathon 2026 -- Blockchain with Algorand (Option 1)

**SPEAKER NOTES:**
Hi everyone, I'm Pranay. AlgoFlow is a decentralized payroll streaming platform built on Algorand. Instead of paying employees once a month, AlgoFlow streams salary tokens to them every second -- and they can withdraw anytime. I built this solo over the hackathon using Algorand Python smart contracts and a React frontend.

---

## SLIDE 2: Problem Statement

**ON THE SLIDE:**

### The Payroll Problem

- Workers wait an average of **30 days** for payment
- Monthly pay cycles create cash flow stress for employees
- Gig workers and DAO contributors invoice manually across timezones
- Employees have **zero visibility** into when or how they get paid
- No programmable salary infrastructure exists on Algorand today

**SPEAKER NOTES:**
Traditional payroll is broken. Employees do the work today but get paid weeks later. For gig workers and DAO contributors, it is even worse -- manual invoicing, payment disputes, no transparency. There is no way for an employee to verify in real time what they have earned. And on Algorand specifically, there is no existing infrastructure for programmable, streaming payroll. That is the gap AlgoFlow fills.

---

## SLIDE 3: Solution -- AlgoFlow

**ON THE SLIDE:**

### How AlgoFlow Works

- **Salary streaming**: Tokens accrue every second using math-based calculation
  - Formula: `rate x elapsed_time / 3600` -- no per-second transactions
- **Instant withdrawal**: Employee claims anytime via smart contract inner transaction
- **Dual dashboards**: Employer manages team; employee monitors earnings live
- **Emergency controls**: Pause/resume individual or all streams instantly
- **Built on Algorand**: ~3.3s finality, sub-$0.001 fees, native ASA tokens

**SPEAKER NOTES:**
AlgoFlow uses a math-based streaming model. Instead of sending a transaction every second, the smart contract stores each employee's hourly rate and start time. When they withdraw, the contract calculates what is owed using on-chain timestamps and sends it via an inner transaction. The frontend shows a real-time counter ticking up every second for the visual effect, but the actual settlement happens on-chain only when needed. This means zero wasted compute. Employers get a dashboard to register employees, set rates, fund the contract, and pause streams. Employees see their balance growing in real time and can withdraw with one click. Everything runs on Algorand with instant finality and near-zero fees.

---

## SLIDE 4: Implementation Done

**ON THE SLIDE:**

### What We Built

**Smart Contract (Algorand Python)**
- 13 ABI methods: create, fund, register, withdraw, update rate, pause/resume, milestone pay, remove employee, pause all, resume all
- On-chain accrual math with overdraft protection
- PAYUSD stablecoin analog (ASA, 6 decimals)

**Frontend (React + TypeScript)**
- 60fps streaming counter (requestAnimationFrame)
- Employer dashboard: fund contract, register employees, manage rates, pause/remove
- Employee dashboard: live accrual counter, one-click withdraw, transaction history
- Three.js animated background, glassmorphism UI, spotlight card effects

**Infrastructure**
- AlgoKit LocalNet deployment with automated setup scripts
- Atomic transaction groups for safety
- KMD wallet integration for local development

**SPEAKER NOTES:**
On the smart contract side, we have 13 methods covering the full payroll lifecycle -- from creating and funding the contract, to registering employees with hourly rates, to withdrawals, rate updates, and emergency controls like pausing all streams at once. The contract uses Algorand Python, not PyTeal, compiled to AVM bytecode via AlgoKit. On the frontend, the streaming counter runs at 60 frames per second using requestAnimationFrame for smooth animation. The employer dashboard lets you fund the contract pool, register employees, adjust rates, and pause or remove them. The employee dashboard shows earnings ticking up in real time with a one-click withdraw button. The UI uses glassmorphism design with a Three.js animated background. Everything deploys to AlgoKit LocalNet with automated scripts.

---

## SLIDE 5: Conclusion

**ON THE SLIDE:**

### AlgoFlow Proves Programmable Payroll Works on Algorand

**Why Algorand?**
- Instant finality (~3.3s) -- employees see confirmed withdrawals immediately
- Near-zero fees (< $0.001) -- streaming is economically viable
- Native ASAs -- no custom token contracts needed
- Inner transactions -- contract pays employees directly

**Future Roadmap**
- Multi-employer support (multiple contracts per organization)
- Testnet and MainNet deployment with Pera Wallet
- CSV payroll export and reporting
- ARC-28 event emission for indexer-powered analytics

> "Get paid every second, not every month."

**SPEAKER NOTES:**
AlgoFlow demonstrates that real-time programmable payroll is not just possible on Algorand -- it is practical. Algorand's instant finality means employees see confirmed withdrawals in seconds. The near-zero fees mean streaming economics actually work, unlike on Ethereum where gas costs would make this impractical. Native ASAs give us stablecoin-like tokens without deploying a separate token contract. And inner transactions let the contract itself pay employees directly without trusting external signers. Looking ahead, the natural next steps are multi-employer support, Pera Wallet integration for Testnet and MainNet, and payroll reporting features. The core message is simple: with AlgoFlow, you get paid every second, not every month. Thank you.
