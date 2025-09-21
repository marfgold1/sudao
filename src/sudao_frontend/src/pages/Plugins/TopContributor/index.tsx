import { Plugin } from '@/lib/plugin-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star, TrendingUp, Award } from 'lucide-react';

interface TopContributorPageProps {
    plugin: Plugin;
}

// Mock contributor data
const mockContributors = [
    {
        id: 1,
        name: "Alice Johnson",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b2ab?w=64&h=64&fit=crop&crop=face",
        contributions: 156,
        rank: 1,
        category: "Governance"
    },
    {
        id: 2,
        name: "Bob Smith",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
        contributions: 134,
        rank: 2,
        category: "Development"
    },
    {
        id: 3,
        name: "Carol Davis",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
        contributions: 112,
        rank: 3,
        category: "Community"
    }
];

export const TopContributorPage: React.FC<TopContributorPageProps> = ({ plugin }) => {
    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-6 h-6 text-yellow-500" />;
            case 2:
                return <Award className="w-6 h-6 text-gray-400" />;
            case 3:
                return <Award className="w-6 h-6 text-amber-600" />;
            default:
                return <Star className="w-6 h-6 text-blue-500" />;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Plugin Header */}
                <div className="flex items-center gap-4 mb-8">
                    {plugin.icon && (
                        <img src={plugin.icon} alt={plugin.name} className="w-16 h-16 rounded-lg" />
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{plugin.name}</h1>
                        <p className="text-gray-600">Recognize the most active community members</p>
                    </div>
                </div>

                {/* Top Contributors */}
                <div className="space-y-4">
                    {mockContributors.map((contributor) => (
                        <Card key={contributor.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            {getRankIcon(contributor.rank)}
                                            <span className="text-2xl font-bold text-gray-700">#{contributor.rank}</span>
                                        </div>
                                        <img 
                                            src={contributor.avatar} 
                                            alt={contributor.name}
                                            className="w-12 h-12 rounded-full"
                                        />
                                        <div>
                                            <h3 className="font-semibold text-lg">{contributor.name}</h3>
                                            <p className="text-gray-600">{contributor.category} Contributor</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                            <span className="text-2xl font-bold text-green-600">{contributor.contributions}</span>
                                        </div>
                                        <p className="text-sm text-gray-500">contributions</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Stats Card */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-blue-600" />
                            Contribution Statistics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">402</div>
                                <div className="text-gray-600">Total Contributions</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">23</div>
                                <div className="text-gray-600">Active Contributors</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600">134</div>
                                <div className="text-gray-600">This Month</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TopContributorPage;