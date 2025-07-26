// Frontend-related Types
// Proposal Page
export type Status = 'Active' | 'Approved' | 'Rejected' | 'Draft' | 'Executed';

export interface Proposal {
    id: string;
    title: string;
    description: string;
    status: Status;
    publishedDate: string;
}

// Backend-related Types
// Requests and Responses