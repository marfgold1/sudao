
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { useAccount, UserBalances } from "@/hooks/useAccount";
import { useAgents } from "@/hooks/useAgents";
import { useDAO } from "@/hooks/useDAO";
import { MakeOpt, PrincipalReq, StringBlobOpt, Resp, matchVariant } from "@/utils/converter";
import { ApproveArgs, ApproveResult } from "declarations/sudao_ledger/sudao_ledger.did";
import { motion, AnimatePresence, Step } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { _SERVICE as AMM } from "declarations/sudao_amm/sudao_amm.did";

type ModalType = 'contribution' | 'confirmation' | 'none';

type DictSet<T> = <K extends keyof T>(key: K, value: T[K]) => void;
interface ContributionData {
  amount: string;
  contributorName: string;
}

interface ValidationErrors {
  amount: string;
  contributorName: string;
}

export const ContributionComponents: React.FC<{
  children: React.ReactNode,
  showModalType: ModalType,
  setShowModalType: (modalType: ModalType) => void,
}> = (props) => {
  const [contributionData, setContributionData] = useState<ContributionData>({
    amount: "10000",
    contributorName: "",
  })

  const [validationErrors, setValidationErrors] = useState({
    amount: "",
    contributorName: "",
  })

  const validateForm = () => {
    const errors = {
      amount: "",
      contributorName: "",
    }

    if (!contributionData.amount.trim()) {
      errors.amount = "Amount is required"
    } else if (isNaN(Number(contributionData.amount)) || Number(contributionData.amount) <= 0) {
      errors.amount = "Amount must be a positive number"
    } else if (Number(contributionData.amount) < 10000) {
      errors.amount = "Minimum amount is 10,000 ICP for meaningful contribution"
    }

    if (!contributionData.contributorName.trim()) {
      errors.contributorName = "Contributor name is required"
    } else if (contributionData.contributorName.trim().length < 2) {
      errors.contributorName = "Name must be at least 2 characters long"
    }

    setValidationErrors(errors)
    return !Object.values(errors).some(error => error !== "")
  }

  const resetValidationErrors = () => {
    setValidationErrors({ amount: "", contributorName: "" })
  }

  const resetContributionFlow = () => {
    setContributionData({ amount: "10000", contributorName: "" })
    resetValidationErrors()
  }

  const setContribution: DictSet<ContributionData> = (key, value) => {
    setContributionData((prev) => ({ ...prev, [key]: value }))
    resetValidationErrors()
  }

  const closeModal = () => {
    props.setShowModalType('none')
    resetValidationErrors()
  }

  return (
    <FallbackNoAccountModal closeModal={closeModal}>
      <ContributionModal
        show={props.showModalType === 'contribution'}
        contributionData={contributionData}
        setContributionData={setContribution}
        validationErrors={validationErrors}
      >
        <div className="flex space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              props.setShowModalType('none')
              resetValidationErrors()
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
            <Button onClick={() => {
              if (validateForm()) {
                props.setShowModalType('confirmation')
              }
            }} className="w-full bg-slate-900 hover:bg-slate-800">
              Continue
            </Button>
          </motion.div>
        </div>
      </ContributionModal>
      <ConfirmationModal
        show={props.showModalType === 'confirmation'}
        contributionData={contributionData}
      >
        <ContributionProcessor
        />
        <div className="flex space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              props.setShowModalType('contribution')
            }}
            className="flex-1"
          >
            Go back
          </Button>
          <Button
            variant="outline"
            onClick={resetContributionFlow}
            className="flex-1"
          >
            Reset
          </Button>
        </div>
      </ConfirmationModal>
      {props.children}
    </FallbackNoAccountModal>
  )
}

const FallbackNoAccountModal: React.FC<{ closeModal: () => void, children: React.ReactNode }> = (props) => {
  const { currentAccount } = useAccount();
  return (<>
    {currentAccount ? props.children : (<>
      <DialogHeader>
        <DialogTitle>No account connected</DialogTitle>
      </DialogHeader>
      <div className="space-y-6 pt-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Please connect your wallet to continue</span>
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={props.closeModal}
        >
          Close
        </Button>
      </div>
    </>)}
  </>)
}

interface ContributionModalProps {
  show: boolean;
  setContributionData: DictSet<ContributionData>;
  contributionData: ContributionData;
  validationErrors: ValidationErrors;
}

const ContributionModal: React.FC<ContributionModalProps & { children: React.ReactNode }> = (props) => {
  return (
    <>
      {/* Contribution Modal */}
      <AnimatePresence>
        {props.show && (
          <Dialog open={props.show}>
            <DialogContent className="sm:max-w-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <DialogHeader>
                  <DialogTitle>Make a contribution</DialogTitle>
                </DialogHeader>
                {[{
                  label: "Amount (ICP) *",
                  key: "amount" as keyof ContributionData,
                  inputType: "number",
                  value: props.contributionData.amount,
                  placeholder: "10000",
                  error: props.validationErrors.amount,
                  helperText: "Minimum 10,000 ICP. You will receive governance tokens through AMM swap.",
                }, {
                  label: "Contributor Name *",
                  key: "contributorName" as keyof ContributionData,
                  inputType: "text",
                  value: props.contributionData.contributorName,
                  placeholder: "Your name",
                  error: props.validationErrors.contributorName,
                }].map((o) => (
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block" htmlFor={o.key}>{o.label}</label>
                      <Input
                        type={o.inputType}
                        value={o.value}
                        name={o.key}
                        onChange={(e) => { props.setContributionData(o.key, e.target.value) }}
                        placeholder="10000"
                        className={o.error ? "border-red-500 focus:border-red-500" : ""}
                      />
                      {o.error && <p className="text-red-500 text-xs mt-1">{o.error}</p>}
                      {o.helperText && <p className="text-xs text-gray-500 mt-1">{o.helperText}</p>}
                    </div>
                  </div>
                ))}
                {props.children}
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  )
}

interface ConfirmationModalProps {
  show: boolean;
  contributionData: ContributionData;
}

const ConfirmationModal: React.FC<ConfirmationModalProps & { children: React.ReactNode }> = (props) => {
  const { currentAccount } = useAccount();
  const { daoInfo } = useDAO();

  return (
    <>
      {/* Confirmation Modal */}
      <AnimatePresence>
        {props.show && (
          <Dialog open={props.show}>
            <DialogContent className="sm:max-w-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <DialogHeader>
                  <DialogTitle>Payment Confirmation</DialogTitle>
                </DialogHeader>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Contributor Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name</span>
                      <span className="font-medium">{props.contributionData.contributorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wallet</span>
                      <span className="font-mono text-sm">
                        {currentAccount!.toString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Payment Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contribution to {daoInfo?.name}</span>
                      <span className="font-medium">{props.contributionData.amount} ICP</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total</span>
                      <span>{props.contributionData.amount} ICP</span>
                    </div>
                  </div>
                </div>
                {props.children}
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}

interface ContributionProcessorProps {
  resetContributionFlow: () => void;
  refetchTransactions: () => void;
  contributionData: ContributionData;
}

type StepType = 'approve' | 'ammInfo' | 'quote' | 'swap' | 'balances';
const stepTypes: StepType[] = ['approve', 'ammInfo', 'quote', 'swap', 'balances'];
type StepResults = {
  [K in StepType]?: K extends 'approve' ? bigint :
  K extends 'ammInfo' ? [Resp<AMM['get_token_info']>, Resp<AMM['get_reserves']>] :
  K extends 'quote' ? bigint :
  K extends 'swap' ? bigint :
  K extends 'balances' ? UserBalances : never;
};

const ContributionProcessor = (props: ContributionProcessorProps) => {
  const { currentAccount, getUserBalances } = useAccount();
  const { daoInfo } = useDAO();
  const { agents, canisterIds: { daoAmm: daoAmmCanId } } = useAgents();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [stepResults, setStepResults] = useState<StepResults>({});
  const stepResultsRef = useRef<StepResults>({});

  const currentStep = stepTypes.findIndex(step => stepResults[step] === undefined);

  const addDebugLog = useCallback((message: string) => {
    console.log(`[DEBUG] ${message}`)
    setDebugInfo((prev) => [
      ...prev.slice(-9),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ])
  }, []);

  if (!daoAmmCanId || !agents.daoAmm) {
    const err = "No DAO AMM canister ID available"
    addDebugLog(err)
    throw new Error(err)
  }

  const userPrincipal = currentAccount!.principal.toString()
  const amountIn = BigInt(props.contributionData.amount);
  const stepFn: { [K in StepType]: () => Promise<NonNullable<StepResults[K]>> } = useMemo(() => ({
    approve: async () => {
      addDebugLog(`Calling approve for user ${userPrincipal} with amount ${amountIn}`)
      const approveArgs: ApproveArgs = {
        from_subaccount: MakeOpt(currentAccount!.subAccount?.toUint8Array()),
        spender: { owner: PrincipalReq(daoAmmCanId), subaccount: [] },
        fee: MakeOpt(10000n),
        memo: StringBlobOpt("Contribution to " + daoInfo?.name),
        amount: amountIn,
        created_at_time: MakeOpt(BigInt(Date.now() * 1e6)),
        expected_allowance: MakeOpt(0n),
        expires_at: MakeOpt(BigInt((Date.now() + 60 * 60 * 1000) * 1e6)),
      }
      addDebugLog(`Calling icrc2_approve with args: ${approveArgs}`)
      const approveResult = await agents.icpLedger.icrc2_approve(approveArgs)

      return matchVariant(approveResult, {
        Ok: (approve) => {
          addDebugLog(`Approve successful with amount: ${approve}`)
          return approve;
        },
        Err: (err) => {
          addDebugLog(`Approve failed with error: ${err}`)
          throw new Error(`Approve failed: ${err}`)
        }
      });
    },
    ammInfo: async () => {
      addDebugLog(`Calling check AMM info: get_token_info and get_reserves`)
      const [tokenInfo, reserves] = await Promise.all([
        agents.daoAmm!.get_token_info(),
        agents.daoAmm!.get_reserves(),
      ]);
      addDebugLog(`Token info: ${tokenInfo}`)
      addDebugLog(`Reserves: ${reserves}`)
      return [tokenInfo, reserves];
    },
    quote: async () => {
      // Get Quote
      addDebugLog(`Calling get_swap_quote for ${amountIn} ICP from ${daoAmmCanId}`)
      const quoteResult = await agents.daoAmm!.get_swap_quote(PrincipalReq(daoAmmCanId), amountIn);
      return matchVariant(quoteResult, {
        ok: (quote) => {
          addDebugLog(`Quote successful: ${amountIn} ICP → ${quote.toLocaleString()} Governance tokens`)
          return quote;
        },
        err: (err) => {
          addDebugLog(`Quote failed with error: ${err}`)
          throw new Error(`Quote failed: ${err}`)
        }
      })
    },
    swap: async () => { // Swap
      addDebugLog('Starting swap process')
      const quote = stepResultsRef.current.quote;
      if (quote === undefined) {
        addDebugLog('No quote found')
        throw new Error('No quote found')
      }
      const minAmountOut = quote * 99n / 100n;
      const swapResult = await agents.daoAmm!.swap({
        token_in_id: PrincipalReq(daoAmmCanId),
        amount_in: amountIn,
        min_amount_out: minAmountOut,
      })
      addDebugLog(`Swap result: ${swapResult}`)
      return matchVariant(swapResult, {
        ok: (swap) => {
          addDebugLog(`Swap successful! Received ${swap.toLocaleString()} governance tokens`)
          return swap;
        },
        err: (err) => {
          addDebugLog(`Swap failed with error: ${err}`)
          throw new Error(`Swap failed: ${err}`)
        }
      });
    },
    balances: async () => {
      addDebugLog('Checking balances after swap')
      const userBalance = await getUserBalances();
      if (!userBalance) {
        addDebugLog('No balances found')
        throw new Error('No balances found')
      }
      return userBalance;
    }
  }), [agents, daoAmmCanId, daoInfo, getUserBalances, currentAccount, stepResultsRef, amountIn]);

  const executeStep = async (step: StepType) => {
    if (!daoAmmCanId || !agents.daoAmm) {
      const err = "No DAO AMM canister ID available"
      addDebugLog(err)
      throw new Error(err)
    }
    const idxStep = stepTypes.findIndex(s => s === step);
    addDebugLog(`=== Starting step [${idxStep}] - ${step}`)
    try {
      const result = await stepFn[step]();
      setStepResults(prev => ({ ...prev, [step]: result }))
      stepResultsRef.current = { ...stepResultsRef.current, [step]: result }
      addDebugLog(`=== Step [${idxStep}] - ${step} completed successfully`)
    } catch (error) {
      addDebugLog(`Step ${step} failed with error: ${error}`)
    }
  }

  const contributionCompleted = currentStep === 5;

  const resetContributionFlow = () => {
    setCurrentStep(0)
    setStepResults({})
    setIsProcessingPayment(false)
    setShowConfirmationModal(false)
    setContributionData({ amount: "10000", contributorName: "" })
    setValidationErrors({ amount: "", contributorName: "" })
    setContributionCompleted(false)
  }

  return (
    <>
      {/* Unified contribution button */}
      <div className="space-y-4">
        <Button
          onClick={() => {
            if (contributionCompleted) {
              props.resetContributionFlow()
            } else {
              executeAllSteps(canisterId, ammCanisterId)
            }
          }}
          disabled={isProcessingPayment}
          className={`w-full ${contributionCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}
        >
          {isProcessingPayment ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Contribution...
            </>
          ) : contributionCompleted ? (
            'Contribution Complete - Close'
          ) : (
            'Complete Contribution'
          )}
        </Button>


      </div>
      {/* Debug Log */}
      {debugInfo.length > 0 && (
        <div className="mt-4 p-2 bg-gray-100 border rounded text-xs max-h-32 overflow-y-auto">
          <h4 className="font-semibold mb-1">Debug Log:</h4>
          {debugInfo.map((log, index) => (
            <div key={index} className="text-gray-600 font-mono text-xs">
              {log}
            </div>
          ))}
        </div>
      )}
      {props.children}
    </>
  )
}

const ConfirmationModalContent: React.FC<{ children: React.ReactNode }> = (props) => {

  return (<>


    <div className="space-y-4">
      {/* Progress indicator */}
      {isProcessingPayment && (
        <div className="text-center text-sm text-gray-600">
          Step {currentStep} of 5: {currentStep === 1 && 'Approving...'}
          {currentStep === 2 && 'Checking AMM...'}
          {currentStep === 3 && 'Getting Quote...'}
          {currentStep === 4 && 'Swapping...'}
          {currentStep === 5 && 'Checking Balances...'}
        </div>
      )}

      {/* Individual step buttons (for debugging) */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500">Advanced: Individual Steps</summary>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {[1, 2, 3, 4, 5].map(step => (
            <Button
              key={step}
              size="sm"
              variant={currentStep >= step ? "default" : "outline"}
              onClick={() => executeStep(step, canisterId, ammCanisterId)}
              disabled={isProcessingPayment}
              className="text-xs"
            >
              {step === 1 && 'Approve'}
              {step === 2 && 'AMM Info'}
              {step === 3 && 'Quote'}
              {step === 4 && 'Swap'}
              {step === 5 && 'Balances'}
            </Button>
          ))}
        </div>
      </details>

      {/* Step Results */}
      {stepResults.approve && (
        <div className="p-2 bg-green-50 rounded text-xs">
          <strong>Approve:</strong> ✅ Success
        </div>
      )}
      {stepResults.ammInfo && (
        <div className="p-2 bg-blue-50 rounded text-xs">
          <strong>AMM:</strong> Initialized: {stepResults.ammInfo.is_initialized ? 'Yes' : 'No'},
          Reserves: {stepResults.ammInfo.reserve0.toLocaleString()} ICP, {stepResults.ammInfo.reserve1.toLocaleString()} Gov
        </div>
      )}
      {stepResults.quote && (
        <div className="p-2 bg-yellow-50 rounded text-xs">
          <strong>Quote:</strong> {props.contributionData.amount} ICP → {stepResults.quote.toLocaleString()} Governance tokens
        </div>
      )}
      {stepResults.swap && (
        <div className="p-2 bg-purple-50 rounded text-xs">
          <strong>Swap:</strong> ✅ Received {Number(stepResults.swap.ok).toLocaleString()} governance tokens
        </div>
      )}
      {stepResults.balances && (
        <div className="p-2 bg-gray-50 rounded text-xs">
          <strong>Balances:</strong> {stepResults.balances.icp.toLocaleString()} ICP, {stepResults.balances.governance.toLocaleString()} Governance
        </div>
      )}
    </div>

    {props.children}
  </>
  )
}
