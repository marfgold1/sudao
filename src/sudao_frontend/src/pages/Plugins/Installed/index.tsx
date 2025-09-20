import { Input } from "@/components/ui/input";
import { PluginDetailModal, PluginCard, ConfirmationModal } from "@/components/Plugins";
import { usePluginStore } from "@/lib/plugin-store";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Separator } from "@/components/ui/separator";

export default function PluginInstalledPage() {
    const { plugins, uninstallPlugin, loadingPlugins } = usePluginStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPlugin, setSelectedPlugin] = useState<any>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pluginToUninstall, setPluginToUninstall] = useState<any>(null);

    const handlePluginClick = (id: any) => {
        const plugin = plugins.find((p) => p.id === id);
        if (plugin) {
            setSelectedPlugin(plugin);
            setIsModalOpen(true);
        }
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

    // Use useMemo to filter plugins for performance
    const filteredPlugins = useMemo(() => {
        const searchFiltered = plugins.filter((plugin) =>
            plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return searchFiltered.filter(plugin => plugin.installed);
    }, [plugins, searchTerm]);

    return (
        <div className="space-y-6 min-h-screen max-w-7xl mx-auto pt-8 mt-[4.5rem]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold">Plugins Installed</h1>
            </motion.div>

            <Separator />

            <div className="flex items-center justify-between">
                <Input
                    placeholder="Search for plugins..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredPlugins.map((plugin, index) => (
                    <motion.div
                        key={plugin.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <PluginCard
                            plugin={plugin}
                            onClick={handlePluginClick}
                            onUninstall={handleUninstallRequest}
                            variant="installed"
                            isLoading={loadingPlugins.has(plugin.id)}
                        />
                    </motion.div>
                ))}
            </div>

            <PluginDetailModal
                plugin={selectedPlugin}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
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
