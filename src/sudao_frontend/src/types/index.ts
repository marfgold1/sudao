// Frontend-related Types
// Proposal Page
export type Status = 'Active' | 'Approved' | 'Rejected' | 'Draft' | 'Executed';

export interface Proposal {
    id: string;
    title: string;
    description: string;
    status: Status;
    publishedDate: string;
    deadline: string;
    votes: number;
    fundingAmount: number;
}

// Trnsaction Page
export interface Transaction {
    id: string
    account: string
    amount: bigint
    type: "In" | "Out"
    beneficiary: string
    address: string
    date: string
    selected?: boolean
}

// Backend-related Types
// Requests and Responses