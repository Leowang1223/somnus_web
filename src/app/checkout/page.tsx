'use client';

import { useCart } from "@/context/CartContext";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createOrderAction } from "@/app/actions";
import { Loader2, ArrowLeft, ShieldCheck, Clock, Store, MapPin, ChevronDown } from "lucide-react";
import Link from "next/link";

interface CVSStore {
    storeId: string;
    storeName: string;
    storeAddress: string;
    subType: string; // UNIMART | FAMI
    displayType: string; // 7-11 | 全家
}

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // 配送方式：home_delivery | cvs_pickup
    const [shippingMethod, setShippingMethod] = useState<'home_delivery' | 'cvs_pickup'>('home_delivery');
    const [selectedCVSStore, setSelectedCVSStore] = useState<CVSStore | null>(null);

    // 檢查購物車中是否有預購商品
    const hasPreorder = items.some(item => item.is_preorder);
    const latestShipDate = items
        .filter(item => item.is_preorder && item.expected_ship_date)
        .map(item => new Date(item.expected_ship_date!))
        .sort((a, b) => b.getTime() - a.getTime())[0];

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        phone: '',
        addressLine1: '',
        city: '',
        postalCode: '',
        country: 'Taiwan'
    });

    // 會計相關欄位
    const [invoiceRequired, setInvoiceRequired] = useState(false);
    const [invoiceType, setInvoiceType] = useState('duplicate');
    const [taxId, setTaxId] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [customerNotes, setCustomerNotes] = useState('');

    // 計算金額
    const subtotal = cartTotal;
    const taxRate = 5;
    const taxAmount = useMemo(() => Math.round(subtotal * taxRate / 100 * 100) / 100, [subtotal]);
    const shippingFee = 0;
    const totalAmount = subtotal + taxAmount + shippingFee;

    // 監聽 CVS 選店 postMessage
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'CVS_STORE_SELECTED') {
                setSelectedCVSStore(event.data.store);
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    // 開啟 ECPay CVS 地圖選店彈窗
    const openCVSMap = useCallback(() => {
        const popup = window.open(
            '/api/logistics/cvs-map',
            'CVSMap',
            'width=1000,height=680,scrollbars=yes,resizable=yes'
        );
        if (!popup) {
            alert('請允許彈出視窗以選擇超商門市');
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // CVS 配送需確認已選門市
        if (shippingMethod === 'cvs_pickup' && !selectedCVSStore) {
            alert('請先選擇超商取件門市');
            return;
        }

        setIsLoading(true);

        const orderData = {
            total: cartTotal,
            items: items.map(item => ({
                productId: item.product.id,
                variantId: item.variant?.id,
                name: item.product.name + (item.variant ? ` - ${item.variant.name}` : ''),
                price: item.product.price,
                quantity: item.quantity,
                image: item.product.image
            })),
            shippingInfo: formData,
            customer_name: formData.fullName,
            customer_email: formData.email,
            customer_phone: formData.phone,
            // 物流
            shipping_method: shippingMethod,
            cvs_store_id: selectedCVSStore?.storeId || null,
            cvs_store_name: selectedCVSStore?.storeName || null,
            cvs_store_address: selectedCVSStore?.storeAddress || null,
            cvs_sub_type: selectedCVSStore?.subType || null,
            // 會計欄位
            currency: 'TWD',
            tax_rate: taxRate,
            tax_type: 'taxable',
            shipping_fee: shippingFee,
            invoice_required: invoiceRequired,
            invoice_type: invoiceRequired ? invoiceType : null,
            tax_id: invoiceType === 'triplicate' ? taxId : null,
            company_name: invoiceType === 'triplicate' ? companyName : null,
            customer_type: taxId ? 'B2B' : 'B2C',
            customer_notes: customerNotes || null,
        };

        const result = await createOrderAction(orderData);

        if (!result.success) {
            alert('訂單建立失敗，請再試一次。');
            setIsLoading(false);
            return;
        }

        clearCart();

        try {
            const payRes = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: result.orderId,
                    amount: totalAmount,
                    currency: 'TWD',
                    description: `SØMNS 訂單 ${result.orderId}`,
                    customerEmail: formData.email,
                }),
            });

            const payData = await payRes.json();

            if (payData.mode === 'form' && payData.formHtml) {
                const doc = new DOMParser().parseFromString(payData.formHtml, 'text/html');
                const form = doc.querySelector('form');
                if (form) {
                    document.body.appendChild(form);
                    form.submit();
                    return;
                }
            } else if (payData.mode === 'redirect' && payData.redirectUrl) {
                window.location.href = payData.redirectUrl;
                return;
            } else {
                router.push(`/order-confirmation/${result.orderId}`);
                return;
            }
        } catch (payErr) {
            console.error('Payment API error:', payErr);
            router.push(`/order-confirmation/${result.orderId}`);
        }

        setIsLoading(false);
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-display text-white mb-4">Your Ritual is Empty</h1>
                    <Link href="/collection" className="text-[#d8aa5b] hover:text-white transition-colors uppercase tracking-widest text-xs font-bold border-b border-[#d8aa5b]">
                        Return to Collection
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-20 md:pt-24 pb-12">
            <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                <Link href="/collection" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 md:mb-12 text-xs uppercase tracking-widest">
                    <ArrowLeft size={16} /> Continue Shopping
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                    {/* Left: Form */}
                    <div>
                        <h1 className="text-3xl font-display mb-8">Secure Checkout</h1>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Contact */}
                            <div className="space-y-4">
                                <h2 className="text-xs uppercase tracking-widest text-[#d8aa5b] font-bold mb-4">聯絡資訊</h2>
                                <input
                                    required type="email" name="email" placeholder="Email"
                                    value={formData.email} onChange={handleChange}
                                    className="w-full bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors rounded-sm"
                                />
                                <input required name="fullName" placeholder="收件人姓名" value={formData.fullName} onChange={handleChange}
                                    className="w-full bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors rounded-sm" />
                                <input required name="phone" placeholder="手機號碼" value={formData.phone} onChange={handleChange}
                                    className="w-full bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors rounded-sm" />
                            </div>

                            {/* Shipping Method */}
                            <div className="space-y-4">
                                <h2 className="text-xs uppercase tracking-widest text-[#d8aa5b] font-bold mb-4 mt-8">配送方式</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShippingMethod('home_delivery')}
                                        className={`flex flex-col items-center gap-2 p-4 border rounded-sm transition-all ${shippingMethod === 'home_delivery' ? 'border-[#d8aa5b] bg-[#d8aa5b]/10' : 'border-white/10 bg-[#111] hover:border-white/20'}`}
                                    >
                                        <MapPin size={20} className={shippingMethod === 'home_delivery' ? 'text-[#d8aa5b]' : 'text-white/40'} />
                                        <span className="text-xs font-bold uppercase tracking-widest">宅配到府</span>
                                        <span className="text-[10px] text-gray-500">填寫收件地址</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShippingMethod('cvs_pickup')}
                                        className={`flex flex-col items-center gap-2 p-4 border rounded-sm transition-all ${shippingMethod === 'cvs_pickup' ? 'border-[#d8aa5b] bg-[#d8aa5b]/10' : 'border-white/10 bg-[#111] hover:border-white/20'}`}
                                    >
                                        <Store size={20} className={shippingMethod === 'cvs_pickup' ? 'text-[#d8aa5b]' : 'text-white/40'} />
                                        <span className="text-xs font-bold uppercase tracking-widest">超商取貨</span>
                                        <span className="text-[10px] text-gray-500">7-11 / 全家</span>
                                    </button>
                                </div>
                            </div>

                            {/* Home Delivery Address */}
                            {shippingMethod === 'home_delivery' && (
                                <div className="space-y-4">
                                    <h2 className="text-xs uppercase tracking-widest text-[#d8aa5b] font-bold mb-4 mt-4">收件地址</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input required name="addressLine1" placeholder="地址" value={formData.addressLine1} onChange={handleChange}
                                            className="col-span-2 w-full bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors rounded-sm" />
                                        <input required name="city" placeholder="城市" value={formData.city} onChange={handleChange}
                                            className="w-full bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors rounded-sm" />
                                        <input required name="postalCode" placeholder="郵遞區號" value={formData.postalCode} onChange={handleChange}
                                            className="w-full bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors rounded-sm" />
                                        <select name="country" value={formData.country} onChange={handleChange}
                                            className="col-span-2 w-full bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-colors rounded-sm">
                                            <option value="Taiwan">台灣</option>
                                            <option value="Hong Kong">香港</option>
                                            <option value="Japan">日本</option>
                                            <option value="United States">美國</option>
                                            <option value="Other">其他</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* CVS Pickup Store */}
                            {shippingMethod === 'cvs_pickup' && (
                                <div className="space-y-4">
                                    <h2 className="text-xs uppercase tracking-widest text-[#d8aa5b] font-bold mb-4 mt-4">超商取件門市</h2>

                                    {selectedCVSStore ? (
                                        <div className="bg-[#d8aa5b]/10 border border-[#d8aa5b]/30 rounded-sm p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Store size={16} className="text-[#d8aa5b]" />
                                                    <span className="text-sm font-bold text-[#d8aa5b]">{selectedCVSStore.displayType}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={openCVSMap}
                                                    className="text-[10px] text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
                                                >
                                                    重新選擇
                                                </button>
                                            </div>
                                            <p className="text-white font-medium">{selectedCVSStore.storeName}</p>
                                            <p className="text-gray-400 text-sm">{selectedCVSStore.storeAddress}</p>
                                            <p className="text-gray-600 text-[10px]">門市代碼：{selectedCVSStore.storeId}</p>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={openCVSMap}
                                            className="w-full border-2 border-dashed border-white/20 hover:border-[#d8aa5b]/50 rounded-sm p-6 flex flex-col items-center gap-3 transition-all group"
                                        >
                                            <Store size={28} className="text-white/20 group-hover:text-[#d8aa5b]/60 transition-colors" />
                                            <span className="text-sm font-bold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">選擇取件門市</span>
                                            <span className="text-[10px] text-gray-600">7-11 / 全家超商 · 點擊開啟地圖</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Invoice */}
                            <div className="space-y-4">
                                <h2 className="text-xs uppercase tracking-widest text-[#d8aa5b] font-bold mb-4 mt-8">發票資訊</h2>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={invoiceRequired}
                                        onChange={(e) => setInvoiceRequired(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${invoiceRequired ? 'bg-[#d8aa5b] border-[#d8aa5b]' : 'border-white/20 group-hover:border-white/40'}`}>
                                        {invoiceRequired && <div className="w-2 h-2 bg-black rounded-sm" />}
                                    </div>
                                    <span className="text-sm text-gray-300">我需要開立發票</span>
                                </label>

                                {invoiceRequired && (
                                    <div className="space-y-4 pl-8 border-l border-white/10">
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="invoiceType" value="duplicate"
                                                    checked={invoiceType === 'duplicate'} onChange={(e) => setInvoiceType(e.target.value)}
                                                    className="sr-only" />
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${invoiceType === 'duplicate' ? 'border-[#d8aa5b]' : 'border-white/20'}`}>
                                                    {invoiceType === 'duplicate' && <div className="w-2 h-2 bg-[#d8aa5b] rounded-full" />}
                                                </div>
                                                <span className="text-sm text-gray-300">二聯式（個人）</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="invoiceType" value="triplicate"
                                                    checked={invoiceType === 'triplicate'} onChange={(e) => setInvoiceType(e.target.value)}
                                                    className="sr-only" />
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${invoiceType === 'triplicate' ? 'border-[#d8aa5b]' : 'border-white/20'}`}>
                                                    {invoiceType === 'triplicate' && <div className="w-2 h-2 bg-[#d8aa5b] rounded-full" />}
                                                </div>
                                                <span className="text-sm text-gray-300">三聯式（公司）</span>
                                            </label>
                                        </div>

                                        {invoiceType === 'triplicate' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <input placeholder="統一編號" value={taxId} onChange={(e) => setTaxId(e.target.value)}
                                                    className="w-full bg-[#111] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm" />
                                                <input placeholder="公司名稱" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                                                    className="w-full bg-[#111] border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Customer Notes */}
                            <div className="space-y-4">
                                <h2 className="text-xs uppercase tracking-widest text-[#d8aa5b] font-bold mb-4 mt-8">訂單備註</h2>
                                <textarea
                                    placeholder="有任何特殊需求嗎？（選填）"
                                    value={customerNotes}
                                    onChange={(e) => setCustomerNotes(e.target.value)}
                                    rows={3}
                                    className="w-full bg-[#111] border border-white/10 p-4 text-white text-sm focus:outline-none focus:border-[#d8aa5b] transition-colors rounded-sm resize-none"
                                />
                            </div>

                            {/* Submit */}
                            <div className="pt-8">
                                <button
                                    type="submit"
                                    disabled={isLoading || (shippingMethod === 'cvs_pickup' && !selectedCVSStore)}
                                    className="w-full bg-[#d8aa5b] text-black h-14 font-bold uppercase tracking-widest hover:bg-white transition-colors flex items-center justify-center gap-3 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : (
                                        <span className="flex items-center gap-2">
                                            <ShieldCheck size={18} /> 確認下單 &mdash; NT${totalAmount.toLocaleString()}
                                        </span>
                                    )}
                                </button>
                                {shippingMethod === 'cvs_pickup' && !selectedCVSStore && (
                                    <p className="text-center text-amber-500 text-[10px] mt-2">請先選擇超商取件門市</p>
                                )}
                                <p className="text-center text-gray-600 text-[10px] mt-4 uppercase tracking-widest">
                                    Secure Checkout
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="bg-[#111] p-5 md:p-8 rounded-sm h-fit lg:sticky top-24 border border-white/5 order-first lg:order-last">
                        {/* 預購提示 */}
                        {hasPreorder && (
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-sm mb-6">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Clock size={12} className="text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-blue-300 font-bold text-sm mb-2">包含預購商品</h4>
                                        <p className="text-blue-200/80 text-xs leading-relaxed">
                                            您的訂單包含預購商品
                                            {latestShipDate && (
                                                <>，預計 <span className="font-bold text-white">{latestShipDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</span> 統一出貨</>
                                            )}
                                        </p>
                                        <p className="text-blue-200/60 text-[10px] mt-2">
                                            顯示金額為需支付訂金，商品到貨前將另行通知支付尾款
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <h2 className="text-xl font-display mb-8">訂單摘要</h2>
                        <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-16 h-20 bg-[#050505] rounded-sm relative overflow-hidden flex-shrink-0">
                                        {item.product.image ? (
                                            <img src={item.product.image} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full bg-[#111] flex items-center justify-center text-white/10">
                                                <div className="w-4 h-4 rounded-full bg-white/10" />
                                            </div>
                                        )}
                                        <div className="absolute top-0 right-0 bg-[#d8aa5b] text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center">
                                            {item.quantity}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-display text-sm">{item.product.name}</h3>
                                        <p className="text-gray-500 text-xs">{item.variant?.name}</p>
                                        {item.is_preorder && (
                                            <span className="inline-block text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm border border-blue-500/20 text-blue-400 bg-blue-500/5 mt-1">
                                                預購
                                            </span>
                                        )}
                                        <p className="text-[#d8aa5b] text-sm mt-1">
                                            NT${item.is_preorder && item.deposit_amount ? (item.deposit_amount * item.quantity).toLocaleString() : (item.product.price * item.quantity).toLocaleString()}
                                            {item.is_preorder && item.deposit_amount && item.deposit_amount < item.product.price && (
                                                <span className="text-gray-600 text-xs ml-2">(訂金)</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Price Breakdown */}
                        <div className="border-t border-white/10 pt-6 space-y-2">
                            <div className="flex justify-between text-gray-400 text-sm">
                                <span>小計</span>
                                <span>NT${subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-400 text-sm">
                                <span>稅額（{taxRate}%）</span>
                                <span>NT${taxAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-400 text-sm">
                                <span>運費</span>
                                <span>{shippingFee > 0 ? `NT$${shippingFee.toLocaleString()}` : '免運'}</span>
                            </div>
                            <div className="flex justify-between text-gray-400 text-sm">
                                <span>配送方式</span>
                                <span className="text-white text-xs">
                                    {shippingMethod === 'cvs_pickup'
                                        ? (selectedCVSStore ? `${selectedCVSStore.displayType} ${selectedCVSStore.storeName}` : '超商取貨（未選門市）')
                                        : '宅配到府'}
                                </span>
                            </div>
                            <div className="flex justify-between text-white text-lg font-display pt-4 border-t border-white/10 mt-4">
                                <span>總計</span>
                                <span className="text-[#d8aa5b]">NT${totalAmount.toLocaleString()}</span>
                            </div>
                            {hasPreorder && (
                                <p className="text-[10px] text-cyan-400 text-right">
                                    * 預購商品僅收取訂金，尾款將於出貨前通知
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
