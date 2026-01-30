'use client';

import { useState } from 'react';
import { updateArticleAction, uploadFileAction } from "@/app/actions";
import { Edit, Plus, Save, X, BookOpen, Upload, Loader2, Image as ImageIcon, Zap, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CMSArticle } from '@/types/cms';
import { useRouter } from 'next/navigation';

function MediaPicker({ label, value, onChange, prefix }: { label: string, value: string, onChange: (val: string) => void, prefix?: string }) {
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
        <div className="space-y-4">
            <label className="block text-[10px] uppercase text-[#d8aa5b] font-bold tracking-[0.2em]">{label}</label>
            <div className="flex gap-2">
                <input
                    name="image"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] text-sm font-mono"
                    placeholder="Thumbnail URL or Upload ->"
                />
                <label className="bg-white/5 border border-white/10 p-3 text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center min-w-[50px]">
                    {isUploading ? <Loader2 size={16} className="animate-spin text-[#d8aa5b]" /> : <Upload size={16} />}
                    <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
                </label>
            </div>
        </div>
    );
}

export default function AdminJournalClient({ initialArticles }: { initialArticles: CMSArticle[] }) {
    const router = useRouter();
    const [articles, setArticles] = useState(initialArticles);
    const [isEditing, setIsEditing] = useState(false);
    const [currentArticle, setCurrentArticle] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleEdit = (article: any) => {
        setCurrentArticle(article);
        setIsEditing(true);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === articles.length) setSelectedIds([]);
        else setSelectedIds(articles.map(a => a.id));
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleAddNew = () => {
        setCurrentArticle({
            title: '',
            category: 'Ritual',
            readTime: '5 min read',
            snippet: '',
            content: '',
            status: 'draft',
            tags: [],
            metaTitle: '',
            metaDescription: ''
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
                    <Plus size={16} /> Add Article
                </button>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-widest border-b border-white/5">
                        <tr>
                            <th className="p-6 w-10">
                                <button onClick={toggleSelectAll} className={`w-4 h-4 border transition-colors flex items-center justify-center ${selectedIds.length === articles.length ? 'bg-[#d8aa5b] border-[#d8aa5b]' : 'border-white/20'}`}>
                                    {selectedIds.length === articles.length && <Check size={10} className="text-black" />}
                                </button>
                            </th>
                            <th className="p-6 font-medium">Title</th>
                            <th className="p-6 font-medium">Category</th>
                            <th className="p-6 font-medium">Status</th>
                            <th className="p-6 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white">
                        {articles.map((article) => (
                            <tr key={article.id} className={`hover:bg-white/5 transition-colors group ${selectedIds.includes(article.id) ? 'bg-[#d8aa5b]/5' : ''}`}>
                                <td className="p-6">
                                    <button onClick={() => toggleSelectOne(article.id)} className={`w-4 h-4 border transition-colors flex items-center justify-center ${selectedIds.includes(article.id) ? 'bg-[#d8aa5b] border-[#d8aa5b]' : 'border-white/10'}`}>
                                        {selectedIds.includes(article.id) && <Check size={10} className="text-black" />}
                                    </button>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-sm overflow-hidden border border-white/5 shrink-0">
                                            {article.image && <img src={article.image} className="w-full h-full object-cover" alt="" />}
                                        </div>
                                        <span className="font-display truncate max-w-[300px]">{article.title}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-sm text-gray-500">{article.category}</td>
                                <td className="p-6">
                                    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm border ${article.status === 'published' ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-yellow-500/20 text-yellow-500 bg-yellow-500/5'}`}>
                                        {article.status || 'draft'}
                                    </span>
                                </td>
                                <td className="p-6 text-right flex justify-end gap-3">
                                    <Link href={`/admin/journal/${article.id}`} className="text-[#d8aa5b] hover:text-white transition-colors bg-[#d8aa5b]/5 px-3 py-1 rounded-sm text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                                        <BookOpen size={12} /> Layout
                                    </Link>
                                    <button onClick={() => handleEdit(article)} className="text-gray-500 hover:text-white transition-colors p-1">
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
                            className="bg-[#0a0a09] border border-white/10 p-10 rounded-sm max-w-4xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="font-display text-3xl text-white mb-1">{currentArticle.id ? 'Refine Ritual' : 'Script New Myth'}</h2>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-widest">Editorial & Story Metadata</p>
                                </div>
                                <button onClick={() => setIsEditing(false)} className="text-white/30 hover:text-white transition-colors p-2"><X size={28} /></button>
                            </div>

                            <div className="flex justify-between items-center bg-[#d8aa5b]/5 border border-[#d8aa5b]/20 p-4 rounded-sm mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#d8aa5b] flex items-center justify-center text-black">
                                        <Zap size={14} />
                                    </div>
                                    <p className="text-[10px] text-white font-bold uppercase tracking-widest">AI Translation Ritual Available</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const { translateAction } = await import("@/app/actions");
                                        const result = await translateAction(currentArticle.title, 'zh');
                                        alert(`AI Suggestion: ${result.translated}`);
                                    }}
                                    className="px-4 py-2 bg-[#d8aa5b] text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all rounded-sm"
                                >
                                    Translate Content
                                </button>
                            </div>

                            <form action={async (formData) => {
                                await updateArticleAction(formData);
                                setIsEditing(false);
                                router.refresh();
                            }} className="space-y-8">
                                <input type="hidden" name="id" value={currentArticle.id || ''} />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-[#d8aa5b] mb-2 font-bold">Headline</label>
                                            <input name="title" defaultValue={currentArticle.title} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] font-display text-xl" required />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Display Status</label>
                                                <select name="status" defaultValue={currentArticle.status || 'draft'} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] appearance-none">
                                                    <option value="draft">Draft</option>
                                                    <option value="published">Published</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Read Time</label>
                                                <input name="readTime" defaultValue={currentArticle.readTime} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b]" />
                                            </div>
                                        </div>

                                        <MediaPicker
                                            label="Feature Image / Thumbnail"
                                            value={currentArticle.image}
                                            onChange={(val) => setCurrentArticle({ ...currentArticle, image: val })}
                                            prefix={currentArticle.title}
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">SEO Meta Title</label>
                                            <input name="metaTitle" defaultValue={currentArticle.metaTitle} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] text-xs" />
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">SEO Meta Description</label>
                                            <textarea name="metaDescription" defaultValue={currentArticle.metaDescription} rows={3} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] text-xs resize-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Tags (Comma split)</label>
                                            <input name="tags" defaultValue={(currentArticle.tags || []).join(', ')} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] text-xs font-mono" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Snippet (Intro)</label>
                                    <textarea name="snippet" defaultValue={currentArticle.snippet} rows={3} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] font-light resize-none" placeholder="A brief hook..." />
                                </div>

                                <button type="submit" className="w-full bg-[#d8aa5b] text-black h-16 font-bold uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl flex items-center justify-center gap-3">
                                    <Save size={18} /> Seal Publication
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
