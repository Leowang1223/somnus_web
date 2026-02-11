import { getAdminTicketsAction } from "@/app/actions";
import TicketListClient from "./TicketListClient";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering to ensure fresh data
export const revalidate = 0;

export default async function AdminCSPage() {
    const { tickets } = await getAdminTicketsAction();

    // Get current admin info
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const adminEmail = session?.user?.email || 'unknown';
    const adminId = session?.user?.id || 'unknown';

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="font-display text-4xl mb-2">CS Command Center</h1>
                    <p className="text-gray-500 text-sm">Manage support inquiries and return authorizations.</p>
                </div>
            </header>

            <TicketListClient
                tickets={tickets || []}
                adminEmail={adminEmail}
                adminId={adminId}
            />
        </div>
    );
}
