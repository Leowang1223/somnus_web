# 📊 會計 + 訂單追蹤完整實作指南

## ✅ **已完成功能總覽**

### **🎯 核心升級內容**

本次升級同時實作了**會計財務邏輯**與**訂單追蹤系統**，確保系統符合專業會計標準，同時提升訂單管理效率。

---

## 📦 **資料庫架構升級**

### **1. Orders 表 - 新增 30+ 個欄位**

#### **會計核心欄位（9個）**
| 欄位 | 類型 | 用途 | 會計意義 |
|------|------|------|---------|
| `order_type` | TEXT | stock / preorder | 區分現貨/預購，影響收入認列時機 |
| `currency` | TEXT | TWD / USD / EUR | 多幣別支援 |
| `exchange_rate` | NUMERIC | 匯率 | 換算本幣金額 |
| `subtotal` | NUMERIC | 小計（未稅） | 會計分錄基礎 |
| `tax_amount` | NUMERIC | 稅額 | 營業稅申報 |
| `shipping_fee` | NUMERIC | 運費 | 獨立科目 |
| `total_amount` | NUMERIC | 總額（含稅含運） | 對帳用 |
| `customer_country` | TEXT | 客戶國別 | 跨境稅務判斷 |
| `customer_type` | TEXT | B2B / B2C | 發票開立依據 |

#### **預購履約欄位（5個）** - 會計超關鍵
| 欄位 | 類型 | 會計意義 |
|------|------|---------|
| `is_fulfilled` | BOOLEAN | **決定能否認列收入** |
| `fulfilled_at` | TIMESTAMPTZ | **收入認列日** |
| `deferred_revenue` | NUMERIC | **遞延收入（負債科目）** |
| `recognized_revenue` | NUMERIC | **已認列收入（實際營收）** |
| `preorder_batch_id` | TEXT | 批次履約管理 |

**💡 會計邏輯：**
```
預購訂單收款時：
  借：銀行存款 $1,000
    貸：預收貨款（遞延收入）$1,000

出貨履約時：
  借：預收貨款 $1,000
    貸：營業收入（已認列收入）$1,000
```

#### **發票稅務欄位（8個）**
| 欄位 | 用途 |
|------|------|
| `invoice_required` | 是否需開發票 |
| `invoice_type` | 二聯式 / 三聯式 |
| `invoice_number` | 發票號碼 |
| `invoice_issued_at` | 發票開立時間 |
| `tax_rate` | 稅率（5% / 0%） |
| `tax_type` | 應稅 / 免稅 / 零稅率 |
| `tax_id` | 統編（B2B） |
| `company_name` | 公司名稱 |

#### **訂單追蹤欄位（8個）**
| 欄位 | 用途 |
|------|------|
| `estimated_delivery_date` | 預計送達時間 |
| `last_status_update` | 最後狀態更新時間 |
| `notification_sent` | 通知發送記錄（JSONB） |
| `can_cancel_until` | 可取消截止時間 |
| `customer_notes` | 客戶備註 |
| `modification_requests` | 修改請求記錄（JSONB） |
| `is_flagged` | 是否異常標記 |
| `flag_reason` | 異常原因 |
| `flag_priority` | 優先級（low/medium/high/critical） |
| `assigned_to` | 負責客服 |

---

### **2. Payments 表（全新）- 金流追蹤**

**為什麼必須獨立？**
- ✅ 一筆訂單可能有多次付款（訂金+尾款）
- ✅ 退款、爭議、手續費需要獨立追蹤
- ✅ 金流對帳需要流水號
- ✅ 實收金額 ≠ 訂單金額（扣除手續費）

**核心欄位：**
```sql
id                     -- 付款ID
order_id               -- 關聯訂單
payment_provider       -- Stripe / PayPal / 綠界 / BMC
transaction_id         -- 金流商交易流水號
amount                 -- 付款金額
gateway_fee            -- 金流手續費
net_amount             -- 實收金額（扣除手續費）
payment_status         -- pending / completed / failed
paid_at                -- 付款時間
payout_status          -- pending / paid_out（是否已入帳）
payout_at              -- 實際入帳時間
payment_type           -- deposit（訂金）/ final（尾款）/ full（全額）
```

**會計價值：**
- 📊 每日對帳報表
- 💰 手續費成本追蹤
- 🏦 銀行入帳狀態管理

---

### **3. Shipments 表（全新）- 物流追蹤**

**獨立物流管理的優勢：**
- ✅ 支援一筆訂單多個包裹
- ✅ 完整物流歷程記錄
- ✅ 異常追蹤與預警
- ✅ 簽收證明數位化

**核心欄位：**
```sql
id                     -- 物流ID
order_id               -- 關聯訂單
carrier                -- 物流商（DHL / FedEx / 順豐）
tracking_number        -- 追蹤碼
shipment_status        -- pending / in_transit / delivered / failed
current_location       -- 當前位置
status_updates         -- 物流歷程（JSONB）
shipped_at             -- 出貨時間
estimated_delivery     -- 預計送達
delivered_at           -- 實際送達
recipient_name         -- 簽收人
signature_url          -- 簽收簽名照片
is_delayed             -- 是否延遲
exception_count        -- 異常次數
```

**客戶體驗提升：**
- 📍 即時物流狀態追蹤
- 🔔 自動異常預警
- 📸 簽收照片存證

---

### **4. Refunds 表（全新）- 退款追蹤**

**會計合規的退款管理：**

```sql
id                     -- 退款ID
order_id               -- 原始訂單
payment_id             -- 原始付款
refund_amount          -- 退款金額
refund_fee             -- 不可退的手續費
net_refund             -- 實際退款
refund_type            -- full / partial
invoice_action         -- void（作廢）/ credit_note（折讓）
credit_note_number     -- 折讓單號
refund_status          -- pending / completed / failed
approved_by            -- 審核者
```

**會計處理：**
- 📝 自動產生折讓單
- 💸 收入沖回記錄
- 🔍 手續費損失追蹤

---

### **5. Order Tags 表（全新）- 訂單標籤系統**

**靈活的訂單分類：**

```sql
order_id               -- 訂單ID
tag_type               -- priority / issue / vip / rush / risk
tag_value              -- high / low / damaged / fraud
tag_color              -- UI 顏色
created_by             -- 建立者（admin）
notes                  -- 標籤備註
```

**使用場景：**
- 🔴 高優先級訂單（VIP 客戶）
- ⚠️ 問題訂單標記
- 🚀 急件標記
- 🛡️ 風險訂單預警

---

## 📊 **會計報表 Views（自動化）**

### **1. 每日營收報表 (daily_revenue_report)**

```sql
SELECT * FROM daily_revenue_report WHERE report_date = '2026-02-13';
```

**報表欄位：**
- `total_orders` - 總訂單數
- `stock_orders` - 現貨訂單數
- `preorder_orders` - 預購訂單數
- `gross_revenue` - 總營收
- `recognized_revenue` - **已認列收入（實際營收）**
- `deferred_revenue` - **遞延收入（負債）**
- `total_tax` - 營業稅總額
- `total_shipping` - 運費總額

**會計師最愛的報表** ✨

---

### **2. 遞延收入追蹤 (deferred_revenue_tracker)**

```sql
SELECT * FROM deferred_revenue_tracker
WHERE fulfillment_status = 'overdue';
```

**報表欄位：**
- `order_id` - 訂單編號
- `deposit_amount` - 訂金金額
- `deferred_revenue` - 尚未認列的收入
- `is_fulfilled` - 是否已履約
- `expected_ship_date` - 預計出貨日
- `days_until_fulfillment` - 距離履約天數
- `fulfillment_status` - fulfilled / overdue / upcoming / pending

**用途：**
- 📅 追蹤預購商品履約進度
- ⚠️ 預警逾期未出貨的訂單
- 💼 投資人盡職調查必備

---

### **3. 金流對帳表 (payment_reconciliation)**

```sql
SELECT * FROM payment_reconciliation
WHERE payment_provider = 'stripe';
```

**報表欄位：**
- `payment_provider` - 金流商
- `payment_date` - 付款日期
- `transaction_count` - 交易筆數
- `gross_amount` - 總收款
- `total_fees` - 手續費總額
- `net_amount` - 實收金額
- `paid_out` - 已入帳金額
- `pending_payout` - 待入帳金額

**對帳神器** 🎯

---

### **4. 物流異常報表 (shipment_exceptions)**

```sql
SELECT * FROM shipment_exceptions
WHERE is_delayed = true;
```

**報表欄位：**
- `tracking_number` - 追蹤碼
- `carrier` - 物流商
- `is_delayed` - 是否延遲
- `exception_count` - 異常次數
- `customer_email` - 客戶 Email
- `estimated_delivery` - 預計送達

**客服必備工具** 🚨

---

## 🔧 **如何使用**

### **Step 1: 執行 Migration**

```bash
# 方法一：透過 Supabase CLI
cd somnus_web-main
supabase db push

# 方法二：手動在 Dashboard 執行
# 1. 進入 Supabase Dashboard → SQL Editor
# 2. 複製 supabase/migrations/20260213_accounting_and_tracking.sql
# 3. 執行
```

---

### **Step 2: 建立訂單時自動計算會計欄位**

**範例：訂單建立邏輯**

```typescript
const orderData = {
  // 基本資訊
  id: 'SOM-260213-0001',
  status: 'paid',

  // 會計核心
  order_type: hasPreorder ? 'preorder' : 'stock',
  currency: 'TWD',
  exchange_rate: 1.0,

  // 金額計算
  subtotal: 1000,                    // 小計（未稅）
  tax_amount: 1000 * 0.05,          // 稅額（5%）
  shipping_fee: 100,                 // 運費
  total_amount: 1000 + 50 + 100,    // 總額

  // 預購履約（關鍵）
  is_fulfilled: false,               // 尚未出貨
  deferred_revenue: 1150,            // 全額列為遞延收入（負債）
  recognized_revenue: 0,             // 尚未認列收入

  // 客戶與稅務
  customer_country: 'TW',
  customer_type: 'B2C',
  tax_rate: 5.0,
  tax_type: 'taxable'
};
```

---

### **Step 3: 出貨時履約（收入認列）**

```typescript
// 出貨時更新
await updateOrderFulfillment(orderId, {
  is_fulfilled: true,
  fulfilled_at: new Date().toISOString(),
  recognized_revenue: 1150,          // 轉為已認列收入
  deferred_revenue: 0,               // 清空遞延收入
  status: 'shipped'
});
```

**會計分錄自動完成：**
```
借：預收貨款 $1,150
  貸：營業收入 $1,150
```

---

### **Step 4: 記錄付款（Payments 表）**

```typescript
const payment = {
  id: 'PAY-260213-0001',
  order_id: 'SOM-260213-0001',
  payment_provider: 'stripe',
  transaction_id: 'ch_1234567890',
  amount: 1150,
  gateway_fee: 35,                   // Stripe 手續費 3%
  net_amount: 1115,                  // 實收 = 1150 - 35
  payment_status: 'completed',
  paid_at: new Date().toISOString(),
  payment_type: 'full'               // 全額付款
};
```

---

### **Step 5: 建立物流追蹤**

```typescript
const shipment = {
  id: 'SHIP-260213-0001',
  order_id: 'SOM-260213-0001',
  carrier: 'DHL',
  tracking_number: 'DHL1234567890',
  tracking_url: 'https://dhl.com/track/...',
  shipment_status: 'in_transit',
  status_updates: [
    {
      timestamp: '2026-02-13T10:00:00Z',
      status: 'pending',
      description: '待取件'
    },
    {
      timestamp: '2026-02-13T14:00:00Z',
      status: 'in_transit',
      location: '台北轉運中心',
      description: '已取件，運送中'
    }
  ]
};
```

---

### **Step 6: 查詢會計報表**

```typescript
// 查詢今日營收
const todayRevenue = await supabase
  .from('daily_revenue_report')
  .select('*')
  .eq('report_date', '2026-02-13')
  .single();

console.log(`
  今日營收統計：
  - 總訂單：${todayRevenue.total_orders} 筆
  - 已認列收入：$${todayRevenue.recognized_revenue}
  - 遞延收入：$${todayRevenue.deferred_revenue}
  - 營業稅：$${todayRevenue.total_tax}
`);

// 查詢待履約的預購訂單
const pendingPreorders = await supabase
  .from('deferred_revenue_tracker')
  .select('*')
  .eq('fulfillment_status', 'pending');

console.log(`待履約預購：${pendingPreorders.length} 筆`);
```

---

## 🎯 **會計合規檢查清單**

### ✅ **收入認列原則**
- [x] 現貨訂單：付款後立即認列收入
- [x] 預購訂單：出貨後才認列收入（履約原則）
- [x] 退款訂單：自動沖回收入

### ✅ **營業稅申報**
- [x] 稅額獨立記錄（`tax_amount`）
- [x] 支援不同稅率（5% / 0%）
- [x] 支援免稅 / 零稅率判斷
- [x] 發票號碼可追蹤

### ✅ **金流對帳**
- [x] 每筆付款有獨立流水號
- [x] 手續費獨立記錄
- [x] 實收金額可追蹤
- [x] 入帳狀態管理

### ✅ **遞延收入管理**
- [x] 預購訂單自動列為遞延收入
- [x] 履約後自動轉為已認列收入
- [x] 可產生遞延收入追蹤表

---

## 📁 **檔案清單**

### **新增檔案**
```
supabase/migrations/
  └─ 20260213_accounting_and_tracking.sql  (600+ 行)

src/types/
  ├─ accounting.ts  (會計類型定義)
  └─ tracking.ts    (追蹤類型定義)

ACCOUNTING_AND_TRACKING.md  (本文件)
```

### **修改檔案**
```
src/types/
  └─ order.ts  (整合會計與追蹤欄位)
```

---

## 🚀 **下一步建議**

### **Phase 1: Admin 介面整合（2-3天）**
1. 訂單詳情頁顯示會計資訊
2. 金流對帳頁面
3. 遞延收入儀表板
4. 物流追蹤管理介面

### **Phase 2: 前台追蹤頁面（1-2天）**
1. 客戶追蹤碼查詢頁面
2. 訂單詳情頁（含物流進度）
3. 訂單修改/取消功能

### **Phase 3: 自動化與整合（1週）**
1. 金流 Webhook 自動記錄付款
2. 物流 API 自動更新狀態
3. Email 通知自動化
4. ERP 系統串接

---

## 💡 **最佳實踐**

### **會計操作**
1. ✅ 每天結帳前檢查遞延收入表
2. ✅ 月底對帳時使用金流對帳表
3. ✅ 發票開立時確認稅額正確
4. ✅ 退款時同步更新發票狀態

### **訂單追蹤**
1. ✅ 出貨時同步建立 Shipment 記錄
2. ✅ 異常訂單立即標記 (is_flagged)
3. ✅ 定期檢查物流異常報表
4. ✅ 客訴訂單加上標籤 (order_tags)

---

完成時間：2026-02-13
實作者：Claude Sonnet 4.5
專案：Somnus Web - 會計與訂單追蹤完整實作
版本：v2.0 (預購 + 會計 + 追蹤)
