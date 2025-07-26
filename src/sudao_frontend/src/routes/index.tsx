import { Outlet, RouteObject, createBrowserRouter } from "react-router-dom";
import { Home, Example, Proposal, Transaction } from "@/pages";
import { DynamicNavbar, /* Footer */ } from "@/components";
// import { AuthProvider } from "@/contexts/AuthContext";

const MainLayout = () => {
    return (
        <>
            <DynamicNavbar />
            <Outlet />
            {/* <Footer /> */}
        </>
    );
};

const AuthLayout = () => {
    return <Outlet />;
};

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
                path: "/proposal",
                element: <Proposal />,
            },
            {
                path: "/home/:daoId",
                element: <Transaction />,
            },
            {
                path: "/proposal/:daoId",
                element: <Proposal />,
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