/**
 * 訂單追蹤相關的類型定義
 */

// 物流狀態
export type ShipmentStatus =
  | 'pending'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned';

// 物流追蹤記錄
export interface Shipment {
  id: string;
  order_id: string;

  // 物流商資訊
  carrier: string;
  tracking_number: string;
  tracking_url?: string;

  // 包裹資訊
  package_weight?: number;
  package_dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  package_count: number;

  // 物流狀態
  shipment_status: ShipmentStatus;
  current_location?: string;
  status_updates: ShipmentStatusUpdate[];

  // 時間記錄
  shipped_at?: string;
  estimated_delivery?: string;
  delivered_at?: string;

  // 簽收資訊
  recipient_name?: string;
  signature_url?: string;
  delivery_photo_url?: string;
  delivery_notes?: string;

  // 異常記錄
  is_delayed: boolean;
  delay_reason?: string;
  exception_count: number;
  last_exception?: string;

  created_at: string;
  updated_at: string;
}

// 物流狀態更新記錄
export interface ShipmentStatusUpdate {
  timestamp: string;
  status: ShipmentStatus;
  location?: string;
  description: string;
  operator?: string;
}

// 訂單標籤類型
export type OrderTagType = 'priority' | 'issue' | 'vip' | 'rush' | 'risk';

// 訂單標籤
export interface OrderTag {
  id: number;
  order_id: string;
  tag_type: OrderTagType;
  tag_value: string;
  tag_color?: string;
  created_by?: string;
  notes?: string;
  created_at: string;
}

// 異常標記優先級
export type FlagPriority = 'low' | 'medium' | 'high' | 'critical';

// 訂單追蹤相關欄位（擴充 Order 類型用）
export interface TrackingOrderFields {
  // 預計配送
  estimated_delivery_date?: string;
  last_status_update: string;
  notification_sent: NotificationRecord[];

  // 訂單修改
  can_cancel_until?: string;
  customer_notes?: string;
  modification_requests: ModificationRequest[];

  // 異常追蹤
  is_flagged: boolean;
  flag_reason?: string;
  flag_priority?: FlagPriority;
  assigned_to?: string;
}

// 通知記錄
export interface NotificationRecord {
  type: 'email' | 'sms' | 'push';
  event: string;
  sent_at: string;
  status: 'sent' | 'failed' | 'delivered';
}

// 修改請求記錄
export interface ModificationRequest {
  type: 'address_change' | 'cancel_request' | 'delay_request';
  requested_at: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected';
  old_value?: any;
  new_value?: any;
  notes?: string;
  processed_at?: string;
  processed_by?: string;
}

// 物流異常報表
export interface ShipmentException {
  id: string;
  order_id: string;
  tracking_number: string;
  carrier: string;
  shipment_status: ShipmentStatus;
  is_delayed: boolean;
  delay_reason?: string;
  exception_count: number;
  last_exception?: string;
  estimated_delivery?: string;
  customer_email: string;
  customer_phone?: string;
}
