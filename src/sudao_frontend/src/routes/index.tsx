import { Outlet, RouteObject, createBrowserRouter } from "react-router-dom";
import { Home, Example, Proposal, Transaction, DiscoverCollectives, Profile, BuildDAO, NotFound } from "@/pages";
import { NavbarDAO, NavbarSUDAO, FooterSUDAO, FooterDAO } from "@/components";

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
import { RouteObject, createBrowserRouter } from "react-router-dom";
import { Home, Example, Proposal, DiscoverCollectives, Profile, Transaction } from "@/pages";
import { MainLayout, AuthLayout } from "@/routes/layouts";
import { DAOHomeTest } from "@/pages/DAOHome/test";

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
