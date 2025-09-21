import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"
import ProposalList from "../ProposalList"
import ProposalDetail from "../ProposalDetail"
import ProposalCreation from "../ProposalCreation"
import { DAOLayout } from "../../components/DAOLayout"
import { useProposals } from "../../hooks/useProposals"
import { useDAORegistration } from "../../hooks/useDAORegistration"
import { usePluginRegistry } from "../../contexts/pluginRegistry/context"
import { useCanisters } from "../../contexts/canisters/context"
import { Proposal } from "../../hooks/useProposals"

const ProposalPage: React.FC = () => {
    const { daoId } = useParams<{ daoId: string }>()
    const { canisterIds } = useCanisters()
    const [currentView, setCurrentView] = useState<"list" | "detail" | "create">("list")
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
    const [editingProposal, setEditingProposal] = useState<Proposal | null>(null)
    const [filterOpen, setFilterOpen] = useState(false)
    const [showPublishConfirmation, setShowPublishConfirmation] = useState(false)


    const { registerDAO, registering } = useDAORegistration()
    const { checkPluginRegistration, updatePluginRegistration, registrationMemo } = usePluginRegistry()
    const [isRegistered, setIsRegistered] = useState<boolean | null>(null)
    const [checkingRegistration, setCheckingRegistration] = useState(true)

    // Use proposal plugin hooks
    const {
        proposals,
        loading,
        error,
        fetchProposals,
        refreshProposals,
        handleCreateProposal,
        handleVote,
        handlePublish,
        handleAddComment,
        handleRegisterDAO
    } = useProposals(daoId || null)

    // Auto-check registration on mount
    useEffect(() => {
        if (!daoId) return
        
        // Check memo first synchronously
        const cachedResult = registrationMemo[daoId]?.['proposal']
        if (cachedResult !== undefined) {
            console.log(`[ProposalPage] Using cached result: ${cachedResult}`)
            setIsRegistered(cachedResult)
            setCheckingRegistration(false)
            // Fetch proposals only if registered
            if (cachedResult) {
                fetchProposals()
            }
            return
        }
        
        // If not cached, make async call
        const checkRegistration = async () => {
            setCheckingRegistration(true)
            try {
                const registered = await checkPluginRegistration(daoId, 'proposal')
                setIsRegistered(registered)
                // Fetch proposals only if registered
                if (registered) {
                    fetchProposals()
                }
            } catch (err) {
                setIsRegistered(false)
            } finally {
                setCheckingRegistration(false)
            }
        }

        checkRegistration()
    }, [daoId, registrationMemo])



    const handleDAORegistration = async () => {
        if (!daoId || !canisterIds.daoLedger || !canisterIds.daoAmm || !canisterIds.daoBe) {
            toast.error('Missing required canister IDs for registration')
            return
        }

        try {
            await registerDAO(
                daoId,
                canisterIds.daoLedger,
                canisterIds.daoAmm,
                canisterIds.daoBe
            )
            setIsRegistered(true)
            updatePluginRegistration(daoId, 'proposal', true)
            // Now fetch proposals after successful registration
            await fetchProposals()
        } catch (err) {
            console.error('Registration failed:', err)
        }
    }

    const handleProposalClick = (proposal: Proposal) => {
        setSelectedProposal(proposal)
        setCurrentView("detail")
    }

    const handleDraftCreated = async (proposalArgs: any) => {
        try {
            const proposalId = await handleCreateProposal(proposalArgs)
            if (proposalId) {
                // Fetch the created proposal and navigate to detail view
                await fetchProposals()
                const createdProposal = proposals.find(p => p.id === proposalId)
                if (createdProposal) {
                    setSelectedProposal(createdProposal)
                    setCurrentView("detail")
                }
            }
        } catch (err) {
            console.error('Failed to create proposal:', err)
        }
        setEditingProposal(null)
    }

    const handleEditProposal = (proposal: Proposal) => {
        setEditingProposal(proposal)
        setCurrentView("create")
    }

    const handlePublishProposal = (proposal: Proposal) => {
        setSelectedProposal(proposal)
        setShowPublishConfirmation(true)
    }

    const confirmPublish = async () => {
        if (selectedProposal) {
            try {
                await handlePublish(selectedProposal.id)
                await fetchProposals()
                const updatedProposal = proposals.find(p => p.id === selectedProposal.id)
                if (updatedProposal) {
                    setSelectedProposal(updatedProposal)
                }
                setShowPublishConfirmation(false)
            } catch (err) {
                console.error('Failed to publish proposal:', err)
            }
        }
    }

    const handleCreateNew = () => {
        setEditingProposal(null)
        setCurrentView("create")
    }

    // Show registration page while checking or if not registered
    if (checkingRegistration || isRegistered === false) {
        return (
            <DAOLayout>
                <div className="container mx-auto px-6 py-8">
                    <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        {checkingRegistration ? (
                            <>
                                <h2 className="text-xl font-semibold mb-4">Checking Registration Status</h2>
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <span className="ml-3 text-gray-600 dark:text-gray-400">Verifying DAO registration...</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-semibold mb-4">Register DAO with Proposal System</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    This DAO needs to be registered with the proposal system before you can create and manage proposals.
                                </p>
                                <button
                                    onClick={handleDAORegistration}
                                    disabled={registering}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {registering ? 'Registering...' : 'Register DAO'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </DAOLayout>
        )
    }

    return (
        <DAOLayout>
            {currentView === "list" && (
                <ProposalList
                    proposals={proposals}
                    onProposalClick={handleProposalClick}
                    onCreateClick={handleCreateNew}
                    onRefresh={refreshProposals}
                    filterOpen={filterOpen}
                    setFilterOpen={setFilterOpen}
                    loading={loading}
                />
            )}

            {currentView === "detail" && selectedProposal && (
                <ProposalDetail 
                    proposal={selectedProposal} 
                    onBack={() => setCurrentView("list")}
                    onEdit={handleEditProposal}
                    onPublish={handlePublishProposal}
                    onVote={handleVote}
                    onAddComment={handleAddComment}
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

            {error && (
                <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
                    Error: {error}
                </div>
            )}
        </DAOLayout>
    )
}

export default ProposalPage