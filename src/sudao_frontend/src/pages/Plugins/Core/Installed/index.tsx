import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/layouts";
import { InstalledPluginsTable, PluginDetailModal, ConfirmationModal } from "@/components/Plugins";
import { usePluginStore } from "@/lib/plugin-store";
import { Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function InstalledPluginsPage() {
    const { daoId } = useParams(); // Get the dynamic DAO ID from the URL
    const { plugins, togglePlugin, uninstallPlugin, loadingPlugins } = usePluginStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedPlugin, setSelectedPlugin] = useState<any>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pluginToUninstall, setPluginToUninstall] = useState<any>(null);

    const installedPlugins = useMemo(() => plugins.filter((plugin) => plugin.installed), [plugins]);

    // Adjust breadcrumb items to use dynamic paths for react-router-dom
    const breadcrumbItems = [
        { label: "Creator Dashboard", href: `/dao/${daoId}/creator-dashboard` },
        { label: "Installed Plugins" },
    ];

    const handleTogglePlugin = (id: any, enabled: boolean) => {
        togglePlugin(id, enabled);
    };

    const handleUninstallRequest = (id: any) => {
        const plugin = plugins.find((p) => p.id === id);
        if (plugin) {
            setPluginToUninstall(plugin);
            setIsConfirmModalOpen(true);
        }
    };

    const handleConfirmUninstall = async () => {
        if (pluginToUninstall) {
            await uninstallPlugin(pluginToUninstall.id);
            setIsConfirmModalOpen(false);
            setPluginToUninstall(null);
        }
    };

    const handleUninstallFromModal = async (id: any) => {
        const plugin = plugins.find((p) => p.id === id);
        if (plugin) {
            setPluginToUninstall(plugin);
            setIsConfirmModalOpen(true);
            setIsModalOpen(false);
        }
    };

    const handlePluginClick = (id: any) => {
        const plugin = plugins.find((p) => p.id === id);
        if (plugin) {
            setSelectedPlugin(plugin);
            setIsModalOpen(true);
        }
    };

    const filteredPlugins = useMemo(
        () => {
            const searchFiltered = installedPlugins.filter(
                (plugin) =>
                    plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    plugin.description.toLowerCase().includes(searchTerm.toLowerCase()),
            );
            
            // Now, filter based on the active/inactive status
            if (filterStatus === "active") {
                return searchFiltered.filter(plugin => plugin.enabled);
            }
            if (filterStatus === "inactive") {
                return searchFiltered.filter(plugin => !plugin.enabled);
            }
            
            return searchFiltered;
        },
        [installedPlugins, searchTerm, filterStatus],
    );

    return (
        <div className="space-y-6">
            <Breadcrumb items={breadcrumbItems} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold">Installed Plugins</h1>
            </motion.div>

            <div className="bg-card border rounded-lg">
                <div className="p-4 border-b">
                    <div className="flex items-center gap-4">
                        <Input
                            placeholder="Search for plugins..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />

                        {/* Filter dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 mr-1" />
                                    Filter: <span className="capitalize font-semibold">{filterStatus}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-40">
                                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                                    All
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStatus("active")}>
                                    Active
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStatus("inactive")}>
                                    Inactive
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="p-4">
                    <InstalledPluginsTable
                        plugins={filteredPlugins}
                        onToggle={handleTogglePlugin}
                        onUninstall={handleUninstallRequest}
                        onPluginClick={handlePluginClick}
                    />
                </div>
            </div>

            <PluginDetailModal
                plugin={selectedPlugin}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUninstall={handleUninstallFromModal}
                variant="installed"
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmUninstall}
                plugin={pluginToUninstall}
                action="uninstall"
                isLoading={pluginToUninstall && loadingPlugins.has(pluginToUninstall.id)}
            />
        </div>
    );
}