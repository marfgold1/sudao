import { RouteObject, createBrowserRouter } from "react-router-dom";
import { Home, Example, Proposal, DiscoverCollectives, Profile } from "@/pages";
import { MainLayout, AuthLayout } from "@/routes/layouts";
import { DAOHomeTest } from "@/pages/DAOHome/test";

const routes: RouteObject[] = [
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                path: "/",
                element: <Home />,
            },
            {
                path: "/discover",
                element: <DiscoverCollectives />,
            },
            // {
            //     path: "/home/:daoId",
            //     element: <Transaction />,
            // },
            {
                path: "/home/:daoId",
                element: <DAOHomeTest />,
            },
            {
                path: "/proposal/:daoId",
                element: <Proposal />,
            },
            {
                path: "/profile",
                element: <Profile />,
            },
            {
                path: "/example",
                element: <Example />,
            }
        ],
    },
    {
        path: "/",
        element: <AuthLayout />,
        children: [
            {
                path: "/auth",
                element: <Home />,
            }
        ],
    },
];

const router = createBrowserRouter(routes);

export default router;