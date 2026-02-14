
import type { AccountingOrderFields } from './accounting';
import type { TrackingOrderFields } from './tracking';

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'preorder_confirmed' | 'preorder_ready';

export type OrderItem = {
    productId: string;
    variantId?: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    // 預購欄位
    is_preorder?: boolean;
    expected_ship_date?: string;
    deposit_amount?: number;
    full_amount?: number;
};

export type ShippingInfo = {
    fullName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    country: string;
    notes?: string;
};

export type TrackingInfo = {
    carrier: string;       // e.g., DHL, FedEx, SF Express
    trackingNumber: string;
    trackingUrl?: string;  // Direct link to carrier's tracking page
    estimatedDelivery?: string;
    shippedAt?: string;    // ISO Date
    deliveredAt?: string;  // ISO Date
};

export type PreorderInfo = {
    productIds: string[];
    expectedShipDate: string;
    depositTotal: number;
    remainingTotal: number;
};

export type Order = {
    id: string;            // Unique Order ID (e.g., SOM-2024-0001)
    userId?: string;       // If logged in
    date: string;          // ISO Date
    status: OrderStatus;
    total: number;
    items: OrderItem[];
    shippingInfo: ShippingInfo;
    trackingInfo?: TrackingInfo;
    timeline: {
        status: OrderStatus;
        date: string;
        note?: string;
    }[];
    // 預購欄位
    has_preorder?: boolean;
    preorder_info?: PreorderInfo;
    deposit_amount?: number;
    remaining_amount?: number;
} & Partial<AccountingOrderFields> & Partial<TrackingOrderFields>;
