
import { getDashboardStatsAction } from "@/app/actions";
import DashboardClient from "./DashboardClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
    const supabase = await createClient();

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        // Not logged in - redirect to login
        redirect('/login');
    }

    // Check user role from database
    const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('email', session.user.email)
        .single();

    if (error || !userData) {
        // User not found in database - not authorized
        redirect('/');
    }

    // Only 'owner' and 'support' roles can access admin
    if (userData.role !== 'owner' && userData.role !== 'support') {
        redirect('/');
    }

    // User is authorized - load dashboard
    const stats = await getDashboardStatsAction();

    return (
        <DashboardClient data={stats} />
    );
}

