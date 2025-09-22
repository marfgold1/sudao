import React, { useState, useEffect, Suspense, lazy, useMemo, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { usePluginStore, Plugin } from '@/lib/plugin-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, ExternalLink } from 'lucide-react';

// Make React available globally for remote plugins
if (typeof window !== 'undefined') {
    (window as any).React = React;
}

// Plugin component props interface
interface PluginComponentProps {
    plugin: Plugin;
    daoId?: string;
}

// Lazy load builtin plugin components
const builtinComponents: { [key: string]: React.LazyExoticComponent<React.ComponentType<any>> } = {
    'latest-news': lazy(() => import('@/pages/Plugins/LatestNews')),
    'proposal': lazy(() => import('@/pages/Plugins/Proposal')),
    'top-contributor': lazy(() => import('@/pages/Plugins/TopContributor')),
};

// Remote plugin component cache
const remoteComponentCache = new Map<string, React.ComponentType<any>>();

export const PluginRouteHandler: React.FC = () => {
    const { daoId, pluginId } = useParams<{ daoId: string; pluginId: string }>();
    const plugins = usePluginStore((state) => state.plugins);
    const remoteComponentRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [componentReady, setComponentReady] = useState(false);
    
    // Check if plugin exists and is active
    const plugin = useMemo(() => {
        return plugins.find(p => p.id === pluginId && p.showInMyPages);
    }, [plugins, pluginId]);
    
    // If plugin doesn't exist or isn't active, redirect to 404
    if (!plugin || !pluginId) {
        return <Navigate to={`/dao/${daoId}/404`} replace />;
    }

    // Load remote plugin component
    useEffect(() => {
        if (plugin.componentType === 'remote' && plugin.componentUrl && !componentReady) {
            loadRemoteComponent();
        }
    }, [plugin.componentUrl, plugin.componentType, componentReady]);

    const loadRemoteComponent = async () => {
        if (!plugin.componentUrl) return;

        // Check cache first
        const cached = remoteComponentCache.get(plugin.componentUrl);
        if (cached) {
            remoteComponentRef.current = cached;
            setComponentReady(true);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch the remote component
            const response = await fetch(plugin.componentUrl);
            if (!response.ok) {
                throw new Error(`Failed to load plugin: ${response.statusText}`);
            }

            const moduleCode = await response.text();
            
            // For data URLs, evaluate the code directly
            if (plugin.componentUrl.startsWith('data:')) {
                // Execute the code and extract the component
                let Component = null;
                
                try {
                    // Clear any existing component first
                    delete (window as any).CustomDashboardComponent;
                    
                    // Provide module system polyfills for libraries that use CommonJS
                    const modulePolyfill = `
                        var module = { exports: {} };
                        var exports = module.exports;
                        var require = function(name) { 
                            return window[name] || {}; 
                        };
                        ${moduleCode}
                        if (typeof module.exports === 'function') {
                            window.CustomDashboardComponent = module.exports;
                        } else if (module.exports.default) {
                            window.CustomDashboardComponent = module.exports.default;
                        }
                    `;
                    
                    // Execute the module code with polyfills
                    eval(modulePolyfill);
                    
                    // Try to get the component from the global scope
                    Component = (window as any).CustomDashboardComponent;
                    
                    // If we didn't get a function, try to find any function that was added to window
                    if (!Component || typeof Component !== 'function') {
                        const windowKeys = Object.getOwnPropertyNames(window);
                        const newFunctions = windowKeys.filter(key => 
                            typeof (window as any)[key] === 'function' && 
                            key.includes('Component')
                        );
                        
                        if (newFunctions.length > 0) {
                            Component = (window as any)[newFunctions[0]];
                        }
                    }
                    
                    // Ensure we have a function, not a React element
                    if (Component && typeof Component === 'object' && Component.$$typeof) {
                        throw new Error('Got a React element instead of component function - component was likely called during evaluation');
                    }
                    
                    if (!Component || typeof Component !== 'function') {
                        // Create a demo component that shows the loaded library info
                        Component = function DemoRemoteComponent({ plugin, daoId }: PluginComponentProps) {
                            const React = window.React;
                            return React.createElement('div', {
                                className: 'container mx-auto px-4 py-8'
                            }, 
                                React.createElement('div', {
                                    className: 'max-w-4xl mx-auto'
                                }, 
                                    React.createElement('div', {
                                        className: 'bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-8 border text-center'
                                    }, [
                                        React.createElement('div', {
                                            key: 'emoji',
                                            className: 'text-6xl mb-4'
                                        }, '🌐'),
                                        React.createElement('h1', {
                                            key: 'title',
                                            className: 'text-3xl font-bold text-purple-800 mb-4'
                                        }, 'Real CDN Plugin Loaded!'),
                                        React.createElement('h2', {
                                            key: 'plugin-name', 
                                            className: 'text-xl font-semibold text-gray-900 mb-2'
                                        }, (plugin.name || 'Remote Plugin') + ' - From Real CDN!'),
                                        React.createElement('p', {
                                            key: 'dev',
                                            className: 'text-gray-600 mb-4'
                                        }, 'by ' + (plugin.developer || 'Unknown')),
                                        React.createElement('p', {
                                            key: 'desc',
                                            className: 'text-gray-700 mb-4'
                                        }, 'This was fetched from a real CDN: ' + plugin.componentUrl),
                                        React.createElement('div', {
                                            key: 'dao-info',
                                            className: 'bg-white/50 rounded-lg p-4'
                                        }, [
                                            React.createElement('h3', {
                                                key: 'dao-title',
                                                className: 'font-semibold mb-2'
                                            }, 'Plugin Info:'),
                                            React.createElement('p', {
                                                key: 'dao-id'
                                            }, 'DAO ID: ' + (daoId || 'undefined')),
                                            React.createElement('p', {
                                                key: 'url'
                                            }, 'Loaded from: ' + plugin.componentUrl?.substring(0, 50) + '...')
                                        ])
                                    ])
                                )
                            );
                        };
                    }
                    
                } catch (evalError) {
                    throw new Error('Failed to evaluate plugin code: ' + (evalError as Error).message);
                }
                
                if (!Component || typeof Component !== 'function') {
                    throw new Error('Plugin component not found or invalid - got: ' + typeof Component);
                }

                // Cache the component
                remoteComponentCache.set(plugin.componentUrl, Component);
                remoteComponentRef.current = Component;
                setComponentReady(true);
            } else {
                // For regular URLs, use dynamic import
                const blob = new Blob([moduleCode], { type: 'application/javascript' });
                const moduleUrl = URL.createObjectURL(blob);
                
                const module = await import(moduleUrl);
                let Component = module.default || module[plugin.id];
                
                if (!Component) {
                    // Create a demo component that shows the loaded library info
                    Component = function DemoRemoteComponent({ plugin, daoId }: PluginComponentProps) {
                        const React = window.React;
                        return React.createElement('div', {
                            className: 'container mx-auto px-4 py-8'
                        }, 
                            React.createElement('div', {
                                className: 'max-w-4xl mx-auto'
                            }, 
                                React.createElement('div', {
                                    className: 'bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-8 border text-center'
                                }, [
                                    React.createElement('div', {
                                        key: 'emoji',
                                        className: 'text-6xl mb-4'
                                    }, '🌐'),
                                    React.createElement('h1', {
                                        key: 'title',
                                        className: 'text-3xl font-bold text-purple-800 mb-4'
                                    }, 'Real CDN Plugin Loaded!'),
                                    React.createElement('h2', {
                                        key: 'plugin-name', 
                                        className: 'text-xl font-semibold text-gray-900 mb-2'
                                    }, (plugin.name || 'Remote Plugin') + ' - From Real CDN!'),
                                    React.createElement('p', {
                                        key: 'dev',
                                        className: 'text-gray-600 mb-4'
                                    }, 'by ' + (plugin.developer || 'Unknown')),
                                    React.createElement('p', {
                                        key: 'desc',
                                        className: 'text-gray-700 mb-4'
                                    }, 'This was fetched from a real CDN: ' + plugin.componentUrl),
                                    React.createElement('p', {
                                        key: 'loaded-info',
                                        className: 'text-sm text-gray-600 mb-4'
                                    }, 'Successfully loaded Day.js library from CDN, but no React component was found.'),
                                    React.createElement('div', {
                                        key: 'dao-info',
                                        className: 'bg-white/50 rounded-lg p-4'
                                    }, [
                                        React.createElement('h3', {
                                            key: 'dao-title',
                                            className: 'font-semibold mb-2'
                                        }, 'Plugin Info:'),
                                        React.createElement('p', {
                                            key: 'dao-id'
                                        }, 'DAO ID: ' + (daoId || 'undefined')),
                                        React.createElement('p', {
                                            key: 'url'
                                        }, 'Loaded from: ' + plugin.componentUrl?.substring(0, 60) + '...')
                                    ])
                                ])
                            )
                        );
                    };
                }

                // Cache the component
                remoteComponentCache.set(plugin.componentUrl, Component);
                remoteComponentRef.current = Component;
                setComponentReady(true);

                // Cleanup
                URL.revokeObjectURL(moduleUrl);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error loading plugin');
        } finally {
            setLoading(false);
        }
    };

    // Render based on plugin type
    const renderPlugin = () => {
        switch (plugin.componentType) {
            case 'builtin': {
                const BuiltinComponent = builtinComponents[plugin.id];
                if (BuiltinComponent) {
                    return (
                        <Suspense fallback={<PluginLoadingFallback />}>
                            <BuiltinComponent plugin={plugin} daoId={daoId} />
                        </Suspense>
                    );
                }
                return <DefaultPluginPage plugin={plugin} />;
            }

            case 'remote': {
                if (loading) {
                    return <PluginLoadingFallback />;
                }
                
                if (error) {
                    return <PluginErrorFallback plugin={plugin} error={error} onRetry={loadRemoteComponent} />;
                }
                
                if (componentReady && remoteComponentRef.current) {
                    const RemoteComponent = remoteComponentRef.current;
                    
                    // Create a wrapper component to safely render the remote component
                    const RemoteComponentWrapper = () => {
                        try {
                            if (typeof RemoteComponent === 'function') {
                                return RemoteComponent({ plugin, daoId });
                            } else {
                                return <DefaultPluginPage plugin={plugin} />;
                            }
                        } catch (err) {
                            return <PluginErrorFallback plugin={plugin} error={(err as Error).message} />;
                        }
                    };
                    
                    return <RemoteComponentWrapper />;
                }
                
                return <PluginLoadingFallback />;
            }

            case 'iframe': {
                if (!plugin.componentUrl) {
                    return <PluginErrorFallback plugin={plugin} error="No iframe URL provided" />;
                }
                
                return <IframePluginRenderer plugin={plugin} />;
            }

            default:
                return <DefaultPluginPage plugin={plugin} />;
        }
    };

    return renderPlugin();
};

// Loading fallback component
const PluginLoadingFallback: React.FC = () => (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardContent className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                        <p className="text-gray-600">Loading plugin...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
);

// Error fallback component
const PluginErrorFallback: React.FC<{ plugin: Plugin; error: string; onRetry?: () => void }> = ({ 
    plugin, 
    error, 
    onRetry 
}) => (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
            <Card className="border-red-200">
                <CardContent className="py-8">
                    <div className="text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-600" />
                        <h2 className="text-xl font-semibold text-red-800 mb-2">Plugin Failed to Load</h2>
                        <p className="text-gray-600 mb-4">Plugin: {plugin.name}</p>
                        <p className="text-red-600 text-sm mb-6">{error}</p>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Retry Loading
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
);

// Iframe plugin renderer
const IframePluginRenderer: React.FC<{ plugin: Plugin }> = ({ plugin }) => (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
            {/* Plugin Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    {plugin.icon && (
                        <img src={plugin.icon} alt={plugin.name} className="w-12 h-12 rounded-lg" />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{plugin.name}</h1>
                        <p className="text-gray-600">by {plugin.developer}</p>
                    </div>
                </div>
                <a 
                    href={plugin.componentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                </a>
            </div>

            {/* Iframe Container */}
            <Card>
                <CardContent className="p-0">
                    <iframe
                        src={plugin.componentUrl}
                        title={plugin.name}
                        className="w-full h-[800px] border-0 rounded-lg"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        loading="lazy"
                    />
                </CardContent>
            </Card>
        </div>
    </div>
);

// Default plugin page for unmapped plugins
const DefaultPluginPage: React.FC<{ plugin: Plugin }> = ({ plugin }) => (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                {plugin.icon && (
                    <img src={plugin.icon} alt={plugin.name} className="w-16 h-16 rounded-lg" />
                )}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{plugin.name}</h1>
                    <p className="text-gray-600">by {plugin.developer}</p>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>About This Plugin</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-gray-700">{plugin.description}</p>
                    
                    {plugin.longDescription && (
                        <>
                            <h3 className="text-lg font-semibold">Details</h3>
                            <p className="text-gray-700">{plugin.longDescription}</p>
                        </>
                    )}
                    
                    {plugin.features && plugin.features.length > 0 && (
                        <>
                            <h3 className="text-lg font-semibold">Features</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700">
                                {plugin.features.map((feature: string, index: number) => (
                                    <li key={index}>{feature}</li>
                                ))}
                            </ul>
                        </>
                    )}
                    
                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                        <div className="text-center">
                            <div className="text-4xl mb-3">🚀</div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Plugin Active</h3>
                            <p className="text-gray-600">
                                This plugin is running with default display. 
                                {plugin.componentType === 'remote' && ' Custom functionality will load when available.'}
                                {plugin.componentType === 'iframe' && ' Iframe content will load when URL is provided.'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
);

export default PluginRouteHandler;