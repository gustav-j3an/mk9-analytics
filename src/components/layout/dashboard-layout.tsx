import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1">
                <Topbar />
                <main className="p-8">{children}</main>
            </div>
        </div>
    );
}