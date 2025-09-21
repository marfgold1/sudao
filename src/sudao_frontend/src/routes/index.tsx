import { Outlet, createBrowserRouter, RouteObject } from "react-router-dom";
import {
  Home,
  Example,
  Proposal,
  Transaction,
  DiscoverCollectives,
  Profile,
} from "@/pages";
import BuildDAO from "@/pages/BuildDAO";
import NotFound from "@/pages/NotFound";
import { NavbarDAO, NavbarSUDAO, FooterSUDAO, FooterDAO } from "@/components";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Layouts
const SUDAOLayout = () => (
  <>
    <NavbarSUDAO />
    <Outlet />
    <FooterSUDAO />
  </>
);

const DAOLayout = () => (
  <>
    <NavbarDAO />
    <Outlet />
    <FooterDAO />
  </>
);

const routes: RouteObject[] = [
  {
    path: "/",
    element: <SUDAOLayout />,
    errorElement: <ErrorBoundary />,
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
    path: "/dao",
    element: <DAOLayout />,
    errorElement: <ErrorBoundary />,
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
  },
];

const router = createBrowserRouter(routes);

export default router;
