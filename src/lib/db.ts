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
        hover_video: model.hoverVideo, // Map back if you add this column, waiting for schema check
        status: model.status,
        aspect_ratio: model.aspectRatio,
        tags: model.tags,
        focus_point: model.focusPoint,
        sections: model.sections,
        variants: model.variants, // Add column if needed
        supplier: model.supplier // Add column if needed
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
    try {
        const supabase = await createClient();
        // Dynamic column handling: If schema misses columns, this might fail unless we verify schema.
        // For now, mapping known fields.
        const dbRecord = toProductDB(product);

        // Remove undefined keys to let defaults handle it or avoid errors
        Object.keys(dbRecord).forEach(key => (dbRecord as any)[key] === undefined && delete (dbRecord as any)[key]);

        const { error } = await supabase
            .from('products')
            .upsert(dbRecord);

        if (error) console.error('❌ Save Product Failed:', error);
    } catch (e) {
        console.error('❌ DB Exception:', e);
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
    try {
        const supabase = await createClient();
        const dbRecord = toArticleDB(article);

        const { error } = await supabase
            .from('articles')
            .upsert(dbRecord);

        if (error) console.error('❌ Save Article Failed:', error);
    } catch (e) { console.error(e); }
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
    try {
        const supabase = await createClient();
        // Assuming ID 1 for single layout
        await supabase
            .from('homepage_layout')
            .upsert({ id: 1, sections: layout.sections });
    } catch (e) { console.error(e); }
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
    try {
        const supabase = await createClient();
        const dbRecord = toOrderDB(order);
        const { error } = await supabase.from('orders').upsert(dbRecord);
        if (error) console.error('❌ Save Order Failed:', error);
    } catch (e) { console.error(e); }
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
    // This function is tricky because `users` table is linked to `auth.users`
    // We usually only update profile data here.
    // If 'user' object has 'email', we might rely on triggers or just update what we can.
    try {
        const supabase = await createClient();

        // Only update fields allowed in public.users
        const updateData: any = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        };

        const { error } = await supabase.from('users').upsert(updateData);
        if (error) console.error('❌ Save User Failed:', error);
    } catch (e) { console.error(e); }
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

        // Map snake_case to camelCase if frontend needs it
        return data.map((t: any) => ({
            id: t.id,
            customerName: t.customer_name,
            customerEmail: t.customer_email,
            subject: t.subject,
            message: t.message, // Initial message, might be in messages array too
            messages: t.messages || [],
            status: t.status,
            createdAt: t.created_at,
            type: t.subject, // Map subject to type if needed
            department: 'General' // Default
        }));
    } catch (e) { return []; }
}

export async function saveTicket(ticket: any) {
    try {
        const supabase = await createClient();
        const dbRecord = {
            id: ticket.id,
            customer_name: ticket.customerName || 'Guest',
            customer_email: ticket.customerEmail || ticket.user_email,
            subject: ticket.type || ticket.subject || 'Support Request',
            message: ticket.messages?.[0]?.content || 'Start',
            status: ticket.status,
            messages: ticket.messages
        };

        const { error } = await supabase.from('tickets').upsert(dbRecord);
        if (error) console.error('❌ Save Ticket Failed:', error);
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
