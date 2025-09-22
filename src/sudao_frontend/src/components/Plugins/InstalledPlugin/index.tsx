import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, ChevronsUpDown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Plugin, usePluginStore } from "@/lib/plugin-store";

interface InstalledPluginsTableProps {
    plugins: Plugin[];
    onToggle: (id: string, enabled: boolean) => void;
    onUninstall: (id: string) => void;
    onPluginClick: (id: string) => void;
}

export default function InstalledPluginsTable({ plugins, onToggle, onUninstall, onPluginClick }: InstalledPluginsTableProps) {
    const { loadingPlugins } = usePluginStore();
    const [sortField, setSortField] = useState<string>("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    // Memoize the sorted plugins array
    const sortedPlugins = useMemo(() => {
        const sorted = [...plugins];

        if (sortField) {
            sorted.sort((a, b) => {
                // Get the values, ensuring they are not undefined
                const aValue = a[sortField as keyof Plugin];
                const bValue = b[sortField as keyof Plugin];

                // Add a check to handle potential undefined values
                if (aValue === undefined || bValue === undefined) {
                    return 0; // Or handle this case as you see fit
                }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    const comparison = aValue.localeCompare(bValue);
                    return sortDirection === "asc" ? comparison : -comparison;
                }

                if (aValue < bValue) {
                    return sortDirection === "asc" ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortDirection === "asc" ? 1 : -1;
                }
                return 0;
            });
        }

        return sorted;
    }, [plugins, sortField, sortDirection]);

    return (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            <Button
                                variant="ghost"
                                className="h-auto p-0 font-semibold hover:bg-transparent justify-start"
                                onClick={() => handleSort("name")}
                            >
                                Plugins
                                <ChevronsUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead>
                            <Button
                                variant="ghost"
                                className="h-auto p-0 font-semibold hover:bg-transparent"
                                onClick={() => handleSort("description")}
                            >
                                Description
                            </Button>
                        </TableHead>
                        <TableHead>
                            <Button
                                variant="ghost"
                                className="h-auto p-0 font-semibold hover:bg-transparent"
                                onClick={() => handleSort("developer")}
                            >
                                Developer
                                <ChevronsUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedPlugins.map((plugin: Plugin, index: any) => (
                        <motion.tr
                            key={plugin.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                        >
                            <TableCell className="flex space-x-3">
                                <div className="w-8 h-8 rounded overflow-hidden bg-muted flex items-center justify-center">
                                    <img
                                        src={plugin.icon}
                                        alt={plugin.name}
                                        width={32}
                                        height={32}
                                        draggable={false}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onPluginClick(plugin.id)}
                                        className="font-medium text-primary hover:underline text-left"
                                    >
                                        {plugin.name}
                                    </button>
                                    {plugin.isCore && (
                                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                                        Core
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="max-w-md">
                                <p className="text-sm text-muted-foreground line-clamp-2">{plugin.description}</p>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm">by {plugin.developer}</span>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center justify-start gap-3">
                                    <Switch 
                                        checked={plugin.enabled} 
                                        onCheckedChange={(enabled: boolean) => onToggle(plugin.id, enabled)}
                                        disabled={loadingPlugins.has(plugin.id)}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onUninstall(plugin.id)}
                                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        disabled={loadingPlugins.has(plugin.id)}
                                    >
                                        {loadingPlugins.has(plugin.id) ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </TableCell>
                        </motion.tr>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}