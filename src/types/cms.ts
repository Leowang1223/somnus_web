
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
    description: string;
    [key: string]: any; // Allow dynamic language fields (name_zh, description_jp, etc.)
    price: number;
    category: string;
    image: string;
    hoverVideo?: string;
    tags?: string[];
    aspectRatio?: '1:1' | '4:5' | '16:9';
    focusPoint?: { x: number; y: number };
    status?: 'published' | 'draft' | 'archived';
    sections?: Section[];
    // 預購欄位
    is_preorder?: boolean;
    preorder_start_date?: string;
    preorder_end_date?: string;
    expected_ship_date?: string;
    preorder_limit?: number | null;
    preorder_sold?: number;
    preorder_deposit_percentage?: number;
    preorder_status?: 'upcoming' | 'active' | 'ended' | 'shipped';
}

export interface CMSArticle {
    id: string;
    title: string;
    slug: string;
    [key: string]: any; // Allow dynamic language fields
    category: string;
    readTime: string;
    snippet: string;
    image?: string;
    sections?: Section[];
    metaTitle?: string;
    metaDescription?: string;
    tags?: string[];
    status?: 'published' | 'draft' | 'archived';
}
