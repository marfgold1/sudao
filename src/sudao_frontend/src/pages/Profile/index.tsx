import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Copy,
    Edit,
    Search,
    ArrowUpRight,
    ArrowDownLeft,
    ChevronUp,
    Filter,
    ArrowUp,
    ArrowDown,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react"
import { mockProposals, mockTransactions } from "@/mocks"
import { Proposal, Transaction } from "@/types"
import { ProposalItem } from "@/components"

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
}

export default function ProfileDashboard() {
    const [isReadMoreExpanded, setIsReadMoreExpanded] = useState(false)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [searchTerm, setSearchTerm] = useState("")
    const [dateFilter, setDateFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | 'In' | 'Out'>('all')

    const [currentPage, setCurrentPage] = useState(1)
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [sortField, setSortField] = useState<keyof Transaction | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [showFilter, setShowFilter] = useState(false)

    const transactions = mockTransactions.slice(0, 3)
    const proposals = mockProposals.slice(0, 3)

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

    const handleRowSelect = (id: string) => {
        setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
    }

    const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage)
    const startIndex = (currentPage - 1) * rowsPerPage
    const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + rowsPerPage)

    const handleSelectAll = () => {
        if (selectedRows.length === paginatedTransactions.length) {
            setSelectedRows([])
        } else {
            setSelectedRows(paginatedTransactions.map((t) => t.id))
        }
    }

    const copyAddress = (address: string) => {
        navigator.clipboard.writeText(address)
    }

    return (
        <div className="min-h-screen bg-gray-50 mt-[4.5rem]">
            <motion.div
                className="max-w-7xl mx-auto px-6 py-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Profile Section */}
                <motion.div variants={itemVariants} className="mb-8">
                    <div className="flex items-start space-x-4 mb-6">
                        <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-blue-600 text-white text-lg">ML</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900">Alisha Listya Wardhani</h1>
                                <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="text-gray-600 mb-2">
                                <p>
                                    I'm highly experienced in blockchain development and security best practices through my work at
                                    OpenZeppelin as Head of Solutions Architecture. I've worked
                                    {isReadMoreExpanded && (
                                        <span>
                                            {" "}
                                            extensively with smart contract auditing, DeFi protocols, and governance systems. My expertise
                                            includes Solidity development, security analysis, and building scalable blockchain infrastructure.
                                        </span>
                                    )}
                                </p>
                                <Button
                                    variant="link"
                                    className="p-0 h-auto text-blue-600 hover:text-blue-800"
                                    onClick={() => setIsReadMoreExpanded(!isReadMoreExpanded)}
                                >
                                    {isReadMoreExpanded ? (
                                        <>
                                            Show less <ChevronUp className="w-4 h-4 ml-1" />
                                        </>
                                    ) : (
                                        <>
                                            Read more <ChevronDown className="w-4 h-4 ml-1" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Balance Card */}
                        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                            <Card className="bg-gradient-to-br from-blue-500 to-teal-600 text-white h-full">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-blue-100">Balance</span>
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-bold">ICP</span>
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold mb-4">0 ICP</div>
                                    <div className="flex items-center space-x-2 pt-2 border-t border-white/20">
                                        <code className="text-sm font-mono px-2 py-1 rounded bg-white/10 text-blue-100">0xAbC1...7890</code>
                                        <Button variant="ghost" size="sm" onClick={() => copyAddress("0xAbC1...7890")} className="text-white hover:bg-white/10">
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Address Card */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="text-sm text-gray-600 mb-2">Voting Power</div>
                                <div className="text-3xl font-bold">2.5 ICP</div>
                            </CardContent>
                        </Card>

                        {/* About Member Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">About Member</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Address</span>
                                    <span className="text-blue-600 font-mono text-sm">0xAbC1...7890</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Account Made</span>
                                    <span className="text-blue-600">24 September 2024</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>

                {/* Past Contributions Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg shadow-sm border mb-8"
                    variants={itemVariants}
                >
                    <div className="px-6 pt-6 text-2xl font-bold">Past Contributions</div>
                    <div className="p-6 pt-4 border-b">
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
                                            <TableCell className="font-semibold py-4">{transaction.amount.toString()} ICP</TableCell>
                                            <TableCell className="py-4">
                                                <Badge
                                                    variant={transaction.type === "In" ? "Approved" : "Rejected"}
                                                    className={`flex items-center space-x-1 w-fit ${transaction.type === "In" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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

                {/* Submitted Proposals Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg shadow-sm mb-8"
                    variants={itemVariants}
                >
                    <div className="px-6 pt-6 pb-2 text-2xl font-bold">Submitted Proposals</div>
                    <div className="px-6 pb-6">
                        {proposals.length > 0 ? (
                            proposals.map((proposal: Proposal) => <ProposalItem key={proposal.id} proposal={proposal} onProposalClick={undefined} />)
                        ) : (
                            <div className="text-center py-12 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-gray-500 dark:text-gray-400">No proposals found.</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}
