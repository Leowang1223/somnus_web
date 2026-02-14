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
                    // 預購欄位
                    is_preorder: boolean
                    preorder_start_date: string | null
                    preorder_end_date: string | null
                    expected_ship_date: string | null
                    preorder_limit: number | null
                    preorder_sold: number
                    preorder_deposit_percentage: number
                    preorder_status: string
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
                    // 預購欄位
                    is_preorder?: boolean
                    preorder_start_date?: string | null
                    preorder_end_date?: string | null
                    expected_ship_date?: string | null
                    preorder_limit?: number | null
                    preorder_sold?: number
                    preorder_deposit_percentage?: number
                    preorder_status?: string
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
                    // 預購欄位
                    is_preorder?: boolean
                    preorder_start_date?: string | null
                    preorder_end_date?: string | null
                    expected_ship_date?: string | null
                    preorder_limit?: number | null
                    preorder_sold?: number
                    preorder_deposit_percentage?: number
                    preorder_status?: string
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
                    // 預購欄位
                    has_preorder: boolean
                    preorder_info: Json
                    deposit_amount: number
                    remaining_amount: number
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
                    // 預購欄位
                    has_preorder?: boolean
                    preorder_info?: Json
                    deposit_amount?: number
                    remaining_amount?: number
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
                    // 預購欄位
                    has_preorder?: boolean
                    preorder_info?: Json
                    deposit_amount?: number
                    remaining_amount?: number
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
                    type: string | null
                    department: string | null
                    status: string
                    order_id: string | null
                    messages: Json
                    user_email: string | null
                    assigned_to: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    type?: string | null
                    department?: string | null
                    status?: string
                    order_id?: string | null
                    messages?: Json
                    user_email?: string | null
                    assigned_to?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    type?: string | null
                    department?: string | null
                    status?: string
                    order_id?: string | null
                    messages?: Json
                    user_email?: string | null
                    assigned_to?: string | null
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
