import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb } from "@/layouts";
import { PluginDetailModal, PluginCard } from "@/components/Plugins";
import { usePluginStore } from "@/lib/plugin-store";
import { Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";

export default function PluginMarketplacePage() {
    const { daoId } = useParams(); // Get the dynamic DAO ID from the URL
    const { plugins, installPlugin, uninstallPlugin } = usePluginStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("All Plugins");
    const [selectedPlugin, setSelectedPlugin] = useState<any>();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Adjust breadcrumb items to use dynamic paths for react-router-dom
    const breadcrumbItems = [
        { label: "Creator Dashboard", href: `/dao/${daoId}/creator-dashboard` },
        { label: "Plugin Marketplace" },
    ];

    const handleInstallPlugin = (id: any) => {
        installPlugin(id);
        setIsModalOpen(false);
    };

    const handleUninstallPlugin = (id: any) => {
        uninstallPlugin(id);
        setIsModalOpen(false);
    };

    const handlePluginClick = (id: any) => {
        const plugin = plugins.find((p) => p.id === id);
        if (plugin) {
            setSelectedPlugin(plugin);
            setIsModalOpen(true);
        }
    };

    // Use useMemo to filter plugins for performance
    const filteredPlugins = useMemo(() => {
        const searchFiltered = plugins.filter((plugin) =>
            plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filter === "All Plugins") {
            return searchFiltered;
        }
        if (filter === "Installed Plugins") {
            return searchFiltered.filter(plugin => plugin.installed);
        }
        
        return searchFiltered;
    }, [plugins, searchTerm, filter]);

    return (
        <div className="space-y-6">
            <Breadcrumb items={breadcrumbItems} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold">Plugin Marketplace</h1>
            </motion.div>

            <div className="flex items-center justify-between">
                <Input
                    placeholder="Search for plugins..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All Plugins">All Plugins</SelectItem>
                            <SelectItem value="Installed Plugins">Installed Plugins</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPlugins.map((plugin, index) => (
                    <motion.div
                        key={plugin.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <PluginCard
                            plugin={plugin}
                            onInstall={handleInstallPlugin}
                            onUninstall={handleUninstallPlugin}
                            onClick={handlePluginClick}
                            variant="marketplace"
                        />
                    </motion.div>
                ))}
            </div>

            <PluginDetailModal
                plugin={selectedPlugin}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onInstall={handleInstallPlugin}
                onUninstall={handleUninstallPlugin}
            />
        </div>
    );
}
