import { CMSProduct } from '@/types/cms';

/**
 * 預購輔助函數庫
 * 提供預購相關的狀態檢查、計算和格式化功能
 */

// ==========================================
// 狀態檢查函數
// ==========================================

/**
 * 檢查預購是否進行中
 */
export function isPreorderActive(product: CMSProduct): boolean {
  if (!product.is_preorder) return false;

  const now = new Date();
  const start = product.preorder_start_date ? new Date(product.preorder_start_date) : null;
  const end = product.preorder_end_date ? new Date(product.preorder_end_date) : null;

  if (!start || !end) return false;

  // 檢查時間範圍
  const inTimeRange = now >= start && now <= end;

  // 檢查是否售罄
  const notSoldOut = !product.preorder_limit ||
                     (product.preorder_sold || 0) < product.preorder_limit;

  return inTimeRange && notSoldOut;
}

/**
 * 檢查預購是否即將開始 (3天內)
 */
export function isPreorderUpcoming(product: CMSProduct): boolean {
  if (!product.is_preorder || !product.preorder_start_date) return false;

  const now = new Date();
  const start = new Date(product.preorder_start_date);
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  return now < start && start <= threeDaysLater;
}

/**
 * 檢查預購是否已結束
 */
export function isPreorderEnded(product: CMSProduct): boolean {
  if (!product.is_preorder) return false;

  // 檢查是否售罄
  if (product.preorder_limit && (product.preorder_sold || 0) >= product.preorder_limit) {
    return true;
  }

  // 檢查時間是否已過
  if (!product.preorder_end_date) return false;
  const now = new Date();
  const end = new Date(product.preorder_end_date);
  return now > end;
}

/**
 * 檢查是否可以加入購物車
 */
export function canAddToCart(product: CMSProduct, quantity: number = 1): {
  success: boolean;
  message?: string;
} {
  // 一般商品直接通過
  if (!product.is_preorder) {
    return { success: true };
  }

  // 預購未開始
  if (!isPreorderActive(product)) {
    const start = product.preorder_start_date ? new Date(product.preorder_start_date) : null;
    const now = new Date();

    if (start && now < start) {
      return {
        success: false,
        message: `預購尚未開始，將於 ${formatDate(product.preorder_start_date!)} 開放`
      };
    }

    if (isPreorderEnded(product)) {
      return {
        success: false,
        message: '預購已結束'
      };
    }
  }

  // 檢查剩餘數量
  const remaining = getPreorderRemaining(product);
  if (remaining !== null && quantity > remaining) {
    return {
      success: false,
      message: `僅剩 ${remaining} 個預購名額`
    };
  }

  return { success: true };
}

// ==========================================
// 計算函數
// ==========================================

/**
 * 計算預購剩餘數量
 */
export function getPreorderRemaining(product: CMSProduct): number | null {
  if (!product.is_preorder || !product.preorder_limit) {
    return null; // 無限制
  }

  const sold = product.preorder_sold || 0;
  return Math.max(0, product.preorder_limit - sold);
}

/**
 * 計算預購進度百分比
 */
export function getPreorderProgress(product: CMSProduct): number {
  if (!product.is_preorder || !product.preorder_limit) {
    return 0;
  }

  const sold = product.preorder_sold || 0;
  return Math.min(100, Math.round((sold / product.preorder_limit) * 100));
}

/**
 * 計算實際支付金額（含訂金）
 */
export function calculatePayableAmount(product: CMSProduct): {
  depositAmount: number;
  fullAmount: number;
  isFullPayment: boolean;
} {
  const fullAmount = product.price;
  const percentage = product.preorder_deposit_percentage || 100;
  const depositAmount = Math.round((fullAmount * percentage) / 100 * 100) / 100; // 四捨五入到小數點後2位

  return {
    depositAmount,
    fullAmount,
    isFullPayment: percentage === 100
  };
}

/**
 * 計算剩餘尾款
 */
export function calculateRemainingAmount(product: CMSProduct): number {
  const { depositAmount, fullAmount } = calculatePayableAmount(product);
  return Math.round((fullAmount - depositAmount) * 100) / 100;
}

// ==========================================
// 倒數計時函數
// ==========================================

/**
 * 計算預購倒數（到開始或結束時間）
 */
export function getPreorderCountdown(product: CMSProduct): {
  type: 'start' | 'end' | null;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
} | null {
  if (!product.is_preorder) return null;

  const now = new Date().getTime();
  const start = product.preorder_start_date ? new Date(product.preorder_start_date).getTime() : null;
  const end = product.preorder_end_date ? new Date(product.preorder_end_date).getTime() : null;

  let targetTime: number;
  let type: 'start' | 'end';

  // 決定倒數目標（開始或結束）
  if (start && now < start) {
    targetTime = start;
    type = 'start';
  } else if (end && now < end) {
    targetTime = end;
    type = 'end';
  } else {
    return null; // 預購已結束
  }

  const diff = targetTime - now;
  const totalSeconds = Math.floor(diff / 1000);

  return {
    type,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds
  };
}

// ==========================================
// 格式化函數
// ==========================================

/**
 * 格式化日期
 */
export function formatDate(dateString: string, locale: string = 'zh-TW'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 格式化日期時間
 */
export function formatDateTime(dateString: string, locale: string = 'zh-TW'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 獲取預購狀態文字
 */
export function getPreorderStatusText(product: CMSProduct, lang: 'zh' | 'en' = 'zh'): string {
  if (!product.is_preorder) return '';

  const status = product.preorder_status || 'upcoming';

  const statusTexts: Record<string, Record<string, string>> = {
    upcoming: {
      zh: '即將開始',
      en: 'Upcoming'
    },
    active: {
      zh: '預購中',
      en: 'Pre-order Now'
    },
    ended: {
      zh: '預購已結束',
      en: 'Pre-order Ended'
    },
    shipped: {
      zh: '已出貨',
      en: 'Shipped'
    }
  };

  return statusTexts[status]?.[lang] || statusTexts.upcoming[lang];
}

/**
 * 獲取預購狀態顏色
 */
export function getPreorderStatusColor(product: CMSProduct): string {
  if (!product.is_preorder) return 'gray';

  const status = product.preorder_status || 'upcoming';

  const colorMap: Record<string, string> = {
    upcoming: 'yellow',
    active: 'blue',
    ended: 'gray',
    shipped: 'purple'
  };

  return colorMap[status] || 'gray';
}

// ==========================================
// 預購時間相關函數
// ==========================================

/**
 * 檢查預購是否即將結束 (少於7天)
 */
export function isPreorderEndingSoon(product: CMSProduct): boolean {
  if (!product.is_preorder || !product.preorder_end_date) return false;

  const now = new Date();
  const end = new Date(product.preorder_end_date);
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return now < end && end <= sevenDaysLater;
}

/**
 * 檢查預購是否熱門 (剩餘少於20%)
 */
export function isPreorderHot(product: CMSProduct): boolean {
  if (!product.is_preorder || !product.preorder_limit) return false;

  const progress = getPreorderProgress(product);
  return progress >= 80; // 已售出80%以上
}

/**
 * 獲取預購時間範圍文字
 */
export function getPreorderTimeRangeText(product: CMSProduct, lang: 'zh' | 'en' = 'zh'): string {
  if (!product.is_preorder) return '';

  const start = product.preorder_start_date ? formatDate(product.preorder_start_date) : '未定';
  const end = product.preorder_end_date ? formatDate(product.preorder_end_date) : '未定';

  if (lang === 'en') {
    return `${start} - ${end}`;
  }

  return `${start} 至 ${end}`;
}
