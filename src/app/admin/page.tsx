
import { getDashboardStatsAction } from "@/app/actions";
import DashboardClient from "./DashboardClient";

// Add revalidation to ensure data is decently fresh even with ISG (or use dynamic const)
// export const revalidate = 0; // Removed for static export compatibility

export default async function AdminDashboard() {
    // This action runs on server (for SSR) or is executed during build for SSG
    // Since we set revalidate = 0, it should be dynamic
    const stats = await getDashboardStatsAction();

    return (
        <DashboardClient data={stats} />
    );
}
