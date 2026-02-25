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
            .from('somnus')
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
            .from('somnus')
            .getPublicUrl(filename);

        console.log("✅ File uploaded successfully to Supabase:", publicUrl);
        return { url: publicUrl };
    } catch (error: any) {
        console.error("❌ Upload Action Failed:", error);
        return { error: `Upload failed: ${error.message || String(error)}` };
    }
}

// ==========================================
// 🔐 Auth Actions
// ==========================================
export async function logoutAction() {
    try {
        const supabase = await createClient();
        await supabase.auth.signOut();
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function updateHomeLayoutAction(sections: any[]) {
    try {
        await db.saveHomeLayout({ sections });
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error("❌ updateHomeLayoutAction failed:", e);
        return { success: false, error: e.message || "儲存佈局時出錯" };
    }
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

const ACTIVE_TICKET_STATUSES = ['pending', 'open', 'resolved'] as const;

function buildTicketPreviewFromMessage(msg: any) {
    const raw = (msg?.content || '').toString().trim();
    if (raw) return raw.slice(0, 200);
    if (msg?.image_url) return '[image]';
    return '';
}

function mapTicketRecord(t: any) {
    const lastMessageAt = t.last_message_at || t.updated_at || t.created_at || null;
    const adminLastReadAt = t.admin_last_read_at || null;
    const customerLastReadAt = t.customer_last_read_at || null;
    return {
        id: t.id,
        type: t.type,
        department: t.department || 'General',
        status: t.status,
        orderId: t.order_id,
        messages: t.messages || [],
        userEmail: t.user_email,
        assignedTo: t.assigned_to,
        assignedAt: t.assigned_at,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        lastMessageAt,
        lastMessagePreview: t.last_message_preview || '',
        lastMessageSender: t.last_message_sender || null,
        customerLastReadAt,
        adminLastReadAt,
        hasUnreadForAdmin: !!(lastMessageAt && t.last_message_sender === 'user' && (!adminLastReadAt || new Date(lastMessageAt) > new Date(adminLastReadAt))),
        hasUnreadForCustomer: !!(lastMessageAt && t.last_message_sender === 'admin' && (!customerLastReadAt || new Date(lastMessageAt) > new Date(customerLastReadAt))),
    };
}

async function findActiveTicketByUserEmail(supabase: any, userEmail: string) {
    const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_email', userEmail)
        .in('status', [...ACTIVE_TICKET_STATUSES])
        .order('last_message_at', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1);
    if (error) return { ticket: null, error };
    return { ticket: data?.[0] || null, error: null };
}

export async function getMyActiveTicketAction() {
    try {
        const authClient = await createClient();
        const { data: { session } } = await authClient.auth.getSession();
        const userEmail = session?.user?.email ?? null;
        if (!userEmail) return { success: true, ticket: null };

        const { createAdminClient } = await import('@/lib/supabase/admin');
        const supabase = createAdminClient();
        const { ticket, error } = await findActiveTicketByUserEmail(supabase, userEmail);
        if (error) return { success: false, error: error.message || 'Failed to fetch active ticket' };
        return { success: true, ticket: ticket ? mapTicketRecord(ticket) : null };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Failed to fetch active ticket' };
    }
}

export async function submitTicketAction(formData: FormData) {
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const supabase = createAdminClient(); // service_role: bypasses RLS so guests can submit

        const type = formData.get('type') as string;
        const message = formData.get('message') as string;
        const imageUrl = formData.get('imageUrl') as string;
        const orderId = formData.get('orderId') as string;
        const department = formData.get('department') as string || 'General';

        let userEmail: string | null = null;
        try {
            const authClient = await createClient();
            const { data: { session } } = await authClient.auth.getSession();
            userEmail = session?.user?.email ?? null;
        } catch {}

        if (userEmail) {
            const { ticket: existingTicket, error: existingError } = await findActiveTicketByUserEmail(supabase, userEmail);
            if (existingError) {
                console.error('Failed to check active ticket:', existingError);
            } else if (existingTicket) {
                return { success: true, ticketId: existingTicket.id, existing: true, ticket: mapTicketRecord(existingTicket) };
            }
        }

        const initialMessage: Record<string, any> = {
            id: `msg-${Date.now()}`,
            sender: 'user',
            content: message,
            timestamp: Date.now()
        };
        if (imageUrl) initialMessage.image_url = imageUrl;

        const nowIso = new Date().toISOString();
        const ticket = {
            id: `tkt-${Date.now()}`,
            type,
            department,
            status: 'pending',
            order_id: orderId || null,
            messages: [initialMessage],
            user_email: userEmail || null,
            created_at: nowIso,
            updated_at: nowIso,
            last_message_at: nowIso,
            last_message_preview: buildTicketPreviewFromMessage(initialMessage),
            last_message_sender: 'user',
            customer_last_read_at: nowIso
        };

        const { error } = await supabase
            .from('tickets')
            .insert(ticket as any);

        if (error) {
            console.error('Failed to save ticket:', error);
            return { success: false, error: error.message || 'Failed to save ticket' };
        }

        return { success: true, ticketId: ticket.id, ticket: mapTicketRecord(ticket) };
    } catch (e) {
        console.error('Exception submitting ticket:', e);
        return { success: false, error: e instanceof Error ? e.message : 'Submit ticket failed' };
    }
}

export async function replyToTicketAction(ticketId: string, content: string, sender: 'user' | 'admin', imageUrl?: string) {
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const supabase = createAdminClient();

        const { data: ticket, error: fetchError } = await supabase
            .from('tickets')
            .select('messages,status')
            .eq('id', ticketId)
            .single() as { data: any; error: any };

        if (fetchError || !ticket) {
            console.error('Ticket not found:', fetchError);
            return { success: false, error: fetchError?.message || 'Ticket not found' };
        }

        const newMsg: Record<string, any> = {
            id: `msg-${Date.now()}`,
            sender,
            content,
            timestamp: Date.now(),
        };
        if (imageUrl) newMsg.image_url = imageUrl;

        const newMessages = [
            ...(ticket.messages as any[] || []),
            newMsg,
        ];

        const nowIso = new Date().toISOString();
        const updatePayload: Record<string, any> = {
            messages: newMessages,
            updated_at: nowIso,
            last_message_at: nowIso,
            last_message_preview: buildTicketPreviewFromMessage(newMsg),
            last_message_sender: sender,
        };

        if (sender === 'user') {
            updatePayload.customer_last_read_at = nowIso;
            if (ticket.status === 'resolved') {
                updatePayload.status = 'open';
                updatePayload.resolved_at = null;
            }
            updatePayload.closed_at = null;
        } else {
            updatePayload.admin_last_read_at = nowIso;
        }

        const { error: updateError } = await (supabase.from('tickets') as any)
            .update(updatePayload)
            .eq('id', ticketId);

        if (updateError) {
            console.error('Failed to update ticket:', updateError);
            return { success: false, error: updateError.message || 'Failed to update ticket' };
        }

        revalidatePath('/admin/cs');
        return { success: true };
    } catch (e) {
        console.error('Exception replying to ticket:', e);
        return { success: false, error: e instanceof Error ? e.message : 'Reply failed' };
    }
}

export async function claimTicketAction(ticketId: string, adminId: string) {
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const supabase = createAdminClient();
        const nowIso = new Date().toISOString();
        const { error } = await (supabase.from('tickets') as any)
            .update({
                assigned_to: adminId,
                assigned_at: nowIso,
                status: 'open',
                updated_at: nowIso
            })
            .eq('id', ticketId);

        if (error) {
            console.error('Claim ticket failed:', error);
            return { success: false, error: error?.message || 'Claim ticket failed' };
        }

        revalidatePath('/admin/cs');
        return { success: true };
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Claim ticket failed' }; }
}

export async function unassignTicketAction(ticketId: string) {
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const supabase = createAdminClient();
        const { error } = await (supabase.from('tickets') as any)
            .update({
                assigned_to: null,
                assigned_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', ticketId);
        if (error) return { success: false, error: error.message || 'Unassign failed' };
        revalidatePath('/admin/cs');
        return { success: true };
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Unassign failed' }; }
}

export async function getTicketUpdatesAction(ticketId: string, viewer?: 'user' | 'admin') {
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const supabase = createAdminClient();
        const { data: ticket, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', ticketId)
            .single() as { data: any; error: any };

        if (error || !ticket) {
            return { success: false, error: error?.message || 'Ticket not found' };
        }

        if (viewer === 'user' || viewer === 'admin') {
            const readColumn = viewer === 'user' ? 'customer_last_read_at' : 'admin_last_read_at';
            await (supabase.from('tickets') as any)
                .update({ [readColumn]: new Date().toISOString() })
                .eq('id', ticketId);
            ticket[readColumn] = new Date().toISOString();
        }

        return {
            success: true,
            ticket: mapTicketRecord(ticket)
        };
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Get ticket updates failed' }; }
}

export async function updateTicketStatusAction(id: string, status: string) {
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const supabase = createAdminClient();
        const nowIso = new Date().toISOString();
        const patch: Record<string, any> = {
            status,
            updated_at: nowIso,
        };
        if (status === 'resolved') patch.resolved_at = nowIso;
        if (status === 'closed') patch.closed_at = nowIso;
        if (status === 'open') {
            patch.closed_at = null;
            patch.resolved_at = null;
        }

        const { error } = await (supabase.from('tickets') as any)
            .update(patch)
            .eq('id', id);

        if (error) {
            console.error('Update ticket status failed:', error);
            return { success: false, error: error.message || 'Update ticket status failed' };
        }

        revalidatePath('/admin/cs');
        return { success: true };
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Update ticket status failed' }; }
}

export async function getAdminTicketsAction() {
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .order('last_message_at', { ascending: false })
            .order('updated_at', { ascending: false });
        if (error) { console.error('getAdminTicketsAction failed:', error); return { tickets: [], success: false }; }
        const tickets = (data || []).map((t: any) => mapTicketRecord(t));
        return { tickets, success: true };
    } catch (e) { return { tickets: [], success: false, error: e instanceof Error ? e.message : 'Get admin tickets failed' }; }
}

export async function updateProductAction(formData: FormData) {
    try {
        const products = await db.getProducts();
        const id = formData.get('id') as string;
        const nameEn = formData.get('name') as string;
        const nameZh = formData.get('name_zh') as string;
        const nameJp = formData.get('name_jp') as string;
        const nameKo = formData.get('name_ko') as string;
        const name = nameEn || nameZh || nameJp || nameKo || '';
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

        // 預購欄位解析
        const is_preorder = formData.get('is_preorder') === 'true';
        const preorder_start_date = formData.get('preorder_start_date') as string || null;
        const preorder_end_date = formData.get('preorder_end_date') as string || null;
        const expected_ship_date = formData.get('expected_ship_date') as string || null;
        const preorder_limit = formData.get('preorder_limit') ? Number(formData.get('preorder_limit')) : null;
        const preorder_deposit_percentage = formData.get('preorder_deposit_percentage') ? Number(formData.get('preorder_deposit_percentage')) : 100;

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
            // 預購欄位
            is_preorder,
            preorder_start_date,
            preorder_end_date,
            expected_ship_date,
            preorder_limit,
            preorder_sold: existingProduct?.preorder_sold || 0, // 保留已售數量
            preorder_deposit_percentage,
            // preorder_status 會由資料庫 trigger 自動計算
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
    } catch (e: any) {
        console.error('updateProductAction failed:', e);
        return { success: false, error: e?.message || String(e) };
    }
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
            slug: (() => {
                let s = title.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                return s || `article-${Date.now()}`;
            })(),
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
                let slug = metadata.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                if (!slug) slug = `product-${Date.now()}`;
                product.slug = slug;
            }
            if (metadata.price !== undefined) product.price = Number(metadata.price);
            if (metadata.cost !== undefined) product.cost = Number(metadata.cost);
            if (metadata.category) product.category = metadata.category;
            if (metadata.status) product.status = metadata.status;

            await db.saveProduct(product);
            revalidatePath('/admin/products');
            revalidatePath('/collection');
            revalidatePath(`/product/${product.slug}`);
        }
        return { success: true };
    } catch (e) { return { success: false }; }
}

export async function deleteProductAction(id: string) {
    'use server';
    try {
        await db.deleteProduct(id);
        revalidatePath('/admin/products');
        revalidatePath('/collection');
        return { success: true };
    } catch (e) { return { success: false }; }
}

export async function bulkUpdateStatusAction(ids: string[], status: string, type: 'product' | 'article') {
    'use server';
    try {
        if (type === 'product') {
            const products = await db.getProducts();
            for (const id of ids) {
                const product = products.find((p: any) => p.id === id);
                if (product) {
                    product.status = status;
                    await db.saveProduct(product);
                }
            }
            revalidatePath('/admin/products');
            revalidatePath('/collection');
        } else {
            const articles = await db.getArticles();
            for (const id of ids) {
                const article = articles.find((a: any) => a.id === id);
                if (article) {
                    article.status = status;
                    await db.saveArticle(article);
                }
            }
            revalidatePath('/admin/journal');
            revalidatePath('/journal');
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
                let slug = metadata.title.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                if (!slug) slug = `article-${Date.now()}`;
                article.slug = slug;
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

        // 檢查是否有預購商品並計算預購資訊
        let has_preorder = false;
        let deposit_amount = 0;
        let remaining_amount = 0;
        const preorder_product_ids: string[] = [];
        let expected_ship_date: string | null = null;

        // Enrich items with cost data and preorder info at time of purchase
        const enrichedItems = orderData.items?.map((item: any) => {
            const product = products.find((p: any) => p.id === item.productId);
            const itemData = {
                ...item,
                cost: product?.cost || 0 // Snapshot cost
            };

            // 檢查是否為預購商品
            if (product?.is_preorder) {
                has_preorder = true;
                preorder_product_ids.push(product.id);

                // 計算訂金
                const percentage = product.preorder_deposit_percentage || 100;
                const itemTotal = item.price * item.quantity;
                const itemDeposit = Math.round((itemTotal * percentage) / 100 * 100) / 100;
                const itemRemaining = itemTotal - itemDeposit;

                deposit_amount += itemDeposit;
                remaining_amount += itemRemaining;

                // 記錄預購資訊到商品項目
                itemData.is_preorder = true;
                itemData.expected_ship_date = product.expected_ship_date;
                itemData.deposit_amount = itemDeposit;
                itemData.full_amount = itemTotal;

                // 更新預期出貨日期（取最晚的）
                if (product.expected_ship_date) {
                    if (!expected_ship_date || new Date(product.expected_ship_date) > new Date(expected_ship_date)) {
                        expected_ship_date = product.expected_ship_date;
                    }
                }

                // 更新商品的預購已售數量
                product.preorder_sold = (product.preorder_sold || 0) + item.quantity;
                db.saveProduct(product).catch(err => console.error('Failed to update preorder_sold:', err));
            }

            return itemData;
        }) || [];

        // 計算訂單狀態
        const orderStatus = has_preorder ? 'preorder_confirmed' : 'paid';
        const statusNote = has_preorder
            ? `預購訂單已確認。訂金 $${deposit_amount.toFixed(2)}，預計 ${expected_ship_date ? new Date(expected_ship_date).toLocaleDateString('zh-TW') : '未定'} 出貨。`
            : 'Order placed. Awaiting payment confirmation.';

        // === 會計欄位計算 ===
        const subtotal = enrichedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const currency = orderData.currency || 'TWD';
        const exchangeRate = orderData.exchange_rate || 1.0;
        const taxRate = orderData.tax_rate ?? 5.0;
        const taxType = orderData.tax_type || 'taxable';
        const taxAmount = taxType === 'taxable' ? Math.round(subtotal * taxRate / 100 * 100) / 100 : 0;
        const shippingFee = orderData.shipping_fee || 0;
        const totalAmount = subtotal + taxAmount + shippingFee;

        // 訂單類型
        const orderType = has_preorder ? 'preorder' : 'stock';

        // 收入認列邏輯：預購 → 遞延收入，現貨 → 已認列收入
        const deferredRevenue = has_preorder ? totalAmount : 0;
        const recognizedRevenue = has_preorder ? 0 : totalAmount;

        // 客戶資訊
        const customerCountry = orderData.shippingInfo?.country || 'TW';
        const customerType = orderData.customer_type || 'B2C';

        // 取消期限（預設 24 小時內可取消，預購 48 小時）
        const cancelHours = has_preorder ? 48 : 24;
        const canCancelUntil = new Date(Date.now() + cancelHours * 60 * 60 * 1000).toISOString();

        const newOrder = {
            id: orderId,
            date: new Date().toISOString(),
            status: orderStatus,
            ...orderData,
            items: enrichedItems,
            // 預購資訊
            has_preorder,
            deposit_amount: has_preorder ? deposit_amount : 0,
            remaining_amount: has_preorder ? remaining_amount : 0,
            preorder_info: has_preorder ? {
                productIds: preorder_product_ids,
                expectedShipDate: expected_ship_date,
                depositTotal: deposit_amount,
                remainingTotal: remaining_amount
            } : {},
            // 會計欄位
            order_type: orderType,
            currency,
            exchange_rate: exchangeRate,
            subtotal,
            tax_amount: taxAmount,
            shipping_fee: shippingFee,
            total_amount: totalAmount,
            customer_country: customerCountry,
            customer_type: customerType,
            tax_id: orderData.tax_id || null,
            company_name: orderData.company_name || null,
            invoice_required: orderData.invoice_required || false,
            invoice_type: orderData.invoice_type || null,
            tax_rate: taxRate,
            tax_type: taxType,
            is_fulfilled: !has_preorder, // 現貨直接視為已履約
            fulfilled_at: !has_preorder ? new Date().toISOString() : null,
            deferred_revenue: deferredRevenue,
            recognized_revenue: recognizedRevenue,
            preorder_batch_id: orderData.preorder_batch_id || null,
            // 追蹤欄位
            estimated_delivery_date: has_preorder && expected_ship_date ? expected_ship_date : null,
            last_status_update: new Date().toISOString(),
            can_cancel_until: canCancelUntil,
            customer_notes: orderData.customer_notes || null,
            timeline: [
                { status: orderStatus, date: new Date().toISOString(), note: statusNote }
            ]
        };

        await db.saveOrder(newOrder);
        revalidatePath('/admin');
        revalidatePath('/admin/orders');
        revalidatePath('/admin/preorders');

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
            .single() as { data: any; error: any };

        const role = userData?.role || 'consumer';
        const name = userData?.name || data.user.email?.split('@')[0] || 'User';

        return {
            success: true,
            user: {
                email: data.user.email!,
                role,
                name
            },
            // Return tokens so the browser client can call setSession() directly
            accessToken: data.session?.access_token,
            refreshToken: data.session?.refresh_token,
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
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const adminClient = createAdminClient();

        // 1. Create real auth user via Supabase Admin API
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
        });

        if (authError) {
            console.error('Auth createUser failed:', authError);
            return { success: false, error: authError.message };
        }

        // 2. Insert profile in public.users (admin client bypasses RLS)
        const { error: profileError } = await adminClient
            .from('users')
            .upsert({
                id: authData.user.id,
                email: userData.email,
                name: userData.name,
                role: userData.role || 'support'
            });

        if (profileError) {
            console.error('Profile insert failed:', profileError);
            return { success: false, error: profileError.message };
        }

        return {
            success: true,
            user: { id: authData.user.id, email: userData.email, name: userData.name, role: userData.role }
        };
    } catch (e: any) {
        console.error('addUserAction error:', e);
        return { success: false, error: e.message || 'Failed to create user' };
    }
}

export async function deleteUserAction(userId: string) {
    'use server';
    try {
        // 1. Delete from public.users
        await db.deleteUser(userId);

        // 2. Delete from auth.users via Admin API
        try {
            const { createAdminClient } = await import('@/lib/supabase/admin');
            const adminClient = createAdminClient();
            await adminClient.auth.admin.deleteUser(userId);
        } catch (authErr) {
            console.error('Failed to delete auth user (may not exist):', authErr);
        }

        return { success: true };
    } catch (e) { return { success: false }; }
}

// ==========================================
// 🎯 Preorder Actions
// ==========================================

/**
 * 更新預購商品的已售數量
 */
export async function updatePreorderSoldAction(productId: string, quantity: number) {
    'use server';
    try {
        const products = await db.getProducts();
        const product = products.find((p: any) => p.id === productId);

        if (!product || !product.is_preorder) {
            return { success: false, error: 'Product not found or not a preorder' };
        }

        // 更新已售數量
        product.preorder_sold = (product.preorder_sold || 0) + quantity;

        // 檢查是否售罄
        if (product.preorder_limit && product.preorder_sold >= product.preorder_limit) {
            product.preorder_status = 'ended';
        }

        await db.saveProduct(product);
        revalidatePath('/admin/products');
        revalidatePath('/admin/preorders');
        revalidatePath('/collection');
        if (product.slug) revalidatePath(`/product/${product.slug}`);

        return { success: true, newSoldCount: product.preorder_sold };
    } catch (e) {
        console.error('updatePreorderSoldAction error:', e);
        return { success: false, error: 'Failed to update preorder sold count' };
    }
}

/**
 * 獲取所有預購商品
 */
export async function getPreorderProductsAction() {
    'use server';
    try {
        const products = await db.getProducts();
        const preorderProducts = products.filter((p: any) => p.is_preorder);

        return { success: true, products: preorderProducts };
    } catch (e) {
        console.error('getPreorderProductsAction error:', e);
        return { success: false, products: [], error: 'Failed to get preorder products' };
    }
}

/**
 * 獲取活躍的預購商品（進行中）
 */
export async function getActivePreordersAction() {
    'use server';
    try {
        const products = await db.getProducts();
        const now = new Date();

        const activePreorders = products.filter((p: any) => {
            if (!p.is_preorder || p.status !== 'published') return false;

            const start = p.preorder_start_date ? new Date(p.preorder_start_date) : null;
            const end = p.preorder_end_date ? new Date(p.preorder_end_date) : null;

            if (!start || !end) return false;

            // 時間範圍內
            const inTimeRange = now >= start && now <= end;

            // 未售罄
            const notSoldOut = !p.preorder_limit || (p.preorder_sold || 0) < p.preorder_limit;

            return inTimeRange && notSoldOut;
        });

        return { success: true, products: activePreorders };
    } catch (e) {
        console.error('getActivePreordersAction error:', e);
        return { success: false, products: [], error: 'Failed to get active preorders' };
    }
}

/**
 * 批次更新預購狀態（手動標記為已出貨等）
 */
export async function batchUpdatePreorderStatusAction(productIds: string[], status: 'upcoming' | 'active' | 'ended' | 'shipped') {
    'use server';
    try {
        const products = await db.getProducts();

        for (const productId of productIds) {
            const product = products.find((p: any) => p.id === productId);
            if (product && product.is_preorder) {
                product.preorder_status = status;
                await db.saveProduct(product);
            }
        }

        revalidatePath('/admin/products');
        revalidatePath('/admin/preorders');
        revalidatePath('/collection');

        return { success: true };
    } catch (e) {
        console.error('batchUpdatePreorderStatusAction error:', e);
        return { success: false, error: 'Failed to batch update preorder status' };
    }
}

/**
 * 獲取預購訂單（包含預購商品的訂單）
 */
export async function getPreorderOrdersAction() {
    'use server';
    try {
        const orders = await db.getOrders();
        const preorderOrders = orders.filter((o: any) => o.has_preorder === true);

        return { success: true, orders: preorderOrders };
    } catch (e) {
        console.error('getPreorderOrdersAction error:', e);
        return { success: false, orders: [], error: 'Failed to get preorder orders' };
    }
}

// ==========================================
// 💳 Payment & Accounting Actions
// ==========================================

/**
 * 記錄一筆付款
 */
export async function createPaymentAction(paymentData: {
    order_id: string;
    payment_provider: string;
    transaction_id?: string;
    payment_method?: string;
    amount: number;
    currency?: string;
    exchange_rate?: number;
    gateway_fee?: number;
    payment_type?: string;
}) {
    'use server';
    try {
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        const paymentId = `PAY-${dateStr}-${rand}`;

        const netAmount = paymentData.amount - (paymentData.gateway_fee || 0);
        const exchangeRate = paymentData.exchange_rate || 1.0;

        const payment = {
            id: paymentId,
            order_id: paymentData.order_id,
            payment_provider: paymentData.payment_provider,
            transaction_id: paymentData.transaction_id,
            payment_method: paymentData.payment_method,
            amount: paymentData.amount,
            currency: paymentData.currency || 'TWD',
            exchange_rate: exchangeRate,
            amount_twd: Math.round(paymentData.amount * exchangeRate * 100) / 100,
            gateway_fee: paymentData.gateway_fee || 0,
            net_amount: netAmount,
            payment_status: 'completed',
            paid_at: new Date().toISOString(),
            payout_status: 'pending',
            payment_type: paymentData.payment_type || 'full',
        };

        await db.savePayment(payment);

        revalidatePath('/admin/orders');
        revalidatePath('/admin/payments');

        return { success: true, paymentId };
    } catch (e) {
        console.error('createPaymentAction error:', e);
        return { success: false, error: 'Failed to create payment' };
    }
}

/**
 * 獲取所有付款記錄
 */
export async function getPaymentsAction() {
    'use server';
    try {
        const payments = await db.getPayments();
        return { success: true, payments };
    } catch (e) {
        return { success: false, payments: [] };
    }
}

/**
 * 獲取某訂單的付款記錄
 */
export async function getPaymentsByOrderAction(orderId: string) {
    'use server';
    try {
        const payments = await db.getPaymentsByOrder(orderId);
        return { success: true, payments };
    } catch (e) {
        return { success: false, payments: [] };
    }
}

/**
 * 更新入帳狀態
 */
export async function updatePayoutStatusAction(paymentId: string, status: 'pending' | 'paid_out') {
    'use server';
    try {
        const supabase = await createClient();
        const updates: any = { payout_status: status };
        if (status === 'paid_out') updates.payout_at = new Date().toISOString();

        await (supabase.from('payments') as any).update(updates).eq('id', paymentId);

        revalidatePath('/admin/payments');
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

/**
 * 履約訂單（預購出貨 → 認列收入）
 */
export async function fulfillOrderAction(orderId: string) {
    'use server';
    try {
        const orders = await db.getOrders();
        const order = orders.find((o: any) => o.id === orderId);

        if (!order) return { success: false, error: 'Order not found' };

        const now = new Date().toISOString();

        order.is_fulfilled = true;
        order.fulfilled_at = now;
        order.recognized_revenue = order.total_amount || order.total || 0;
        order.deferred_revenue = 0;
        order.status = 'shipped';
        order.last_status_update = now;

        // 加入 timeline
        const timeline = order.timeline || [];
        timeline.push({ status: 'shipped', date: now, note: '預購商品已出貨，收入已認列' });
        order.timeline = timeline;

        await db.saveOrder(order);

        revalidatePath('/admin/orders');
        revalidatePath('/admin/preorders');
        revalidatePath('/admin');

        return { success: true };
    } catch (e) {
        console.error('fulfillOrderAction error:', e);
        return { success: false, error: 'Failed to fulfill order' };
    }
}

// ==========================================
// 💸 Refund Actions
// ==========================================

/**
 * 建立退款
 */
export async function createRefundAction(refundData: {
    order_id: string;
    payment_id?: string;
    refund_amount: number;
    refund_fee?: number;
    refund_reason?: string;
    refund_type?: string;
    invoice_action?: string;
}) {
    'use server';
    try {
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        const refundId = `REF-${dateStr}-${rand}`;

        const netRefund = refundData.refund_amount - (refundData.refund_fee || 0);

        const refund = {
            id: refundId,
            order_id: refundData.order_id,
            payment_id: refundData.payment_id,
            refund_amount: refundData.refund_amount,
            refund_fee: refundData.refund_fee || 0,
            net_refund: netRefund,
            refund_reason: refundData.refund_reason,
            refund_type: refundData.refund_type || 'full',
            invoice_action: refundData.invoice_action,
            refund_status: 'pending',
        };

        await db.saveRefund(refund);

        // 更新訂單狀態
        const orders = await db.getOrders();
        const order = orders.find((o: any) => o.id === refundData.order_id);
        if (order) {
            order.status = 'refunded';
            order.last_status_update = new Date().toISOString();
            const timeline = order.timeline || [];
            timeline.push({
                status: 'refunded',
                date: new Date().toISOString(),
                note: `退款 $${refundData.refund_amount}｜原因：${refundData.refund_reason || '未說明'}`
            });
            order.timeline = timeline;

            // 收入沖回
            if (order.recognized_revenue > 0) {
                order.recognized_revenue = Math.max(0, order.recognized_revenue - refundData.refund_amount);
            }

            await db.saveOrder(order);
        }

        revalidatePath('/admin/orders');
        revalidatePath('/admin/payments');
        revalidatePath('/admin');

        return { success: true, refundId };
    } catch (e) {
        console.error('createRefundAction error:', e);
        return { success: false, error: 'Failed to create refund' };
    }
}

/**
 * 獲取退款記錄
 */
export async function getRefundsAction() {
    'use server';
    try {
        const refunds = await db.getRefunds();
        return { success: true, refunds };
    } catch (e) {
        return { success: false, refunds: [] };
    }
}

// ==========================================
// 🚚 Shipment Actions
// ==========================================

/**
 * 建立物流記錄
 */
export async function createShipmentAction(shipmentData: {
    order_id: string;
    carrier: string;
    tracking_number: string;
    tracking_url?: string;
    estimated_delivery?: string;
}) {
    'use server';
    try {
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        const shipmentId = `SHIP-${dateStr}-${rand}`;

        const now = new Date().toISOString();

        const shipment = {
            id: shipmentId,
            order_id: shipmentData.order_id,
            carrier: shipmentData.carrier,
            tracking_number: shipmentData.tracking_number,
            tracking_url: shipmentData.tracking_url || `https://www.google.com/search?q=${shipmentData.carrier}+tracking+${shipmentData.tracking_number}`,
            shipment_status: 'pending',
            shipped_at: now,
            estimated_delivery: shipmentData.estimated_delivery,
            status_updates: [
                { timestamp: now, status: 'pending', description: '物流單已建立' }
            ]
        };

        await db.saveShipment(shipment);

        // 更新訂單物流資訊
        const orders = await db.getOrders();
        const order = orders.find((o: any) => o.id === shipmentData.order_id);
        if (order) {
            order.trackingInfo = {
                carrier: shipmentData.carrier,
                trackingNumber: shipmentData.tracking_number,
                url: shipment.tracking_url,
            };
            order.estimated_delivery_date = shipmentData.estimated_delivery;
            order.last_status_update = now;
            await db.saveOrder(order);
        }

        revalidatePath('/admin/orders');

        return { success: true, shipmentId };
    } catch (e) {
        console.error('createShipmentAction error:', e);
        return { success: false, error: 'Failed to create shipment' };
    }
}

/**
 * 更新物流狀態
 */
export async function updateShipmentStatusAction(
    shipmentId: string,
    status: string,
    location?: string,
    description?: string
) {
    'use server';
    try {
        const supabase = await createClient();
        const { data: shipment } = await (supabase.from('shipments') as any).select('*').eq('id', shipmentId).single() as { data: any };

        if (!shipment) return { success: false, error: 'Shipment not found' };

        const now = new Date().toISOString();
        const statusUpdates = shipment.status_updates || [];
        statusUpdates.push({
            timestamp: now,
            status,
            location: location || '',
            description: description || `狀態更新為 ${status}`
        });

        const updates: any = {
            shipment_status: status,
            status_updates: statusUpdates,
            current_location: location || shipment.current_location,
        };

        if (status === 'delivered') {
            updates.delivered_at = now;
        }
        if (status === 'failed' || status === 'returned') {
            updates.is_delayed = true;
            updates.last_exception = description || status;
            updates.exception_count = (shipment.exception_count || 0) + 1;
        }

        await (supabase.from('shipments') as any).update(updates).eq('id', shipmentId);

        // 同步更新訂單狀態
        if (status === 'delivered') {
            const { data: order } = await (supabase.from('orders') as any).select('*').eq('id', shipment.order_id).single() as { data: any };
            if (order) {
                const timeline = order.timeline || [];
                timeline.push({ status: 'delivered', date: now, note: '已簽收' });
                await (supabase.from('orders') as any).update({
                    status: 'delivered',
                    timeline,
                    last_status_update: now,
                }).eq('id', shipment.order_id);
            }
        }

        revalidatePath('/admin/orders');

        return { success: true };
    } catch (e) {
        console.error('updateShipmentStatusAction error:', e);
        return { success: false };
    }
}

/**
 * 透過追蹤碼查詢物流（前台用）
 */
export async function trackShipmentAction(trackingNumber: string) {
    'use server';
    try {
        const shipment = await db.getShipmentByTracking(trackingNumber) as any;
        if (!shipment) return { success: false, error: 'Tracking number not found' };

        return {
            success: true,
            shipment: {
                carrier: shipment.carrier,
                tracking_number: shipment.tracking_number,
                tracking_url: shipment.tracking_url,
                shipment_status: shipment.shipment_status,
                current_location: shipment.current_location,
                status_updates: shipment.status_updates || [],
                shipped_at: shipment.shipped_at,
                estimated_delivery: shipment.estimated_delivery,
                delivered_at: shipment.delivered_at,
            },
            order: shipment.orders ? {
                id: shipment.orders.id,
                status: shipment.orders.status,
                date: shipment.orders.date,
            } : null
        };
    } catch (e) {
        return { success: false, error: 'Failed to track shipment' };
    }
}

/**
 * 獲取所有物流記錄
 */
export async function getShipmentsAction() {
    'use server';
    try {
        const shipments = await db.getShipments();
        return { success: true, shipments };
    } catch (e) {
        return { success: false, shipments: [] };
    }
}

// ==========================================
// 🏷️ Order Tag Actions
// ==========================================

export async function addOrderTagAction(orderId: string, tagType: string, tagValue: string, notes?: string) {
    'use server';
    try {
        await db.addOrderTag({
            order_id: orderId,
            tag_type: tagType,
            tag_value: tagValue,
            notes,
        });
        revalidatePath('/admin/orders');
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function removeOrderTagAction(tagId: number) {
    'use server';
    try {
        await db.removeOrderTag(tagId);
        revalidatePath('/admin/orders');
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

// ==========================================
// 🚩 Order Flag Actions
// ==========================================

export async function flagOrderAction(orderId: string, reason: string, priority: string) {
    'use server';
    try {
        const supabase = await createClient();
        await (supabase.from('orders') as any).update({
            is_flagged: true,
            flag_reason: reason,
            flag_priority: priority,
            last_status_update: new Date().toISOString(),
        }).eq('id', orderId);

        revalidatePath('/admin/orders');
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function unflagOrderAction(orderId: string) {
    'use server';
    try {
        const supabase = await createClient();
        await (supabase.from('orders') as any).update({
            is_flagged: false,
            flag_reason: null,
            flag_priority: null,
        }).eq('id', orderId);

        revalidatePath('/admin/orders');
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

// ==========================================
// ⚙️ Merchant Settings Actions
// ==========================================

/**
 * 取得商家設定（金流設定）
 */
export async function getMerchantSettingsAction() {
    'use server';
    try {
        const supabase = await createClient();
        const { data, error } = await (supabase.from('merchant_settings') as any)
            .select('*')
            .eq('id', 1)
            .single() as { data: any; error: any };

        if (error || !data) {
            return { success: true, settings: { payment_provider: 'manual' } };
        }

        // 隱藏敏感欄位（只傳遞 provider 類型與 test_mode，不傳遞 keys）
        return {
            success: true,
            settings: {
                payment_provider: data.payment_provider,
                ecpay_test_mode: data.ecpay_test_mode,
                tappay_test_mode: data.tappay_test_mode,
                payment_currency: data.payment_currency,
                // 是否已設定（有值但不回傳實際值）
                has_ecpay_config: !!(data.ecpay_merchant_id && data.ecpay_hash_key && data.ecpay_hash_iv),
                has_stripe_config: !!(data.stripe_secret_key),
                has_tappay_config: !!(data.tappay_partner_key && data.tappay_merchant_id),
                has_ecpay_logistics_config: !!(data.ecpay_logistics_merchant_id && data.ecpay_logistics_hash_key && data.ecpay_logistics_hash_iv),
                ecpay_logistics_test_mode: data.ecpay_logistics_test_mode,
            }
        };
    } catch (e) {
        return { success: false, settings: null };
    }
}

/**
 * 更新商家金流設定
 */
export async function updateMerchantSettingsAction(settings: {
    payment_provider?: string;
    ecpay_merchant_id?: string;
    ecpay_hash_key?: string;
    ecpay_hash_iv?: string;
    ecpay_test_mode?: boolean;
    stripe_publishable_key?: string;
    stripe_secret_key?: string;
    stripe_webhook_secret?: string;
    tappay_partner_key?: string;
    tappay_merchant_id?: string;
    tappay_test_mode?: boolean;
    payment_currency?: string;
}) {
    'use server';
    try {
        const supabase = await createClient();

        const record: any = { id: 1, updated_at: new Date().toISOString() };
        if (settings.payment_provider !== undefined) record.payment_provider = settings.payment_provider;
        if (settings.ecpay_merchant_id)   record.ecpay_merchant_id = settings.ecpay_merchant_id;
        if (settings.ecpay_hash_key)      record.ecpay_hash_key = settings.ecpay_hash_key;
        if (settings.ecpay_hash_iv)       record.ecpay_hash_iv = settings.ecpay_hash_iv;
        if (settings.ecpay_test_mode !== undefined) record.ecpay_test_mode = settings.ecpay_test_mode;
        if (settings.stripe_publishable_key) record.stripe_publishable_key = settings.stripe_publishable_key;
        if (settings.stripe_secret_key)   record.stripe_secret_key = settings.stripe_secret_key;
        if (settings.stripe_webhook_secret) record.stripe_webhook_secret = settings.stripe_webhook_secret;
        if (settings.tappay_partner_key)  record.tappay_partner_key = settings.tappay_partner_key;
        if (settings.tappay_merchant_id)  record.tappay_merchant_id = settings.tappay_merchant_id;
        if (settings.tappay_test_mode !== undefined) record.tappay_test_mode = settings.tappay_test_mode;
        if (settings.payment_currency)    record.payment_currency = settings.payment_currency;

        const { error } = await supabase.from('merchant_settings').upsert(record);
        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e: any) {
        console.error('updateMerchantSettingsAction error:', e);
        return { success: false, error: e.message };
    }
}

// ──────────────────────────────────────────────────────────────
// ECPay 測試連線
// ──────────────────────────────────────────────────────────────
export async function testEcpayConnectionAction(
    merchantId: string,
    hashKey: string,
    hashIv: string,
    testMode: boolean
): Promise<{ success: boolean; message: string }> {
    'use server';
    try {
        if (!merchantId || !hashKey || !hashIv) {
            return { success: false, message: '請填寫 MerchantID、HashKey、HashIV' };
        }

        const { createHash } = await import('crypto');

        // 使用 QueryTradeInfo V5 API 發送帶有假交易編號的請求
        // ECPay 若憑證正確會回傳「查無此筆訂單」，若錯誤則回傳簽章驗證失敗
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const testTradeNo = 'STEST' + timestamp.slice(-15); // max 20 chars

        const params: Record<string, string> = {
            MerchantID: merchantId,
            MerchantTradeNo: testTradeNo,
            TimeStamp: timestamp,
        };

        // 計算 CheckMacValue（與 ecpay.ts 邏輯相同）
        const sorted = Object.keys(params)
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
            .map(k => `${k}=${params[k]}`)
            .join('&');
        const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIv}`;
        const encoded = encodeURIComponent(raw).toLowerCase()
            .replace(/%20/g, '+').replace(/%21/g, '!').replace(/%28/g, '(')
            .replace(/%29/g, ')').replace(/%2a/g, '*');
        const checkMac = createHash('sha256').update(encoded).digest('hex').toUpperCase();

        const body = new URLSearchParams({
            ...params,
            CheckMacValue: checkMac,
        });

        const endpoint = testMode
            ? 'https://payment-stage.ecpay.com.tw/Cashier/QueryTradeInfo/V5'
            : 'https://payment.ecpay.com.tw/Cashier/QueryTradeInfo/V5';

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
            signal: AbortSignal.timeout(10000),
        });

        const text = await res.text();

        // ECPay 回傳 URL-encoded 格式，RtnCode=10200002 表示「查無此筆訂單」（憑證正確！）
        // RtnCode=10100058 = CheckMacValue 錯誤（憑證錯誤）
        if (text.includes('RtnCode=10200002') || text.includes('RtnCode=1')) {
            return { success: true, message: `✅ 連線成功（${testMode ? '測試環境' : '正式環境'}），憑證格式有效` };
        }
        if (text.includes('RtnCode=10100058') || text.includes('CheckMacValue')) {
            return { success: false, message: '❌ CheckMacValue 驗證失敗，請確認 HashKey / HashIV 是否正確' };
        }
        if (text.includes('MerchantID') && text.includes('RtnCode')) {
            return { success: true, message: `✅ 連線成功（${testMode ? '測試環境' : '正式環境'}），ECPay 回應正常` };
        }
        // HTML 回應通常表示參數錯誤
        if (text.startsWith('<!') || text.startsWith('<html')) {
            return { success: false, message: '❌ MerchantID 無效或 IP 未加入白名單，請確認帳號設定' };
        }
        return { success: false, message: `❌ 未預期回應：${text.slice(0, 120)}` };
    } catch (e: any) {
        if (e?.name === 'TimeoutError') {
            return { success: false, message: '❌ 連線逾時（10秒），請確認網路或 ECPay 服務狀態' };
        }
        return { success: false, message: `❌ 連線錯誤：${e?.message || String(e)}` };
    }
}

// ──────────────────────────────────────────────────────────────
// ECPay 物流 Actions
// ──────────────────────────────────────────────────────────────

/** 取得 ECPay 物流 Adapter（讀 DB 憑證） */
async function getLogisticsAdapter() {
    const { ECPayLogisticsAdapter } = await import('@/lib/logistics/ecpay-logistics');
    const supabase = await createClient();
    const { data } = await supabase
        .from('merchant_settings')
        .select('ecpay_logistics_merchant_id, ecpay_logistics_hash_key, ecpay_logistics_hash_iv, ecpay_logistics_test_mode')
        .eq('id', 1)
        .single() as { data: any };

    return new ECPayLogisticsAdapter({
        merchantId: data?.ecpay_logistics_merchant_id || '2000132',
        hashKey:    data?.ecpay_logistics_hash_key    || 'XBERn1YOvpM9nfZc',
        hashIv:     data?.ecpay_logistics_hash_iv     || 'h1ONHk4P4yqbl5LK',
        testMode:   data?.ecpay_logistics_test_mode   ?? true,
    });
}

/** 更新 ECPay 物流設定 */
export async function updateLogisticsSettingsAction(settings: {
    ecpay_logistics_merchant_id?: string;
    ecpay_logistics_hash_key?: string;
    ecpay_logistics_hash_iv?: string;
    ecpay_logistics_test_mode?: boolean;
}): Promise<{ success: boolean; error?: string }> {
    'use server';
    try {
        const supabase = await createClient();
        const record: any = { id: 1, updated_at: new Date().toISOString() };
        if (settings.ecpay_logistics_merchant_id !== undefined) record.ecpay_logistics_merchant_id = settings.ecpay_logistics_merchant_id;
        if (settings.ecpay_logistics_hash_key !== undefined)     record.ecpay_logistics_hash_key    = settings.ecpay_logistics_hash_key;
        if (settings.ecpay_logistics_hash_iv !== undefined)      record.ecpay_logistics_hash_iv     = settings.ecpay_logistics_hash_iv;
        if (settings.ecpay_logistics_test_mode !== undefined)    record.ecpay_logistics_test_mode   = settings.ecpay_logistics_test_mode;
        const { error } = await supabase.from('merchant_settings').upsert(record);
        if (error) throw error;
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/** 建立 ECPay CVS 物流訂單（後台出貨時呼叫） */
export async function createEcpayLogisticsShipmentAction(params: {
    orderId: string;
    logisticsSubType: 'UNIMART' | 'FAMI';
    goodsName: string;
    goodsAmount: number;
    senderName: string;
    senderPhone: string;
}): Promise<{ success: boolean; allPayLogisticsId?: string; cvsPaperNo?: string; error?: string }> {
    'use server';
    try {
        const supabase = await createClient();
        const adapter = await getLogisticsAdapter();

        // 取得訂單資訊
        const { data: order } = await supabase
            .from('orders')
            .select('customer_name, customer_phone, customer_email, cvs_store_id, cvs_store_name, cvs_sub_type, total')
            .eq('id', params.orderId)
            .single() as { data: any };

        if (!order) return { success: false, error: '找不到訂單' };
        if (!order.cvs_store_id) return { success: false, error: '此訂單無超商門市資訊' };

        // 生成物流 MerchantTradeNo（最多 20 chars）
        const dateStr = new Date().toLocaleDateString('zh-TW', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\//g, '');
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        const logisticsTradeNo = `L${dateStr}${rand}`.slice(0, 20);

        // 取得 Webhook URL
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
        const serverReplyUrl = `${siteUrl}/api/webhooks/logistics/ecpay`;

        const result = await adapter.createCVSShipment({
            merchantTradeNo:   logisticsTradeNo,
            logisticsSubType:  params.logisticsSubType,
            goodsAmount:       Math.round(params.goodsAmount),
            goodsName:         params.goodsName,
            senderName:        params.senderName,
            senderPhone:       params.senderPhone,
            receiverName:      order.customer_name,
            receiverCellPhone: (order.customer_phone || '').replace(/[^0-9]/g, ''),
            receiverEmail:     order.customer_email,
            receiverStoreId:   order.cvs_store_id,
            serverReplyUrl,
        });

        if (!result.success) return result;

        // 建立 shipments 記錄
        const now = new Date().toISOString();
        const dateStr2 = new Date().toLocaleDateString('zh-TW', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\//g, '');
        const rand2 = Math.random().toString(36).slice(2, 6).toUpperCase();
        const shipmentId = `SHIP-${dateStr2}-${rand2}`;
        const carrierName = params.logisticsSubType === 'FAMI' ? '全家超商' : '7-11超商';

        await supabase.from('shipments').upsert({
            id:                shipmentId,
            order_id:          params.orderId,
            carrier:           carrierName,
            tracking_number:   result.cvsPaperNo || logisticsTradeNo,
            logistics_id:      result.allPayLogisticsId,
            logistics_trade_no: logisticsTradeNo,
            cvs_paper_no:      result.cvsPaperNo,
            shipment_status:   'pending',
            status_updates:    [{ timestamp: now, status: 'pending', description: '已建立物流訂單', operator: '後台' }],
            shipped_at:        now,
            created_at:        now,
            updated_at:        now,
        } as any);

        // 更新訂單
        const { data: existingOrder } = await supabase.from('orders').select('timeline').eq('id', params.orderId).single() as { data: any };
        const timeline = Array.isArray(existingOrder?.timeline) ? existingOrder.timeline : [];
        timeline.push({ status: 'shipped', date: now, note: `已建立${carrierName}物流訂單，寄件碼：${result.cvsPaperNo || logisticsTradeNo}` });

        await (supabase.from('orders') as any).update({
            status:              'shipped',
            tracking_carrier:    carrierName,
            tracking_number:     result.cvsPaperNo || logisticsTradeNo,
            timeline,
            last_status_update:  now,
        }).eq('id', params.orderId);

        revalidatePath('/admin/orders');
        return { success: true, allPayLogisticsId: result.allPayLogisticsId, cvsPaperNo: result.cvsPaperNo };
    } catch (e: any) {
        console.error('createEcpayLogisticsShipmentAction error:', e);
        return { success: false, error: e.message };
    }
}

/** 查詢 ECPay 物流最新狀態（後台手動觸發） */
export async function queryEcpayLogisticsStatusAction(shipmentId: string): Promise<{
    success: boolean;
    statusCode?: string;
    statusMessage?: string;
    error?: string;
}> {
    'use server';
    try {
        const supabase = await createClient();
        const adapter = await getLogisticsAdapter();
        const { CVS_STATUS_MAP, CVS_RTNCODE_TO_STATUS } = await import('@/lib/logistics/ecpay-logistics');

        const { data: shipment } = await supabase
            .from('shipments')
            .select('logistics_trade_no, logistics_id, shipment_status, status_updates, order_id')
            .eq('id', shipmentId)
            .single() as { data: any };

        if (!shipment?.logistics_trade_no) {
            return { success: false, error: '找不到物流訂單編號' };
        }

        const result = await adapter.queryStatus(shipment.logistics_trade_no);
        if (!result.success) return { success: false, error: result.error };

        const rtnCode = result.rtnCode || '';
        const newStatus = CVS_RTNCODE_TO_STATUS[rtnCode] || 'in_transit';
        const statusMessage = CVS_STATUS_MAP[rtnCode] || result.statusMessage || '';

        // 若狀態有變化，更新記錄
        if (newStatus !== shipment.shipment_status) {
            const statusUpdates = Array.isArray(shipment.status_updates) ? shipment.status_updates : [];
            statusUpdates.push({
                timestamp:   new Date().toISOString(),
                status:      newStatus,
                description: statusMessage,
                operator:    'ECPay（手動查詢）',
            });
            await (supabase.from('shipments') as any).update({
                shipment_status: newStatus,
                status_updates:  statusUpdates,
                updated_at:      new Date().toISOString(),
            }).eq('id', shipmentId);
        }

        revalidatePath('/admin/orders');
        return { success: true, statusCode: rtnCode, statusMessage };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
