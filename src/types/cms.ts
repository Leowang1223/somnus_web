
export type SectionType =
    | 'hero'
    | 'text-image'
    | 'features'
    | 'video'
    | 'rich-text'
    | 'richText'
    | 'quote'
    | 'grid'
    | 'full-image'
    | 'spacer'
    | 'purchase';

export interface Section {
    id: string;
    type: SectionType;
    content: any;
    isEnabled: boolean;
    backgroundConfig?: {
        url?: string;
        type?: 'image' | 'video';
        opacity?: number;
        blur?: number;
        grain?: number;
    };
}

export interface HomeLayout {
    sections: Section[];
}

export interface CMSProduct {
    id: string;
    slug: string;
    name: string;
    price: number;
    description: string;
    category: string;
    image: string;
    hoverVideo?: string;
    tags?: string[];
    aspectRatio?: '1:1' | '4:5' | '16:9';
    focusPoint?: { x: number; y: number };
    status?: 'published' | 'draft' | 'archived';
    sections?: Section[];
}

export interface CMSArticle {
    id: string;
    title: string;
    category: string;
    readTime: string;
    snippet: string;
    image?: string;
    sections?: Section[];
    slug: string;
    metaTitle?: string;
    metaDescription?: string;
    tags?: string[];
    status?: 'published' | 'draft' | 'archived';
}
