import { Plugin } from '@/lib/plugin-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Vote, Clock, CheckCircle, XCircle, Users } from 'lucide-react';

interface ProposalPluginPageProps {
    plugin: Plugin;
}

// Mock proposal data
const mockProposals = [
    {
        id: 1,
        title: "Increase Community Development Budget",
        description: "Proposal to increase the community development budget by 25% to support more community-driven projects and initiatives.",
        status: "active",
        votesFor: 156,
        votesAgainst: 23,
        totalVotes: 179,
        deadline: "2024-01-20",
        proposer: "Alice Johnson"
    },
    {
        id: 2,
        title: "Implement New Staking Mechanism",
        description: "Introduction of a new staking mechanism that allows members to earn rewards for long-term participation in governance.",
        status: "passed",
        votesFor: 234,
        votesAgainst: 45,
        totalVotes: 279,
        deadline: "2024-01-15",
        proposer: "Bob Smith"
    },
    {
        id: 3,
        title: "Partnership with DeFi Protocol",
        description: "Strategic partnership proposal with a leading DeFi protocol to expand our ecosystem and provide more utility to token holders.",
        status: "rejected",
        votesFor: 89,
        votesAgainst: 167,
        totalVotes: 256,
        deadline: "2024-01-10",
        proposer: "Carol Davis"
    }
];

export const ProposalPluginPage: React.FC<ProposalPluginPageProps> = ({ plugin }) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <Clock className="w-5 h-5 text-yellow-600" />;
            case 'passed':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <Clock className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-yellow-100 text-yellow-800';
            case 'passed':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Plugin Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        {plugin.icon && (
                            <img src={plugin.icon} alt={plugin.name} className="w-16 h-16 rounded-lg" />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{plugin.name}</h1>
                            <p className="text-gray-600">Participate in community governance</p>
                        </div>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Vote className="w-4 h-4 mr-2" />
                        Create Proposal
                    </Button>
                </div>

                {/* Proposals List */}
                <div className="space-y-6">
                    {mockProposals.map((proposal) => (
                        <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getStatusIcon(proposal.status)}
                                            <CardTitle className="text-xl hover:text-blue-600 cursor-pointer">
                                                {proposal.title}
                                            </CardTitle>
                                            <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(proposal.status)}`}>
                                                {proposal.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-3">
                                            Proposed by {proposal.proposer} • Deadline: {new Date(proposal.deadline).toLocaleDateString()}
                                        </p>
                                        <p className="text-gray-700 mb-4">
                                            {proposal.description}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Voting Stats */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <span className="text-green-700 font-semibold">{proposal.votesFor} For</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <XCircle className="w-5 h-5 text-red-600" />
                                            <span className="text-red-700 font-semibold">{proposal.votesAgainst} Against</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-5 h-5 text-gray-600" />
                                            <span className="text-gray-700">{proposal.totalVotes} Total Votes</span>
                                        </div>
                                    </div>
                                    {proposal.status === 'active' && (
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                                                Vote Against
                                            </Button>
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                                Vote For
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                    <div 
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                        style={{ width: `${(proposal.votesFor / proposal.totalVotes) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>{((proposal.votesFor / proposal.totalVotes) * 100).toFixed(1)}% approval</span>
                                    <span>{proposal.totalVotes} votes cast</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProposalPluginPage;