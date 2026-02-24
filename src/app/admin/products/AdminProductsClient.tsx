'use client';

import { useState, useEffect } from 'react';
import { updateProductAction, uploadFileAction, deleteProductAction, bulkUpdateStatusAction } from "@/app/actions";
import { Edit, Plus, Save, X, Layout, Trash2, Upload, Loader2, Image as ImageIcon, ChevronDown, Check, Zap, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CMSProduct } from '@/types/cms';
import { useRouter } from 'next/navigation';

function MediaPicker({ label, value, onChange, focusPoint, onFocusChange, prefix }: {
    label: string,
    value: string,
    onChange: (val: string) => void,
    focusPoint?: { x: number, y: number },
    onFocusChange?: (fp: { x: number, y: number }) => void,
    prefix?: string
}) {
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (prefix) formData.append('prefix', prefix);

        try {
            const result = await uploadFileAction(formData);
            if (result.url) {
                onChange(result.url);
            } else {
                alert("上傳失敗: 無法取得檔案 URL");
            }
        } catch (err) {
            alert("上傳失敗");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d8aa5b] font-bold">{label}</label>
            <div className="flex gap-2">
                <input
                    name="image"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] text-sm font-mono"
                    placeholder="URL 或 上傳 ->"
                />
                <label className="bg-white/5 border border-white/10 p-3 text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center min-w-[50px]">
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*" />
                </label>
            </div>
            {value && onFocusChange && (
                <div
                    className="relative aspect-video bg-black/40 border border-white/5 rounded-sm overflow-hidden cursor-crosshair group"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                        const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                        onFocusChange({ x, y });
                    }}
                >
                    {value.match(/\.(mp4|webm)$/) ? (
                        <video src={value} className="w-full h-full object-cover opacity-40" muted />
                    ) : (
                        <img src={value} className="w-full h-full object-cover opacity-40" alt="焦點預覽" />
                    )}
                    <div
                        className="absolute w-4 h-4 border-2 border-[#d8aa5b] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-[0_0_10px_rgba(216,170,91,0.5)]"
                        style={{ left: `${focusPoint?.x ?? 50}%`, top: `${focusPoint?.y ?? 50}%` }}
                    />
                </div>
            )}
        </div>
    );
}

export default function AdminProductsClient({ initialProducts }: { initialProducts: CMSProduct[] }) {
    const router = useRouter();
    const [products, setProducts] = useState(initialProducts);

    // 同步伺服器最新資料到本地 state（router.refresh() 後 initialProducts prop 會更新）
    useEffect(() => {
        setProducts(initialProducts);
    }, [initialProducts]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeLang, setActiveLang] = useState<'en' | 'zh' | 'jp' | 'ko'>('zh');

    const handleEdit = (product: any) => {
        setCurrentProduct(product);
        setIsEditing(true);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === products.length) setSelectedIds([]);
        else setSelectedIds(products.map(p => p.id));
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleAddNew = () => {
        setCurrentProduct({
            name: '',
            price: 0,
            cost: 0,
            category: 'Touch',
            description: '',
            slug: '',
            image: '',
            status: 'draft',
            tags: [],
            aspectRatio: '4:5',
            focusPoint: { x: 50, y: 50 },
            // Init multi-lang fields
            name_zh: '', name_jp: '', name_ko: '',
            description_zh: '', description_jp: '', description_ko: '',
            // Init preorder fields
            is_preorder: false,
            preorder_start_date: null,
            preorder_end_date: null,
            expected_ship_date: null,
            preorder_limit: null,
            preorder_sold: 0,
            preorder_deposit_percentage: 100,
            preorder_status: 'upcoming'
        });
        setIsEditing(true);
    };

    // Helper to get current field value based on activeLang
    const getFieldValue = (field: string) => {
        if (activeLang === 'en') return currentProduct[field];
        return currentProduct[`${field}_${activeLang}`] || '';
    };

    // Helper to set field value based on activeLang
    const setFieldValue = (field: string, value: string) => {
        if (activeLang === 'en') {
            setCurrentProduct({ ...currentProduct, [field]: value });
        } else {
            setCurrentProduct({ ...currentProduct, [`${field}_${activeLang}`]: value });
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    {selectedIds.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-[#d8aa5b]/10 border border-[#d8aa5b]/20 px-4 py-2 rounded-sm flex items-center gap-6"
                        >
                            <span className="text-[#d8aa5b] text-[10px] uppercase font-bold tracking-widest">{selectedIds.length} 個已選擇</span>
                            <div className="h-4 w-[1px] bg-[#d8aa5b]/20" />
                            <button
                                onClick={async () => {
                                    await bulkUpdateStatusAction(selectedIds, 'published', 'product');
                                    setSelectedIds([]);
                                    router.refresh();
                                }}
                                className="text-white hover:text-[#d8aa5b] text-[10px] uppercase tracking-widest font-bold transition-colors"
                            >發佈</button>
                            <button
                                onClick={async () => {
                                    if (!confirm(`確定要刪除 ${selectedIds.length} 個產品嗎？`)) return;
                                    for (const id of selectedIds) {
                                        await deleteProductAction(id);
                                    }
                                    setSelectedIds([]);
                                    router.refresh();
                                }}
                                className="text-white hover:text-red-400 text-[10px] uppercase tracking-widest font-bold transition-colors"
                            >刪除</button>
                        </motion.div>
                    )}
                </div>
                <button onClick={handleAddNew} className="bg-[#d8aa5b] text-black px-6 py-3 text-xs uppercase font-bold tracking-widest hover:bg-white transition-colors flex items-center gap-2 rounded-sm">
                    <Plus size={16} /> 新增產品
                </button>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-widest border-b border-white/5">
                        <tr>
                            <th className="p-6 w-10">
                                <button onClick={toggleSelectAll} className={`w-4 h-4 border transition-colors flex items-center justify-center ${selectedIds.length === products.length ? 'bg-[#d8aa5b] border-[#d8aa5b]' : 'border-white/20'}`}>
                                    {selectedIds.length === products.length && <Check size={10} className="text-black" />}
                                </button>
                            </th>
                            <th className="p-6 font-medium">產品名稱</th>
                            <th className="p-6 font-medium">類別</th>
                            <th className="p-6 font-medium">狀態</th>
                            <th className="p-6 font-medium">價格</th>
                            <th className="p-6 font-medium text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white">
                        {products.map((product) => (
                            <tr key={product.id} className={`hover:bg-white/5 transition-colors group ${selectedIds.includes(product.id) ? 'bg-[#d8aa5b]/5' : ''}`}>
                                <td className="p-6">
                                    <button onClick={() => toggleSelectOne(product.id)} className={`w-4 h-4 border transition-colors flex items-center justify-center ${selectedIds.includes(product.id) ? 'bg-[#d8aa5b] border-[#d8aa5b]' : 'border-white/10 overflow-hidden'}`}>
                                        {selectedIds.includes(product.id) && <Check size={10} className="text-black" />}
                                    </button>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-sm overflow-hidden border border-white/5">
                                            {product.image && <img src={product.image} className="w-full h-full object-cover" alt="" />}
                                        </div>
                                        <div>
                                            <span className="font-display block">{product.name || product.name_zh || product.name_jp || product.name_ko || '(未命名)'}</span>
                                            {product.name_zh && product.name_zh !== product.name && <span className="text-xs text-gray-500 block">{product.name_zh}</span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 text-sm text-gray-500">{product.category}</td>
                                <td className="p-6">
                                    <div className="flex flex-col gap-2">
                                        <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm border w-fit ${product.status === 'published' ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-yellow-500/20 text-yellow-500 bg-yellow-500/5'}`}>
                                            {product.status || 'draft'}
                                        </span>
                                        {product.is_preorder && (
                                            <div className="flex gap-1">
                                                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm border border-blue-500/20 text-blue-400 bg-blue-500/5 w-fit">
                                                    預購中
                                                </span>
                                                {product.preorder_limit && (
                                                    <span className="text-[10px] text-gray-600">
                                                        {product.preorder_sold || 0}/{product.preorder_limit}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-6 text-[#d8aa5b] font-display">${product.price}</td>
                                <td className="p-6 text-right flex justify-end gap-3">
                                    <Link href={`/admin/products/${product.id}`} className="text-[#d8aa5b] hover:text-white transition-colors bg-[#d8aa5b]/5 px-3 py-1 rounded-sm text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                                        <Layout size={12} /> 設計佈局
                                    </Link>
                                    <button onClick={() => handleEdit(product)} className="text-gray-500 hover:text-white transition-colors">
                                        <Edit size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            className="bg-[#0a0009] border border-white/10 p-10 rounded-sm max-w-4xl w-full shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            {/* Decorative background source */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#d8aa5b] opacity-[0.03] blur-[100px] -mr-32 -mt-32"></div>

                            <div className="flex justify-between items-center mb-6 relative z-10">
                                <div>
                                    <h2 className="font-display text-3xl text-white mb-1">{currentProduct.id ? '優化產品資料' : '創建新產品'}</h2>
                                    <p className="text-gray-500 text-xs uppercase tracking-widest">核心產品元數據</p>
                                </div>
                                <button onClick={() => setIsEditing(false)} className="text-white/30 hover:text-white transition-colors p-2"><X size={28} /></button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Form Side */}
                                <form action={async (formData) => {
                                    // Validate at least one name is filled
                                    const hasAnyName = currentProduct.name || currentProduct.name_zh ||
                                        currentProduct.name_jp || currentProduct.name_ko;
                                    if (!hasAnyName) {
                                        alert('請至少填寫一種語言的產品名稱');
                                        return;
                                    }
                                    const result = await updateProductAction(formData);
                                    if (!result.success) {
                                        alert('儲存失敗，請稍後再試');
                                        return;
                                    }
                                    setIsEditing(false);
                                    router.refresh();
                                }} className="space-y-8 relative z-10">
                                    <input type="hidden" name="id" value={currentProduct.id || ''} />
                                    <input type="hidden" name="focusPoint" value={JSON.stringify(currentProduct.focusPoint || { x: 50, y: 50 })} />

                                    {/* Language Tabs */}
                                    <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
                                        {[
                                            { code: 'zh', label: '🇹🇼 繁體中文', name: 'name_zh', desc: 'description_zh' },
                                            { code: 'en', label: '🇺🇸 English', name: 'name', desc: 'description' },
                                            { code: 'jp', label: '🇯🇵 日本語', name: 'name_jp', desc: 'description_jp' },
                                            { code: 'ko', label: '🇰🇷 한국어', name: 'name_ko', desc: 'description_ko' },
                                        ].map((lang: any) => (
                                            <button
                                                key={lang.code}
                                                type="button"
                                                onClick={() => setActiveLang(lang.code)}
                                                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-sm transition-all ${activeLang === lang.code ? 'bg-[#d8aa5b] text-black' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}

                                        <div className="ml-auto">
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const btn = document.activeElement as HTMLButtonElement;
                                                    const originalText = btn.innerHTML;
                                                    btn.innerHTML = `<span class="animate-pulse">✨ Translating...</span>`;
                                                    btn.disabled = true;

                                                    const { autoTranslateAction } = await import("@/app/actions");

                                                    // Get current content
                                                    const currentName = getFieldValue('name');
                                                    const currentDesc = getFieldValue('description');

                                                    if (!currentName && !currentDesc) {
                                                        alert("請先輸入內容再進行翻譯");
                                                        btn.innerHTML = originalText;
                                                        btn.disabled = false;
                                                        return;
                                                    }

                                                    // Calls REAL Google Gemini API
                                                    const nameRes = await autoTranslateAction(currentName, activeLang, ['en', 'zh', 'jp', 'ko']);
                                                    const descRes = await autoTranslateAction(currentDesc, activeLang, ['en', 'zh', 'jp', 'ko']);

                                                    // Apply translations
                                                    const newProduct = { ...currentProduct };

                                                    if (nameRes.success && nameRes.translations) {
                                                        ['en', 'zh', 'jp', 'ko'].forEach(lang => {
                                                            if (lang === activeLang) return;
                                                            const key = lang === 'en' ? 'name' : `name_${lang}`;
                                                            newProduct[key] = nameRes.translations![lang] || newProduct[key];
                                                        });
                                                    }

                                                    if (descRes.success && descRes.translations) {
                                                        ['en', 'zh', 'jp', 'ko'].forEach(lang => {
                                                            if (lang === activeLang) return;
                                                            const key = lang === 'en' ? 'description' : `description_${lang}`;
                                                            newProduct[key] = descRes.translations![lang] || newProduct[key];
                                                        });
                                                    }

                                                    setCurrentProduct(newProduct);
                                                    btn.innerHTML = originalText;
                                                    btn.disabled = false;
                                                }}
                                                className="px-3 py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white rounded-sm text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 transition-all border border-purple-500/30"
                                            >
                                                <Zap size={14} /> AI Auto-Translate
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2 font-bold">{activeLang === 'en' ? 'Product Name' : activeLang === 'zh' ? '產品名稱' : activeLang === 'jp' ? '商品名' : '상품명'}</label>
                                                <input
                                                    value={getFieldValue('name')}
                                                    onChange={e => setFieldValue('name', e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-all font-display text-xl"
                                                    placeholder={activeLang === 'en' ? "e.g. Midnight Mist" : "例如：午夜迷霧"}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">{activeLang === 'en' ? 'Description' : activeLang === 'zh' ? '氛圍描述' : activeLang === 'jp' ? '説明' : '설명'}</label>
                                                <textarea
                                                    value={getFieldValue('description')}
                                                    onChange={e => setFieldValue('description', e.target.value)}
                                                    rows={4}
                                                    className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] resize-none font-light"
                                                    placeholder="..."
                                                />
                                            </div>

                                            <div className="border-t border-white/10 pt-6 mt-6">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">顯示狀態</label>
                                                        <select name="status" defaultValue={currentProduct.status || 'draft'} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] appearance-none">
                                                            <option value="draft">草稿 (隱藏)</option>
                                                            <option value="published">已發佈 (公開)</option>
                                                            <option value="archived">已歸檔</option>
                                                        </select>
                                                    </div>
                                                    {/* Other fields unrelated to lang */}
                                                    <div>
                                                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">類別</label>
                                                        <select name="category" defaultValue={currentProduct.category} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] appearance-none">
                                                            <option value="Touch">Touch</option>
                                                            <option value="Scent">Scent</option>
                                                            <option value="Kit">Kit</option>
                                                            <option value="Visual">Visual</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="mt-6 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">售價 ($)</label>
                                                        <input name="price" type="number" min="0" step="0.01" defaultValue={currentProduct.price} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b]" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1">
                                                            成本 ($) <span className="text-[10px] text-gray-600 normal-case">(僅後台可見)</span>
                                                        </label>
                                                        <input name="cost" type="number" min="0" step="0.01" defaultValue={currentProduct.cost || 0} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b]" />
                                                    </div>
                                                </div>
                                            </div>

                                            <MediaPicker
                                                label="產品主要圖片"
                                                value={currentProduct.image}
                                                onChange={(val) => setCurrentProduct({ ...currentProduct, image: val })}
                                                focusPoint={currentProduct.focusPoint}
                                                onFocusChange={(fp) => setCurrentProduct({ ...currentProduct, focusPoint: fp })}
                                                prefix={currentProduct.name}
                                            />

                                            {/* 預購設定區塊 */}
                                            <div className="border border-white/10 bg-white/[0.02] p-6 rounded-sm space-y-4 mt-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm uppercase tracking-widest text-[#d8aa5b] font-bold flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        預購設定
                                                    </h3>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={currentProduct.is_preorder || false}
                                                            onChange={(e) => setCurrentProduct({
                                                                ...currentProduct,
                                                                is_preorder: e.target.checked
                                                            })}
                                                            className="w-4 h-4 accent-[#d8aa5b]"
                                                        />
                                                        <span className="text-xs text-white group-hover:text-[#d8aa5b] transition-colors">啟用預購</span>
                                                    </label>
                                                </div>

                                                {currentProduct.is_preorder && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="space-y-4"
                                                    >
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs text-gray-400 mb-2">預購開始時間</label>
                                                                <input
                                                                    type="datetime-local"
                                                                    name="preorder_start_date"
                                                                    value={currentProduct.preorder_start_date?.slice(0, 16) || ''}
                                                                    onChange={(e) => setCurrentProduct({
                                                                        ...currentProduct,
                                                                        preorder_start_date: e.target.value ? new Date(e.target.value).toISOString() : null
                                                                    })}
                                                                    className="w-full bg-white/5 border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-gray-400 mb-2">預購結束時間</label>
                                                                <input
                                                                    type="datetime-local"
                                                                    name="preorder_end_date"
                                                                    value={currentProduct.preorder_end_date?.slice(0, 16) || ''}
                                                                    onChange={(e) => setCurrentProduct({
                                                                        ...currentProduct,
                                                                        preorder_end_date: e.target.value ? new Date(e.target.value).toISOString() : null
                                                                    })}
                                                                    className="w-full bg-white/5 border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs text-gray-400 mb-2">預計出貨日期</label>
                                                            <input
                                                                type="date"
                                                                name="expected_ship_date"
                                                                value={currentProduct.expected_ship_date?.slice(0, 10) || ''}
                                                                onChange={(e) => setCurrentProduct({
                                                                    ...currentProduct,
                                                                    expected_ship_date: e.target.value ? new Date(e.target.value).toISOString() : null
                                                                })}
                                                                className="w-full bg-white/5 border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs text-gray-400 mb-2">預購數量限制</label>
                                                                <input
                                                                    type="number"
                                                                    name="preorder_limit"
                                                                    value={currentProduct.preorder_limit || ''}
                                                                    onChange={(e) => setCurrentProduct({
                                                                        ...currentProduct,
                                                                        preorder_limit: e.target.value ? Number(e.target.value) : null
                                                                    })}
                                                                    placeholder="不限制留空"
                                                                    className="w-full bg-white/5 border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-gray-400 mb-2">訂金比例 (%)</label>
                                                                <input
                                                                    type="number"
                                                                    name="preorder_deposit_percentage"
                                                                    value={currentProduct.preorder_deposit_percentage || 100}
                                                                    onChange={(e) => setCurrentProduct({
                                                                        ...currentProduct,
                                                                        preorder_deposit_percentage: Math.min(100, Math.max(0, Number(e.target.value)))
                                                                    })}
                                                                    min="0"
                                                                    max="100"
                                                                    className="w-full bg-white/5 border border-white/10 p-3 text-white text-sm focus:outline-none focus:border-[#d8aa5b] rounded-sm"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* 預購進度顯示（僅編輯現有產品時） */}
                                                        {currentProduct.id && (
                                                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-sm">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-xs text-blue-300 font-bold">預購進度</span>
                                                                    <span className="text-xs text-blue-300">
                                                                        已預購：<span className="font-bold text-white">{currentProduct.preorder_sold || 0}</span>
                                                                        {currentProduct.preorder_limit && ` / ${currentProduct.preorder_limit}`}
                                                                    </span>
                                                                </div>
                                                                {currentProduct.preorder_limit && (
                                                                    <div className="w-full bg-white/10 rounded-full h-2">
                                                                        <div
                                                                            className="bg-blue-500 h-2 rounded-full transition-all"
                                                                            style={{
                                                                                width: `${Math.min(100, ((currentProduct.preorder_sold || 0) / currentProduct.preorder_limit) * 100)}%`
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="bg-yellow-500/10 border-l-2 border-yellow-500 p-3">
                                                            <p className="text-[10px] text-yellow-200 leading-relaxed">
                                                                💡 訂金 100% = 全額付款 | 訂金 &lt; 100% = 需支付尾款
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {/* Hidden inputs for preorder fields */}
                                                <input type="hidden" name="is_preorder" value={currentProduct.is_preorder ? 'true' : 'false'} />
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-6">
                                            <button type="submit" className="flex-1 bg-[#d8aa5b] text-black h-16 font-bold uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl flex items-center justify-center gap-3">
                                                <Save size={18} /> {currentProduct.id ? '確認變更' : '初始化產品'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* HIDDEN INPUTS FOR PERSISTENCE: Ensure all lang fields are submitted no matter which tab is active */}
                                    {['zh', 'jp', 'ko'].map(lang => (
                                        <div key={lang}>
                                            <input type="hidden" name={`name_${lang}`} value={currentProduct[`name_${lang}`] || ''} />
                                            <input type="hidden" name={`description_${lang}`} value={currentProduct[`description_${lang}`] || ''} />
                                        </div>
                                    ))}
                                    <input type="hidden" name="name" value={currentProduct.name || ''} /> {/* EN fallback */}
                                    <input type="hidden" name="description" value={currentProduct.description || ''} />
                                </form>

                                {/* Preview / Info Side */}
                                <div className="hidden lg:flex flex-col justify-center border-l border-white/5 pl-12">
                                    <div className="mb-10 text-center">
                                        <div
                                            className="w-full bg-[#111] border border-white/5 rounded-sm flex flex-col items-center justify-center relative overflow-hidden"
                                            style={{ aspectRatio: currentProduct.aspectRatio === '1:1' ? '1/1' : currentProduct.aspectRatio === '16:9' ? '16/9' : '4/5' }}
                                        >
                                            {currentProduct.image ? (
                                                <img
                                                    src={currentProduct.image}
                                                    className="w-full h-full object-cover"
                                                    alt="預覽"
                                                    style={{ objectPosition: `${currentProduct.focusPoint?.x ?? 50}% ${currentProduct.focusPoint?.y ?? 50}%` }}
                                                />
                                            ) : (
                                                <>
                                                    <div className="w-20 h-20 border border-white/20 rounded-full flex items-center justify-center mb-6">
                                                        <ImageIcon className="text-white/20" size={32} />
                                                    </div>
                                                    <p className="text-xs uppercase tracking-widest text-white/20">媒體預覽</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="bg-[#d8aa5b]/5 border-l-2 border-[#d8aa5b] p-4">
                                            <p className="text-xs text-[#d8aa5b] font-medium leading-relaxed">
                                                正在編輯：{activeLang === 'en' ? 'English' : activeLang === 'zh' ? 'Traditional Chinese' : activeLang === 'jp' ? 'Japanese' : 'Korean'}
                                            </p>
                                        </div>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-widest leading-loose">
                                            AI 翻譯將根據您當前輸入的語言，自動生成其他語言的充滿詩意的文案。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
