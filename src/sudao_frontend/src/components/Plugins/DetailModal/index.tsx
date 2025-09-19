import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { motion } from "framer-motion";
import { Plugin } from "@/lib/plugin-store";
import PluginLogo from '@/assets/images/plugin.png';

interface PluginDetailModalProps {
    plugin: Plugin | null;
    isOpen: boolean;
    onClose: () => void;
    onInstall?: (id: string) => void;
    onUninstall?: (id: string) => void;
    variant?: "marketplace" | "installed";
}

export default function PluginDetailModal({ 
    plugin, 
    isOpen, 
    onClose, 
    onInstall, 
    onUninstall,
    variant = "marketplace" 
}: PluginDetailModalProps) {
    if (!plugin) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
        >
            {isOpen && (
                <Dialog open={isOpen} onOpenChange={onClose}>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
                        <div className="relative">
                            <div className="relative h-44 w-full overflow-hidden">
                                <img
                                    src={PluginLogo}
                                    alt="Plugin base logo"
                                    className="object-cover w-full h-full"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                                        <img
                                            src={plugin.icon}
                                            alt={plugin.name}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-2xl font-semibold">{plugin.name}</h2>
                                            {plugin.isPaid && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-center gap-2 rounded-xl bg-red-100 text-red-700 font-semibold py-0.5 px-3">
                                                                <div className="text-xs">Paid</div>
                                                                <Info className="w-3 h-3 text-muted-foreground" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>This plugin requires payment to install</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            {plugin.isCore && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-center gap-2 rounded-xl bg-blue-100 text-blue-700 font-semibold py-0.5 px-3">
                                                                <div className="text-xs">Core Plugin</div>
                                                                <Info className="w-3 h-3 text-muted-foreground" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Essential core plugin available by default for your DAO</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">by {plugin.developer}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {plugin.longDescription || plugin.description}
                                    </p>
                                </div>

                                {plugin.features && (
                                    <div>
                                        <h4 className="font-semibold mb-3">Features</h4>
                                        <ul className="space-y-2">
                                        {plugin.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm">
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                            {feature}
                                            </li>
                                        ))}
                                        </ul>
                                    </div>
                                )}

                                <Separator />

                                <div className="grid grid-cols-2 gap-6 pb-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Creator</h4>
                                        <p className="text-sm text-muted-foreground">{plugin.developer}</p>
                                    </div>

                                    {plugin.dependencies && plugin.dependencies.length > 0 ? (
                                        <div>
                                            <h4 className="font-semibold mb-2">Dependencies</h4>
                                            <div className="space-y-1">
                                                {plugin.dependencies.map((dep, index) => (
                                                <Badge key={index} variant="outline" className="text-xs">
                                                    {dep}
                                                </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <h4 className="font-semibold mb-2">Dependencies</h4>
                                            <p className="text-sm text-muted-foreground">None</p>
                                        </div>
                                    )}

                                    {plugin.pricing && (
                                        <div>
                                        <h4 className="font-semibold mb-2">Pricing</h4>
                                        <p className="text-sm font-medium">{plugin.pricing}</p>
                                        </div>
                                    )}
                                </div>

                                {variant == "marketplace" &&
                                    <div className="flex justify-end gap-3 pt-4 border-t">
                                        {plugin.installed ? (
                                            <Button
                                                variant="outline"
                                                onClick={() => onUninstall?.(plugin.id)}
                                                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                            >
                                            Uninstall Plugin
                                            </Button>
                                        ) : (
                                            <Button onClick={() => onInstall?.(plugin.id)}>Install Plugin</Button>
                                        )}
                                    </div>
                                }
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </motion.div>
    );
}