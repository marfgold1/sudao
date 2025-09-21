import { Proposal } from "@/types";
import { CircleUserRound, Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import { useState } from "react";

export const ProposalItem: React.FC<{ proposal: Proposal, onProposalClick: any }> = ({ proposal, onProposalClick }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(proposal.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <TableRow 
            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
            onClick={() => onProposalClick(proposal)}
        >
            <TableCell className="font-medium">
                <div className="flex flex-col gap-1">
                    <span className="font-semibold">{proposal.title}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {proposal.description}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <Badge variant={proposal.status}>{proposal.status}</Badge>
            </TableCell>
            <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <CircleUserRound className="w-4 h-4" />
                    <span className="font-mono text-xs">
                        {proposal.creator.slice(0, 8)}...{proposal.creator.slice(-4)}
                    </span>
                </div>
            </TableCell>
            <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                {proposal.publishedDate}
            </TableCell>
            <TableCell className="text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">{proposal.yesVotes}</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-red-600 dark:text-red-400">{proposal.noVotes}</span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleCopy} 
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Copy ID"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    {copied && <span className="text-green-500 text-xs">Copied!</span>}
                </div>
            </TableCell>
        </TableRow>
    );
};