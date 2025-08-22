import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  ArrowUp,
  ArrowDown,
  Loader2,
  FileText,
} from "lucide-react"
import { Transaction } from "@/types"
import { DAOLayout } from "../../components/DAOLayout"
import { getTransactionHistory } from "../../services/treasury"
import { useAgent, useIdentity } from '@nfid/identitykit/react'
import { toast } from 'react-toastify'
import { Actor } from "@dfinity/agent"
import { Principal } from "@dfinity/principal"
import {
  idlFactory as idlFactoryICP,
  canisterId as icpCanisterId,
} from "declarations/icp_ledger_canister/index"
import {
  idlFactory as idlFactoryAMM,
  canisterId as ammCanisterId,
} from "declarations/sudao_amm/index"
import type { _SERVICE as _SERVICE_ICP_LEDGER } from "declarations/icp_ledger_canister/icp_ledger_canister.did"
import type { _SERVICE as _SERVICE_AMM } from "declarations/sudao_amm/sudao_amm.did"

const TransactionPage: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [searchTerm, setSearchTerm] = useState("")
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
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [sortField, setSortField] = useState<keyof Transaction | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [showFilter, setShowFilter] = useState(false)
    const [typeFilter, setTypeFilter] = useState<'all' | 'In' | 'Out'>('all')
    const [dateFilter, setDateFilter] = useState('')
    const [loading, setLoading] = useState(false)
    
    const agent = useAgent()
    const identity = useIdentity()

    const handleSort = (field: keyof Transaction) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const filteredTransactions = transactions
        .filter((transaction) => {
            const matchesSearch = transaction.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.beneficiary.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesType = typeFilter === 'all' || transaction.type === typeFilter
            const matchesDate = !dateFilter || transaction.date.includes(dateFilter)
            return matchesSearch && matchesType && matchesDate
        })
        .sort((a, b) => {
            if (!sortField) return 0
            
            let aValue = a[sortField]
            let bValue = b[sortField]
            
            if (aValue === undefined && bValue === undefined) return 0
            if (aValue === undefined) return sortDirection === 'asc' ? 1 : -1
            if (bValue === undefined) return sortDirection === 'asc' ? -1 : 1
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase()
                bValue = bValue.toLowerCase()
            }
            
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

    const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage)
    const startIndex = (currentPage - 1) * rowsPerPage
    const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + rowsPerPage)

    const handleRowSelect = (id: string) => {
        setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
    }

    const handleSelectAll = () => {
        if (selectedRows.length === paginatedTransactions.length) {
            setSelectedRows([])
        } else {
            setSelectedRows(paginatedTransactions.map((t) => t.id))
        }
    }

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

    const handleFinalContribution = async (canisterId: string) => {
        if (!agent || !identity) {
            toast.error('Please connect your wallet first')
            return
        }

        // Check if required canister IDs are available
        if (!icpCanisterId || !ammCanisterId) {
            toast.error('Canister IDs not available. Please ensure the local network is running.')
            console.error('Missing canister IDs:', { icpCanisterId, ammCanisterId })
            return
        }

        setIsProcessingPayment(true)
        
        try {
            const userPrincipal = identity.getPrincipal().toString()
            const numberValue = Number(contributionData.amount)
            console.log('[CONTRIBUTION] Starting contribution process:', { userPrincipal, numberValue, canisterId })
            
            // Validate minimum amount (10,000 ICP minimum like in Profile component)
            if (numberValue < 10000) {
                console.log('[CONTRIBUTION] Amount too small:', numberValue)
                toast.error('Amount too small. Try at least 10,000 ICP for a meaningful contribution.')
                return
            }
            
            // Initialize actors with proper root key fetching
            if (process.env.DFX_NETWORK !== "ic") {
                console.log('[CONTRIBUTION] Fetching root key for local development')
                await agent.fetchRootKey()
                console.log('[CONTRIBUTION] Root key fetched successfully')
            }
            
            // Step 1: Approve AMM to spend ICP
            console.log('[CONTRIBUTION] Creating ICP actor with canisterId:', icpCanisterId)
            const actorICP = Actor.createActor<_SERVICE_ICP_LEDGER>(idlFactoryICP, {
                agent,
                canisterId: icpCanisterId,
            })

            const icrc2_approve_args = {
                from_subaccount: [] as [],
                spender: {
                    owner: Principal.fromText(ammCanisterId),
                    subaccount: [] as [],
                },
                fee: [BigInt(10000)] as [bigint],
                memo: [] as [],
                amount: BigInt(numberValue),
                created_at_time: [BigInt(Date.now() * 1000000)] as [bigint],
                expected_allowance: [] as [],
                expires_at: [BigInt((Date.now() + 10000000000000) * 1000000)] as [bigint],
            }

            console.log('[CONTRIBUTION] Calling icrc2_approve with args:', icrc2_approve_args)
            const approveResult = await actorICP.icrc2_approve(icrc2_approve_args)
            console.log('[CONTRIBUTION] Approve result:', approveResult)

            // Step 2: Get swap quote and perform swap
            console.log('[CONTRIBUTION] Creating AMM actor with canisterId:', ammCanisterId)
            const actorAMM = Actor.createActor<_SERVICE_AMM>(idlFactoryAMM, {
                agent,
                canisterId: ammCanisterId,
            })

            console.log('[CONTRIBUTION] Getting swap quote for:', { icpCanisterId, amount: BigInt(numberValue) })
            
            let minAmountOut = 1 // Default minimum amount
            
            try {
                // Try to get quote with short timeout
                const quotePromise = actorAMM.get_swap_quote(
                    Principal.fromText(icpCanisterId),
                    BigInt(numberValue)
                )
                
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Quote timeout')), 5000)
                )
                
                const quoteResult = await Promise.race([quotePromise, timeoutPromise])
                console.log('[CONTRIBUTION] Quote result:', quoteResult)
                
                if ("ok" in quoteResult) {
                    const quote = Number(quoteResult.ok)
                    console.log('[CONTRIBUTION] Quote received:', quote)
                    if (quote > 0) {
                        minAmountOut = Math.floor(quote * 0.99) // 1% slippage
                        console.log('[CONTRIBUTION] Using quote-based minAmountOut:', minAmountOut)
                    }
                }
            } catch (error) {
                console.log('[CONTRIBUTION] Quote failed or timed out, proceeding with minimal slippage:', error)
                // Use minimal amount to allow swap to proceed
                minAmountOut = 1
            }

            const swapArgs = {
                token_in_id: Principal.fromText(icpCanisterId),
                amount_in: BigInt(numberValue),
                min_amount_out: BigInt(minAmountOut),
            }
            console.log('[CONTRIBUTION] Proceeding with swap args:', swapArgs)

            console.log('[CONTRIBUTION] Calling swap with args:', swapArgs)
            
            // Add timeout for swap call
            const swapPromise = actorAMM.swap(swapArgs)
            const swapTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Swap request timed out after 30 seconds')), 30000)
            )
            
            const swapResult = await Promise.race([swapPromise, swapTimeoutPromise])
            console.log('[CONTRIBUTION] Swap result:', swapResult)

            if ("ok" in swapResult) {
                console.log('[CONTRIBUTION] Swap successful, received tokens:', swapResult.ok)
                
                // Register user after successful contribution
                try {
                    console.log('[CONTRIBUTION] Attempting user registration for canisterId:', canisterId)
                    const { registerUser } = await import('../../services/dao')
                    await registerUser(canisterId, agent)
                    console.log('[CONTRIBUTION] User registration successful')
                } catch (regError) {
                    console.log('[CONTRIBUTION] Registration after contribution failed:', regError)
                }

                const newTransaction: Transaction = {
                    id: Date.now().toString(),
                    account: userPrincipal.slice(0, 8) + '...' + userPrincipal.slice(-6),
                    amount: Number(contributionData.amount),
                    type: "In",
                    beneficiary: "DAO Treasury",
                    address: ammCanisterId.slice(0, 8) + '...' + ammCanisterId.slice(-6),
                    date: new Date().toISOString().split("T")[0],
                }

                console.log('[CONTRIBUTION] Adding new transaction:', newTransaction)
                setTransactions((prev) => [newTransaction, ...prev])
                toast.success(`Contribution successful! Received ${Number(swapResult.ok).toLocaleString()} governance tokens`)
            } else {
                console.log('[CONTRIBUTION] Swap failed with error:', swapResult.err)
                throw new Error(`Swap failed: ${JSON.stringify(swapResult.err)}`)
            }
        } catch (error) {
            console.error('Contribution error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Contribution failed. Please try again.'
            toast.error(errorMessage)
        } finally {
            setIsProcessingPayment(false)
            setShowConfirmationModal(false)
            setContributionData({ amount: "10000", contributorName: "" })
            setValidationErrors({ amount: "", contributorName: "" })
        }
    }

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    return (
        <DAOLayout>
            {({ dao, canisterId, isRegistered, isCreator }) => {
                return <TransactionContent 
                    dao={dao}
                    canisterId={canisterId}
                    isRegistered={isRegistered}
                    isCreator={isCreator}
                    transactions={transactions}
                    setTransactions={setTransactions}
                    loading={loading}
                    setLoading={setLoading}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    showContributionModal={showContributionModal}
                    setShowContributionModal={setShowContributionModal}
                    showConfirmationModal={showConfirmationModal}
                    setShowConfirmationModal={setShowConfirmationModal}
                    contributionData={contributionData}
                    setContributionData={setContributionData}
                    validationErrors={validationErrors}
                    setValidationErrors={setValidationErrors}
                    isProcessingPayment={isProcessingPayment}
                    setIsProcessingPayment={setIsProcessingPayment}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    rowsPerPage={rowsPerPage}
                    setRowsPerPage={setRowsPerPage}
                    selectedRows={selectedRows}
                    setSelectedRows={setSelectedRows}
                    sortField={sortField}
                    setSortField={setSortField}
                    sortDirection={sortDirection}
                    setSortDirection={setSortDirection}
                    showFilter={showFilter}
                    setShowFilter={setShowFilter}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    handleSort={handleSort}
                    filteredTransactions={filteredTransactions}
                    totalPages={totalPages}
                    paginatedTransactions={paginatedTransactions}
                    handleRowSelect={handleRowSelect}
                    handleSelectAll={handleSelectAll}
                    validateForm={validateForm}
                    handleContributionSubmit={handleContributionSubmit}
                    handleFinalContribution={() => handleFinalContribution(canisterId)}
                />

            }}
        </DAOLayout>
    )
}

const TransactionContent: React.FC<any> = ({
    dao, canisterId, isRegistered, isCreator, transactions, setTransactions,
    loading, setLoading, searchTerm, setSearchTerm, showContributionModal,
    setShowContributionModal, showConfirmationModal, setShowConfirmationModal,
    contributionData, setContributionData, validationErrors, setValidationErrors,
    isProcessingPayment, setIsProcessingPayment, currentPage, setCurrentPage,
    rowsPerPage, setRowsPerPage, selectedRows, setSelectedRows, sortField,
    setSortField, sortDirection, setSortDirection, showFilter, setShowFilter,
    typeFilter, setTypeFilter, dateFilter, setDateFilter, handleSort,
    filteredTransactions, totalPages, paginatedTransactions, handleRowSelect,
    handleSelectAll, validateForm, handleContributionSubmit, handleFinalContribution
}) => {
    const agent = useAgent()
    const identity = useIdentity()
    
    // Load transactions from DAO
    useEffect(() => {
        if (canisterId) {
            setLoading(true)
            getTransactionHistory(canisterId)
                .then(history => {
                    const mappedTransactions = history.map(tx => ({
                        id: tx.id,
                        account: tx.from.slice(0, 8) + '...' + tx.from.slice(-6),
                        amount: tx.amount,
                        type: tx.transactionType === 'Deposit' ? 'In' as const : 'Out' as const,
                        beneficiary: tx.transactionType === 'Deposit' ? 'DAO Treasury' : tx.to.slice(0, 8) + '...' + tx.to.slice(-6),
                        address: tx.to.slice(0, 8) + '...' + tx.to.slice(-6),
                        date: new Date(Number(tx.timestamp) / 1000000).toISOString().split("T")[0],
                    }))
                    setTransactions(mappedTransactions)
                })
                .catch(() => {
                    setTransactions([])
                })
                .finally(() => setLoading(false))
        }
    }, [canisterId, setTransactions, setLoading])
    
    return (
        <div className="min-h-screen bg-gray-50 mt-[4.5rem]">
                        <div className="container mx-auto px-4 py-6">
                            {/* DAO Header */}
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-gray-900">{dao?.name || "Loading..."}</h1>
                                    {isCreator && (
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                            Creator
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-gray-600 mb-4 max-w-2xl">{dao?.description || "Loading DAO description..."}</p>
                                {dao?.tags && dao.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {dao.tags.map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">{tag}</Badge>
                                        ))}
                                    </div>
                                )}
                                

                            </div>

                            {/* Page Title */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 flex-shrink-0 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                                        <PiggyBank className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold tracking-tight">
                                            <span>Transactions</span>
                                        </h2>
                                        <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                                            Support this collective by contributing directly to its on-chain treasury. Every contribution helps power
                                            new projects and community initiatives.
                                        </p>
                                    </div>
                                </div>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button onClick={() => setShowContributionModal(true)} className="bg-blue-600 hover:bg-blue-700">
                                        Make a Contribution
                                    </Button>
                                </motion.div>
                            </div>

                            {/* Transactions Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-lg shadow-sm border"
                            >
                                <div className="p-6 border-b">
                                    <div className="flex items-center justify-between">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                placeholder="Search for contributors..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 w-80"
                                            />
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setShowFilter(!showFilter)}>
                                            <Filter className="w-4 h-4 mr-2" />
                                            Filter
                                        </Button>
                                    </div>
                                    
                                    {showFilter && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 p-4 border rounded-lg bg-gray-50"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm font-medium">Type:</label>
                                                    <Select value={typeFilter} onValueChange={(value: 'all' | 'In' | 'Out') => setTypeFilter(value)}>
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All</SelectItem>
                                                            <SelectItem value="In">In</SelectItem>
                                                            <SelectItem value="Out">Out</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm font-medium">Date:</label>
                                                    <Input
                                                        type="date"
                                                        value={dateFilter}
                                                        onChange={(e) => setDateFilter(e.target.value)}
                                                        className="w-40"
                                                    />
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => {
                                                        setTypeFilter('all')
                                                        setDateFilter('')
                                                    }}
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="overflow-x-auto px-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">
                                                    <Checkbox
                                                        checked={selectedRows.length === paginatedTransactions.length}
                                                        onCheckedChange={handleSelectAll}
                                                    />
                                                </TableHead>
                                                <TableHead 
                                                    className="cursor-pointer hover:bg-gray-50 select-none"
                                                    onClick={() => handleSort('account')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Account
                                                        {sortField === 'account' && (
                                                            sortDirection === 'asc' ? 
                                                            <ArrowUp className="w-4 h-4" /> : 
                                                            <ArrowDown className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                </TableHead>
                                                <TableHead 
                                                    className="cursor-pointer hover:bg-gray-50 select-none"
                                                    onClick={() => handleSort('amount')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Amount
                                                        {sortField === 'amount' && (
                                                            sortDirection === 'asc' ? 
                                                            <ArrowUp className="w-4 h-4" /> : 
                                                            <ArrowDown className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                </TableHead>
                                                <TableHead 
                                                    className="cursor-pointer hover:bg-gray-50 select-none"
                                                    onClick={() => handleSort('type')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Type
                                                        {sortField === 'type' && (
                                                            sortDirection === 'asc' ? 
                                                            <ArrowUp className="w-4 h-4" /> : 
                                                            <ArrowDown className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                </TableHead>
                                                <TableHead 
                                                    className="cursor-pointer hover:bg-gray-50 select-none"
                                                    onClick={() => handleSort('beneficiary')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Beneficiary
                                                        {sortField === 'beneficiary' && (
                                                            sortDirection === 'asc' ? 
                                                            <ArrowUp className="w-4 h-4" /> : 
                                                            <ArrowDown className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                </TableHead>
                                                <TableHead 
                                                    className="cursor-pointer hover:bg-gray-50 select-none"
                                                    onClick={() => handleSort('address')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Address
                                                        {sortField === 'address' && (
                                                            sortDirection === 'asc' ? 
                                                            <ArrowUp className="w-4 h-4" /> : 
                                                            <ArrowDown className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                </TableHead>
                                                <TableHead 
                                                    className="cursor-pointer hover:bg-gray-50 select-none"
                                                    onClick={() => handleSort('date')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Date
                                                        {sortField === 'date' && (
                                                            sortDirection === 'asc' ? 
                                                            <ArrowUp className="w-4 h-4" /> : 
                                                            <ArrowDown className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <AnimatePresence>
                                                {loading ? (
                                                    <motion.tr
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="h-16"
                                                    >
                                                        <TableCell colSpan={7} className="text-center py-8">
                                                            <div className="flex items-center justify-center">
                                                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                                Loading transactions...
                                                            </div>
                                                        </TableCell>
                                                    </motion.tr>
                                                ) : paginatedTransactions.length === 0 ? (
                                                    <motion.tr
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="h-16"
                                                    >
                                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                            No transactions found
                                                        </TableCell>
                                                    </motion.tr>
                                                ) : paginatedTransactions.map((transaction, index) => (
                                                    <motion.tr
                                                        key={transaction.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -20 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="hover:bg-gray-50 h-16"
                                                    >
                                                        <TableCell className="py-4">
                                                            <Checkbox
                                                                checked={selectedRows.includes(transaction.id)}
                                                                onCheckedChange={() => handleRowSelect(transaction.id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm py-4">{transaction.account}</TableCell>
                                                        <TableCell className="font-semibold py-4">{transaction.amount} ICP</TableCell>
                                                        <TableCell className="py-4">
                                                            <Badge
                                                                variant={transaction.type === "In" ? "Approved" : "Rejected"}
                                                                className={`flex items-center space-x-1 w-fit ${
                                                                    transaction.type === "In" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                                }`}
                                                            >
                                                                {transaction.type === "In" ? (
                                                                    <ArrowDownLeft className="w-3 h-3" />
                                                                ) : (
                                                                    <ArrowUpRight className="w-3 h-3" />
                                                                )}
                                                                <span>{transaction.type}</span>
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-4">{transaction.beneficiary}</TableCell>
                                                        <TableCell className="font-mono text-sm py-4">{transaction.address}</TableCell>
                                                        <TableCell className="py-4">{transaction.date}</TableCell>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex items-center justify-between px-6 py-4 border-t">
                                    <div className="text-sm text-gray-600">
                                        {selectedRows.length} of {filteredTransactions.length} row(s) selected.
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-600">Rows per page</span>
                                            <Select
                                                value={rowsPerPage.toString()}
                                                onValueChange={(value) => setRowsPerPage(Number.parseInt(value))}
                                            >
                                                <SelectTrigger className="w-16">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10</SelectItem>
                                                    <SelectItem value="20">20</SelectItem>
                                                    <SelectItem value="50">50</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                                <ChevronsLeft className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(totalPages)}
                                                disabled={currentPage === totalPages}
                                            >
                                                <ChevronsRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                    {/* Contribution Modal */}
                        <AnimatePresence>
                            {showContributionModal && (
                                <Dialog open={showContributionModal} onOpenChange={() => {}}>
                                    <DialogContent className="sm:max-w-md">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <DialogHeader>
                                                <DialogTitle>Make a contribution</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 pt-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Amount (ICP) *</label>
                                                    <Input
                                                        type="number"
                                                        value={contributionData.amount}
                                                        onChange={(e) => {
                                                            setContributionData((prev) => ({ ...prev, amount: e.target.value }))
                                                            if (validationErrors.amount) {
                                                                setValidationErrors((prev) => ({ ...prev, amount: "" }))
                                                            }
                                                        }}
                                                        placeholder="10000"
                                                        className={validationErrors.amount ? "border-red-500 focus:border-red-500" : ""}
                                                    />
                                                    {validationErrors.amount && (
                                                        <p className="text-red-500 text-xs mt-1">{validationErrors.amount}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Minimum 10,000 ICP. You will receive governance tokens through AMM swap.
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Contributor Name *</label>
                                                    <Input
                                                        value={contributionData.contributorName}
                                                        onChange={(e) => {
                                                            setContributionData((prev) => ({ ...prev, contributorName: e.target.value }))
                                                            if (validationErrors.contributorName) {
                                                                setValidationErrors((prev) => ({ ...prev, contributorName: "" }))
                                                            }
                                                        }}
                                                        placeholder="Your name"
                                                        className={validationErrors.contributorName ? "border-red-500 focus:border-red-500" : ""}
                                                    />
                                                    {validationErrors.contributorName && (
                                                        <p className="text-red-500 text-xs mt-1">{validationErrors.contributorName}</p>
                                                    )}
                                                </div>
                                                <div className="flex space-x-3 pt-4">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowContributionModal(false)
                                                            setValidationErrors({ amount: "", contributorName: "" })
                                                        }}
                                                        className="flex-1"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                                                        <Button onClick={handleContributionSubmit} className="w-full bg-slate-900 hover:bg-slate-800">
                                                            Continue
                                                        </Button>
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </AnimatePresence>

                        {/* Confirmation Modal */}
                        <AnimatePresence>
                            {showConfirmationModal && (
                                <Dialog open={showConfirmationModal} onOpenChange={() => {}}>
                                    <DialogContent className="sm:max-w-md">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <DialogHeader>
                                                <DialogTitle>Payment Confirmation</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-6 pt-4">
                                                <div>
                                                    <h3 className="font-medium text-gray-900 mb-3">Contributor Information</h3>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Name</span>
                                                            <span className="font-medium">{contributionData.contributorName}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Wallet</span>
                                                            <span className="font-mono text-sm">
                                                                {identity ? identity.getPrincipal().toString().slice(0, 8) + '...' + identity.getPrincipal().toString().slice(-6) : 'Not connected'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="font-medium text-gray-900 mb-3">Payment Information</h3>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Contribution to {dao?.name || 'DAO'}</span>
                                                            <span className="font-medium">{contributionData.amount} ICP</span>
                                                        </div>
                                                        <div className="flex justify-between font-semibold text-lg border-t pt-2">
                                                            <span>Total</span>
                                                            <span>{contributionData.amount} ICP</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex space-x-3 pt-4">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowConfirmationModal(false)
                                                            setShowContributionModal(true)
                                                        }}
                                                        className="flex-1"
                                                    >
                                                        Go back
                                                    </Button>
                                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                                                        <Button 
                                                            onClick={() => handleFinalContribution(canisterId)} 
                                                            disabled={isProcessingPayment}
                                                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                                        >
                                                            {isProcessingPayment ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                'Make a contribution'
                                                            )}
                                                        </Button>
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </DialogContent>
                                </Dialog>
                            )}
                    </AnimatePresence>
                </div>
            )
}

export default TransactionPage