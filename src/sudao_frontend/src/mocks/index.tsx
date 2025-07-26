import { Proposal } from "@/types";
import { CheckCircle2, FileText, Hammer, XCircle, File } from "lucide-react";

export const mockProposals: Proposal[] = [
    {
        id: 'pjjjw-4laaa-aaa-aaa-cai',
        title: 'Restoration Workshop for Local Fishermen in Lombok',
        description: 'This proposal aims to organize a hands-on coral restoration workshop for local fishermen in Lombok this August. The workshop will include training on sustainable fishing practices, coral gardening techniques, and marine ecosystem awareness....',
        status: 'Approved',
        publishedDate: '22 April 2025',
        deadline: '25 December 2025',
        votes: 73,
        fundingAmount: 252,
    },
    {
        id: 'abcde-1fghi-2jklm-3nopq',
        title: 'Develop a New Governance Staking Module',
        description: 'Proposal to fund the development of a new staking module that allows for more flexible governance participation and reward distribution. This will enhance decentralization and community engagement.',
        status: 'Active',
        publishedDate: '15 May 2025',
        deadline: '25 December 2025',
        votes: 73,
        fundingAmount: 252,
    },
    {
        id: 'rstuv-5wxyz-6abcd-7efgh',
        title: 'Community Marketing Initiative for Q3 2025',
        description: 'Funding request for a community-led marketing campaign to increase brand awareness and user adoption in the Asian market. Focus on social media, content creation, and local meetups.',
        status: 'Rejected',
        publishedDate: '10 April 2025',
        deadline: '25 December 2025',
        votes: 73,
        fundingAmount: 252,
    },
    {
        id: 'ijklm-9nopq-0rstu-1vwxy',
        title: 'Integration with Solar DEX Aggregator',
        description: 'Technical proposal to integrate our protocol with the Solar DEX aggregator, aiming to increase liquidity and provide users with better trading rates. Includes audit and development costs.',
        status: 'Executed',
        publishedDate: '01 March 2025',
        deadline: '25 December 2025',
        votes: 73,
        fundingAmount: 252,
    },
    {
        id: 'zabcd-3efgh-4ijkl-5mnop',
        title: 'UI/UX Redesign for the Main Dashboard',
        description: 'A draft proposal for a complete overhaul of the main user dashboard to improve user experience, streamline workflows, and introduce a new, modern design system.',
        status: 'Draft',
        publishedDate: '28 May 2025',
        deadline: '25 December 2025',
        votes: 73,
        fundingAmount: 252,
    },
];

export const statCards = [
    { title: 'Active Proposals', value: '234', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
    { title: 'Approved Proposals', value: '78', icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/50' },
    { title: 'Rejected Proposals', value: '30', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/50' },
    { title: 'Draft', value: '10', icon: File, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' },
    { title: 'Executed', value: '5', icon: Hammer, color: 'text-gray-500', bgColor: 'bg-gray-200 dark:bg-gray-700' },
];