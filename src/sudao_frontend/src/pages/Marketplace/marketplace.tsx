import { Input } from "@/components/ui/input";
import { PluginDetailModal, PluginCard } from "@/components/Plugins";
import { usePluginStore } from "@/lib/plugin-store";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";

export function Marketplace() {
    const { plugins } = usePluginStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPlugin, setSelectedPlugin] = useState<any>();
    const [isModalOpen, setIsModalOpen] = useState(false);

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

        return searchFiltered
    }, [plugins, searchTerm]);

    return (
        <div className="space-y-6 min-h-screen max-w-7xl mx-auto py-20 px-4">
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
                        whileInView={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <PluginCard
                            plugin={plugin}
                            onClick={handlePluginClick}
                            variant="view"
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
        </div>
    );
}
