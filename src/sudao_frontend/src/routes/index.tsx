import { Outlet, RouteObject, createBrowserRouter } from "react-router-dom";
import { Home, Example, Proposal, Transaction, DiscoverCollectives, Profile, BuildDAO, NotFound, CreatorDashboard, InstalledPluginsPage, PluginMarketplacePage, InstalledPluginsPublicPage, Marketplace, HomeDAO } from "@/pages";
import { NavbarDAO, NavbarSUDAO, FooterSUDAO, FooterDAO, PluginRouteHandler } from "@/components";
import { CreatorDashboardLayout } from "@/layouts";

const SUDAOLayout = () => {
    return (
        <>
            <NavbarSUDAO />
            <Outlet />
            <FooterSUDAO />
        </>
    );
};

const DAOLayout = () => {
    return (
        <>
            <NavbarDAO />
            <Outlet />
            <FooterDAO />
        </>
    );
};

const routes: RouteObject[] = [
    {
        path: "/",
        element: <SUDAOLayout />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: "discover",
                element: <DiscoverCollectives />,
            },
            {
                path: "build",
                element: <BuildDAO />,
            },
            {
                path: "example",
                element: <Example />,
            },
            {
                path: "plugins",
                element: <Marketplace />,
            },
            {
                path: "*",
                element: <NotFound />,
            },
        ],
    },
    {
        path: "/dao", // DAO-related pages
        element: <DAOLayout />,
        children: [
            {
                path: ":daoId/home",
                element: <HomeDAO />,
            },
            {
                path: ":daoId/transaction",
                element: <Transaction />,
            },
            {
                path: ":daoId/proposal",
                element: <Proposal />,
            },
            {
                path: ":daoId/profile",
                element: <Profile />,
            },
            {
                path: ":daoId/plugins",
                element: <InstalledPluginsPublicPage />,
            },
            {
                path: ":daoId/:pluginId",
                element: <PluginRouteHandler />,
            },
            {
                path: ":daoId/creator-dashboard",
                element: <CreatorDashboardLayout />,
                children: [
                    {
                        index: true,
                        element: <CreatorDashboard />,
                    },
                    {
                        path: "plugins",
                        children: [
                            {
                                path: "installed",
                                element: <InstalledPluginsPage />,
                            },
                            {
                                path: "marketplace",
                                element: <PluginMarketplacePage />,
                            },
                        ],
                    },
                    {
                        path: ":pluginId",
                        element: <PluginRouteHandler />,
                    },
                ],
            },
            {
                path: "404",
                element: <NotFound />,
            },
            {
                path: "*",
                element: <NotFound />,
            },
        ],
    },
    {
        path: "*",
        element: <NotFound />,
    }
];

const router = createBrowserRouter(routes);

export default router;