import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, FileText, HomeIcon, Puzzle, Store, User, ChevronDown, ChevronRight, Menu, LayoutList } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePluginStore } from "@/lib/plugin-store";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sidebarItems = [
    { icon: CreditCard, label: "Transactions", path: "transactions" },
];

const pluginItems = [
    { icon: Puzzle, label: "Installed Plugins", path: "plugins/installed" },
    { icon: Store, label: "Plugin Marketplace", path: "plugins/marketplace" },
];

const CreatorDashboardSidebar: React.FC = () => {
    const { daoId } = useParams();
    const location = useLocation();
    const pathname = location.pathname;

    const plugins = usePluginStore((state) => state.plugins);
    const [isMyPagesOpen, setIsMyPagesOpen] = useState(false);

    const myPagesPlugins = useMemo(() => plugins.filter((plugin) => plugin.showInMyPages), [plugins]);

    const totalPages = useMemo(
        () => sidebarItems.length + myPagesPlugins.length + 1, // +1 for Home
        [myPagesPlugins.length],
    );

    return (
        <aside className="w-64 bg-slate-100 border-r border-sidebar-border">
            <div className="p-4 space-y-1">
                {/* Creator Dashboard Link */}
                <div className="mb-1">
                    <Link to={`/dao/${daoId}/creator-dashboard`} className="block">
                        <Button variant="ghost" className="w-full justify-start text-blue-500 hover:bg-blue-700/10">
                            <Menu className="w-4 h-4 mr-2" />
                            Creator Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Public Profile Link */}
                <div className="mb-4">
                    {/* Using a standard <a> tag for external navigation */}
                    <a href={`/dao/${daoId}/home`} className="block">
                        <Button variant="ghost" className="w-full justify-between text-muted-foreground hover:bg-accent">
                        <div className="flex items-center">
                            <User className="w-4 h-4 mr-4" />
                            Public Profile
                        </div>
                        <ChevronRight className="w-4 h-4" />
                        </Button>
                    </a>
                </div>

                {/* My Pages Section */}
                <div className="mb-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-between text-muted-foreground hover:bg-accent"
                        onClick={() => setIsMyPagesOpen(!isMyPagesOpen)}
                    >
                        <div className="flex items-center">
                            <LayoutList className="w-4 h-4 mr-4" />
                            My Pages
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.div animate={{ rotate: isMyPagesOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                <ChevronDown className="w-4 h-4" />
                            </motion.div>
                            <Badge variant="secondary" className="bg-blue-950 text-white rounded-2xl hover:bg-blue-950">{totalPages}</Badge>
                        </div>
                    </Button>

                    <AnimatePresence>
                        {isMyPagesOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="ml-6 mt-1 space-y-1">
                                    {/* Home Link (using a Link instead of a disabled button) */}
                                    <Link to={`/dao/${daoId}/creator-dashboard`} className="block">
                                        <Button
                                            variant="ghost"
                                            disabled={true}
                                            className={cn(
                                            "w-full justify-start",
                                            pathname === `/dao/${daoId}/creator-dashboard`
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                            )}
                                        >
                                            <HomeIcon className="w-4 h-4 mr-2" />
                                            Home
                                        </Button>
                                    </Link>

                                    {/* Sidebar Items */}
                                    {sidebarItems.map((item) => (
                                        <Link key={item.path} to={`/dao/${daoId}/creator-dashboard/${item.path}`} className="block">
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "w-full justify-start",
                                                    pathname === `/dao/${daoId}/creator-dashboard/${item.path}`
                                                    ? "bg-accent text-accent-foreground"
                                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                                )}
                                            >
                                                <item.icon className="w-4 h-4 mr-2" />
                                                {item.label}
                                            </Button>
                                        </Link>
                                    ))}

                                    {/* Plugin Items */}
                                    {myPagesPlugins.map((plugin) => (
                                        <Link key={plugin.id} to={`/dao/${daoId}/creator-dashboard/${plugin.id}`} className="block">
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "w-full justify-start",
                                                    pathname === `/dao/${daoId}/creator-dashboard/${plugin.id}`
                                                    ? "bg-accent text-accent-foreground"
                                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                                )}
                                            >
                                                <FileText className="w-4 h-4 mr-2" />
                                                {plugin.name}
                                            </Button>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Plugin Management Section */}
                {pluginItems.map((item) => (
                    <Link key={item.path} to={`/dao/${daoId}/creator-dashboard/${item.path}`} className="block">
                        <Button
                            variant="ghost"
                            className={cn(
                            "w-full justify-start",
                            pathname.startsWith(`/dao/${daoId}/creator-dashboard/${item.path}`)
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                            )}
                        >
                            <item.icon className="w-4 h-4 mr-2" />
                            {item.label}
                        </Button>
                    </Link>
                ))}
            </div>
        </aside>
    );
}

export default CreatorDashboardSidebar;