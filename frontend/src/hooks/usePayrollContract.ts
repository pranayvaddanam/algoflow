/**
 * Hook for calling PayrollStream smart contract methods.
 *
 * Each method builds an AtomicTransactionComposer, adds the ABI method call,
 * signs via the wallet's transactionSigner, and returns the result.
 *
 * Uses the ARC56 JSON spec for method definitions.
 */

import { useCallback } from 'react';
import algosdk from 'algosdk';

import { getAppId, getAssetId, getApplicationAddress } from '../lib/algorand';
import { TX_CONFIRMATION_ROUNDS, MIN_TX_FEE } from '../lib/constants';
import { useAlgoFlowWallet } from './useWallet';

import type { MethodCallResult } from '../types';

// Import ARC56 contract spec (copied into src/lib for TypeScript resolution)
import arc56Json from '../lib/PayrollStream.arc56.json';

/** Parsed ABI contract from the ARC56 specification. */
const contract = new algosdk.ABIContract(arc56Json);

/**
 * Hook providing async functions for each PayrollStream contract method.
 *
 * All methods:
 * 1. Get suggested params from algodClient
 * 2. Build an AtomicTransactionComposer with the correct ABI method
 * 3. Sign via the wallet's transactionSigner
 * 4. Execute and return the result
 */
export function usePayrollContract() {
  const { algodClient, activeAddress, transactionSigner } = useAlgoFlowWallet();
  const appId = getAppId();
  const assetId = getAssetId();

  /**
   * Get suggested params with standard fee.
   */
  const getSuggestedParams = useCallback(async () => {
    return algodClient.getTransactionParams().do();
  }, [algodClient]);

  /**
   * Get suggested params with fee pooling for methods using inner transactions.
   * Sets fee to 2x minimum and flatFee to true.
   */
  const getPooledFeeParams = useCallback(async () => {
    const sp = await algodClient.getTransactionParams().do();
    sp.fee = MIN_TX_FEE * 2n;
    sp.flatFee = true;
    return sp;
  }, [algodClient]);

  /**
   * Execute an ATC and return a normalized result.
   */
  const executeAtc = useCallback(
    async (atc: algosdk.AtomicTransactionComposer): Promise<MethodCallResult> => {
      const result = await atc.execute(algodClient, TX_CONFIRMATION_ROUNDS);
      const returnValue = result.methodResults[0]?.returnValue;
      return {
        txIDs: result.txIDs,
        confirmedRound: result.confirmedRound,
        returnValue: returnValue !== undefined ? Number(returnValue) : undefined,
      };
    },
    [algodClient],
  );

  /**
   * Opt the contract into the salary ASA.
   * Employer-only. Uses inner transaction (fee pooling).
   */
  const optInAsset = useCallback(async (): Promise<MethodCallResult> => {
    if (!activeAddress) throw new Error('Wallet not connected');

    const sp = await getPooledFeeParams();
    const atc = new algosdk.AtomicTransactionComposer();
    const method = contract.getMethodByName('opt_in_asset');

    atc.addMethodCall({
      appID: appId,
      method,
      sender: activeAddress,
      signer: transactionSigner,
      suggestedParams: sp,
      methodArgs: [],
    });

    return executeAtc(atc);
  }, [activeAddress, appId, transactionSigner, getPooledFeeParams, executeAtc]);

  /**
   * Fund the contract with salary tokens (PAYUSD).
   *
   * Builds an atomic group:
   * 1. AssetTransfer from employer to contract address
   * 2. fund() ABI call referencing the transfer
   */
  const fund = useCallback(
    async (amountInBaseUnits: number): Promise<MethodCallResult> => {
      if (!activeAddress) throw new Error('Wallet not connected');

      const sp = await getSuggestedParams();
      const appAddress = getApplicationAddress(appId);
      const atc = new algosdk.AtomicTransactionComposer();
      const method = contract.getMethodByName('fund');

      // 1. Asset transfer to contract (passed as method arg, not separate txn)
      const axferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: appAddress,
        amount: BigInt(amountInBaseUnits),
        assetIndex: assetId,
        suggestedParams: sp,
      });

      // 2. fund() method call — axfer transaction passed as the method argument
      atc.addMethodCall({
        appID: appId,
        method,
        sender: activeAddress,
        signer: transactionSigner,
        suggestedParams: sp,
        methodArgs: [{ txn: axferTxn, signer: transactionSigner }],
      });

      return executeAtc(atc);
    },
    [activeAddress, appId, assetId, transactionSigner, getSuggestedParams, executeAtc],
  );

  /**
   * Register a new employee with an hourly salary rate.
   * Employer-only. The employee must have already opted into the app.
   */
  const registerEmployee = useCallback(
    async (employeeAddress: string, rateInBaseUnits: number): Promise<MethodCallResult> => {
      if (!activeAddress) throw new Error('Wallet not connected');

      const sp = await getSuggestedParams();
      const atc = new algosdk.AtomicTransactionComposer();
      const method = contract.getMethodByName('register_employee');

      atc.addMethodCall({
        appID: appId,
        method,
        sender: activeAddress,
        signer: transactionSigner,
        suggestedParams: sp,
        methodArgs: [employeeAddress, BigInt(rateInBaseUnits)],
      });

      return executeAtc(atc);
    },
    [activeAddress, appId, transactionSigner, getSuggestedParams, executeAtc],
  );

  /**
   * Withdraw all accrued salary tokens.
   * Employee-only. Uses inner transaction (fee pooling).
   */
  const withdraw = useCallback(async (): Promise<MethodCallResult> => {
    if (!activeAddress) throw new Error('Wallet not connected');

    const sp = await getPooledFeeParams();
    const atc = new algosdk.AtomicTransactionComposer();
    const method = contract.getMethodByName('withdraw');

    atc.addMethodCall({
      appID: appId,
      method,
      sender: activeAddress,
      signer: transactionSigner,
      suggestedParams: sp,
      methodArgs: [],
      appForeignAssets: [assetId],
    });

    return executeAtc(atc);
  }, [activeAddress, appId, assetId, transactionSigner, getPooledFeeParams, executeAtc]);

  /**
   * Read-only: get the accrued balance for an employee.
   * Does NOT require a connected wallet — uses simulate with an empty signer.
   */
  const getAccrued = useCallback(
    async (employeeAddress: string): Promise<MethodCallResult> => {
      const sp = await getSuggestedParams();
      const atc = new algosdk.AtomicTransactionComposer();
      const method = contract.getMethodByName('get_accrued');

      // Always use simulate for readonly calls — never touch the wallet signer.
      // This prevents getAccrued from competing with withdraw/other txns for
      // the KMD wallet connection.
      const sender = employeeAddress;
      const signer = algosdk.makeEmptyTransactionSigner();

      atc.addMethodCall({
        appID: appId,
        method,
        sender,
        signer,
        suggestedParams: sp,
        methodArgs: [employeeAddress],
      });

      const simResult = await atc.simulate(algodClient, new algosdk.modelsv2.SimulateRequest({
        txnGroups: [],
        allowEmptySignatures: true,
      }));
      const methodResult = simResult.methodResults[0];
      const returnValue = methodResult?.returnValue;
      return {
        txIDs: methodResult?.txID ? [methodResult.txID] : [],
        confirmedRound: 0n,
        returnValue: returnValue !== undefined ? Number(returnValue) : undefined,
      };
    },
    [activeAddress, appId, algodClient, transactionSigner, getSuggestedParams, executeAtc],
  );

  /**
   * Update an employee's hourly salary rate.
   * Employer-only. Settles accrued at old rate first. Uses inner txn (fee pooling).
   */
  const updateRate = useCallback(
    async (employeeAddress: string, newRateInBaseUnits: number): Promise<MethodCallResult> => {
      if (!activeAddress) throw new Error('Wallet not connected');

      const sp = await getPooledFeeParams();
      const atc = new algosdk.AtomicTransactionComposer();
      const method = contract.getMethodByName('update_rate');

      atc.addMethodCall({
        appID: appId,
        method,
        sender: activeAddress,
        signer: transactionSigner,
        suggestedParams: sp,
        methodArgs: [employeeAddress, BigInt(newRateInBaseUnits)],
        appAccounts: [employeeAddress],
        appForeignAssets: [assetId],
      });

      return executeAtc(atc);
    },
    [activeAddress, appId, assetId, transactionSigner, getPooledFeeParams, executeAtc],
  );

  /**
   * Pause an individual employee's salary stream.
   * Employer-only. Settles accrued first. Uses inner txn (fee pooling).
   */
  const pauseStream = useCallback(
    async (employeeAddress: string): Promise<MethodCallResult> => {
      if (!activeAddress) throw new Error('Wallet not connected');

      const sp = await getPooledFeeParams();
      const atc = new algosdk.AtomicTransactionComposer();
      const method = contract.getMethodByName('pause_stream');

      atc.addMethodCall({
        appID: appId,
        method,
        sender: activeAddress,
        signer: transactionSigner,
        suggestedParams: sp,
        methodArgs: [employeeAddress],
        appAccounts: [employeeAddress],
        appForeignAssets: [assetId],
      });

      return executeAtc(atc);
    },
    [activeAddress, appId, assetId, transactionSigner, getPooledFeeParams, executeAtc],
  );

  /**
   * Resume a paused employee's salary stream.
   * Employer-only. No inner transaction needed.
   */
  const resumeStream = useCallback(
    async (employeeAddress: string): Promise<MethodCallResult> => {
      if (!activeAddress) throw new Error('Wallet not connected');

      const sp = await getSuggestedParams();
      const atc = new algosdk.AtomicTransactionComposer();
      const method = contract.getMethodByName('resume_stream');

      atc.addMethodCall({
        appID: appId,
        method,
        sender: activeAddress,
        signer: transactionSigner,
        suggestedParams: sp,
        methodArgs: [employeeAddress],
        appAccounts: [employeeAddress],
      });

      return executeAtc(atc);
    },
    [activeAddress, appId, transactionSigner, getSuggestedParams, executeAtc],
  );

  /**
   * Remove an employee with final payout.
   * Employer-only. Uses inner transaction (fee pooling).
   */
  const removeEmployee = useCallback(
    async (employeeAddress: string): Promise<MethodCallResult> => {
      if (!activeAddress) throw new Error('Wallet not connected');

      const sp = await getPooledFeeParams();
      const atc = new algosdk.AtomicTransactionComposer();
      const method = contract.getMethodByName('remove_employee');

      atc.addMethodCall({
        appID: appId,
        method,
        sender: activeAddress,
        signer: transactionSigner,
        suggestedParams: sp,
        methodArgs: [employeeAddress],
        appAccounts: [employeeAddress],
        appForeignAssets: [assetId],
      });

      return executeAtc(atc);
    },
    [activeAddress, appId, transactionSigner, getPooledFeeParams, executeAtc],
  );

  /**
   * Send a one-time milestone payment to an employee.
   * Employer-only. Uses inner transaction (fee pooling).
   */
  const milestonePay = useCallback(
    async (employeeAddress: string, amountInBaseUnits: number): Promise<MethodCallResult> => {
      if (!activeAddress) throw new Error('Wallet not connected');

      const sp = await getPooledFeeParams();
      const atc = new algosdk.AtomicTransactionComposer();
      const method = contract.getMethodByName('milestone_pay');

      atc.addMethodCall({
        appID: appId,
        method,
        sender: activeAddress,
        signer: transactionSigner,
        suggestedParams: sp,
        methodArgs: [employeeAddress, BigInt(amountInBaseUnits)],
        appAccounts: [employeeAddress],
        appForeignAssets: [assetId],
      });

      return executeAtc(atc);
    },
    [activeAddress, appId, assetId, transactionSigner, getPooledFeeParams, executeAtc],
  );

  /**
   * Emergency pause all active streams.
   * Employer-only. No inner transaction needed.
   */
  const pauseAll = useCallback(async (): Promise<MethodCallResult> => {
    if (!activeAddress) throw new Error('Wallet not connected');

    const sp = await getSuggestedParams();
    const atc = new algosdk.AtomicTransactionComposer();
    const method = contract.getMethodByName('pause_all');

    atc.addMethodCall({
      appID: appId,
      method,
      sender: activeAddress,
      signer: transactionSigner,
      suggestedParams: sp,
      methodArgs: [],
    });

    return executeAtc(atc);
  }, [activeAddress, appId, transactionSigner, getSuggestedParams, executeAtc]);

  /**
   * Resume all streams after an emergency pause.
   * Employer-only. No inner transaction needed.
   */
  const resumeAll = useCallback(async (): Promise<MethodCallResult> => {
    if (!activeAddress) throw new Error('Wallet not connected');

    const sp = await getSuggestedParams();
    const atc = new algosdk.AtomicTransactionComposer();
    const method = contract.getMethodByName('resume_all');

    atc.addMethodCall({
      appID: appId,
      method,
      sender: activeAddress,
      signer: transactionSigner,
      suggestedParams: sp,
      methodArgs: [],
    });

    return executeAtc(atc);
  }, [activeAddress, appId, transactionSigner, getSuggestedParams, executeAtc]);

  /**
   * Drain all remaining PAYUSD from the contract back to the employer.
   * Employer-only. Requires global pause. Uses inner transaction (fee pooling).
   */
  const drainFunds = useCallback(async (): Promise<MethodCallResult> => {
    if (!activeAddress) throw new Error('Wallet not connected');

    const sp = await getPooledFeeParams();
    const atc = new algosdk.AtomicTransactionComposer();
    const method = contract.getMethodByName('drain_funds');

    atc.addMethodCall({
      appID: appId,
      method,
      sender: activeAddress,
      signer: transactionSigner,
      suggestedParams: sp,
      methodArgs: [],
      appForeignAssets: [assetId],
    });

    return executeAtc(atc);
  }, [activeAddress, appId, assetId, transactionSigner, getPooledFeeParams, executeAtc]);

  return {
    optInAsset,
    fund,
    registerEmployee,
    withdraw,
    getAccrued,
    updateRate,
    pauseStream,
    resumeStream,
    removeEmployee,
    milestonePay,
    pauseAll,
    resumeAll,
    drainFunds,
  };
}
