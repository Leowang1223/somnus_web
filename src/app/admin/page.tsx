
import { getDashboardStatsAction } from "@/app/actions";
import DashboardClient from "./DashboardClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
    const supabase = await createClient();

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.email) {
        // Not logged in or no email - redirect to login
        redirect('/login');
    }

    // At this point, TypeScript knows session.user.email exists
    const userEmail = session.user.email;

    // Check user role from database
    const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('email', userEmail)
        .single();

    if (error || !userData) {
        // User not found in database - not authorized
        redirect('/');
    }

    // Type assertion for role
    const userRole = (userData as any).role as string;

    // Only 'owner' and 'support' roles can access admin
    if (userRole !== 'owner' && userRole !== 'support') {
        redirect('/');
    }

    // User is authorized - load dashboard
    const stats = await getDashboardStatsAction();

    return (
        <DashboardClient data={stats} />
    );
}
