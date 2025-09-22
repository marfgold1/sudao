import { motion } from "framer-motion";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";

const CreatorDashboard: React.FC = () => {
    const { daoId } = useParams<{ daoId: string }>();
    
    const quickActions = [
        {
            title: "Manage Transactions",
            href: `/dao/${daoId}/creator-dashboard/transaction`,
            description: "View and manage all treasury transactions",
        },
        {
            title: "Review Proposals",
            href: `/dao/${daoId}/creator-dashboard/proposal`,
            description: "Track and manage community proposals",
        },
        {
            title: "Plugin Marketplace",
            href: `/dao/${daoId}/creator-dashboard/plugins/marketplace`,
            description: "Discover and install new plugins",
        },
        {
            title: "Installed Plugins",
            href: `/dao/${daoId}/creator-dashboard/plugins/installed`,
            description: "Manage your active plugins",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-balance">Creator Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your DAO, track performance, and engage with your community
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickActions.map((action, index) => (
                        <motion.div
                            key={action.title}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link to={action.href}> {/* Use 'to' prop instead of 'href' */}
                                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">{action.title}</CardTitle>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                        </div>
                                        <CardDescription>{action.description}</CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CreatorDashboard;