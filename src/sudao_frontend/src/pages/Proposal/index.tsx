import { useState } from "react"
import ProposalList from "../ProposalList"
import ProposalDetail from "../ProposalDetail"
import { mockProposals } from "@/mocks"
import ProposalCreation from "../ProposalCreation"
import { Proposal } from "@/types"

export default function HomePage() {
    const [currentView, setCurrentView] = useState<"list" | "detail" | "create">("list")
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
    const [editingProposal, setEditingProposal] = useState<Proposal | null>(null)
    const [proposals, setProposals] = useState<Proposal[]>(mockProposals)
    const [filterOpen, setFilterOpen] = useState(false)
    const [showPublishConfirmation, setShowPublishConfirmation] = useState(false)

    const handleProposalClick = (proposal: Proposal) => {
        setSelectedProposal(proposal)
        setCurrentView("detail")
    }

    const handleDraftCreated = (proposal: Proposal) => {
        // Add or update proposal in the list
        if (editingProposal) {
            // Update existing proposal
            setProposals(prev => prev.map(p => p.id === proposal.id ? proposal : p))
        } else {
            // Add new proposal
            setProposals(prev => [...prev, proposal])
        }
        
        // Navigate to detail view
        setSelectedProposal(proposal)
        setEditingProposal(null)
        setCurrentView("detail")
    }

    const handleEditProposal = (proposal: Proposal) => {
        setEditingProposal(proposal)
        setCurrentView("create")
    }

    const handlePublishProposal = (proposal: Proposal) => {
        setSelectedProposal(proposal)
        setShowPublishConfirmation(true)
    }

    const confirmPublish = () => {
        if (selectedProposal) {
            const publishedProposal = { ...selectedProposal, status: 'Active' as const }
            setProposals(prev => prev.map(p => p.id === selectedProposal.id ? publishedProposal : p))
            setSelectedProposal(publishedProposal)
            setShowPublishConfirmation(false)
        }
    }

    const handleCreateNew = () => {
        setEditingProposal(null)
        setCurrentView("create")
    }

    return (
        <div className="min-h-screen bg-gray-50 mt-[4.5rem]">
            <div className="container mx-auto px-4 py-6">
                {currentView === "list" && (
                    <ProposalList
                        proposals={proposals}
                        onProposalClick={handleProposalClick}
                        onCreateClick={handleCreateNew}
                        filterOpen={filterOpen}
                        setFilterOpen={setFilterOpen}
                    />
                )}

                {currentView === "detail" && selectedProposal && (
                    <ProposalDetail 
                        proposal={selectedProposal} 
                        onBack={() => setCurrentView("list")}
                        onEdit={handleEditProposal}
                        onPublish={handlePublishProposal}
                    />
                )}

                {currentView === "create" && (
                    <ProposalCreation 
                        onBack={() => {
                            setEditingProposal(null)
                            setCurrentView("list")
                        }}
                        onDraftCreated={handleDraftCreated}
                        editingProposal={editingProposal}
                    />
                )}

                {/* Publish Confirmation Modal */}
                {showPublishConfirmation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-2">Publish Proposal</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Are you sure you want to publish this proposal?
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                                Once published, the proposal will be active and members can vote on it.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowPublishConfirmation(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmPublish}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Publish
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}