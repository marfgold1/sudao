import { Proposal, Transaction } from "@/types";
import { CheckCircle2, FileText, Hammer, XCircle, File } from "lucide-react";

// Proposals
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
    {
        id: 'draft-example-001',
        title: 'Mobile App Development for Community Engagement',
        description: 'This is a draft proposal for developing a mobile application to enhance community engagement and participation in environmental conservation activities. The app will feature tracking, gamification, and social sharing capabilities.',
        status: 'Draft',
        publishedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        deadline: '25 December 2025',
        votes: 0,
        fundingAmount: 500,
    },
];

export const statCards = [
    { title: 'Active Proposals', value: '234', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
    { title: 'Approved Proposals', value: '78', icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/50' },
    { title: 'Rejected Proposals', value: '30', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/50' },
    { title: 'Draft', value: '10', icon: File, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' },
    { title: 'Executed', value: '5', icon: Hammer, color: 'text-gray-500', bgColor: 'bg-gray-200 dark:bg-gray-700' },
];

export const members = [
    {
        id: 1,
        name: "Alisha Listya",
        address: "h3b5k-c2a...aad-aaa",
        avatar: "CN",
        isCurrentUser: true,
    },
    {
        id: 2,
        name: "Alisha Listya",
        address: "h3b5k-c2a...aad-aaa",
        avatar: "CN",
        isCurrentUser: false,
    },
    {
        id: 3,
        name: "Alisha Listya",
        address: "h3b5k-c2a...aad-aaa",
        avatar: "CN",
        isCurrentUser: false,
    },
]

// Transaction

export const mockTransactions: Transaction[] = [
    {
        id: "1",
        account: "2vxsx-fae...aaa-aaa",
        amount: 10,
        type: "Out",
        beneficiary: "Michael Donner",
        address: "rwlgt-iia...aai-aaa",
        date: "2024-06-11",
    },
    {
        id: "2",
        account: "rwlgt-iia...aal-aaa",
        amount: 80,
        type: "In",
        beneficiary: "Collective Treasury",
        address: "2vxsx-faea...aaa",
        date: "2024-06-10",
    },
    {
        id: "3",
        account: "pjlw-4la...aac-aaa",
        amount: 80,
        type: "Out",
        beneficiary: "Austin Ridge",
        address: "jv6dk-hya...aaa",
        date: "2024-06-09",
    },
    {
        id: "4",
        account: "h3b5k-c2a...aad-aaa",
        amount: 80,
        type: "Out",
        beneficiary: "Amar Lombardi",
        address: "2vxsx-faea...aaa",
        date: "2024-06-08",
    },
    {
        id: "5",
        account: "jv6dk-hya...aae-aaa",
        amount: 80,
        type: "Out",
        beneficiary: "Kenneth Spikes",
        address: "h3b5k-c2a...aad",
        date: "2024-06-07",
    },
    {
        id: "6",
        account: "o7h6t-lia...aaf-aaa",
        amount: 80,
        type: "In",
        beneficiary: "Collective Treasury",
        address: "2vxsx-faea...aaa",
        date: "2024-06-06",
    },
    {
        id: "7",
        account: "sg6tq-zia...aah-aaa",
        amount: 80,
        type: "In",
        beneficiary: "Collective Treasury",
        address: "2vxsx-faea...aaa",
        date: "2024-06-05",
    },
    {
        id: "8",
        account: "TASK-7184",
        amount: 80,
        type: "In",
        beneficiary: "Collective Treasury",
        address: "2vxsx-faea...aaa",
        date: "2024-06-03",
    },
    {
        id: "9",
        account: "TASK-5160",
        amount: 80,
        type: "In",
        beneficiary: "Collective Treasury",
        address: "2vxsx-faea...aaa",
        date: "2024-06-03",
    },
]

// Discover Collective
export const userCollectives = [
    {
        id: "yh1",
        name: "Yayasan HMIF",
        description:
        "Transforming city rooftops and abandoned lots into lush community gardens and green spaces for sustainable urban living.",
        avatar: "/placeholder.svg?height=40&width=40&text=YH",
        members: 410,
        tags: ["Urban", "Gardening", "Sustainability"],
        isOwned: true,
    },
]

export const discoverCollectives = [
    {
        id: "art-change",
        name: "Art for Change Network",
        description:
        "Uniting artists worldwide to fund public art projects and social campaigns that inspire positive change in communities.",
        avatar: "/placeholder.svg?height=40&width=40&text=AC",
        members: 720,
        tags: ["Art", "Activism", "Community"],
        category: "Art & Culture",
    },
    {
        id: "farmers-future",
        name: "Farmers for Future",
        description:
        "Supporting regenerative agriculture projects and providing training to small farmers for sustainable food production.",
        avatar: "/placeholder.svg?height=40&width=40&text=FF",
        members: 520,
        tags: ["Agriculture", "Sustainability", "Climate"],
        category: "Environment",
    },
    {
        id: "blue-ocean",
        name: "Blue Ocean Watch",
        description: "Funding marine conservation missions and citizen-led ocean cleanups around the world.",
        avatar: "/placeholder.svg?height=40&width=40&text=BO",
        members: 950,
        tags: ["Ocean", "Conservation", "Cleanups"],
        category: "Environment",
    },
    {
        id: "renewable-hub",
        name: "Renewable Innovators Hub",
        description: "Accelerating community-led renewable energy projects and local green tech startups.",
        avatar: "/placeholder.svg?height=40&width=40&text=RI",
        members: 840,
        tags: ["Energy", "Innovation", "Climate"],
        category: "Technology",
    },
    {
        id: "coral-revival",
        name: "Coral Revival Collective",
        description:
        "Dedicated to restoring coral reefs across Southeast Asia through large-scale restoration and community education programs.",
        avatar: "/placeholder.svg?height=40&width=40&text=CR",
        members: 46,
        tags: ["Environment", "Restoration", "Ocean"],
        category: "Environment",
    },
    {
        id: "urban-greenmakers",
        name: "Urban Greenmakers",
        description:
        "Transforming city rooftops and abandoned lots into lush community gardens and green spaces for sustainable urban living.",
        avatar: "/placeholder.svg?height=40&width=40&text=UG",
        members: 410,
        tags: ["Urban", "Gardening", "Sustainability"],
        category: "Environment",
    },
    {
        id: "women-tech",
        name: "Women in Tech Connect",
        description: "Empowering women in tech through mentorship, workshops, and funding for groundbreaking projects.",
        avatar: "/placeholder.svg?height=40&width=40&text=WT",
        members: 950,
        tags: ["Technology", "Diversity", "Education"],
        category: "Technology",
    },
    {
        id: "open-school",
        name: "Open School Alliance",
        description:
        "Building free, open-source educational materials and supporting local teachers in underserved communities.",
        avatar: "/placeholder.svg?height=40&width=40&text=OS",
        members: 360,
        tags: ["Education", "Open-Source", "Community"],
        category: "Education",
    },
]

export const floatingCards = [
    { id: 1, x: 100, y: 80, delay: 0 },
    { id: 2, x: 200, y: 110, delay: 0.2 },
    { id: 3, x: 300, y: 90, delay: 0.4 },
    { id: 4, x: 400, y: 120, delay: 0.6 },
    { id: 5, x: 500, y: 100, delay: 0.8 },
    { id: 6, x: 600, y: 115, delay: 1.0 },
    { id: 7, x: 700, y: 85, delay: 1.2 },
]