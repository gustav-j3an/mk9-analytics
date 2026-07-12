import { DashboardLayout } from "../layout/dashboard-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}