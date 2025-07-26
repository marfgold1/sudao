import { useState } from "react"
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
} from "lucide-react"
import { Transaction } from "@/types"
import { mockTransactions } from "@/mocks"


const TransactionPage: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
    const [searchTerm, setSearchTerm] = useState("")
    const [showContributionModal, setShowContributionModal] = useState(false)
    const [showConfirmationModal, setShowConfirmationModal] = useState(false)
    const [contributionData, setContributionData] = useState({
        amount: "10",
        contributorName: "",
        walletAddress: "",
    })
    const [validationErrors, setValidationErrors] = useState({
        amount: "",
        contributorName: "",
        walletAddress: "",
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [sortField, setSortField] = useState<keyof Transaction | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [showFilter, setShowFilter] = useState(false)
    const [typeFilter, setTypeFilter] = useState<'all' | 'In' | 'Out'>('all')
    const [dateFilter, setDateFilter] = useState('')

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
            
            // Handle undefined values
            if (aValue === undefined && bValue === undefined) return 0
            if (aValue === undefined) return sortDirection === 'asc' ? 1 : -1
            if (bValue === undefined) return sortDirection === 'asc' ? -1 : 1
            
            // Convert strings to lowercase for case-insensitive comparison
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
            walletAddress: "",
        }

        // Amount validation
        if (!contributionData.amount.trim()) {
            errors.amount = "Amount is required"
        } else if (isNaN(Number(contributionData.amount)) || Number(contributionData.amount) <= 0) {
            errors.amount = "Amount must be a positive number"
        } else if (Number(contributionData.amount) < 0.001) {
            errors.amount = "Minimum amount is 0.001 ICP"
        }

        // Contributor name validation
        if (!contributionData.contributorName.trim()) {
            errors.contributorName = "Contributor name is required"
        } else if (contributionData.contributorName.trim().length < 2) {
            errors.contributorName = "Name must be at least 2 characters long"
        }

        // Wallet address validation
        if (!contributionData.walletAddress.trim()) {
            errors.walletAddress = "Wallet address is required"
        } else if (contributionData.walletAddress.trim().length < 10) {
            errors.walletAddress = "Invalid wallet address format"
        } else if (!/^[a-zA-Z0-9-]+$/.test(contributionData.walletAddress.trim())) {
            errors.walletAddress = "Wallet address contains invalid characters"
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

    const handleFinalContribution = () => {
        // Add new transaction to the list
        const newTransaction: Transaction = {
            id: Date.now().toString(),
            account: contributionData.walletAddress || "sg6tq-zia...aah-aaa",
            amount: Number.parseInt(contributionData.amount),
            type: "In",
            beneficiary: "Collective Treasury",
            address: "2vxsx-faea...aaa",
            date: new Date().toISOString().split("T")[0],
        }

        setTransactions((prev) => [newTransaction, ...prev])
        setShowConfirmationModal(false)
        setContributionData({ amount: "10", contributorName: "", walletAddress: "" })
        setValidationErrors({ amount: "", contributorName: "", walletAddress: "" })
    }

    return (
        <div className="min-h-screen bg-gray-50 mt-[4.5rem]">
            {/* Main Content */}
            <main className="container mx-auto px-10 py-8">
                {/* Organization Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Yayasan Anak Muda Indonesia</h1>
                    <p className="text-gray-600 mb-4 max-w-2xl">
                        We are dedicated to restoring coral reefs in Southeast Asia by funding local planting projects, training
                        volunteers, and building awareness in coastal communities.
                    </p>
                    <Button variant="link" className="text-blue-600 p-0 h-auto">
                        Read more
                    </Button>
                </motion.div>

                {/* Page Title */}
                <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4 mb-8">
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
                        {/* Search and Filter */}
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
                        
                        {/* Filter Panel */}
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

                    {/* Transactions Table */}
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
                                    {paginatedTransactions.map((transaction, index) => (
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

                    {/* Pagination */}
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
            </main>

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
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">Amount *</label>
                                        <Input
                                            value={contributionData.amount}
                                            onChange={(e) => {
                                                setContributionData((prev) => ({ ...prev, amount: e.target.value }))
                                                if (validationErrors.amount) {
                                                    setValidationErrors((prev) => ({ ...prev, amount: "" }))
                                                }
                                            }}
                                            placeholder="10 ICP"
                                            className={validationErrors.amount ? "border-red-500 focus:border-red-500" : ""}
                                        />
                                        {validationErrors.amount && (
                                            <p className="text-red-500 text-xs mt-1">{validationErrors.amount}</p>
                                        )}
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
                                            placeholder="Alisha Listya"
                                            className={validationErrors.contributorName ? "border-red-500 focus:border-red-500" : ""}
                                        />
                                        {validationErrors.contributorName && (
                                            <p className="text-red-500 text-xs mt-1">{validationErrors.contributorName}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">Wallet Address *</label>
                                        <Input
                                            value={contributionData.walletAddress}
                                            onChange={(e) => {
                                                setContributionData((prev) => ({ ...prev, walletAddress: e.target.value }))
                                                if (validationErrors.walletAddress) {
                                                    setValidationErrors((prev) => ({ ...prev, walletAddress: "" }))
                                                }
                                            }}
                                            placeholder="sg6tq-zia...aah-aaa"
                                            className={`font-mono text-sm ${validationErrors.walletAddress ? "border-red-500 focus:border-red-500" : ""}`}
                                        />
                                        {validationErrors.walletAddress && (
                                            <p className="text-red-500 text-xs mt-1">{validationErrors.walletAddress}</p>
                                        )}
                                    </div>
                                    <div className="flex space-x-3 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowContributionModal(false)
                                                setValidationErrors({ amount: "", contributorName: "", walletAddress: "" })
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
                                            <span className="font-medium">{contributionData.contributorName || "Alisha Listya"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Address</span>
                                            <span className="font-mono text-sm">
                                            {contributionData.walletAddress || "sg6tq-zia...aah-aaa"}
                                            </span>
                                        </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-3">Payment Information</h3>
                                        <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Contribution to Yayasan Anak Muda</span>
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
                                            <Button onClick={handleFinalContribution} className="w-full bg-blue-600 hover:bg-blue-700">
                                                Make a contribution
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