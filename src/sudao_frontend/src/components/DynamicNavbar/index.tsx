import React from "react";
import { useLocation } from "react-router-dom";
import NavbarSUDAO from "../NavbarSUDAO";
import NavbarDAO from "../NavbarDAO";

const DynamicNavbar: React.FC = () => {
  const location = useLocation();

  // Check if current route is for a specific DAO
  const isDaoRoute =
    location.pathname.includes("/home/") ||
    location.pathname.includes("/proposal/") ||
    location.pathname.includes("/transaction/") ||
    location.pathname.includes("/profile");

  return isDaoRoute ? <NavbarDAO /> : <NavbarSUDAO />;
};

export default DynamicNavbar;
