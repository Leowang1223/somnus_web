import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PreordersClient from "./PreordersClient";

export default async function PreordersPage() {
    const supabase = await createClient();

    // 驗證管理員權限
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
        redirect('/login');
    }

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('email', session.user.email)
        .single();

    if (!userData || (userData.role !== 'owner' && userData.role !== 'support')) {
        redirect('/');
    }

    // 獲取所有預購產品
    const { data: preorderProducts } = await supabase
        .from('products')
        .select('*')
        .eq('is_preorder', true)
        .order('preorder_start_date', { ascending: false });

    // 獲取所有訂單（用於篩選預購訂單）
    const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('has_preorder', true)
        .order('date', { ascending: false });

    return (
        <PreordersClient
            products={preorderProducts || []}
            orders={allOrders || []}
        />
    );
}
