'use client';

import { useEffect, useState } from 'react';
import { getMerchantSettingsAction, updateMerchantSettingsAction, testEcpayConnectionAction, updateLogisticsSettingsAction } from '@/app/actions';
import { CreditCard, CheckCircle, AlertCircle, Settings, ChevronDown, ChevronUp, Truck } from 'lucide-react';

const PROVIDERS = [
    { value: 'manual', label: '手動確認付款', desc: '客戶付款後由後台手動確認（適合銀行轉帳、ATM）' },
    { value: 'ecpay',  label: '綠界 ECPay',   desc: '台灣最多商家使用，支援信用卡、ATM、超商代碼' },
    { value: 'stripe', label: 'Stripe',        desc: '國際信用卡，適合海外銷售（USD/EUR）' },
    { value: 'tappay', label: 'TapPay',        desc: '台灣金融機構整合，支援 Apple Pay / 信用卡' },
];

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);

    // Form state
    const [provider, setProvider] = useState('manual');
    const [currency, setCurrency] = useState('TWD');
    // ECPay
    const [ecpayMerchantId, setEcpayMerchantId] = useState('');
    const [ecpayHashKey, setEcpayHashKey] = useState('');
    const [ecpayHashIv, setEcpayHashIv] = useState('');
    const [ecpayTestMode, setEcpayTestMode] = useState(true);
    // Stripe
    const [stripePublishable, setStripePublishable] = useState('');
    const [stripeSecret, setStripeSecret] = useState('');
    const [stripeWebhook, setStripeWebhook] = useState('');
    // TapPay
    const [tappayPartnerKey, setTappayPartnerKey] = useState('');
    const [tappayMerchantId, setTappayMerchantId] = useState('');
    const [tappayTestMode, setTappayTestMode] = useState(true);
    // ECPay 測試連線
    const [ecpayTesting, setEcpayTesting] = useState(false);
    const [ecpayTestResult, setEcpayTestResult] = useState<{ success: boolean; message: string } | null>(null);
    // ECPay 物流
    const [logisticsMerchantId, setLogisticsMerchantId] = useState('');
    const [logisticsHashKey, setLogisticsHashKey] = useState('');
    const [logisticsHashIv, setLogisticsHashIv] = useState('');
    const [logisticsTestMode, setLogisticsTestMode] = useState(true);
    const [logisticsSaving, setLogisticsSaving] = useState(false);
    const [logisticsSaved, setLogisticsSaved] = useState(false);
    const [logisticsExpanded, setLogisticsExpanded] = useState(false);

    useEffect(() => {
        getMerchantSettingsAction().then(res => {
            if (res.success && res.settings) {
                const s = res.settings;
                setSettings(s);
                setProvider(s.payment_provider || 'manual');
                setCurrency(s.payment_currency || 'TWD');
                setEcpayTestMode(s.ecpay_test_mode ?? true);
                setTappayTestMode(s.tappay_test_mode ?? true);
                setLogisticsTestMode(s.ecpay_logistics_test_mode ?? true);
                setExpanded(s.payment_provider || 'manual');
            }
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        const result = await updateMerchantSettingsAction({
            payment_provider: provider,
            payment_currency: currency,
            ...(provider === 'ecpay' && {
                ecpay_merchant_id: ecpayMerchantId || undefined,
                ecpay_hash_key: ecpayHashKey || undefined,
                ecpay_hash_iv: ecpayHashIv || undefined,
                ecpay_test_mode: ecpayTestMode,
            }),
            ...(provider === 'stripe' && {
                stripe_publishable_key: stripePublishable || undefined,
                stripe_secret_key: stripeSecret || undefined,
                stripe_webhook_secret: stripeWebhook || undefined,
            }),
            ...(provider === 'tappay' && {
                tappay_partner_key: tappayPartnerKey || undefined,
                tappay_merchant_id: tappayMerchantId || undefined,
                tappay_test_mode: tappayTestMode,
            }),
        });
        setSaving(false);
        if (result.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
        else alert('儲存失敗：' + (result as any).error);
    };

    if (loading) return <div className="text-white/40 py-20 text-center">載入中...</div>;

    const webhookBase = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';

    return (
        <div className="text-white max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
                <Settings size={24} className="text-[#d8aa5b]" />
                <h1 className="text-3xl font-display">系統設定</h1>
            </div>

            {/* Payment Provider */}
            <section className="mb-8">
                <h2 className="text-xs uppercase tracking-widest text-[#d8aa5b] font-bold mb-4">金流設定</h2>
                <p className="text-gray-500 text-sm mb-6">
                    選擇您的金流服務商。設定後，顧客結帳時將自動跳轉至對應的付款頁面。
                </p>

                {/* Provider Cards */}
                <div className="space-y-3 mb-6">
                    {PROVIDERS.map(p => (
                        <div key={p.value} className={`border rounded-sm transition-colors ${provider === p.value ? 'border-[#d8aa5b]/40 bg-[#d8aa5b]/5' : 'border-white/5 bg-[#111]'}`}>
                            <button
                                type="button"
                                onClick={() => { setProvider(p.value); setExpanded(expanded === p.value ? null : p.value); }}
                                className="w-full flex items-center justify-between p-4 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${provider === p.value ? 'border-[#d8aa5b]' : 'border-white/20'}`}>
                                        {provider === p.value && <div className="w-2 h-2 bg-[#d8aa5b] rounded-full" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm">{p.label}</span>
                                            {settings?.has_ecpay_config && p.value === 'ecpay' && <CheckCircle size={12} className="text-green-400" />}
                                            {settings?.has_stripe_config && p.value === 'stripe' && <CheckCircle size={12} className="text-green-400" />}
                                            {settings?.has_tappay_config && p.value === 'tappay' && <CheckCircle size={12} className="text-green-400" />}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                                    </div>
                                </div>
                                {p.value !== 'manual' && (
                                    expanded === p.value ? <ChevronUp size={16} className="text-white/40 flex-shrink-0" /> : <ChevronDown size={16} className="text-white/40 flex-shrink-0" />
                                )}
                            </button>

                            {/* ECPay Config */}
                            {p.value === 'ecpay' && expanded === 'ecpay' && (
                                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-4">
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-sm p-3 text-xs text-blue-300">
                                        <strong>需要申請：</strong>登入 <a href="https://member.ecpay.com.tw" target="_blank" rel="noreferrer" className="underline">ECPay 後台</a> → 廠商後台 → 廠商資訊，取得 MerchantID、HashKey、HashIV
                                    </div>
                                    <input placeholder="MerchantID（特店編號）" value={ecpayMerchantId} onChange={e => setEcpayMerchantId(e.target.value)}
                                        className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm" />
                                    <input placeholder="HashKey" value={ecpayHashKey} onChange={e => setEcpayHashKey(e.target.value)}
                                        className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm font-mono" />
                                    <input placeholder="HashIV" value={ecpayHashIv} onChange={e => setEcpayHashIv(e.target.value)}
                                        className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm font-mono" />
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={ecpayTestMode} onChange={e => setEcpayTestMode(e.target.checked)} className="sr-only" />
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${ecpayTestMode ? 'bg-[#d8aa5b] border-[#d8aa5b]' : 'border-white/20'}`}>
                                            {ecpayTestMode && <div className="w-2 h-2 bg-black rounded-sm" />}
                                        </div>
                                        <span className="text-sm text-gray-300">使用測試環境（Stage）</span>
                                    </label>
                                    <div className="bg-[#050505] border border-white/5 rounded-sm p-3 text-xs text-gray-500">
                                        <strong className="text-gray-400">Webhook URL（填入 ECPay 後台）：</strong>
                                        <p className="font-mono mt-1 break-all text-gray-400">{webhookBase}/api/webhooks/payment/ecpay</p>
                                    </div>
                                    <div className="flex items-center gap-3 pt-1">
                                        <button
                                            type="button"
                                            disabled={ecpayTesting}
                                            onClick={async () => {
                                                setEcpayTesting(true);
                                                setEcpayTestResult(null);
                                                const result = await testEcpayConnectionAction(ecpayMerchantId, ecpayHashKey, ecpayHashIv, ecpayTestMode);
                                                setEcpayTestResult(result);
                                                setEcpayTesting(false);
                                            }}
                                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
                                        >
                                            {ecpayTesting ? (
                                                <><span className="animate-spin inline-block w-3 h-3 border border-white/40 border-t-white rounded-full" /> 測試中...</>
                                            ) : '測試連線'}
                                        </button>
                                        {ecpayTestResult && (
                                            <span className={`text-xs ${ecpayTestResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                                {ecpayTestResult.message}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Stripe Config */}
                            {p.value === 'stripe' && expanded === 'stripe' && (
                                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-4">
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-sm p-3 text-xs text-blue-300">
                                        <strong>需要申請：</strong>登入 <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer" className="underline">Stripe Dashboard</a> → Developers → API keys
                                    </div>
                                    <input placeholder="Publishable Key (pk_live_...)" value={stripePublishable} onChange={e => setStripePublishable(e.target.value)}
                                        className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm font-mono" />
                                    <input placeholder="Secret Key (sk_live_...)" value={stripeSecret} onChange={e => setStripeSecret(e.target.value)} type="password"
                                        className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm font-mono" />
                                    <input placeholder="Webhook Signing Secret (whsec_...)" value={stripeWebhook} onChange={e => setStripeWebhook(e.target.value)} type="password"
                                        className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm font-mono" />
                                    <div className="bg-[#050505] border border-white/5 rounded-sm p-3 text-xs text-gray-500">
                                        <strong className="text-gray-400">Webhook URL（填入 Stripe Dashboard）：</strong>
                                        <p className="font-mono mt-1 break-all text-gray-400">{webhookBase}/api/webhooks/payment/stripe</p>
                                    </div>
                                </div>
                            )}

                            {/* TapPay Config */}
                            {p.value === 'tappay' && expanded === 'tappay' && (
                                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-4">
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-sm p-3 text-xs text-blue-300">
                                        <strong>需要申請：</strong>至 <a href="https://www.tappaysdk.com" target="_blank" rel="noreferrer" className="underline">TapPay 官網</a> 申請商家帳號，取得 Partner Key 與 Merchant ID
                                    </div>
                                    <input placeholder="Partner Key" value={tappayPartnerKey} onChange={e => setTappayPartnerKey(e.target.value)} type="password"
                                        className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm font-mono" />
                                    <input placeholder="Merchant ID" value={tappayMerchantId} onChange={e => setTappayMerchantId(e.target.value)}
                                        className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm" />
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={tappayTestMode} onChange={e => setTappayTestMode(e.target.checked)} className="sr-only" />
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${tappayTestMode ? 'bg-[#d8aa5b] border-[#d8aa5b]' : 'border-white/20'}`}>
                                            {tappayTestMode && <div className="w-2 h-2 bg-black rounded-sm" />}
                                        </div>
                                        <span className="text-sm text-gray-300">使用沙盒環境</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Currency */}
                <div className="mb-6">
                    <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2">預設幣別</label>
                    <select value={currency} onChange={e => setCurrency(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm">
                        <option value="TWD">TWD（新台幣）</option>
                        <option value="USD">USD（美金）</option>
                        <option value="JPY">JPY（日幣）</option>
                        <option value="HKD">HKD（港幣）</option>
                    </select>
                </div>

                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 bg-[#d8aa5b] text-black px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors rounded-sm disabled:opacity-50">
                    {saving ? '儲存中...' : saved ? <><CheckCircle size={14} /> 已儲存</> : '儲存設定'}
                </button>

                {/* Guide */}
                <div className="mt-8 bg-[#111] border border-white/5 rounded-sm p-5">
                    <h3 className="text-sm font-bold mb-3 text-[#d8aa5b]">整合說明</h3>
                    <ol className="space-y-2 text-xs text-gray-400 list-decimal list-inside">
                        <li>選擇金流服務商並填入 API 金鑰</li>
                        <li>將 Webhook URL 填入金流商後台（每筆付款完成後會自動通知）</li>
                        <li>建議先使用測試環境驗證流程無誤後再切換正式環境</li>
                        <li>顧客結帳後系統將自動導向至您設定的金流頁面</li>
                        <li>付款成功後訂單狀態自動更新為「已付款」</li>
                    </ol>
                </div>
            </section>

            {/* ECPay Logistics Section */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <Truck size={18} className="text-[#d8aa5b]" />
                    <h2 className="text-xs uppercase tracking-widest text-[#d8aa5b] font-bold">物流設定（ECPay 超商取貨）</h2>
                    {settings?.has_ecpay_logistics_config && <CheckCircle size={14} className="text-green-400" />}
                </div>
                <p className="text-gray-500 text-sm mb-4">
                    設定後，後台可為超商取貨訂單直接建立 7-11 / 全家物流單，並自動同步物流狀態。
                </p>

                <div className="border border-white/10 rounded-sm bg-[#111]">
                    <button
                        type="button"
                        onClick={() => setLogisticsExpanded(!logisticsExpanded)}
                        className="w-full flex items-center justify-between p-4 text-left"
                    >
                        <span className="text-sm font-bold">ECPay 物流 API 設定</span>
                        {logisticsExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                    </button>

                    {logisticsExpanded && (
                        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-4">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-sm p-3 text-xs text-amber-300">
                                <strong>物流 API 憑證與金流 API 不同：</strong>需至 ECPay 後台 → 物流管理 → API 串接憑證，取得「物流專用」的 MerchantID / HashKey / HashIV。
                            </div>
                            <input
                                placeholder="MerchantID（物流特店編號）"
                                value={logisticsMerchantId}
                                onChange={e => setLogisticsMerchantId(e.target.value)}
                                className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm"
                            />
                            <input
                                placeholder="HashKey（物流）"
                                value={logisticsHashKey}
                                onChange={e => setLogisticsHashKey(e.target.value)}
                                className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm font-mono"
                            />
                            <input
                                placeholder="HashIV（物流）"
                                value={logisticsHashIv}
                                onChange={e => setLogisticsHashIv(e.target.value)}
                                className="w-full bg-[#050505] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm font-mono"
                            />
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={logisticsTestMode} onChange={e => setLogisticsTestMode(e.target.checked)} className="sr-only" />
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${logisticsTestMode ? 'bg-[#d8aa5b] border-[#d8aa5b]' : 'border-white/20'}`}>
                                    {logisticsTestMode && <div className="w-2 h-2 bg-black rounded-sm" />}
                                </div>
                                <span className="text-sm text-gray-300">使用測試環境（Stage）</span>
                            </label>
                            <div className="bg-[#050505] border border-white/5 rounded-sm p-3 text-xs text-gray-500">
                                <strong className="text-gray-400">物流 Webhook URL：</strong>
                                <p className="font-mono mt-1 break-all text-gray-400">{webhookBase}/api/webhooks/logistics/ecpay</p>
                            </div>
                            <div className="bg-[#050505] border border-white/5 rounded-sm p-3 text-xs text-gray-500">
                                <strong className="text-gray-400">CVS 選店回調 URL（填入 ECPay ServerReplyURL）：</strong>
                                <p className="font-mono mt-1 break-all text-gray-400">{webhookBase}/api/logistics/cvs-callback</p>
                            </div>
                            <button
                                type="button"
                                disabled={logisticsSaving}
                                onClick={async () => {
                                    setLogisticsSaving(true);
                                    setLogisticsSaved(false);
                                    const result = await updateLogisticsSettingsAction({
                                        ecpay_logistics_merchant_id: logisticsMerchantId || undefined,
                                        ecpay_logistics_hash_key: logisticsHashKey || undefined,
                                        ecpay_logistics_hash_iv: logisticsHashIv || undefined,
                                        ecpay_logistics_test_mode: logisticsTestMode,
                                    });
                                    setLogisticsSaving(false);
                                    if (result.success) { setLogisticsSaved(true); setTimeout(() => setLogisticsSaved(false), 3000); }
                                    else alert('儲存失敗：' + result.error);
                                }}
                                className="flex items-center gap-2 bg-[#d8aa5b] text-black px-6 py-2.5 text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors rounded-sm disabled:opacity-50"
                            >
                                {logisticsSaving ? '儲存中...' : logisticsSaved ? <><CheckCircle size={14} /> 已儲存</> : '儲存物流設定'}
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
