
const TransactionPage: React.FC = () => {
    const [showContributionModal, setShowContributionModal] = useState(false)
    const [showConfirmationModal, setShowConfirmationModal] = useState(false)
    const [contributionData, setContributionData] = useState({
        amount: "10000",
        contributorName: "",
    })
    const [validationErrors, setValidationErrors] = useState({
        amount: "",
        contributorName: "",
    })
    const [isProcessingPayment, setIsProcessingPayment] = useState(false)
    const [balancesAfterSwap, setBalancesAfterSwap] = useState<UserBalances | null>(null)
    const [currentStep, setCurrentStep] = useState(0)
    const [stepResults, setStepResults] = useState<{
        approve?: ApproveResult;
        ammInfo?: [typeof amm.tokenInfo, typeof amm.reserves];
        quote?: bigint;
        swap?: bigint;
        balances?: UserBalances;
    }>({})
    const [debugInfo, setDebugInfo] = useState<string[]>([])
    const [contributionCompleted, setContributionCompleted] = useState(false)
    const amm = useAMM();

    const addDebugLog = useCallback((message: string) => {
        console.log(`[DEBUG] ${message}`)
        setDebugInfo((prev) => [
            ...prev.slice(-9),
            `${new Date().toLocaleTimeString()}: ${message}`,
        ])
    }, [])

    const [loading, setLoading] = useState(false)
    const { currentAccount, getUserBalances } = useAccount()
    const { agents, canisterIds: { daoAmm: daoAmmCanId, icpLedger: icpCanId } } = useAgents()

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

    const handleContributionSubmit = () => {
        if (validateForm()) {
            setShowContributionModal(false)
            setShowConfirmationModal(true)
        }
    }

    const resetContributionFlow = () => {
        setCurrentStep(0)
        setStepResults({})
        setIsProcessingPayment(false)
        setShowConfirmationModal(false)
        setContributionData({ amount: "10000", contributorName: "" })
        setValidationErrors({ amount: "", contributorName: "" })
        setContributionCompleted(false)
    }

    const executeAllSteps = async () => {
        setIsProcessingPayment(true)

        for (let step = 1; step <= 5; step++) {
            try {
                await executeStep(step)
                // Small delay between steps for better UX
                await new Promise(resolve => setTimeout(resolve, 500))
            } catch (error) {
                setIsProcessingPayment(false)
                console.error(error)
                return // Stop on first error
            }
        }

        setIsProcessingPayment(false)
        setContributionCompleted(true)
        toast.success('Contribution completed successfully!')

        // Reload transactions from AMM to show the new transaction
        try {
            const hist = await amm.getHistory();
            setTransactions((hist?.map(tx => ({
                id: tx.id.toString(),
                account: tx.user.toString(),
                amount: tx.amount_in,
                type: 'In' as const,
                beneficiary: 'AMM Pool',
                address: tx.token_in.toString(),
                date: new Date(Number(tx.timestamp) / 1000000).toLocaleString(),
            })) || []));
        } catch (error) {
            console.error(error)
        }
    }

    const executeStep = async (step: number) => {
        if (!currentAccount) {
            addDebugLog('No current account available')
            toast.error('Please connect your wallet first')
            return
        }
        if (!daoAmmCanId || !amm) {
            addDebugLog('No DAO AMM canister ID available')
            toast.error('Please set the DAO AMM canister ID')
            return
        }

        const userPrincipal = currentAccount.principal.toString()
        const amountIn = BigInt(contributionData.amount);
        addDebugLog(`Starting step ${step} for user ${userPrincipal} with amount ${contributionData.amount}`)
        try {
            switch (step) {
                case 1: { // Approve
                    const approveArgs: ApproveArgs = {
                        from_subaccount: MakeOpt(currentAccount.subAccount?.toUint8Array()),
                        spender: { owner: PrincipalReq(daoAmmCanId), subaccount: [] },
                        fee: MakeOpt(10000n),
                        memo: [],
                        amount: amountIn,
                        created_at_time: MakeOpt(BigInt(Date.now() * 1000000)),
                        expected_allowance: MakeOpt(0n),
                        expires_at: MakeOpt(BigInt((Date.now() + 60 * 60 * 1000) * 1000000)),
                    }
                    addDebugLog(`Calling icrc2_approve with args: ${approveArgs}`)
                    const approveResult = await agents.icpLedger.icrc2_approve(approveArgs)
                    addDebugLog(`Approve result: ${approveResult}`)
                    setStepResults(prev => ({ ...prev, approve: approveResult }))
                    toast.success('Approval successful!')
                } break;
                case 2: { // Check AMM Info
                    await amm.refetch();
                    if (!amm.tokenInfo || !amm.reserves) {
                        addDebugLog('fail to get amm info')
                        throw new Error('fail to get amm info')
                    }
                    addDebugLog(`Token info: ${amm.tokenInfo}`)
                    addDebugLog(`Reserves: ${amm.reserves}`)

                    addDebugLog(`Processed AMM info:\nToken info: ${amm.tokenInfo}\nReserves: ${amm.reserves}`)
                    setStepResults(prev => ({ ...prev, ammInfo: [amm.tokenInfo, amm.reserves] }))
                } break;
                case 3: { // Get Quote
                    addDebugLog(`Getting quote for ${contributionData.amount} ICP from ${daoAmmCanId}`)
                    const quoteResult = await amm.handleGetQuote(daoAmmCanId, amountIn);
                    addDebugLog(`Quote result: ${quoteResult}`)
                    matchVariant(quoteResult, {
                        ok: (quote) => {
                            setStepResults(prev => ({ ...prev, quote }))
                            toast.success(`Quote: ${contributionData.amount} ICP → ${quote.toLocaleString()} Governance tokens`)
                        },
                        err: (err) => {
                            addDebugLog(`Quote failed with error: ${err}`)
                            throw new Error(`Quote failed: ${err}`)
                        }
                    })
                } break;
                case 4: { // Swap
                    addDebugLog('Starting swap process')
                    if (!stepResults.quote) {
                        addDebugLog('No quote found')
                        throw new Error('No quote found')
                    }
                    const minAmountOut = stepResults.quote * 99n / 100n;
                    const swapResult = await amm.handleSwap(icpCanId, amountIn, minAmountOut)
                    addDebugLog(`Swap result: ${swapResult}`)
                    matchVariant(swapResult, {
                        ok: (swap) => {
                            addDebugLog(`Swap successful, received: ${swap}`)
                            setStepResults(prev => ({ ...prev, swap }))
                            toast.success(`Swap successful! Received ${swap.toLocaleString()} governance tokens`)
                        },
                        err: (err) => {
                            addDebugLog(`Swap failed with error: ${err}`)
                            throw new Error(`Swap failed: ${err}`)
                        }
                    });
                } break;
                case 5: { // Check Balances
                    addDebugLog('Checking balances after swap')
                    const userBalance = await getUserBalances();
                    if (!userBalance) {
                        addDebugLog('No balances found')
                        throw new Error('No balances found')
                    }

                    addDebugLog(`Balances result: ${userBalance}`)
                    setStepResults(prev => ({ ...prev, balances: userBalance }))
                    setBalancesAfterSwap(userBalance)
                    toast.success(`Balances: ${userBalance.icp.toLocaleString()} ICP, ${userBalance.governance.toLocaleString()} Governance tokens`)
                } break;
            }
            addDebugLog(`Step ${step} completed successfully`)
            setCurrentStep(step)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Step failed'
            addDebugLog(`Step ${step} failed: ${errorMessage}`)
            console.error(`Step ${step} error:`, error)
            toast.error(`Step ${step} failed: ${errorMessage}`)
        }
    }

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    return (
        <DAOLayout>
            {({ dao, isRegistered, isCreator }) => {
                return
            }}
        </DAOLayout>
    )
}