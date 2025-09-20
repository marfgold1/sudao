import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plugin } from "@/lib/plugin-store";
import { memo, useMemo } from "react";

interface PluginCardProps {
    plugin: Plugin;
    onInstall?: (id: string) => void;
    onUninstall?: (id: string) => void;
    onClick?: (id: string) => void;
    variant?: "marketplace" | "installed" | "view";
}

const InstallButton = ({ plugin, onInstall, onUninstall }: Pick<PluginCardProps, 'plugin' | 'onInstall' | 'onUninstall'>) => (
    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {plugin.installed ? (
            <Button
                variant="outline"
                size="sm"
                onClick={() => onUninstall?.(plugin.id)}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
                Uninstall Plugin
            </Button>
        ) : (
            <Button
                size="sm"
                onClick={() => onInstall?.(plugin.id)}
                className="bg-blue-500 hover:bg-blue-700"
            >
                Install Plugin
            </Button>
        )}
    </div>
);

const ViewDetails = ({ plugin }: Pick<PluginCardProps, 'plugin'>) => (
    <div className="flex gap-2 text-blue-600 font-semibold text-sm" onClick={(e) => e.stopPropagation()}>
        {plugin.isPaid ? plugin.pricing : "Free"}
    </div>
);

const PluginCard = ({
    plugin,
    onInstall,
    onUninstall,
    onClick,
    variant = "marketplace",
}: PluginCardProps) => {

    const actionComponent = useMemo(() => {
        if (variant === "marketplace") {
            return <InstallButton plugin={plugin} onInstall={onInstall} onUninstall={onUninstall} />;
        }
        if (variant === "view") {
            return <ViewDetails plugin={plugin} />;
        }
        return null;
    }, [variant, plugin, onInstall, onUninstall]);

    return (
        <motion.div whileHover={{ y: -2 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card
                className="h-full cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onClick?.(plugin.id)}
            >
                <CardContent className="p-0">
                    <div className="flex items-start gap-4 mb-2 p-5">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                            <img
                                src={plugin.icon}
                                alt={plugin.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                            <h3 className="font-semibold text-blue-500 hover:underline truncate mb-1">{plugin.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{plugin.description}</p>
                            <p className="text-sm text-muted-foreground">by <span className="font-semibold text-black">{plugin.developer}</span></p>
                        </div>
                    </div>

                    {(variant === "marketplace" || variant === "view") && (
                        <div className="border-t py-3 p-5 bg-slate-100">
                            <div className="flex items-center justify-between">
                                {plugin.installCount && (
                                    <span className="text-xs">Installed by: {plugin.installCount}</span>
                                )}
                                {actionComponent}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default memo(PluginCard);