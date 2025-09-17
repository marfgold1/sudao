import { Outlet } from "react-router-dom";
import { DynamicNavbar } from "@/components";

export const MainLayout = () => {
    return (
        <>
            <DynamicNavbar />
            <Outlet />
            {/* <Footer /> */}
        </>
    );
};

export const AuthLayout = () => {
    return <Outlet />;
};