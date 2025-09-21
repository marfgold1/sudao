import { Plugin } from '@/lib/plugin-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, ExternalLink } from 'lucide-react';

interface LatestNewsPageProps {
    plugin: Plugin;
}

// Mock news data
const mockNews = [
    {
        id: 1,
        title: "New Governance Proposal: Community Treasury Allocation",
        content: "The community has proposed a new treasury allocation strategy to better support community-driven initiatives. This proposal aims to distribute funds more equitably across different project categories.",
        author: "DAO Governance Team",
        date: "2024-01-15",
        category: "Governance"
    },
    {
        id: 2,
        title: "Platform Upgrade: Enhanced Security Features",
        content: "We're excited to announce the latest platform upgrade that includes enhanced security features, improved user authentication, and better transaction monitoring capabilities.",
        author: "Development Team",
        date: "2024-01-12",
        category: "Development"
    },
    {
        id: 3,
        title: "Community Milestone: 1000+ Active Members!",
        content: "Our community has reached an incredible milestone of over 1000 active members! Thank you to everyone who has contributed to making this DAO a thriving ecosystem.",
        author: "Community Manager",
        date: "2024-01-10",
        category: "Community"
    }
];

export const LatestNewsPage: React.FC<LatestNewsPageProps> = ({ plugin }) => {
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
                        <p className="text-gray-600">Stay updated with the latest community news</p>
                    </div>
                </div>

                {/* News Articles */}
                <div className="space-y-6">
                    {mockNews.map((article) => (
                        <Card key={article.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl mb-2 hover:text-blue-600 cursor-pointer">
                                            {article.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                {article.author}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(article.date).toLocaleDateString()}
                                            </div>
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                                {article.category}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-blue-600 transition-colors">
                                        <ExternalLink className="w-5 h-5" />
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 leading-relaxed">
                                    {article.content}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Load More Button */}
                <div className="text-center mt-8">
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Load More News
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LatestNewsPage;