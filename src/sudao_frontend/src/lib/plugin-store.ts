import { create } from "zustand"

import PluginLatestNews from '@/assets/images/plugin_latest_news.png';
import PluginProposal from '@/assets/images/plugin_proposal.png';
import PluginTopContributor from '@/assets/images/plugin_top_contributor.png';
import PluginDAOAnalytics from '@/assets/images/plugin_dao_analytics.png';
import PluginEngagementDashboard from '@/assets/images/plugin_engagement_dashboard.png';

export interface Plugin {
    id: string
    name: string
    description: string
    developer: string
    icon?: string
    installed: boolean
    enabled: boolean
    installCount?: string
    pricing?: string
    isPaid?: boolean
    isCore?: boolean
    features?: string[]
    dependencies?: string[]
    longDescription?: string
    showInMyPages?: boolean
}

interface NavbarPreferences {
    visiblePluginIds: string[] // First 2 plugins to show in navbar
    pluginOrder: string[]      // Full order of all plugins
}

interface PluginStore {
    plugins: Plugin[]
    loadingPlugins: Set<string>
    navbarPreferences: NavbarPreferences
    installPlugin: (id: string) => Promise<void>
    uninstallPlugin: (id: string) => Promise<void>
    togglePlugin: (id: string, enabled: boolean) => void
    updateNavbarPreferences: (preferences: NavbarPreferences) => void
    getOrderedNavPlugins: () => Plugin[]
}

const initialPlugins: Plugin[] = [
    {
        id: "latest-news",
        name: "Latest News",
        description:
            "Keep your members in the loop with the latest updates, stories, and announcements from your collective. Perfect for homepages or proposal pages.",
        developer: "Amar Fadil",
        icon: PluginLatestNews,
        installed: true,
        enabled: false,
        installCount: "128 collectives",
        showInMyPages: false,
        features: ["Real-time news updates", "Customizable news feed", "Member notifications", "Rich media support"],
    },
    {
        id: "proposal",
        name: "Proposal",
        description:
            "The Proposal Plugin lets members create, discuss, and vote on initiatives directly on-chain. From budget approvals to community rules, every decision is transparent, verifiable, and powered by ICP.",
        developer: "SUDAO Core Team",
        icon: PluginProposal,
        installed: true,
        enabled: true,
        isCore: true,
        installCount: "128 collectives",
        isPaid: true,
        pricing: "10 ICP",
        showInMyPages: true,
        features: [
            "Members can draft and submit new proposals",
            "Built-in commenting enables open discussion",
            "Voting happens securely on-chain via ICP",
            "Rules like quorum and deadlines are customizable",
            "Members receive real-time proposal notifications",
            "Results are transparent and verifiable instantly",
            "Proposals can be tracked from draft to execution",
        ],
        dependencies: [],
        longDescription:
            "The Proposal Plugin lets members create, discuss, and vote on initiatives directly on-chain. From budget approvals to community rules, every decision is transparent, verifiable, and powered by ICP.",
    },
    {
        id: "top-contributor",
        name: "Top Contributor",
        description:
            "Showcase the most active or generous members in your community — based on contributions, voting activity, or proposal submissions.",
        developer: "SUDAO Core Team",
        icon: PluginTopContributor,
        installed: false,
        enabled: false,
        installCount: "94 collectives",
        isPaid: true,
        pricing: "10 ICP",
        showInMyPages: false,
        features: ["Activity tracking", "Contribution metrics", "Member rankings", "Customizable criteria"],
    },
    {
        id: "dao-analytics",
        name: "DAO Analytics",
        description:
            "Visualize key stats: voting participation, funding trends, treasury flow, and proposal outcomes. Build transparency and spot patterns over time.",
        developer: "SUDAO Core Team",
        icon: PluginDAOAnalytics,
        installed: false,
        enabled: false,
        installCount: "76 collectives",
        showInMyPages: false,
        features: ["Voting analytics", "Treasury tracking", "Participation metrics", "Custom dashboards"],
    },
    {
        id: "engagement-scoreboard",
        name: "Engagement Scoreboard",
        description:
            "Track and display community involvement in real time — votes cast, discussions joined, and proposals submitted. Motivate members to stay involved.",
        developer: "SUDAO Core Team",
        icon: PluginEngagementDashboard,
        installed: false,
        enabled: false,
        installCount: "45 collectives",
        showInMyPages: false,
        features: ["Real-time tracking", "Member engagement", "Gamification", "Progress visualization"],
    },
]

export const usePluginStore = create<PluginStore>((set, get) => ({
    plugins: initialPlugins,
    loadingPlugins: new Set(),
    navbarPreferences: {
        visiblePluginIds: [], // Will be populated with first 3 enabled plugins
        pluginOrder: []       // Will be populated with all plugin IDs
    },
    installPlugin: async (id) => {
        set((state) => ({
            loadingPlugins: new Set(state.loadingPlugins).add(id)
        }));
        
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        set((state) => {
            const newLoadingPlugins = new Set(state.loadingPlugins);
            newLoadingPlugins.delete(id);
            return {
                loadingPlugins: newLoadingPlugins,
                plugins: state.plugins.map((plugin) =>
                    plugin.id === id ? { 
                        ...plugin, 
                        installed: true, 
                        enabled: false,
                        showInMyPages: false
                    } : plugin,
                ),
            };
        });
    },
    uninstallPlugin: async (id) => {
        set((state) => ({
            loadingPlugins: new Set(state.loadingPlugins).add(id)
        }));
        
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        set((state) => {
            const newLoadingPlugins = new Set(state.loadingPlugins);
            newLoadingPlugins.delete(id);
            return {
                loadingPlugins: newLoadingPlugins,
                plugins: state.plugins.map((plugin) =>
                    plugin.id === id ? { ...plugin, installed: false, enabled: false, showInMyPages: false } : plugin,
                ),
            };
        });
    },
    togglePlugin: (id, enabled) =>
        set((state) => ({
            plugins: state.plugins.map((plugin) =>
                plugin.id === id ? { ...plugin, enabled, showInMyPages: enabled && plugin.installed } : plugin,
            ),
        })),
    
    updateNavbarPreferences: (preferences) =>
        set(() => ({
            navbarPreferences: preferences
        })),

    getOrderedNavPlugins: () => {
        const { plugins, navbarPreferences } = get();
        const navPlugins = plugins.filter(plugin => plugin.showInMyPages);
        
        if (navbarPreferences.pluginOrder.length === 0) {
            // Default order: alphabetical
            return navPlugins.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        // Apply user's custom order
        const orderedPlugins: Plugin[] = [];
        const pluginMap = new Map(navPlugins.map(plugin => [plugin.id, plugin]));
        
        // First, add plugins in the user's specified order
        for (const pluginId of navbarPreferences.pluginOrder) {
            const plugin = pluginMap.get(pluginId);
            if (plugin) {
                orderedPlugins.push(plugin);
                pluginMap.delete(pluginId);
            }
        }
        
        // Then add any remaining plugins (newly installed ones)
        orderedPlugins.push(...Array.from(pluginMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
        
        return orderedPlugins;
    },
}))
