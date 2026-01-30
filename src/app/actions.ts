'use server';

import { saveProduct, saveArticle, saveHomeLayout } from "@/lib/db";
import { revalidatePath } from "next/cache";
import fs from 'fs/promises';
import path from 'path';

export async function uploadFileAction(formData: FormData) {
    const file = formData.get('file') as File;
    const prefix = formData.get('prefix') as string || 'somnus';
    if (!file) throw new Error("No file uploaded");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create SEO-friendly unique filename: prefix-timestamp-filename
    const cleanPrefix = prefix.toLowerCase().replace(/[^a-z0-ra-z0-9]/g, '-');
    const cleanFilename = file.name.toLowerCase().replace(/[^a-z0-ra-z0-9.]/g, '-');
    const filename = `${cleanPrefix}-${Date.now()}-${cleanFilename}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const fullPath = path.join(uploadDir, filename);

    await fs.writeFile(fullPath, buffer);
    return { url: `/uploads/${filename}` };
}

export async function updateHomeLayoutAction(sections: any[]) {
    await saveHomeLayout({ sections });
    revalidatePath('/');
    return { success: true };
}

export async function updateProductSectionsAction(id: string, sections: any[]) {
    const { getProducts, saveProduct } = await import("@/lib/db");
    const products = await getProducts();
    const product = products.find((p: any) => p.id === id);
    if (product) {
        product.sections = sections;
        await saveProduct(product);
        revalidatePath(`/product/${product.slug}`);
    }
    return { success: true };
}

export async function updateArticleSectionsAction(id: string, sections: any[]) {
    const { getArticles, saveArticle } = await import("@/lib/db");
    const articles = await getArticles();
    const article = articles.find((a: any) => a.id === id);
    if (article) {
        article.sections = sections;
        await saveArticle(article);
        revalidatePath(`/journal`);
        revalidatePath(`/journal/${article.slug}`);
    }
    return { success: true };
}

export async function updateProductAction(formData: FormData) {
    const { getProducts, saveProduct } = await import("@/lib/db");
    const products = await getProducts();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const existingProduct = products.find((p: any) => p.id === id);

    const tagsInput = formData.get('tags') as string;
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
    const focusPointInput = formData.get('focusPoint') as string;
    const focusPoint = focusPointInput ? JSON.parse(focusPointInput) : { x: 50, y: 50 };

    const product = {
        ...existingProduct,
        id: id || `prod-${Date.now()}`,
        name: name,
        price: Number(formData.get('price')),
        category: formData.get('category') as string,
        description: formData.get('description') as string,
        slug: name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-'),
        image: formData.get('image') as string || existingProduct?.image,
        hoverVideo: formData.get('hoverVideo') as string || existingProduct?.hoverVideo,
        status: (formData.get('status') as any) || existingProduct?.status || 'draft',
        aspectRatio: (formData.get('aspectRatio') as any) || existingProduct?.aspectRatio || '4:5',
        tags: tags,
        focusPoint: focusPoint,
        sections: existingProduct?.sections || [
            { id: `hero-${Date.now()}`, type: 'hero', isEnabled: true, content: { title: name, subtitle: formData.get('category') as string, ctaText: "Explore Ritual", ctaLink: "" } },
            { id: `purchase-${Date.now()}`, type: 'purchase', isEnabled: true, content: {} }
        ]
    };

    await saveProduct(product);
    revalidatePath('/admin/products');
    revalidatePath('/collection');
    if (product.slug) revalidatePath(`/product/${product.slug}`);

    return { success: true };
}

export async function updateArticleAction(formData: FormData) {
    const { getArticles, saveArticle } = await import("@/lib/db");
    const articles = await getArticles();
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
            { id: `hero-${Date.now()}`, type: 'hero', isEnabled: true, content: { title: title, subtitle: "A SØMNUS Editorial", ctaText: "", ctaLink: "" } },
            { id: `content-${Date.now()}`, type: 'richText', isEnabled: true, content: { text: "Begin your story here..." } }
        ]
    };

    await saveArticle(article);
    revalidatePath('/admin/journal');
    revalidatePath('/journal');
    if (article.slug) revalidatePath(`/journal/${article.slug}`);

    return { success: true };
}

export async function translateAction(text: string, targetLang: string) {
    // Mock AI Translation logic
    // In a real scenario, this would call Gemini or DeepL API
    console.log(`Translating to ${targetLang}: ${text}`);

    // Simple mock translations for demonstration
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
