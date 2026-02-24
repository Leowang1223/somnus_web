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
                    // 多語系
                    name_zh: string | null
                    name_jp: string | null
                    name_ko: string | null
                    description_zh: string | null
                    description_jp: string | null
                    description_ko: string | null
                    // 預購欄位
                    is_preorder: boolean
                    preorder_start_date: string | null
                    preorder_end_date: string | null
                    expected_ship_date: string | null
                    preorder_limit: number | null
                    preorder_sold: number
                    preorder_deposit_percentage: number
                    preorder_status: string
                    // 其他
                    hover_video: string | null
                    variants: Json
                    supplier: Json
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
                    name_zh?: string | null
                    name_jp?: string | null
                    name_ko?: string | null
                    description_zh?: string | null
                    description_jp?: string | null
                    description_ko?: string | null
                    is_preorder?: boolean
                    preorder_start_date?: string | null
                    preorder_end_date?: string | null
                    expected_ship_date?: string | null
                    preorder_limit?: number | null
                    preorder_sold?: number
                    preorder_deposit_percentage?: number
                    preorder_status?: string
                    hover_video?: string | null
                    variants?: Json
                    supplier?: Json
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
                    name_zh?: string | null
                    name_jp?: string | null
                    name_ko?: string | null
                    description_zh?: string | null
                    description_jp?: string | null
                    description_ko?: string | null
                    is_preorder?: boolean
                    preorder_start_date?: string | null
                    preorder_end_date?: string | null
                    expected_ship_date?: string | null
                    preorder_limit?: number | null
                    preorder_sold?: number
                    preorder_deposit_percentage?: number
                    preorder_status?: string
                    hover_video?: string | null
                    variants?: Json
                    supplier?: Json
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
                    expected_ship_date: string | null
                    // 會計欄位
                    order_type: string
                    currency: string
                    exchange_rate: number
                    subtotal: number | null
                    tax_amount: number
                    shipping_fee: number
                    total_amount: number | null
                    customer_country: string
                    customer_type: string
                    tax_id: string | null
                    company_name: string | null
                    invoice_required: boolean
                    invoice_type: string | null
                    invoice_number: string | null
                    invoice_issued_at: string | null
                    tax_rate: number
                    tax_type: string
                    // 預購履約
                    is_fulfilled: boolean
                    fulfilled_at: string | null
                    deferred_revenue: number
                    recognized_revenue: number
                    preorder_batch_id: string | null
                    // 訂單追蹤
                    estimated_delivery_date: string | null
                    last_status_update: string | null
                    notification_sent: Json
                    can_cancel_until: string | null
                    customer_notes: string | null
                    modification_requests: Json
                    // 異常追蹤
                    is_flagged: boolean
                    flag_reason: string | null
                    flag_priority: string | null
                    assigned_to: string | null
                    // 物流
                    shipping_method: string
                    cvs_store_id: string | null
                    cvs_store_name: string | null
                    cvs_store_address: string | null
                    cvs_sub_type: string | null
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
                    has_preorder?: boolean
                    preorder_info?: Json
                    deposit_amount?: number
                    remaining_amount?: number
                    expected_ship_date?: string | null
                    order_type?: string
                    currency?: string
                    exchange_rate?: number
                    subtotal?: number | null
                    tax_amount?: number
                    shipping_fee?: number
                    total_amount?: number | null
                    customer_country?: string
                    customer_type?: string
                    tax_id?: string | null
                    company_name?: string | null
                    invoice_required?: boolean
                    invoice_type?: string | null
                    invoice_number?: string | null
                    invoice_issued_at?: string | null
                    tax_rate?: number
                    tax_type?: string
                    is_fulfilled?: boolean
                    fulfilled_at?: string | null
                    deferred_revenue?: number
                    recognized_revenue?: number
                    preorder_batch_id?: string | null
                    estimated_delivery_date?: string | null
                    last_status_update?: string | null
                    notification_sent?: Json
                    can_cancel_until?: string | null
                    customer_notes?: string | null
                    modification_requests?: Json
                    is_flagged?: boolean
                    flag_reason?: string | null
                    flag_priority?: string | null
                    assigned_to?: string | null
                    shipping_method?: string
                    cvs_store_id?: string | null
                    cvs_store_name?: string | null
                    cvs_store_address?: string | null
                    cvs_sub_type?: string | null
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
                    has_preorder?: boolean
                    preorder_info?: Json
                    deposit_amount?: number
                    remaining_amount?: number
                    expected_ship_date?: string | null
                    order_type?: string
                    currency?: string
                    exchange_rate?: number
                    subtotal?: number | null
                    tax_amount?: number
                    shipping_fee?: number
                    total_amount?: number | null
                    customer_country?: string
                    customer_type?: string
                    tax_id?: string | null
                    company_name?: string | null
                    invoice_required?: boolean
                    invoice_type?: string | null
                    invoice_number?: string | null
                    invoice_issued_at?: string | null
                    tax_rate?: number
                    tax_type?: string
                    is_fulfilled?: boolean
                    fulfilled_at?: string | null
                    deferred_revenue?: number
                    recognized_revenue?: number
                    preorder_batch_id?: string | null
                    estimated_delivery_date?: string | null
                    last_status_update?: string | null
                    notification_sent?: Json
                    can_cancel_until?: string | null
                    customer_notes?: string | null
                    modification_requests?: Json
                    is_flagged?: boolean
                    flag_reason?: string | null
                    flag_priority?: string | null
                    assigned_to?: string | null
                    shipping_method?: string
                    cvs_store_id?: string | null
                    cvs_store_name?: string | null
                    cvs_store_address?: string | null
                    cvs_sub_type?: string | null
                }
            }
            articles: {
                Row: {
                    id: string
                    slug: string
                    title: string
                    snippet: string | null
                    cover_image: string | null
                    category: string | null
                    author: string | null
                    date: string | null
                    status: string
                    read_time: string | null
                    tags: Json
                    sections: Json
                    meta_title: string | null
                    meta_description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    slug: string
                    title: string
                    snippet?: string | null
                    cover_image?: string | null
                    category?: string | null
                    author?: string | null
                    date?: string | null
                    status?: string
                    read_time?: string | null
                    tags?: Json
                    sections?: Json
                    meta_title?: string | null
                    meta_description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    slug?: string
                    title?: string
                    snippet?: string | null
                    cover_image?: string | null
                    category?: string | null
                    author?: string | null
                    date?: string | null
                    status?: string
                    read_time?: string | null
                    tags?: Json
                    sections?: Json
                    meta_title?: string | null
                    meta_description?: string | null
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
            payments: {
                Row: {
                    id: string
                    order_id: string | null
                    payment_provider: string
                    transaction_id: string | null
                    payment_method: string | null
                    amount: number
                    currency: string
                    exchange_rate: number
                    amount_twd: number | null
                    gateway_fee: number
                    net_amount: number | null
                    payment_status: string
                    paid_at: string | null
                    payout_status: string
                    payout_at: string | null
                    payout_batch_id: string | null
                    payment_type: string
                    metadata: Json
                    raw_response: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    order_id?: string | null
                    payment_provider: string
                    transaction_id?: string | null
                    payment_method?: string | null
                    amount: number
                    currency?: string
                    exchange_rate?: number
                    amount_twd?: number | null
                    gateway_fee?: number
                    net_amount?: number | null
                    payment_status?: string
                    paid_at?: string | null
                    payout_status?: string
                    payout_at?: string | null
                    payout_batch_id?: string | null
                    payment_type?: string
                    metadata?: Json
                    raw_response?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string | null
                    payment_provider?: string
                    transaction_id?: string | null
                    payment_method?: string | null
                    amount?: number
                    currency?: string
                    exchange_rate?: number
                    amount_twd?: number | null
                    gateway_fee?: number
                    net_amount?: number | null
                    payment_status?: string
                    paid_at?: string | null
                    payout_status?: string
                    payout_at?: string | null
                    payout_batch_id?: string | null
                    payment_type?: string
                    metadata?: Json
                    raw_response?: Json | null
                    updated_at?: string
                }
            }
            shipments: {
                Row: {
                    id: string
                    order_id: string | null
                    carrier: string
                    tracking_number: string
                    tracking_url: string | null
                    package_weight: number | null
                    package_dimensions: Json | null
                    package_count: number
                    shipment_status: string
                    current_location: string | null
                    status_updates: Json
                    shipped_at: string | null
                    estimated_delivery: string | null
                    delivered_at: string | null
                    recipient_name: string | null
                    signature_url: string | null
                    delivery_photo_url: string | null
                    delivery_notes: string | null
                    is_delayed: boolean
                    delay_reason: string | null
                    exception_count: number
                    last_exception: string | null
                    // ECPay 物流
                    logistics_id: string | null
                    logistics_trade_no: string | null
                    cvs_paper_no: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    order_id?: string | null
                    carrier: string
                    tracking_number: string
                    tracking_url?: string | null
                    package_weight?: number | null
                    package_dimensions?: Json | null
                    package_count?: number
                    shipment_status?: string
                    current_location?: string | null
                    status_updates?: Json
                    shipped_at?: string | null
                    estimated_delivery?: string | null
                    delivered_at?: string | null
                    recipient_name?: string | null
                    signature_url?: string | null
                    delivery_photo_url?: string | null
                    delivery_notes?: string | null
                    is_delayed?: boolean
                    delay_reason?: string | null
                    exception_count?: number
                    last_exception?: string | null
                    logistics_id?: string | null
                    logistics_trade_no?: string | null
                    cvs_paper_no?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string | null
                    carrier?: string
                    tracking_number?: string
                    tracking_url?: string | null
                    package_weight?: number | null
                    package_dimensions?: Json | null
                    package_count?: number
                    shipment_status?: string
                    current_location?: string | null
                    status_updates?: Json
                    shipped_at?: string | null
                    estimated_delivery?: string | null
                    delivered_at?: string | null
                    recipient_name?: string | null
                    signature_url?: string | null
                    delivery_photo_url?: string | null
                    delivery_notes?: string | null
                    is_delayed?: boolean
                    delay_reason?: string | null
                    exception_count?: number
                    last_exception?: string | null
                    logistics_id?: string | null
                    logistics_trade_no?: string | null
                    cvs_paper_no?: string | null
                    updated_at?: string
                }
            }
            merchant_settings: {
                Row: {
                    id: number
                    payment_provider: string
                    ecpay_merchant_id: string | null
                    ecpay_hash_key: string | null
                    ecpay_hash_iv: string | null
                    ecpay_test_mode: boolean
                    stripe_publishable_key: string | null
                    stripe_secret_key: string | null
                    stripe_webhook_secret: string | null
                    tappay_partner_key: string | null
                    tappay_merchant_id: string | null
                    tappay_test_mode: boolean
                    payment_currency: string
                    // ECPay 物流
                    ecpay_logistics_merchant_id: string | null
                    ecpay_logistics_hash_key: string | null
                    ecpay_logistics_hash_iv: string | null
                    ecpay_logistics_test_mode: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: number
                    payment_provider?: string
                    ecpay_merchant_id?: string | null
                    ecpay_hash_key?: string | null
                    ecpay_hash_iv?: string | null
                    ecpay_test_mode?: boolean
                    stripe_publishable_key?: string | null
                    stripe_secret_key?: string | null
                    stripe_webhook_secret?: string | null
                    tappay_partner_key?: string | null
                    tappay_merchant_id?: string | null
                    tappay_test_mode?: boolean
                    payment_currency?: string
                    ecpay_logistics_merchant_id?: string | null
                    ecpay_logistics_hash_key?: string | null
                    ecpay_logistics_hash_iv?: string | null
                    ecpay_logistics_test_mode?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    payment_provider?: string
                    ecpay_merchant_id?: string | null
                    ecpay_hash_key?: string | null
                    ecpay_hash_iv?: string | null
                    ecpay_test_mode?: boolean
                    stripe_publishable_key?: string | null
                    stripe_secret_key?: string | null
                    stripe_webhook_secret?: string | null
                    tappay_partner_key?: string | null
                    tappay_merchant_id?: string | null
                    tappay_test_mode?: boolean
                    payment_currency?: string
                    ecpay_logistics_merchant_id?: string | null
                    ecpay_logistics_hash_key?: string | null
                    ecpay_logistics_hash_iv?: string | null
                    ecpay_logistics_test_mode?: boolean
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_my_role: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
