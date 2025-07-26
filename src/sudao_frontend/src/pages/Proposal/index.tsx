import { useState } from "react"
import ProposalList from "../ProposalList"
import ProposalDetail from "../ProposalDetail"
import { mockProposals } from "@/mocks"

export default function HomePage() {
    const [currentView, setCurrentView] = useState<"list" | "detail" | "create">("list")
    const [selectedProposal, setSelectedProposal] = useState<any>(null)
    const [filterOpen, setFilterOpen] = useState(false)

    const handleProposalClick = (proposal: any) => {
        setSelectedProposal(proposal)
        setCurrentView("detail")
    }

    return (
        <div className="min-h-screen bg-gray-50 mt-[4.5rem]">
            <div className="container mx-auto px-4 py-6">
                {currentView === "list" && (
                    <ProposalList
                        proposals={mockProposals}
                        onProposalClick={handleProposalClick}
                        onCreateClick={() => setCurrentView("create")}
                        filterOpen={filterOpen}
                        setFilterOpen={setFilterOpen}
                    />
                )}

                {currentView === "detail" && selectedProposal && (
                    <ProposalDetail proposal={selectedProposal} onBack={() => setCurrentView("list")} />
                )}

                {/* {currentView === "create" && <CreateProposal onBack={() => setCurrentView("list")} />} */}
            </div>
        </div>
    )
}