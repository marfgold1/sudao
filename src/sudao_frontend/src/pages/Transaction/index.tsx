import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  RefreshCw,
} from "lucide-react";
import { Transaction } from "@/types";
import { DAOLayout } from "@/components/DAOLayout";
import { toast } from "react-toastify";
import { useAccount, UserBalances } from "@/hooks/useAccount";
import { useAMM } from "@/hooks/useAMM";
import { useAgents } from "@/hooks/useAgents";
import { useDAO } from "@/hooks/useDAO";
// import { useTreasury } from "@/hooks/useTreasury";
import { useTransactions } from "@/hooks/useTransactions";
import { ApproveArgs } from "declarations/icp_ledger_canister/icp_ledger_canister.did";
import {
  MakeOpt,
  PrincipalReq,
  iterLinkList,
  keyVariant,
} from "@/utils/converter";
import { ApproveResult } from "declarations/sudao_ledger/sudao_ledger.did";

// All props are now handled internally by hooks - no interface needed

const TransactionContent: React.FC = () => {
  // Use hooks to get data and functionality
  const { daoInfo, deploymentInfo } = useDAO();
  const { currentAccount, getUserBalances } = useAccount();
  const { agents, canisterIds } = useAgents();
  const { fetchTransactions, loading: transactionsLoading } = useTransactions();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Fetch real ICP ledger transactions for the DAO
  React.useEffect(() => {
    const loadTransactions = async () => {
      if (!canisterIds.daoBe) return;
      
      try {
        console.log('[TransactionPage] Fetching ICP ledger transactions for DAO:', canisterIds.daoBe);
        const icpTransactions = await fetchTransactions(canisterIds.daoBe);
        setTransactions(icpTransactions);
        console.log('[TransactionPage] Loaded', icpTransactions.length, 'transactions');
      } catch (error) {
        console.error('[TransactionPage] Failed to fetch transactions:', error);
      }
    };
    
    loadTransactions();
  }, [canisterIds.daoBe, fetchTransactions]);
  const { handleGetQuote, handleSwap, tokenInfo, reserves, fetchAMMData } =
    useAMM();

  // Local state for UI
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof Transaction | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilter, setShowFilter] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "In" | "Out">("all");
  const [dateFilter, setDateFilter] = useState("");

  // Contribution modal state
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [contributionData, setContributionData] = useState({
    amount: "",
    contributorName: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    amount: "",
    contributorName: "",
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepResults, setStepResults] = useState<{
    approve?: ApproveResult;
    ammInfo?: {
      tokenInfo: unknown;
      reserves: unknown;
      is_initialized: boolean;
    };
    quote?: bigint;
    swap?: { ok?: bigint } | bigint;
    balances?: UserBalances;
  }>({});
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [contributionCompleted, setContributionCompleted] = useState(false);
  const [userBalance, setUserBalance] = useState<UserBalances | null>(null);

  // Helper functions
  const addDebugLog = useCallback((message: string) => {
    setDebugInfo((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  }, []);

  const validateForm = useCallback(() => {
    const errors = { amount: "", contributorName: "" };
    let isValid = true;

    if (!contributionData.amount || Number(contributionData.amount) < 0.001) {
      errors.amount = "Minimum amount is 0.001 ICP";
      isValid = false;
    }

    if (!contributionData.contributorName.trim()) {
      errors.contributorName = "Contributor name is required";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  }, [contributionData]);

  const handleContributionSubmit = useCallback(() => {
    if (validateForm()) {
      setShowContributionModal(false);
      setShowConfirmationModal(true);
    }
  }, [validateForm]);

  const resetContributionFlow = useCallback(() => {
    setShowConfirmationModal(false);
    setContributionData({ amount: "", contributorName: "" });
    setValidationErrors({ amount: "", contributorName: "" });
    setIsProcessingPayment(false);
    setCurrentStep(1);
    setStepResults({});
    setDebugInfo([]);
    setContributionCompleted(false);
  }, []);

  const executeStep = useCallback(
    async (step: number, _canisterId?: string, ammCanisterId?: string) => {
      if (!currentAccount || !agents.icpLedger) {
        toast.error("Wallet not connected");
        return;
      }

      addDebugLog(`Starting step ${step}`);
      setCurrentStep(step);

      try {
        switch (step) {
          case 1: {
            // Approve ICP transfer

            const canisterIdMap = deploymentInfo
              ? Object.fromEntries(
                  Array.from(iterLinkList(deploymentInfo.canisterIds)).map(
                    ([codeType, canisterId]) => [
                      keyVariant(codeType),
                      canisterId.toString(),
                    ]
                  )
                )
              : {};

            const approveArgs: ApproveArgs = {
              fee: MakeOpt(BigInt(10000)),
              memo: MakeOpt(new Uint8Array()),
              from_subaccount: MakeOpt(),
              created_at_time: MakeOpt(),
              amount: BigInt(Number(contributionData.amount) * 100000000), // Convert to e8s
              expected_allowance: MakeOpt(),
              expires_at: MakeOpt(),
              spender: {
                owner: PrincipalReq(
                  ammCanisterId ||
                    canisterIds.daoAmm ||
                    canisterIdMap.swap ||
                    ""
                ),
                subaccount: MakeOpt(),
              },
            };

            const result = await agents.icpLedgerAuth.icrc2_approve(approveArgs);
            addDebugLog(`Approve result: ${JSON.stringify(result)}`);
            setStepResults((prev) => ({ ...prev, approve: result }));
            break;
          }
          case 2: {
            // Get AMM info
            if (!agents.daoAmmAuth || !currentAccount) {
              throw new Error("AMM not available or user not authenticated");
            }
            
            const [tokenInfoResult, reservesResult] = await Promise.all([
              agents.daoAmmAuth.get_token_info(),
              agents.daoAmmAuth.get_reserves()
            ]);
            
            const ammInfo = { 
              tokenInfo: tokenInfoResult, 
              reserves: reservesResult, 
              is_initialized: true 
            };
            setStepResults((prev) => ({ ...prev, ammInfo }));
            break;
          }
          case 3: {
            // Get quote
            const quote = await handleGetQuote(
              canisterIds.icpLedger,
              BigInt(Number(contributionData.amount) * 100000000)
            );

            const quoteBigint =
              typeof quote === "object" && quote && "ok" in quote
                ? (quote.ok as bigint)
                : (quote as unknown as bigint);
            
            if (!quoteBigint || quoteBigint === BigInt(0)) {
              throw new Error("Invalid quote received");
            }
            
            setStepResults((prev) => ({
              ...prev,
              quote: quoteBigint,
            }));
            break;
          }
          case 4: {
            // Execute swap
            const swapResult = await handleSwap(
              canisterIds.icpLedger,
              BigInt(Number(contributionData.amount) * 100000000),
              BigInt(0) // minimum amount out
            );
            addDebugLog(`Swap result: ${JSON.stringify(swapResult)}`);
            // Handle swap result properly
            const swapBigint =
              typeof swapResult === "object" && swapResult && "ok" in swapResult
                ? { ok: swapResult.ok as bigint }
                : (swapResult as unknown as bigint);
            setStepResults((prev) => ({ ...prev, swap: swapBigint }));
            break;
          }
          case 5: {
            // Check balances
            const balances = await getUserBalances();
            addDebugLog(`Updated balances: ${JSON.stringify(balances)}`);
            setStepResults((prev) => ({
              ...prev,
              balances: balances || undefined,
            }));
            setContributionCompleted(true);
            toast.success("Contribution completed successfully!");
            // Refresh ICP ledger transactions after contribution
            if (canisterIds.daoBe) {
              try {
                const icpTransactions = await fetchTransactions(canisterIds.daoBe);
                setTransactions(icpTransactions);
              } catch (error) {
                console.error('Failed to refresh ICP transactions:', error);
              }
            }
            break;
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        
        // Handle specific error cases gracefully
        if (errorMessage.includes("Anonymous principal cannot approve")) {
          addDebugLog(`Step ${step} failed: Please connect your wallet to continue`);
          toast.error("Please connect your wallet to make contributions");
        } else if (errorMessage.includes("InsufficientFunds")) {
          addDebugLog(`Step ${step} failed: Insufficient balance`);
          toast.error("Insufficient ICP balance for this transaction");
        } else if (errorMessage.includes("BadFee")) {
          addDebugLog(`Step ${step} failed: Incorrect fee amount`);
          toast.error("Transaction fee error. Please try again.");
        } else {
          addDebugLog(`Step ${step} failed: ${errorMessage}`);
          toast.error(`Step ${step} failed: ${errorMessage}`);
        }
        
        throw error; // Stop execution on error
      }
    },
    [
      currentAccount,
      agents,
      contributionData,
      tokenInfo,
      reserves,
      handleGetQuote,
      handleSwap,
      getUserBalances,
      canisterIds,
      addDebugLog,
    ]
  );

  const executeAllSteps = useCallback(
    async (canisterId?: string, ammCanisterId?: string) => {
      setIsProcessingPayment(true);

      try {
        for (let step = 1; step <= 5; step++) {
          await executeStep(step, canisterId, ammCanisterId);
          // Small delay between steps
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        // Stop processing on any step failure
        console.error("Contribution flow stopped due to error:", error);
      } finally {
        setIsProcessingPayment(false);
      }
    },
    [executeStep]
  );

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRowSelect = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === paginatedTransactions.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedTransactions.map((t) => t.id));
    }
  };

  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesSearch =
        transaction.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.beneficiary
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesType =
        typeFilter === "all" || transaction.type === typeFilter;
      const matchesDate = !dateFilter || transaction.date.includes(dateFilter);
      return matchesSearch && matchesType && matchesDate;
    })
    .sort((a, b) => {
      if (!sortField) return 0;

      let aValue = a[sortField];
      let bValue = b[sortField];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortDirection === "asc" ? 1 : -1;
      if (bValue === undefined) return sortDirection === "asc" ? -1 : 1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50 mt-[4.5rem]">
      <div className="container mx-auto px-4 py-6">
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
                Support this collective by contributing directly to its on-chain
                treasury. Every contribution helps power new projects and
                community initiatives.
              </p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => {
                if (!currentAccount) {
                  toast.error(
                    "Please connect your wallet first to make a contribution"
                  );
                  return;
                }
                setShowContributionModal(true);
                // Fetch AMM data and user balance when opening contribution modal
                fetchAMMData();
                getUserBalances().then(setUserBalance);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!canisterIds.daoBe) return;
                    try {
                      const icpTransactions = await fetchTransactions(canisterIds.daoBe);
                      setTransactions(icpTransactions);
                      toast.success('Transactions refreshed');
                    } catch (error) {
                      toast.error('Failed to refresh transactions');
                    }
                  }}
                  disabled={transactionsLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${transactionsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilter(!showFilter)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {showFilter && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Type:</label>
                    <Select
                      value={typeFilter}
                      onValueChange={(value: "all" | "In" | "Out") =>
                        setTypeFilter(value)
                      }
                    >
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
                      setTypeFilter("all");
                      setDateFilter("");
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
                      checked={
                        selectedRows.length === paginatedTransactions.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("account")}
                  >
                    <div className="flex items-center gap-1">
                      Account
                      {sortField === "account" &&
                        (sortDirection === "asc" ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center gap-1">
                      Amount
                      {sortField === "amount" &&
                        (sortDirection === "asc" ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      {sortField === "type" &&
                        (sortDirection === "asc" ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("beneficiary")}
                  >
                    <div className="flex items-center gap-1">
                      Beneficiary
                      {sortField === "beneficiary" &&
                        (sortDirection === "asc" ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("address")}
                  >
                    <div className="flex items-center gap-1">
                      Address
                      {sortField === "address" &&
                        (sortDirection === "asc" ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {sortField === "date" &&
                        (sortDirection === "asc" ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        ))}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {transactionsLoading ? (
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
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-gray-500"
                      >
                        No transactions found
                      </TableCell>
                    </motion.tr>
                  ) : (
                    paginatedTransactions.map((transaction, index) => (
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
                            onCheckedChange={() =>
                              handleRowSelect(transaction.id)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm py-4">
                          {transaction.account}
                        </TableCell>
                        <TableCell className="font-semibold py-4">
                          {Number(transaction.amount) / 100000000} ICP
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            variant={
                              transaction.type === "In"
                                ? "Approved"
                                : "Rejected"
                            }
                            className={`flex items-center space-x-1 w-fit ${
                              transaction.type === "In"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
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
                        <TableCell className="py-4">
                          {transaction.beneficiary}
                        </TableCell>
                        <TableCell className="font-mono text-sm py-4">
                          {transaction.address}
                        </TableCell>
                        <TableCell className="py-4">
                          {transaction.date}
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedRows.length} of {filteredTransactions.length} row(s)
              selected.
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Rows per page</span>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(value) =>
                    setRowsPerPage(Number.parseInt(value))
                  }
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
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
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
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
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Amount (ICP) *
                    </label>
                    <Input
                      type="number"
                      value={contributionData.amount}
                      onChange={(e) => {
                        setContributionData((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }));
                        if (validationErrors.amount) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            amount: "",
                          }));
                        }
                      }}
                      placeholder="0.1"
                      className={
                        validationErrors.amount
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }
                    />
                    {validationErrors.amount && (
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors.amount}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">
                        Minimum 0.001 ICP. You will receive governance tokens
                        through AMM swap.
                      </p>
                      {userBalance && (
                        <p className="text-xs text-blue-600 font-medium">
                          Balance: {(Number(userBalance.icp) / 100000000).toFixed(4)} ICP
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Contributor Name *
                    </label>
                    <Input
                      value={contributionData.contributorName}
                      onChange={(e) => {
                        setContributionData((prev) => ({
                          ...prev,
                          contributorName: e.target.value,
                        }));
                        if (validationErrors.contributorName) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            contributorName: "",
                          }));
                        }
                      }}
                      placeholder="Your name"
                      className={
                        validationErrors.contributorName
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }
                    />
                    {validationErrors.contributorName && (
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors.contributorName}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowContributionModal(false);
                        setValidationErrors({
                          amount: "",
                          contributorName: "",
                        });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        onClick={handleContributionSubmit}
                        className="w-full bg-slate-900 hover:bg-slate-800"
                      >
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
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <DialogHeader>
                  <DialogTitle>Payment Confirmation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4 max-w-full">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">
                      Contributor Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name</span>
                        <span className="font-medium">
                          {contributionData.contributorName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Wallet</span>
                        <span
                          className="font-mono text-sm truncate max-w-xs"
                          title={currentAccount?.principal.toString()}
                        >
                          {currentAccount
                            ? currentAccount.principal.toString().slice(0, 8) +
                              "..." +
                              currentAccount.principal.toString().slice(-6)
                            : "Not connected"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">
                      Payment Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-gray-600 flex-shrink-0">
                          Contribution to{" "}
                          <span className="font-medium break-words">
                            {daoInfo?.name || "DAO"}
                          </span>
                        </span>
                        <span className="font-medium text-right flex-shrink-0">
                          {contributionData.amount} ICP
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total</span>
                        <span>{contributionData.amount} ICP</span>
                      </div>
                    </div>
                  </div>

                  {/* Unified contribution button */}
                  <div className="space-y-4">
                    <Button
                      onClick={() => {
                        if (contributionCompleted) {
                          resetContributionFlow();
                        } else {
                          executeAllSteps(
                            canisterIds.daoBe || "",
                            canisterIds.daoAmm || ""
                          );
                        }
                      }}
                      disabled={isProcessingPayment}
                      className={`w-full ${
                        contributionCompleted
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      } disabled:opacity-50`}
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing Contribution...
                        </>
                      ) : contributionCompleted ? (
                        "Contribution Complete - Close"
                      ) : (
                        "Complete Contribution"
                      )}
                    </Button>

                    {/* Progress indicator */}
                    {isProcessingPayment && (
                      <div className="text-center text-sm text-gray-600">
                        Step {currentStep} of 5:{" "}
                        {currentStep === 1 && "Approving..."}
                        {currentStep === 2 && "Checking AMM..."}
                        {currentStep === 3 && "Getting Quote..."}
                        {currentStep === 4 && "Swapping..."}
                        {currentStep === 5 && "Checking Balances..."}
                      </div>
                    )}

                    {/* Individual step buttons (for debugging) */}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500">
                        Advanced: Individual Steps
                      </summary>
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map((step) => (
                          <Button
                            key={step}
                            size="sm"
                            variant={
                              currentStep >= step ? "default" : "outline"
                            }
                            onClick={() =>
                              executeStep(
                                step,
                                canisterIds.daoBe || "",
                                canisterIds.daoAmm || ""
                              )
                            }
                            disabled={isProcessingPayment}
                            className="text-xs"
                          >
                            {step === 1 && "Approve"}
                            {step === 2 && "AMM Info"}
                            {step === 3 && "Quote"}
                            {step === 4 && "Swap"}
                            {step === 5 && "Balances"}
                          </Button>
                        ))}
                      </div>
                    </details>

                    {/* Step Results */}
                    {stepResults.approve !== undefined ? (
                      <div className="p-2 bg-green-50 rounded text-xs">
                        <strong>Approve:</strong> ✅ Success
                      </div>
                    ) : null}
                    {stepResults.ammInfo ? (
                      <div className="p-2 bg-blue-50 rounded text-xs">
                        <strong>AMM:</strong> Initialized:{" "}
                        {stepResults.ammInfo.is_initialized ? "Yes" : "No"}
                        {reserves &&
                          Array.isArray(reserves) &&
                          reserves.length >= 2 && (
                            <span>
                              , Reserves: {Number(reserves[0]).toLocaleString()}{" "}
                              ICP, {Number(reserves[1]).toLocaleString()} Gov
                            </span>
                          )}
                      </div>
                    ) : null}
                    {stepResults.quote ? (
                      <div className="p-2 bg-yellow-50 rounded text-xs">
                        <strong>Quote:</strong> {contributionData.amount} ICP →{" "}
                        {Number(stepResults.quote).toLocaleString()} Governance
                        tokens
                      </div>
                    ) : null}
                    {stepResults.swap ? (
                      <div className="p-2 bg-purple-50 rounded text-xs">
                        <strong>Swap:</strong> ✅ Received{" "}
                        {typeof stepResults.swap === "object" &&
                        stepResults.swap.ok
                          ? Number(stepResults.swap.ok).toLocaleString()
                          : "Unknown amount"}{" "}
                        governance tokens
                      </div>
                    ) : null}
                    {stepResults.balances ? (
                      <div className="p-2 bg-gray-50 rounded text-xs">
                        <strong>Balances:</strong>{" "}
                        {Number(stepResults.balances.icp).toLocaleString()} ICP,{" "}
                        {Number(
                          stepResults.balances.governance
                        ).toLocaleString()}{" "}
                        Governance
                      </div>
                    ) : null}
                  </div>

                  {/* Debug Log */}
                  {debugInfo.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-100 border rounded text-xs max-h-40 overflow-y-auto">
                      <h4 className="font-semibold mb-2 text-gray-900">
                        Debug Log:
                      </h4>
                      <div className="space-y-1">
                        {debugInfo.map((log, index) => (
                          <div
                            key={index}
                            className="text-gray-600 font-mono text-xs break-all leading-relaxed p-1 bg-white rounded border-l-2 border-gray-300"
                          >
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowConfirmationModal(false);
                        setShowContributionModal(true);
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
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

const TransactionPage: React.FC = () => {
  return (
    <DAOLayout>
      <TransactionContent />
    </DAOLayout>
  );
};

export default TransactionPage;
