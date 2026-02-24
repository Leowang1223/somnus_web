import { createClient } from '@/lib/supabase/server';

// ==========================================
// 🛠️ Helpers for Data Mapping
// ==========================================

// Product Mapping
function toProductModel(record: any) {
    if (!record) return null;
    return {
        ...record,
        aspectRatio: record.aspect_ratio || '4:5',
        focusPoint: record.focus_point || { x: 50, y: 50 },
        // Ensure arrays are arrays (Supabase might return null for empty jsonb)
        tags: record.tags || [],
        sections: record.sections || [],
        variants: record.variants || [],
        supplier: record.supplier || {}
    };
}

function toProductDB(model: any) {
    return {
        id: model.id,
        slug: model.slug,
        name: model.name,
        price: model.price,
        cost: model.cost,
        category: model.category,
        description: model.description,
        image: model.image,
        hover_video: model.hoverVideo,
        status: model.status,
        aspect_ratio: model.aspectRatio,
        tags: model.tags,
        focus_point: model.focusPoint,
        sections: model.sections,
        variants: model.variants,
        supplier: model.supplier,
        // Multi-language fields
        name_zh: model.name_zh,
        name_jp: model.name_jp,
        name_ko: model.name_ko,
        description_zh: model.description_zh,
        description_jp: model.description_jp,
        description_ko: model.description_ko,
        // Preorder fields
        is_preorder: model.is_preorder,
        preorder_start_date: model.preorder_start_date,
        preorder_end_date: model.preorder_end_date,
        expected_ship_date: model.expected_ship_date,
        preorder_limit: model.preorder_limit,
        preorder_sold: model.preorder_sold,
        preorder_deposit_percentage: model.preorder_deposit_percentage,
    };
}

// Order Mapping
function toOrderModel(record: any) {
    if (!record) return null;
    return {
        id: record.id,
        customerName: record.customer_name,
        customerEmail: record.customer_email,
        customerPhone: record.customer_phone,
        shippingInfo: record.shipping_address || {},
        items: record.items || [],
        total: record.total,
        status: record.status,
        date: record.date,
        timeline: record.timeline || [],
        trackingInfo: {
            carrier: record.tracking_carrier,
            trackingNumber: record.tracking_number,
            url: record.tracking_url
        },
        // 預購欄位
        has_preorder: record.has_preorder || false,
        preorder_info: record.preorder_info || {},
        deposit_amount: record.deposit_amount || 0,
        remaining_amount: record.remaining_amount || 0,
        // 會計欄位
        order_type: record.order_type || 'stock',
        currency: record.currency || 'TWD',
        exchange_rate: record.exchange_rate || 1.0,
        subtotal: record.subtotal,
        tax_amount: record.tax_amount || 0,
        shipping_fee: record.shipping_fee || 0,
        total_amount: record.total_amount,
        customer_country: record.customer_country || 'TW',
        customer_type: record.customer_type || 'B2C',
        tax_id: record.tax_id,
        company_name: record.company_name,
        invoice_required: record.invoice_required || false,
        invoice_type: record.invoice_type,
        invoice_number: record.invoice_number,
        invoice_issued_at: record.invoice_issued_at,
        tax_rate: record.tax_rate || 5.0,
        tax_type: record.tax_type || 'taxable',
        is_fulfilled: record.is_fulfilled || false,
        fulfilled_at: record.fulfilled_at,
        deferred_revenue: record.deferred_revenue || 0,
        recognized_revenue: record.recognized_revenue || 0,
        preorder_batch_id: record.preorder_batch_id,
        // 追蹤欄位
        estimated_delivery_date: record.estimated_delivery_date,
        last_status_update: record.last_status_update,
        notification_sent: record.notification_sent || [],
        can_cancel_until: record.can_cancel_until,
        customer_notes: record.customer_notes,
        is_flagged: record.is_flagged || false,
        flag_reason: record.flag_reason,
        flag_priority: record.flag_priority,
        assigned_to: record.assigned_to,
    };
}

function toOrderDB(model: any) {
    const record: any = {
        id: model.id,
        customer_name: model.customerName || model.shippingInfo?.fullName || 'Guest',
        customer_email: model.customerEmail || model.shippingInfo?.email || model.email,
        customer_phone: model.customerPhone || model.shippingInfo?.phone,
        shipping_address: model.shippingInfo || model.shippingAddress || {},
        items: model.items,
        total: model.total,
        status: model.status,
        date: model.date,
        timeline: model.timeline,
        tracking_carrier: model.trackingInfo?.carrier,
        tracking_number: model.trackingInfo?.trackingNumber,
        tracking_url: model.trackingInfo?.url,
        // 預購欄位
        has_preorder: model.has_preorder,
        preorder_info: model.preorder_info,
        deposit_amount: model.deposit_amount,
        remaining_amount: model.remaining_amount,
        // 會計欄位
        order_type: model.order_type,
        currency: model.currency,
        exchange_rate: model.exchange_rate,
        subtotal: model.subtotal,
        tax_amount: model.tax_amount,
        shipping_fee: model.shipping_fee,
        total_amount: model.total_amount,
        customer_country: model.customer_country,
        customer_type: model.customer_type,
        tax_id: model.tax_id,
        company_name: model.company_name,
        invoice_required: model.invoice_required,
        invoice_type: model.invoice_type,
        invoice_number: model.invoice_number,
        invoice_issued_at: model.invoice_issued_at,
        tax_rate: model.tax_rate,
        tax_type: model.tax_type,
        is_fulfilled: model.is_fulfilled,
        fulfilled_at: model.fulfilled_at,
        deferred_revenue: model.deferred_revenue,
        recognized_revenue: model.recognized_revenue,
        preorder_batch_id: model.preorder_batch_id,
        // 追蹤欄位
        estimated_delivery_date: model.estimated_delivery_date,
        last_status_update: model.last_status_update,
        notification_sent: model.notification_sent,
        can_cancel_until: model.can_cancel_until,
        customer_notes: model.customer_notes,
        is_flagged: model.is_flagged,
        flag_reason: model.flag_reason,
        flag_priority: model.flag_priority,
        assigned_to: model.assigned_to,
    };
    // Remove undefined keys to avoid overwriting existing data
    Object.keys(record).forEach(key => record[key] === undefined && delete record[key]);
    return record;
}

// Article Mapping
function toArticleModel(record: any) {
    if (!record) return null;
    return {
        ...record,
        readTime: record.read_time || record.readTime,
        metaTitle: record.meta_title,
        metaDescription: record.meta_description,
        coverImage: record.cover_image,
        image: record.cover_image || record.image,
        tags: record.tags || [],
    };
}

function toArticleDB(model: any) {
    return {
        id: model.id,
        slug: model.slug,
        title: model.title,
        snippet: model.snippet,
        cover_image: model.image || model.coverImage,
        category: model.category,
        author: model.author,
        date: model.date,
        status: model.status,
        sections: model.sections,
        tags: model.tags || [],
        read_time: model.readTime,
        meta_title: model.metaTitle,
        meta_description: model.metaDescription,
    };
}


// ==========================================
// 📦 Products
// ==========================================
export async function getProducts() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ DB: getProducts failed:', error);
            return [];
        }
        return data.map(toProductModel);
    } catch (e) {
        console.error('❌ DB Exception:', e);
        return [];
    }
}

export async function getProductBySlug(slug: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) return null;
        return toProductModel(data);
    } catch (e) { return null; }
}

export async function saveProduct(product: any) {
    const supabase = await createClient();
    const dbRecord = toProductDB(product);

    Object.keys(dbRecord).forEach(key => (dbRecord as any)[key] === undefined && delete (dbRecord as any)[key]);

    const { error } = await supabase
        .from('products')
        .upsert(dbRecord as any);

    if (error) {
        console.error('❌ Save Product Failed:', error);
        throw new Error(error.message);
    }
}

export async function deleteProduct(id: string) {
    try {
        const supabase = await createClient();
        await supabase.from('products').delete().eq('id', id);
    } catch (e) { console.error(e); }
}

// ==========================================
// 📝 Articles (Journal)
// ==========================================
export async function getArticles() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .order('date', { ascending: false });

        if (error) return [];
        return data.map(toArticleModel);
    } catch (e) { return []; }
}

export async function saveArticle(article: any) {
    const supabase = await createClient();
    const dbRecord = toArticleDB(article);

    const { error } = await supabase
        .from('articles')
        .upsert(dbRecord as any);

    if (error) {
        console.error('❌ Save Article Failed:', error);
        throw new Error(error.message);
    }
}

export async function deleteArticle(id: string) {
    try {
        const supabase = await createClient();
        await supabase.from('articles').delete().eq('id', id);
    } catch (e) { console.error(e); }
}

// ==========================================
// 🏠 Homepage Layout
// ==========================================
export async function getHomeLayout() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('homepage_layout')
            .select('*')
            .limit(1)
            .single();

        if (error || !data) return { sections: [] };
        return data; // sections is already jsonb
    } catch (e) { return { sections: [] }; }
}

export async function saveHomeLayout(layout: any) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('homepage_layout')
        .upsert({ id: 1, sections: layout.sections });

    if (error) {
        console.error("❌ saveHomeLayout failed:", error);
        throw new Error(error.message);
    }
}

// ==========================================
// 🛍️ Order Management
// ==========================================
export async function getOrders() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('date', { ascending: false });

        if (error) return [];
        return data.map(toOrderModel);
    } catch (e) { return []; }
}

export async function saveOrder(order: any) {
    const supabase = await createClient();
    const dbRecord = toOrderDB(order);
    const { error } = await supabase.from('orders').upsert(dbRecord);
    if (error) {
        console.error('❌ Save Order Failed:', error);
        throw new Error(error.message);
    }
}

// ==========================================
// 👥 User Management
// ==========================================
export async function getUsers() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .select('*, id') // id is uuid here
            .order('created_at', { ascending: false });

        if (error) return [];
        // Map to flat structure if needed, or keep as is.
        // Frontend expects: { id, email, role, name, ... }
        return data;
    } catch (e) { return []; }
}

export async function saveUser(user: any) {
    const supabase = await createClient();

    const updateData: any = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
    };

    const { error } = await supabase.from('users').upsert(updateData);
    if (error) {
        console.error('❌ Save User Failed:', error);
        throw new Error(error.message);
    }
}

export async function deleteUser(id: string) {
    try {
        const supabase = await createClient();
        // Note: Deleting from public.users DOES NOT delete from auth.users usually.
        // But cascading might verify this. 
        // For admin panel banning, we might want to delete from auth.
        // Using service role might be needed for full delete.
        await supabase.from('users').delete().eq('id', id);
    } catch (e) { console.error(e); }
}

// ==========================================
// 🎫 Customer Service Tickets
// ==========================================
export async function getTickets() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return [];

        return data.map((t: any) => ({
            id: t.id,
            type: t.type,
            department: t.department || 'General',
            status: t.status,
            orderId: t.order_id,
            messages: t.messages || [],
            userEmail: t.user_email,
            assignedTo: t.assigned_to,
            createdAt: t.created_at,
            updatedAt: t.updated_at
        }));
    } catch (e) { return []; }
}

export async function saveTicket(ticket: any) {
    try {
        const supabase = await createClient();
        const dbRecord: any = {
            id: ticket.id,
            type: ticket.type,
            department: ticket.department,
            status: ticket.status,
            order_id: ticket.orderId || ticket.order_id,
            messages: ticket.messages,
            user_email: ticket.userEmail || ticket.user_email,
            assigned_to: ticket.assignedTo || ticket.assigned_to
        };

        // Remove undefined keys
        Object.keys(dbRecord).forEach(key => dbRecord[key] === undefined && delete dbRecord[key]);

        const { error } = await supabase.from('tickets').upsert(dbRecord);
        if (error) console.error('Save Ticket Failed:', error);
    } catch (e) { console.error(e); }
}

// ==========================================
// 📊 Analytics
// ==========================================
export async function getAnalytics() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('analytics')
            .select('*')
            .single();

        if (error || !data) return { totalVisitors: 0, dailyVisits: {} };

        return {
            totalVisitors: data.total_visitors,
            dailyVisits: data.daily_visits
        };
    } catch (e) { return { totalVisitors: 0, dailyVisits: {} }; }
}

export async function updateAnalytics(data: any) {
    try {
        const supabase = await createClient();
        // Fetch current first to merge
        const current = await getAnalytics();

        await supabase
            .from('analytics')
            .upsert({
                id: 1,
                total_visitors: data.totalVisitors || current.totalVisitors,
                daily_visits: data.dailyVisits || current.dailyVisits
            });
    } catch (e) { console.error(e); }
}

// ==========================================
// 💳 Payments (金流)
// ==========================================
export async function getPayments() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return [];
        return data;
    } catch (e) { return []; }
}

export async function getPaymentsByOrder(orderId: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data;
    } catch (e) { return []; }
}

export async function savePayment(payment: any) {
    const supabase = await createClient();
    const record = { ...payment };
    Object.keys(record).forEach(key => record[key] === undefined && delete record[key]);
    const { error } = await supabase.from('payments').upsert(record);
    if (error) { console.error('Save Payment Failed:', error); throw new Error(error.message); }
}

// ==========================================
// 🚚 Shipments (物流)
// ==========================================
export async function getShipments() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('shipments')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return [];
        return data;
    } catch (e) { return []; }
}

export async function getShipmentsByOrder(orderId: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('shipments')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data;
    } catch (e) { return []; }
}

export async function getShipmentByTracking(trackingNumber: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('shipments')
            .select('*, orders(*)')
            .eq('tracking_number', trackingNumber)
            .single();
        if (error) return null;
        return data;
    } catch (e) { return null; }
}

export async function saveShipment(shipment: any) {
    const supabase = await createClient();
    const record = { ...shipment };
    Object.keys(record).forEach(key => record[key] === undefined && delete record[key]);
    const { error } = await supabase.from('shipments').upsert(record);
    if (error) { console.error('Save Shipment Failed:', error); throw new Error(error.message); }
}

// ==========================================
// 💸 Refunds (退款)
// ==========================================
export async function getRefunds() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('refunds')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return [];
        return data;
    } catch (e) { return []; }
}

export async function getRefundsByOrder(orderId: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('refunds')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data;
    } catch (e) { return []; }
}

export async function saveRefund(refund: any) {
    const supabase = await createClient();
    const record = { ...refund };
    Object.keys(record).forEach(key => record[key] === undefined && delete record[key]);
    const { error } = await supabase.from('refunds').upsert(record);
    if (error) { console.error('Save Refund Failed:', error); throw new Error(error.message); }
}

// ==========================================
// 🏷️ Order Tags (訂單標籤)
// ==========================================
export async function getOrderTags(orderId: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('order_tags')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data;
    } catch (e) { return []; }
}

export async function addOrderTag(tag: any) {
    const supabase = await createClient();
    const { error } = await supabase.from('order_tags').insert(tag);
    if (error) { console.error('Add Order Tag Failed:', error); throw new Error(error.message); }
}

export async function removeOrderTag(tagId: number) {
    try {
        const supabase = await createClient();
        await supabase.from('order_tags').delete().eq('id', tagId);
    } catch (e) { console.error(e); }
}
