'use server';

import { revalidatePath } from "next/cache";
import * as db from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// ==========================================
// 📂 File Upload Action
// ==========================================
export async function uploadFileAction(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const prefix = formData.get('prefix') as string || 'somnus';
        if (!file) throw new Error("No file uploaded");

        // Read file as buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate clean filename
        const cleanPrefix = prefix.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const cleanFilename = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-');
        const filename = `${cleanPrefix}-${Date.now()}-${cleanFilename}`;

        // Upload to Supabase Storage
        const supabase = await createClient();

        const { data, error } = await supabase.storage
            .from('images') // Make sure this bucket exists in Supabase
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error("❌ Supabase upload failed:", error);
            throw new Error(error.message);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filename);

        console.log("✅ File uploaded successfully to Supabase:", publicUrl);
        return { url: publicUrl };
    } catch (error: any) {
        console.error("❌ Upload Action Failed:", error);
        return { error: `Upload failed: ${error.message || String(error)}` };
    }
}

export async function updateHomeLayoutAction(sections: any[]) {
    try {
        await db.saveHomeLayout({ sections });
        revalidatePath('/');
        return { success: true };
    } catch (e) { return { success: false, error: "Not supported in static build" }; }
}

export async function updateProductSectionsAction(id: string, sections: any[]) {
    try {
        const products = await db.getProducts();
        const product = products.find((p: any) => p.id === id);
        if (product) {
            product.sections = sections;
            await db.saveProduct(product);
            revalidatePath(`/product/${product.slug}`);
        }
        return { success: true };
    } catch (e) { return { success: false }; }
}

export async function updateArticleSectionsAction(id: string, sections: any[]) {
    try {
        const articles = await db.getArticles();
        const article = articles.find((a: any) => a.id === id);
        if (article) {
            article.sections = sections;
            await db.saveArticle(article);
            revalidatePath(`/journal`);
            revalidatePath(`/journal/${article.slug}`);
            return { success: true };
        }
        return { success: false };
    } catch (e) { return { success: false }; }
}

// ==========================================
// 🧠 AI Actions
// ==========================================
import { translateContent } from "@/lib/gemini";

export async function autoTranslateAction(text: string, sourceLang: string, targetLangs: ('zh' | 'jp' | 'ko' | 'en')[]) {
    try {
        const results: Record<string, string> = {};

        // Parallel execution for speed
        await Promise.all(targetLangs.map(async (lang) => {
            if (lang !== sourceLang) {
                results[lang] = await translateContent(text, lang);
            }
        }));

        return { success: true, translations: results };
    } catch (e) {
        console.error("Auto Translate Action Failed", e);
        return { success: false };
    }
}

// ==========================================
// 🎟️ Ticket & Chat Actions
// ==========================================

export async function submitTicketAction(formData: FormData) {
    try {
        const supabase = await createClient(); // Use server client

        const type = formData.get('type') as string;
        const message = formData.get('message') as string;
        const orderId = formData.get('orderId') as string;
        const department = formData.get('department') as string || 'General';

        // Get current user if logged in
        const { data: { session } } = await supabase.auth.getSession();
        const userEmail = session?.user?.email;

        const ticket = {
            id: `tkt-${Date.now()}`,
            type,
            department,
            status: 'pending',
            order_id: orderId || null,
            messages: [
                { id: `msg-${Date.now()}`, sender: 'user', content: message, timestamp: Date.now() }
            ],
            user_email: userEmail || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Insert into Supabase
        const { error } = await supabase
            .from('tickets')
            .insert(ticket)
            .select()
            .single();

        if (error) {
            console.error('❌ Failed to save ticket:', error);
            return { success: false };
        }

        return { success: true, ticketId: ticket.id };
    } catch (e) {
        console.error('Exception submitting ticket:', e);
        return { success: false };
    }
}

export async function replyToTicketAction(ticketId: string, content: string, sender: 'user' | 'admin') {
    try {
        const supabase = await createClient();

        // 1. Fetch current ticket messages
        const { data: ticket, error: fetchError } = await supabase
            .from('tickets')
            .select('messages')
            .eq('id', ticketId)
            .single();

        if (fetchError || !ticket) {
            console.error('❌ Ticket not found:', fetchError);
            return { success: false };
        }

        // 2. Append new message
        const newMessages = [
            ...(ticket.messages as any[] || []),
            {
                id: `msg-${Date.now()}`,
                sender,
                content,
                timestamp: Date.now()
            }
        ];

        // 3. Update ticket
        const { error: updateError } = await supabase
            .from('tickets')
            .update({
                messages: newMessages,
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);

        if (updateError) {
            console.error('❌ Failed to update ticket:', updateError);
            return { success: false };
        }

        revalidatePath('/admin/cs');
        return { success: true };
    } catch (e) {
        console.error('Exception replying to ticket:', e);
        return { success: false };
    }
}

export async function claimTicketAction(ticketId: string, adminId: string) {
    try {
        const tickets = await db.getTickets();
        const ticket = tickets.find((t: any) => t.id === ticketId);

        if (ticket) {
            ticket.assignedTo = adminId;
            ticket.status = 'open'; // Switch to open once claimed
            await db.saveTicket(ticket);
            revalidatePath('/admin/cs');
        }
        return { success: true };
    } catch (e) { return { success: false }; }
}

export async function getTicketUpdatesAction(ticketId: string) {
    try {
        const tickets = await db.getTickets();
        const ticket = tickets.find((t: any) => t.id === ticketId);
        return { success: true, ticket };
    } catch (e) { return { success: false }; }
}

export async function updateTicketStatusAction(id: string, status: string) {
    try {
        const tickets = await db.getTickets();
        const ticket = tickets.find((t: any) => t.id === id);

        if (ticket) {
            ticket.status = status;
            await db.saveTicket(ticket);
            revalidatePath('/admin/cs');
        }
        return { success: true };
    } catch (e) { return { success: false }; }
}

export async function getAdminTicketsAction() {
    try {
        const tickets = await db.getTickets();
        return { tickets, success: true };
    } catch (e) { return { tickets: [], success: false }; }
}

export async function updateProductAction(formData: FormData) {
    try {
        const products = await db.getProducts();
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const existingProduct = products.find((p: any) => p.id === id);

        const tagsInput = formData.get('tags') as string;
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
        const focusPointInput = formData.get('focusPoint') as string;
        const focusPoint = focusPointInput ? JSON.parse(focusPointInput) : { x: 50, y: 50 };

        // Parse Variants (Colors) and Supplier Data
        const variantsInput = formData.get('variants') as string;
        const variants = variantsInput ? JSON.parse(variantsInput) : [];
        const supplierInput = formData.get('supplier') as string;
        const supplier = supplierInput ? JSON.parse(supplierInput) : {};

        const product = {
            ...existingProduct,
            id: id || `prod-${Date.now()}`,
            name: name,
            price: Number(formData.get('price')),
            cost: Number(formData.get('cost')) || 0,
            category: formData.get('category') as string,
            description: formData.get('description') as string,
            image: formData.get('image') as string || existingProduct?.image,
            hoverVideo: formData.get('hoverVideo') as string || existingProduct?.hoverVideo,
            status: (formData.get('status') as any) || existingProduct?.status || 'draft',
            aspectRatio: (formData.get('aspectRatio') as any) || existingProduct?.aspectRatio || '4:5',
            tags: tags,
            focusPoint: focusPoint,
            variants: variants,
            supplier: supplier,
            // Only update sections if it's a new product or explicitly needed... usually we keep existing sections
            sections: existingProduct?.sections || [
                { id: `hero-${Date.now()}`, type: 'hero', isEnabled: true, content: { title: name, subtitle: formData.get('category') as string, ctaText: "Explore Ritual", ctaLink: "" } },
                { id: `purchase-${Date.now()}`, type: 'purchase', isEnabled: true, content: {} }
            ]
        };

        // --- 🛡️ Robust Slug Generation ---
        let finalSlug = existingProduct?.slug;

        // If no slug exists, or it's invalid/placeholder, generate a new one
        if (!finalSlug || finalSlug === '--' || finalSlug.trim() === '') {
            // 1. Try to generate from English name content (if any)
            let candidate = name.toLowerCase().trim()
                .replace(/[^a-z0-9]/g, '-') // replace non-alphanumeric with hyphen
                .replace(/-+/g, '-')        // consolidate hyphens
                .replace(/^-|-$/g, '');     // trim leading/trailing hyphens

            // 2. If candidate is empty (e.g. Pure Chinese Name), use 'product-{timestamp}'
            if (!candidate) {
                candidate = `product-${Date.now()}`;
            }

            finalSlug = candidate;
        }

        // 3. Ensure Uniqueness
        let uniqueSlug = finalSlug;
        let counter = 1;
        while (products.some((p: any) => p.slug === uniqueSlug && p.id !== product.id)) {
            uniqueSlug = `${finalSlug}-${counter}`;
            counter++;
        }
        product.slug = uniqueSlug;
        // ------------------------------------

        // Preserve multi-lang fields
        ['zh', 'jp', 'ko'].forEach(lang => {
            const nameKey = `name_${lang}`;
            const descKey = `description_${lang}`;
            product[nameKey] = formData.get(nameKey) as string || existingProduct?.[nameKey];
            product[descKey] = formData.get(descKey) as string || existingProduct?.[descKey];
        });

        await db.saveProduct(product);
        revalidatePath('/admin/products');
        revalidatePath('/collection');
        if (product.slug) revalidatePath(`/product/${product.slug}`);

        return { success: true };
    } catch (e) { console.error(e); return { success: false }; }
}

export async function getDashboardStatsAction() {
    try {
        const orders = await db.getOrders();
        const users = await db.getUsers();
        const analytics = await db.getAnalytics();

        return {
            orders,
            users,
            analytics,
            success: true
        };
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        return { success: false, orders: [], users: [], analytics: { totalVisitors: 0 } };
    }
}

export async function updateArticleAction(formData: FormData) {
    try {
        const articles = await db.getArticles();
        const id = formData.get('id') as string;
        const title = formData.get('title') as string;
        const existingArticle = articles.find((a: any) => a.id === id);

        const tagsInput = formData.get('tags') as string;
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];

        const article = {
            ...existingArticle,
            id: id || `art-${Date.now()}`,
            title: title,
            category: formData.get('category') as string || existingArticle?.category || 'Ritual',
            readTime: formData.get('readTime') as string || existingArticle?.readTime || '5 min read',
            snippet: formData.get('snippet') as string,
            image: formData.get('image') as string || existingArticle?.image,
            status: (formData.get('status') as any) || existingArticle?.status || 'draft',
            slug: title.toLowerCase().trim().replace(/[^a-z0-9]/g, '-'),
            tags: tags,
            metaTitle: formData.get('metaTitle') as string,
            metaDescription: formData.get('metaDescription') as string,
            date: existingArticle?.date || new Date().toISOString().split('T')[0],
            sections: existingArticle?.sections || [
                { id: `hero-${Date.now()}`, type: 'hero', isEnabled: true, content: { title: title, subtitle: "A SØMNS Editorial", ctaText: "", ctaLink: "" } },
                { id: `content-${Date.now()}`, type: 'richText', isEnabled: true, content: { text: "Begin your story here..." } }
            ]
        };

        await db.saveArticle(article);
        revalidatePath('/admin/journal');
        revalidatePath('/journal');
        if (article.slug) revalidatePath(`/journal/${article.slug}`);

        return { success: true };
    } catch (e) { return { success: false }; }
}

export async function deleteArticlesAction(articleIds: string[]) {
    'use server';
    try {
        for (const id of articleIds) {
            await db.deleteArticle(id);
        }

        revalidatePath('/admin/journal');
        revalidatePath('/journal');

        return { success: true };
    } catch (e) {
        console.error('Delete articles error:', e);
        return { success: false };
    }
}

export async function translateAction(text: string, targetLang: string) {
    if (typeof window !== 'undefined') return { translated: `[${targetLang}] ${text}` };
    console.log(`Translating to ${targetLang}: ${text}`);

    const mocks: Record<string, Record<string, string>> = {
        'zh': {
            'Home': '首頁',
            'Shop': '商店',
            'Journal': '日誌',
            'Add to Ritual': '加入儀式',
            'Buy Now': '馬上購買'
        },
        'en': {
            '首頁': 'Home',
            '商店': 'Shop',
            '加入儀式': 'Add to Ritual'
        }
    };

    const translated = mocks[targetLang]?.[text] || `[${targetLang}] ${text}`;
    return { translated };
}

export async function updateProductMetadataAction(id: string, metadata: any) {
    try {
        const products = await db.getProducts();
        const product = products.find((p: any) => p.id === id);
        if (product) {
            if (metadata.name) {
                product.name = metadata.name;
                product.slug = metadata.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
            }
            if (metadata.price !== undefined) product.price = Number(metadata.price);
            if (metadata.category) product.category = metadata.category;

            await db.saveProduct(product);
            revalidatePath('/admin/products');
            revalidatePath('/collection');
            revalidatePath(`/product/${product.slug}`);
        }
        return { success: true };
    } catch (e) { return { success: false }; }
}

export async function updateArticleMetadataAction(id: string, metadata: any) {
    try {
        const articles = await db.getArticles();
        const article = articles.find((a: any) => a.id === id);
        if (article) {
            if (metadata.title) {
                article.title = metadata.title;
                article.slug = metadata.title.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
            }
            if (metadata.snippet !== undefined) article.snippet = metadata.snippet;
            if (metadata.metaTitle !== undefined) article.metaTitle = metadata.metaTitle;
            if (metadata.metaDescription !== undefined) article.metaDescription = metadata.metaDescription;

            await db.saveArticle(article);
            revalidatePath('/admin/journal');
            revalidatePath('/journal');
            revalidatePath(`/journal/${article.slug}`);
        }
        return { success: true };
    } catch (e) { return { success: false }; }
}

// ==========================================
// 📦 Order & Logistics Actions
// ==========================================

export async function createOrderAction(orderData: any) {
    'use server';
    try {
        // Generate Order ID (e.g., SOM-240201-1234)
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const orderId = `SOM-${dateStr}-${randomSuffix}`;

        const products = await db.getProducts();

        // Enrich items with cost data at time of purchase
        const enrichedItems = orderData.items?.map((item: any) => {
            const product = products.find((p: any) => p.id === item.id);
            return {
                ...item,
                cost: product?.cost || 0 // Snapshot cost
            };
        }) || [];

        const newOrder = {
            id: orderId,
            date: new Date().toISOString(),
            status: 'paid', // Simulating instant payment
            ...orderData,
            items: enrichedItems,
            timeline: [
                { status: 'paid', date: new Date().toISOString(), note: 'Payment confirmed via Secure Ritual Checkout.' }
            ]
        };

        await db.saveOrder(newOrder);
        revalidatePath('/admin');
        revalidatePath('/admin/orders');

        return { success: true, orderId };
    } catch (e) {
        console.error("Create Order Failed:", e);
        return { success: false };
    }
}

export async function updateOrderStatusAction(orderId: string, status: string, trackingInfo?: any) {
    'use server';
    try {
        const orders = await db.getOrders();
        const order = orders.find((o: any) => o.id === orderId);

        if (order) {
            order.status = status;
            if (trackingInfo) {
                order.trackingInfo = { ...order.trackingInfo, ...trackingInfo };
            }

            // Add to timeline
            order.timeline.push({
                status,
                date: new Date().toISOString(),
                note: trackingInfo ? `Tracking: ${trackingInfo.trackingNumber} (${trackingInfo.carrier})` : `Status updated to ${status}`
            });

            await db.saveOrder(order);
            revalidatePath('/admin/orders');
            revalidatePath(`/track-order`);
            return { success: true };
        }
        return { success: false };
    } catch (e) { return { success: false }; }
}

export async function getOrderAction(orderId: string) {
    'use server';
    try {
        const orders = await db.getOrders();
        // Case-insensitive search for convenience
        const order = orders.find((o: any) => o.id.toLowerCase() === orderId.toLowerCase());

        if (order) {
            return { success: true, order };
        }
        return { success: false, error: 'Order not found' };
    } catch (e) { return { success: false }; }
}

export async function getAllOrdersAction() {
    'use server';
    try {
        const orders = await db.getOrders();
        // Sort by date desc
        return { success: true, orders: orders.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
    } catch (e) { return { success: false, orders: [] }; }
}

// --- User Management Actions ---

export async function loginAction(formData: FormData) {
    'use server';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        const supabase = await createClient();

        // Use Supabase Auth for real authentication
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Invalid credentials' };
        }

        if (!data.user) {
            return { success: false, error: 'No user returned' };
        }

        // Get user role from our database
        const { data: userData } = await supabase
            .from('users')
            .select('role, name')
            .eq('email', email)
            .single();

        const role = userData?.role || 'consumer';
        const name = userData?.name || data.user.email?.split('@')[0] || 'User';

        return {
            success: true,
            user: {
                email: data.user.email!,
                role,
                name
            }
        };
    } catch (e: any) {
        console.error('Login system error:', e);
        return { success: false, error: 'System error: ' + e.message };
    }
}

export async function getUsersAction() {
    'use server';
    try {
        const users = await db.getUsers();
        // Return without passwords (there are no passwords in public.users anyway)
        return { success: true, users: users };
    } catch (e) { return { success: false, users: [] }; }
}

export async function addUserAction(userData: any) {
    'use server';
    try {
        const users = await db.getUsers();

        if (users.find((u: any) => u.email === userData.email)) {
            return { success: false, error: 'User already exists' };
        }

        // Note: usage of db.saveUser here only updates public.users. 
        // Real user creation likely involves Supabase Auth SignUp which needs to happen on client or via admin API.
        // For now we just save the profile if it's what this action intends.
        const newUser = {
            id: `user-${Date.now()}`,
            ...userData,
            date: new Date().toISOString()
        };

        await db.saveUser(newUser);

        return { success: true, user: newUser };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to create user' };
    }
}

export async function deleteUserAction(userId: string) {
    'use server';
    try {
        await db.deleteUser(userId);
        return { success: true };
    } catch (e) { return { success: false }; }
}
