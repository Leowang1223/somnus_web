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
        shippingAddress: record.shipping_address,
        items: record.items || [],
        total: record.total,
        status: record.status,
        date: record.date,
        timeline: record.timeline || [],
        trackingInfo: {
            carrier: record.tracking_carrier,
            trackingNumber: record.tracking_number,
            url: record.tracking_url
        }
    };
}

function toOrderDB(model: any) {
    return {
        id: model.id,
        customer_name: model.customerName || model.billingDetails?.name || 'Guest',
        customer_email: model.customerEmail || model.email,
        customer_phone: model.customerPhone || model.billingDetails?.phone,
        shipping_address: model.shippingAddress || {},
        items: model.items,
        total: model.total,
        status: model.status,
        date: model.date,
        timeline: model.timeline,
        tracking_carrier: model.trackingInfo?.carrier,
        tracking_number: model.trackingInfo?.trackingNumber,
        tracking_url: model.trackingInfo?.url
    };
}

// Article Mapping
function toArticleModel(record: any) {
    if (!record) return null;
    return {
        ...record,
        readTime: record.read_time, // If column exists
        metaTitle: record.meta_title,
        metaDescription: record.meta_description,
        coverImage: record.cover_image,
        // Using 'image' in frontend mostly? The schema says cover_image.
        // Let's assume frontend might look for 'image' or 'coverImage'
        image: record.cover_image || record.image
    };
}

function toArticleDB(model: any) {
    return {
        id: model.id,
        slug: model.slug,
        title: model.title,
        snippet: model.snippet,
        cover_image: model.image || model.coverImage,
        author: model.author,
        date: model.date,
        status: model.status,
        sections: model.sections,
        meta_title: model.metaTitle,
        meta_description: model.metaDescription,
        // read_time: model.readTime // Add col if needed
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
        .upsert(dbRecord);

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
