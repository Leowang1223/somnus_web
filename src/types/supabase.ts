export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    name: string | null
                    role: 'owner' | 'support' | 'consumer'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    name?: string | null
                    role?: 'owner' | 'support' | 'consumer'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string | null
                    role?: 'owner' | 'support' | 'consumer'
                    updated_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    slug: string
                    name: string
                    price: number
                    cost: number
                    category: string | null
                    description: string | null
                    image: string | null
                    status: string
                    aspect_ratio: string | null
                    tags: Json
                    focus_point: Json | null
                    sections: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    slug: string
                    name: string
                    price: number
                    cost?: number
                    category?: string | null
                    description?: string | null
                    image?: string | null
                    status?: string
                    aspect_ratio?: string | null
                    tags?: Json
                    focus_point?: Json | null
                    sections?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    slug?: string
                    name?: string
                    price?: number
                    cost?: number
                    category?: string | null
                    description?: string | null
                    image?: string | null
                    status?: string
                    aspect_ratio?: string | null
                    tags?: Json
                    focus_point?: Json | null
                    sections?: Json
                    updated_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    customer_name: string
                    customer_email: string
                    customer_phone: string | null
                    shipping_address: Json
                    items: Json
                    total: number
                    status: string
                    tracking_carrier: string | null
                    tracking_number: string | null
                    tracking_url: string | null
                    timeline: Json
                    date: string
                    created_at: string
                }
                Insert: {
                    id: string
                    customer_name: string
                    customer_email: string
                    customer_phone?: string | null
                    shipping_address: Json
                    items: Json
                    total: number
                    status?: string
                    tracking_carrier?: string | null
                    tracking_number?: string | null
                    tracking_url?: string | null
                    timeline?: Json
                    date?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    customer_name?: string
                    customer_email?: string
                    customer_phone?: string | null
                    shipping_address?: Json
                    items?: Json
                    total?: number
                    status?: string
                    tracking_carrier?: string | null
                    tracking_number?: string | null
                    tracking_url?: string | null
                    timeline?: Json
                }
            }
            articles: {
                Row: {
                    id: string
                    slug: string
                    title: string
                    snippet: string | null
                    cover_image: string | null
                    author: string | null
                    date: string | null
                    status: string
                    sections: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    slug: string
                    title: string
                    snippet?: string | null
                    cover_image?: string | null
                    author?: string | null
                    date?: string | null
                    status?: string
                    sections?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    slug?: string
                    title?: string
                    snippet?: string | null
                    cover_image?: string | null
                    author?: string | null
                    date?: string | null
                    status?: string
                    sections?: Json
                    updated_at?: string
                }
            }
            tickets: {
                Row: {
                    id: string
                    customer_name: string
                    customer_email: string
                    subject: string
                    message: string
                    status: string
                    messages: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    customer_name: string
                    customer_email: string
                    subject: string
                    message: string
                    status?: string
                    messages?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    customer_name?: string
                    customer_email?: string
                    subject?: string
                    message?: string
                    status?: string
                    messages?: Json
                    updated_at?: string
                }
            }
            analytics: {
                Row: {
                    id: number
                    total_visitors: number
                    daily_visits: Json
                    updated_at: string
                }
                Insert: {
                    id?: number
                    total_visitors?: number
                    daily_visits?: Json
                    updated_at?: string
                }
                Update: {
                    total_visitors?: number
                    daily_visits?: Json
                    updated_at?: string
                }
            }
            homepage_layout: {
                Row: {
                    id: number
                    sections: Json
                    updated_at: string
                }
                Insert: {
                    id?: number
                    sections?: Json
                    updated_at?: string
                }
                Update: {
                    sections?: Json
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
