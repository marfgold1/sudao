import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, RefreshCw, CheckCircle2, Hammer, XCircle, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Proposal, Status } from '@/types';
import { ProposalItem } from '@/components';
import { useAccount } from '@/hooks/useAccount';

const allStatuses: Status[] = ['Active', 'Approved', 'Rejected', 'Draft', 'Executed'];

const ProposalList: React.FC<any> = ({ proposals, onProposalClick, onCreateClick, onRefresh, filterOpen, setFilterOpen, loading, proposalState }) => {
    const { currentAccount } = useAccount();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<Record<Status, boolean>>({
        Active: false,
        Approved: false,
        Rejected: false,
        Draft: false,
        Executed: false,
    });
    
    console.log('[ProposalList] Received proposals:', proposals);
    console.log('[ProposalList] Proposals length:', proposals?.length);

    const handleFilterChange = (status: Status) => {
        setFilters(prev => ({ ...prev, [status]: !prev[status] }));
    };

    const activeFilters = useMemo(() => Object.entries(filters)
        .filter(([, isActive]) => isActive)
        .map(([status]) => status as Status), [filters]);

    const filteredProposals = useMemo(() => {
        if (!proposals || !Array.isArray(proposals)) {
            console.log('[ProposalList] No proposals or not array:', proposals);
            return [];
        }
        
        const filtered = proposals.filter((proposal: Proposal) => {
            const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  proposal.description.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesFilter = activeFilters.length === 0 || activeFilters.includes(proposal.status);

            return matchesSearch && matchesFilter;
        });
        
        console.log('[ProposalList] Filtered proposals:', filtered);
        return filtered;
    }, [proposals, searchTerm, activeFilters]);

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Main Content */}
            <main className="container mx-auto px-6 py-4">
                {/* Page Title */}
                <div className="flex items-start gap-4 mb-8">
                    <div className="w-12 h-12 flex-shrink-0 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Proposals</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                            All proposals from this collective, at a glance. Track funding requests, governance changes, and community ideas — and see how your DAO shapes its future together.
                        </p>
                    </div>
                </div>

                {/* Stat Cards */}
                <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {proposalState && [
                        { title: 'Active Proposals', value: proposalState.activeProposals.toString(), icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
                        { title: 'Approved Proposals', value: proposalState.approvedProposals.toString(), icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/50' },
                        { title: 'Rejected Proposals', value: proposalState.rejectedProposals.toString(), icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/50' },
                        { title: 'Draft', value: proposalState.draftProposals.toString(), icon: File, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' },
                        { title: 'Executed', value: proposalState.executedProposals.toString(), icon: Hammer, color: 'text-gray-500', bgColor: 'bg-gray-200 dark:bg-gray-700' },
                    ].map((card, index) => (
                        <motion.div key={index} variants={cardVariants}>
                            <Card className="bg-white dark:bg-gray-900">
                                <CardHeader className='pb-0 pt-4 flex flex-row w-full items-center justify-between'>
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</div>
                                    <div className={cn("p-1.5 rounded-md", card.bgColor)}>
                                        {React.createElement(card.icon, { className: cn("w-5 h-5", card.color) })}
                                    </div>
                                </CardHeader>
                                <CardContent className='mt-[-0.5rem]'>
                                    <p className="text-3xl font-bold">{card.value}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Latest Proposals Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-1">Latest Proposal</h3>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4 mb-4">
                            <div className="relative w-full md:w-auto md:flex-grow max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input 
                                    placeholder="Search for proposal name, identity..." 
                                    className="pl-10 dark:bg-gray-800 dark:border-gray-700"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Button variant="outline" className="gap-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setFilterOpen(!filterOpen)}>
                                        <Filter className="w-4 h-4" />
                                        Filter
                                        {activeFilters.length > 0 && <span className="ml-1 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{activeFilters.length}</span>}
                                    </Button>
                                    {filterOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }} 
                                            className="absolute top-full right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20"
                                        >
                                            <div className="p-4">
                                                <h4 className="text-sm font-semibold mb-2">Status</h4>
                                                <div className="space-y-2">
                                                    {allStatuses.map(status => (
                                                        <label key={status} className="flex items-center gap-2 text-sm cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={filters[status]}
                                                                onChange={() => handleFilterChange(status)}
                                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            {status}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                                <Button 
                                    variant="outline" 
                                    onClick={onRefresh}
                                    className="gap-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                    disabled={loading}
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                                {currentAccount && (
                                    <Button onClick={onCreateClick} className="gap-2 bg-blue-600 hover:bg-blue-700">
                                        Make a New Proposal
                                    </Button>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Proposals {filteredProposals.length}</p>
                    </div>

                    <div className="px-6 pb-6">
                        {loading ? (
                            <div className="text-center py-12 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-gray-500 dark:text-gray-400">Loading proposals...</p>
                            </div>
                        ) : filteredProposals.length > 0 ? (
                            <div className="border-t border-gray-200 dark:border-gray-700">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Proposal</th>
                                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Creator</th>
                                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Votes</th>
                                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProposals.map((proposal: Proposal) => (
                                            <ProposalItem key={proposal.id} proposal={proposal} onProposalClick={onProposalClick} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-gray-500 dark:text-gray-400">No proposals found.</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </motion.div>
    );
}

export default ProposalList;