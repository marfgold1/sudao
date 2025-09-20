import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GripVertical, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePluginStore, Plugin } from '@/lib/plugin-store';

interface PluginCustomizationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface DragState {
    draggedIndex: number | null;
    draggedFrom: 'visible' | 'more' | null;
}

export const PluginCustomizationModal: React.FC<PluginCustomizationModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { getOrderedNavPlugins, updateNavbarPreferences, navbarPreferences } = usePluginStore();
    const [_, setAllNavPlugins] = useState<Plugin[]>([]);
    const [visiblePlugins, setVisiblePlugins] = useState<Plugin[]>([]);
    const [morePlugins, setMorePlugins] = useState<Plugin[]>([]);
    const [dragState, setDragState] = useState<DragState>({ draggedIndex: null, draggedFrom: null });

    useEffect(() => {
        if (isOpen) {
            const plugins = getOrderedNavPlugins();
            setAllNavPlugins(plugins);
            
            // Apply user preferences or default to first 2
            if (navbarPreferences.visiblePluginIds.length > 0) {
                const visibleIds = navbarPreferences.visiblePluginIds.slice(0, 2);
                const visible = visibleIds.map(id => plugins.find(p => p.id === id)).filter(Boolean) as Plugin[];
                const remaining = plugins.filter(p => !visibleIds.includes(p.id));
                setVisiblePlugins(visible);
                setMorePlugins(remaining);
            } else {
                setVisiblePlugins(plugins.slice(0, 2));
                setMorePlugins(plugins.slice(2));
            }
        }
    }, [isOpen, getOrderedNavPlugins, navbarPreferences]);

    const handleDragStart = (e: React.DragEvent, index: number, from: 'visible' | 'more') => {
        setDragState({ draggedIndex: index, draggedFrom: from });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDragState({ draggedIndex: null, draggedFrom: null });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number, dropZone: 'visible' | 'more') => {
        e.preventDefault();
        
        if (dragState.draggedIndex === null || dragState.draggedFrom === null) return;

        const sourceArray = dragState.draggedFrom === 'visible' ? visiblePlugins : morePlugins;
        const draggedPlugin = sourceArray[dragState.draggedIndex];
        
        // Remove from source
        const newSourceArray = sourceArray.filter((_, index) => index !== dragState.draggedIndex);
        
        if (dropZone === 'visible') {
            // Ensure visible area never has more than 2 plugins
            let newVisiblePlugins = dragState.draggedFrom === 'visible' ? newSourceArray : [...visiblePlugins];
            
            if (dragState.draggedFrom === 'more') {
                // Moving from more to visible
                if (newVisiblePlugins.length >= 2) {
                    // Push the last item to more area
                    const displaced = newVisiblePlugins.pop()!;
                    setMorePlugins([...newSourceArray, displaced]);
                } else {
                    setMorePlugins(newSourceArray);
                }
            } else {
                setMorePlugins(morePlugins);
            }
            
            // Insert at drop position
            newVisiblePlugins.splice(Math.min(dropIndex, 1), 0, draggedPlugin);
            setVisiblePlugins(newVisiblePlugins.slice(0, 2)); // Ensure max 2
            
        } else {
            // Drop in more area
            const newMorePlugins = dragState.draggedFrom === 'more' ? newSourceArray : [...morePlugins];
            newMorePlugins.splice(dropIndex, 0, draggedPlugin);
            setMorePlugins(newMorePlugins);
            
            if (dragState.draggedFrom === 'visible') {
                setVisiblePlugins(newSourceArray);
            }
        }
        
        setDragState({ draggedIndex: null, draggedFrom: null });
    };

    const handleSave = () => {
        const newOrder = [...visiblePlugins, ...morePlugins].map(p => p.id);
        const newPreferences = {
            visiblePluginIds: visiblePlugins.map(p => p.id),
            pluginOrder: newOrder
        };
        updateNavbarPreferences(newPreferences);
        onClose();
    };

    const handleCancel = () => {
        // Reset to current state
        const plugins = getOrderedNavPlugins();
        if (navbarPreferences.visiblePluginIds.length > 0) {
            const visibleIds = navbarPreferences.visiblePluginIds.slice(0, 2);
            const visible = visibleIds.map(id => plugins.find(p => p.id === id)).filter(Boolean) as Plugin[];
            const remaining = plugins.filter(p => !visibleIds.includes(p.id));
            setVisiblePlugins(visible);
            setMorePlugins(remaining);
        } else {
            setVisiblePlugins(plugins.slice(0, 2));
            setMorePlugins(plugins.slice(2));
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={handleCancel}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <div className="flex items-center space-x-3">
                            <Settings className="w-6 h-6 text-blue-600" />
                            <h2 className="text-xl font-semibold text-slate-800">Customize Plugin Navigation</h2>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <p className="text-slate-600 mb-6">
                            Drag and drop plugins to customize which ones appear in the navbar. The first 2 plugins will be visible, and the rest will be in the "More" menu.
                        </p>

                        {/* Navbar Visible Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                                🎯 Navbar Visible (First 2)
                            </h3>
                            <div
                                className="grid grid-cols-2 gap-4 p-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl min-h-[120px]"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, visiblePlugins.length, 'visible')}
                            >
                                {visiblePlugins.map((plugin, index) => (
                                    <div
                                        key={plugin.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index, 'visible')}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, index, 'visible')}
                                        className="bg-white border border-slate-200 rounded-lg p-3 cursor-move hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-center space-x-2 mb-2">
                                            <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                            {plugin.icon && (
                                                <img src={plugin.icon} alt={plugin.name} className="w-6 h-6" />
                                            )}
                                        </div>
                                        <h4 className="font-medium text-sm text-slate-800 truncate">
                                            {plugin.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 truncate">
                                            {plugin.developer}
                                        </p>
                                    </div>
                                ))}
                                {/* Empty slots */}
                                {Array.from({ length: 2 - visiblePlugins.length }).map((_, index) => (
                                    <div
                                        key={`empty-${index}`}
                                        className="border-2 border-dashed border-slate-300 rounded-lg p-3 flex items-center justify-center text-slate-400 text-sm"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, visiblePlugins.length + index, 'visible')}
                                    >
                                        Drop here
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* More Menu Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                                📂 More Menu {morePlugins.length > 0 && `(${morePlugins.length})`}
                            </h3>
                            <div
                                className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl min-h-[120px]"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, morePlugins.length, 'more')}
                            >
                                {morePlugins.map((plugin, index) => (
                                    <div
                                        key={plugin.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index, 'more')}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, index, 'more')}
                                        className="bg-white border border-slate-200 rounded-lg p-3 cursor-move hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-center space-x-2 mb-2">
                                            <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                            {plugin.icon && (
                                                <img src={plugin.icon} alt={plugin.name} className="w-6 h-6" />
                                            )}
                                        </div>
                                        <h4 className="font-medium text-sm text-slate-800 truncate">
                                            {plugin.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 truncate">
                                            {plugin.developer}
                                        </p>
                                    </div>
                                ))}
                                {morePlugins.length === 0 && (
                                    <div className="col-span-3 text-center text-slate-400 py-8">
                                        No plugins in "More" menu
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                            Save Changes
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PluginCustomizationModal;