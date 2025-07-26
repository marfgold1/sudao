import { Proposal } from "@/types";
import { motion } from "framer-motion";
import { CircleUserRound, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export const ProposalItem: React.FC<{ proposal: Proposal }> = ({ proposal }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(proposal.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div 
            className="border-t border-gray-200 dark:border-gray-700 py-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex justify-between items-center mb-2">
                <Badge variant={proposal.status}>{proposal.status}</Badge>
                <a href="#" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">View details</a>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{proposal.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {proposal.description}
            </p>
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <CircleUserRound />
                    <span className="font-mono bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded">{proposal.id}</span>
                    <button onClick={handleCopy} title="Copy ID">
                        <Copy className="w-3.5 h-3.5 hover:text-gray-800 dark:hover:text-gray-200" />
                    </button>
                    {copied && <span className="text-green-500">Copied!</span>}
                </div>
                <span>Published {proposal.publishedDate}</span>
            </div>
        </motion.div>
    );
};