'use client';

import { useState } from 'react';
import { updateProductAction, uploadFileAction } from "@/app/actions";
import { Edit, Plus, Save, X, Layout, Trash2, Upload, Loader2, Image as ImageIcon, ChevronDown, Check, Zap } from "lucide-react";
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
            onChange(result.url);
        } catch (err) {
            alert("Upload failed");
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
                    placeholder="URL or Upload ->"
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
                        <img src={value} className="w-full h-full object-cover opacity-40" alt="Focus Preview" />
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
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
            category: 'Touch',
            description: '',
            slug: '',
            image: '',
            status: 'draft',
            tags: [],
            aspectRatio: '4:5',
            focusPoint: { x: 50, y: 50 }
        });
        setIsEditing(true);
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
                            <span className="text-[#d8aa5b] text-[10px] uppercase font-bold tracking-widest">{selectedIds.length} Selected</span>
                            <div className="h-4 w-[1px] bg-[#d8aa5b]/20" />
                            <button className="text-white hover:text-[#d8aa5b] text-[10px] uppercase tracking-widest font-bold transition-colors">Publish</button>
                            <button className="text-white hover:text-red-400 text-[10px] uppercase tracking-widest font-bold transition-colors">Delete</button>
                        </motion.div>
                    )}
                </div>
                <button onClick={handleAddNew} className="bg-[#d8aa5b] text-black px-6 py-3 text-xs uppercase font-bold tracking-widest hover:bg-white transition-colors flex items-center gap-2 rounded-sm">
                    <Plus size={16} /> Add Product
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
                            <th className="p-6 font-medium">Artifact Name</th>
                            <th className="p-6 font-medium">Category</th>
                            <th className="p-6 font-medium">Status</th>
                            <th className="p-6 font-medium">Price</th>
                            <th className="p-6 font-medium text-right">Actions</th>
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
                                        <span className="font-display">{product.name}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-sm text-gray-500">{product.category}</td>
                                <td className="p-6">
                                    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm border ${product.status === 'published' ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-yellow-500/20 text-yellow-500 bg-yellow-500/5'}`}>
                                        {product.status || 'draft'}
                                    </span>
                                </td>
                                <td className="p-6 text-[#d8aa5b] font-display">${product.price}</td>
                                <td className="p-6 text-right flex justify-end gap-3">
                                    <Link href={`/admin/products/${product.id}`} className="text-[#d8aa5b] hover:text-white transition-colors bg-[#d8aa5b]/5 px-3 py-1 rounded-sm text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                                        <Layout size={12} /> Design
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

                            <div className="flex justify-between items-center mb-10 relative z-10">
                                <div>
                                    <h2 className="font-display text-3xl text-white mb-1">{currentProduct.id ? 'Refine Artifact' : 'Cast New Ritual'}</h2>
                                    <p className="text-gray-500 text-xs uppercase tracking-widest">Core Product Metadata</p>
                                </div>
                                <button onClick={() => setIsEditing(false)} className="text-white/30 hover:text-white transition-colors p-2"><X size={28} /></button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Form Side */}
                                <form action={async (formData) => {
                                    await updateProductAction(formData);
                                    setIsEditing(false);
                                    router.refresh();
                                }} className="space-y-8 relative z-10">
                                    <input type="hidden" name="id" value={currentProduct.id || ''} />
                                    <input type="hidden" name="focusPoint" value={JSON.stringify(currentProduct.focusPoint || { x: 50, y: 50 })} />

                                    <div className="flex justify-between items-center bg-[#d8aa5b]/5 border border-[#d8aa5b]/20 p-4 rounded-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#d8aa5b] flex items-center justify-center text-black">
                                                <Zap size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-white font-bold uppercase tracking-widest">Global Reach</p>
                                                <p className="text-[10px] text-[#d8aa5b] uppercase opacity-70">AI Manual Translation Ritual</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const btn = document.activeElement as HTMLButtonElement;
                                                const originalText = btn.innerText;
                                                btn.innerText = "Chanting...";
                                                btn.disabled = true;

                                                const { translateAction } = await import("@/app/actions");
                                                const result = await translateAction(currentProduct.name, 'zh'); // Example target
                                                alert(`AI Suggested Translation: ${result.translated}`);

                                                btn.innerText = originalText;
                                                btn.disabled = false;
                                            }}
                                            className="px-4 py-2 bg-[#d8aa5b] text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all rounded-sm"
                                        >
                                            Translate to Traditional Chinese
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2 font-bold">Artifact Name</label>
                                                <input
                                                    name="name"
                                                    defaultValue={currentProduct.name}
                                                    onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] transition-all font-display text-xl"
                                                    placeholder="e.g. Midnight Mist"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Display Status</label>
                                                <select name="status" defaultValue={currentProduct.status || 'draft'} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] appearance-none">
                                                    <option value="draft">Draft (Hidden)</option>
                                                    <option value="published">Published (Live)</option>
                                                    <option value="archived">Archived</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Category</label>
                                                <select name="category" defaultValue={currentProduct.category} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] appearance-none">
                                                    <option value="Touch">Touch</option>
                                                    <option value="Scent">Scent</option>
                                                    <option value="Kit">Kit</option>
                                                    <option value="Visual">Visual</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Aspect Ratio</label>
                                                <select name="aspectRatio" defaultValue={currentProduct.aspectRatio || '4:5'} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] appearance-none">
                                                    <option value="4:5">Portrait (4:5)</option>
                                                    <option value="1:1">Square (1:1)</option>
                                                    <option value="16:9">Wide (16:9)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Price ($)</label>
                                                <input name="price" type="number" defaultValue={currentProduct.price} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b]" required />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Sensory Tags (Comma separated)</label>
                                            <input
                                                name="tags"
                                                defaultValue={(currentProduct.tags || []).join(', ')}
                                                className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] text-xs font-mono"
                                                placeholder="e.g. Woody, Warm, Quiet"
                                            />
                                        </div>

                                        <MediaPicker
                                            label="Artifact Primary Image"
                                            value={currentProduct.image}
                                            onChange={(val) => setCurrentProduct({ ...currentProduct, image: val })}
                                            focusPoint={currentProduct.focusPoint}
                                            onFocusChange={(fp) => setCurrentProduct({ ...currentProduct, focusPoint: fp })}
                                            prefix={currentProduct.name}
                                        />

                                        <MediaPicker
                                            label="Hover Cinematic Media (Video/GIF)"
                                            value={currentProduct.hoverVideo || ''}
                                            onChange={(val) => setCurrentProduct({ ...currentProduct, hoverVideo: val })}
                                            prefix={`${currentProduct.name}-hover`}
                                        />

                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Atmospheric Brief</label>
                                            <textarea name="description" defaultValue={currentProduct.description} rows={4} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] resize-none font-light" placeholder="Describe the sensory experience..." required />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <button type="submit" className="flex-1 bg-[#d8aa5b] text-black h-16 font-bold uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl flex items-center justify-center gap-3">
                                            <Save size={18} /> {currentProduct.id ? 'Commit Changes' : 'Initialize Artifact'}
                                        </button>
                                    </div>
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
                                                    alt="Preview"
                                                    style={{ objectPosition: `${currentProduct.focusPoint?.x ?? 50}% ${currentProduct.focusPoint?.y ?? 50}%` }}
                                                />
                                            ) : (
                                                <>
                                                    <div className="w-20 h-20 border border-white/20 rounded-full flex items-center justify-center mb-6">
                                                        <ImageIcon className="text-white/20" size={32} />
                                                    </div>
                                                    <p className="text-xs uppercase tracking-widest text-white/20">Media Preview</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="bg-[#d8aa5b]/5 border-l-2 border-[#d8aa5b] p-4">
                                            <p className="text-xs text-[#d8aa5b] font-medium leading-relaxed">
                                                SEO TIP: Assets are auto-renamed to match the Artifact Name for search indexing.
                                            </p>
                                        </div>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-widest leading-loose">
                                            The focus point ensures your ritual remains centered across different screen sizes (desktop vs mobile).
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
