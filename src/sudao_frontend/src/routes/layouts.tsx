import { Outlet, useParams } from "react-router-dom";
import { NavbarSUDAO, FooterSUDAO, NavbarDAO, FooterDAO } from "@/components";
import { DAOProvider } from "@/contexts/dao/provider";

export const SUDAOLayout = () => (
  <>
    <NavbarSUDAO />
    <Outlet />
    <FooterSUDAO />
  </>
);

export const DAOLayout = () => {
  const { daoId } = useParams<{ daoId: string }>();
  return (
    <DAOProvider daoId={daoId!}>
      <NavbarDAO />
      <Outlet />
      <FooterDAO />
    </DAOProvider>
  );
};