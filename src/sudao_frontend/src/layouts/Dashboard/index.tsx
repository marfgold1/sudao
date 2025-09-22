import { CreatorDashboardSidebar } from "@/components";
import { Outlet } from "react-router-dom";

const CreatorDashboardLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-background pt-[4.5rem]">
            <CreatorDashboardSidebar />
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default CreatorDashboardLayout;