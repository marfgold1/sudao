import { create } from "zustand"

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

interface PluginStore {
    plugins: Plugin[]
    installPlugin: (id: string) => void
    uninstallPlugin: (id: string) => void
    togglePlugin: (id: string, enabled: boolean) => void
}

const initialPlugins: Plugin[] = [
    {
        id: "latest-news",
        name: "Latest News",
        description:
            "Keep your members in the loop with the latest updates, stories, and announcements from your collective. Perfect for homepages or proposal pages.",
        developer: "Amar Fadil",
        installed: true,
        enabled: true,
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
        installed: true,
        enabled: true,
        isCore: true,
        installCount: "128 collectives",
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
        installed: false,
        enabled: false,
        installCount: "45 collectives",
        showInMyPages: false,
        features: ["Real-time tracking", "Member engagement", "Gamification", "Progress visualization"],
    },
]

export const usePluginStore = create<PluginStore>((set) => ({
    plugins: initialPlugins,
    installPlugin: (id) =>
        set((state) => ({
            plugins: state.plugins.map((plugin) =>
                plugin.id === id ? { ...plugin, installed: true, enabled: true } : plugin,
            ),
        })),
    uninstallPlugin: (id) =>
        set((state) => ({
            plugins: state.plugins.map((plugin) =>
                plugin.id === id ? { ...plugin, installed: false, enabled: false, showInMyPages: false } : plugin,
            ),
        })),
    togglePlugin: (id, enabled) =>
        set((state) => ({
            plugins: state.plugins.map((plugin) =>
                plugin.id === id ? { ...plugin, enabled, showInMyPages: enabled && plugin.installed } : plugin,
            ),
        })),
}))
