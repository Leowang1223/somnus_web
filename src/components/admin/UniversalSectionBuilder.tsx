'use client';

import { Section, SectionType } from "@/types/cms";
import { useState, useEffect, useRef } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Eye, EyeOff, Trash2, Plus, Type, Image as ImageIcon, Video, Quote, Layout, Upload, Loader2, ShoppingBag, Zap, Monitor, Tablet, Smartphone } from "lucide-react";
import { uploadFileAction } from "@/app/actions";
import { useAutoFitText } from "@/hooks/useAutoFitText";

// Sortable Item Component
function SortableItem({ section, onEdit, onToggle, onDelete }: {
    section: Section;
    onEdit: (s: Section) => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const Icon = ({
        hero: Layout,
        'text-image': ImageIcon,
        'rich-text': Type,
        video: Video,
        quote: Quote,
        'full-image': ImageIcon,
        features: Layout,
        grid: Layout,
        spacer: Layout,
        purchase: ShoppingBag
    } as any)[section.type] || Layout;

    return (
        <div ref={setNodeRef} style={style} className="bg-[#111] border border-white/10 rounded-sm mb-3 flex items-center p-3 group">
            <div {...attributes} {...listeners} className="cursor-grab text-white/20 hover:text-white mr-3">
                <GripVertical size={18} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} className="text-[#d8aa5b]" />
                    <span className="text-[#d8aa5b] text-[10px] uppercase font-bold tracking-widest">{section.type}</span>
                </div>
                <p className="text-white text-xs truncate opacity-60">
                    {section.type === 'hero' ? section.content.title : (section.content.heading || section.content.text || '未命名區塊')}
                </p>
            </div>

            <div className="flex items-center gap-1">
                <button onClick={() => {
                    const sections = JSON.parse(localStorage.getItem('somnus-section-clipboard') || '[]');
                    localStorage.setItem('somnus-section-clipboard', JSON.stringify([...sections, { ...section, id: `${section.type}-${Date.now()}` }]));
                    alert('區塊已複製到庫中');
                }} className="p-2 text-yellow-400/70 hover:bg-yellow-400/10 rounded-sm transition-colors" title="複製到库">
                    <Plus size={14} />
                </button>
                <button onClick={() => onToggle(section.id)} className={`p-2 rounded-sm transition-colors ${section.isEnabled ? 'text-green-400/70 hover:bg-green-400/10' : 'text-gray-600 hover:bg-white/5'}`}>
                    {section.isEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => onEdit(section)} className="p-2 text-blue-400/70 hover:bg-blue-400/10 rounded-sm transition-colors">
                    <Edit size={14} />
                </button>
                <button onClick={() => onDelete(section.id)} className="p-2 text-red-400/70 hover:bg-red-400/10 rounded-sm transition-colors">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

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
            if (result.error) {
                alert(`上傳錯誤: ${result.error}`);
            } else if (result.url) {
                onChange(result.url);
            }
        } catch (err: any) {
            console.error("Upload error:", err);
            alert(`上傳失敗 (系統): ${err.message || "未知錯誤"}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <label className="block text-xs uppercase text-gray-500 font-bold tracking-widest">{label}</label>
            <div className="flex gap-2">
                <input
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    className="flex-1 bg-[#111] border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] text-sm font-mono"
                    placeholder="URL 或 上傳 ->"
                />
                <label className="bg-white/5 border border-white/10 p-4 text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center min-w-[60px]">
                    {isUploading ? <Loader2 size={18} className="animate-spin text-[#d8aa5b]" /> : <Upload size={18} />}
                    <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*" />
                </label>
            </div>

            {value && onFocusChange && (
                <div className="space-y-2">
                    <p className="text-[10px] uppercase text-gray-600 tracking-widest">設定焦點（點擊圖片）</p>
                    <div
                        className="relative aspect-video bg-black border border-white/5 overflow-hidden cursor-crosshair group"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                            const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                            onFocusChange({ x, y });
                        }}
                    >
                        {value.match(/\.(mp4|webm)$/) ? (
                            <video src={value} className="w-full h-full object-cover opacity-50" muted />
                        ) : (
                            <img src={value} className="w-full h-full object-cover opacity-50" alt="焦點預覽" />
                        )}
                        <div
                            className="absolute w-6 h-6 border-2 border-[#d8aa5b] rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(216,170,91,0.5)] pointer-events-none"
                            style={{ left: `${focusPoint?.x ?? 50}%`, top: `${focusPoint?.y ?? 50}%` }}
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-[#d8aa5b] rounded-full"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MultiImagePicker({ label, values = [], onChange, prefix }: {
    label: string,
    values: string[],
    onChange: (vals: string[]) => void,
    prefix?: string
}) {
    return (
        <div className="space-y-4">
            <label className="block text-xs uppercase text-[#d8aa5b] font-bold tracking-widest">{label} (多張圖片時自動開啟輪播)</label>
            <div className="space-y-3">
                {values.map((val, i) => (
                    <div key={i} className="flex gap-2 items-start">
                        <div className="flex-1">
                            <MediaPicker
                                label={`圖片 #${i + 1}`}
                                value={val}
                                onChange={newVal => {
                                    const next = [...values];
                                    next[i] = newVal;
                                    onChange(next);
                                }}
                                prefix={prefix ? `${prefix}-${i}` : undefined}
                            />
                        </div>
                        <button
                            onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                            className="mt-8 p-2 text-red-400 hover:bg-red-400/10 rounded-sm transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                <button
                    onClick={() => onChange([...values, ""])}
                    className="w-full py-3 border border-dashed border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all text-[10px] uppercase font-bold tracking-widest"
                >
                    + 新增輪播圖片
                </button>
            </div>
        </div>
    );
}

// 字型大小控制器
const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96];

function FontSizeControl({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
    const current = value || 0;
    return (
        <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-sm px-1.5 py-0.5">
            <button
                type="button"
                onClick={() => { const i = FONT_SIZES.indexOf(current); if (i > 0) onChange(FONT_SIZES[i - 1]); }}
                className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-[#d8aa5b] transition-colors text-xs font-bold"
                title="縮小"
            >−</button>
            <select
                value={current || ''}
                onChange={e => onChange(parseInt(e.target.value) || 0)}
                className="bg-transparent text-[10px] text-white/70 focus:outline-none cursor-pointer min-w-[52px]"
            >
                <option value="">預設</option>
                {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
            </select>
            <button
                type="button"
                onClick={() => { const i = FONT_SIZES.indexOf(current); if (i < FONT_SIZES.length - 1) onChange(FONT_SIZES[i + 1]); else if (i === -1) onChange(16); }}
                className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-[#d8aa5b] transition-colors text-xs font-bold"
                title="放大"
            >+</button>
        </div>
    );
}

function LocalizedField({ label, value, onChange, rows = 2, placeholder = '', fontSize, onFontSizeChange }: {
    label: string;
    value: any;
    onChange: (val: any) => void;
    rows?: number;
    placeholder?: string;
    fontSize?: number;
    onFontSizeChange?: (v: number) => void;
}) {
    const langs = ['en', 'zh', 'jp', 'ko'];
    const langLabels: Record<string, string> = { en: 'EN', zh: '中文', jp: '日本語', ko: '한국어' };
    const [activeLang, setActiveLang] = useState<string>('en');

    const asObj = (): Record<string, string> => {
        if (!value) return { en: '', zh: '', jp: '', ko: '' };
        if (typeof value === 'string') return { en: value, zh: '', jp: '', ko: '' };
        return { en: '', zh: '', jp: '', ko: '', ...value };
    };

    const handleTextChange = (newText: string) => {
        const obj = asObj();
        obj[activeLang] = newText;
        onChange(obj);
    };

    const obj = asObj();

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <label className="block text-xs uppercase text-gray-500 font-bold tracking-widest shrink-0">{label}</label>
                <div className="flex items-center gap-2">
                    {onFontSizeChange && (
                        <FontSizeControl value={fontSize} onChange={onFontSizeChange} />
                    )}
                    <div className="flex gap-1">
                        {langs.map(lang => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => setActiveLang(lang)}
                                className={`text-[9px] px-2 py-1 rounded-sm font-bold uppercase tracking-widest transition-all ${activeLang === lang ? 'bg-[#d8aa5b] text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                            >
                                {langLabels[lang]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <textarea
                value={obj[activeLang] || ''}
                onChange={e => handleTextChange(e.target.value)}
                className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]"
                rows={rows}
                placeholder={placeholder || `${langLabels[activeLang]} text...`}
                style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
            />
            {fontSize && (
                <p className="text-[9px] text-gray-600 text-right">預覽字型大小：{fontSize}px（前台將套用此尺寸）</p>
            )}
        </div>
    );
}

function AlignControl({ value, onChange, label = '文字對齊方式' }: { value: string, onChange: (v: string) => void, label?: string }) {
    return (
        <div>
            <label className="block text-xs uppercase text-gray-500 mb-4">{label}</label>
            <div className="flex gap-1 bg-black/40 p-1 rounded-sm border border-white/5">
                {['left', 'center', 'right'].map((align) => (
                    <button
                        key={align}
                        onClick={() => onChange(align)}
                        className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-widest transition-all ${value === align || (!value && align === 'center')
                            ? 'bg-[#d8aa5b] text-black shadow-[0_0_10px_rgba(216,170,91,0.3)]'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {align === 'left' ? '靠左' : align === 'center' ? '置中' : '靠右'}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Mini Section Preview ──────────────────────────────────────────────────────
// Renders a scaled-down preview of a section at a simulated viewport width.
// Uses the same useAutoFitText hook so the preview matches what users see live.
function SectionMiniPreview({
    section,
    previewWidth,
    containerWidth,
}: {
    section: Section;
    previewWidth: number;
    containerWidth: number;
}) {
    const scale = Math.min(1, containerWidth / previewWidth);
    const previewHeight = section.type === 'hero' ? 380 : section.type === 'text-image' ? 260 : 220;
    const content = section.content;

    // Resolve multilingual value
    function getLoc(v: any): string {
        if (!v) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'object') {
            return String(v['zh'] || v['en'] || Object.values(v).find(Boolean) || '');
        }
        return '';
    }

    const titleText = getLoc(content.title || content.heading || content.text || '');
    const subtitleText = getLoc(content.subtitle || '');
    const bodyText = getLoc(content.text || '');

    const titleRef = useRef<HTMLDivElement>(null);
    const subRef = useRef<HTMLDivElement>(null);

    const maxTitleSize =
        content.titleFontSize || content.headingFontSize ||
        (previewWidth >= 1280 ? 72 : previewWidth >= 768 ? 56 : 36);
    const maxSubSize = content.subtitleFontSize || (previewWidth >= 768 ? 14 : 11);

    const { fittedSize: titleFit, shrinkApplied: titleShrunk } = useAutoFitText(titleRef, {
        maxFontSize: maxTitleSize,
        text: titleText,
        minFontSize: 10,
    });
    const { fittedSize: subFit, shrinkApplied: subShrunk } = useAutoFitText(subRef, {
        maxFontSize: maxSubSize,
        text: subtitleText,
        minFontSize: 8,
    });

    const deviceLabel =
        previewWidth === 375 ? '📱 手機 375px' :
            previewWidth === 768 ? '📟 平板 768px' : '🖥 桌機 1280px';

    const badgeColor = titleShrunk || subShrunk ? '#f59e0b' : '#22c55e';
    const badgeText = titleShrunk || subShrunk ? `已縮至 ${titleFit}px（原 ${maxTitleSize}px）` : '✓ 尺寸合適';

    return (
        <div className="flex-shrink-0" style={{ width: containerWidth }}>
            <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[9px] text-gray-400 uppercase tracking-widest">{deviceLabel}</span>
                <span style={{ color: badgeColor }} className="text-[9px] font-bold">{badgeText}</span>
            </div>
            <div style={{ width: containerWidth, height: Math.round(previewHeight * scale), overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, background: '#050505' }}>
                <div style={{
                    width: previewWidth,
                    height: previewHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    background: '#050505',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: content.textAlign === 'left' ? 'flex-start' : content.textAlign === 'right' ? 'flex-end' : 'center',
                    justifyContent: 'center',
                    padding: Math.round(previewWidth * 0.05),
                    gap: 12,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                }}>
                    {/* Title / Heading */}
                    {titleText && (
                        <div
                            ref={titleRef}
                            style={{
                                fontFamily: '"Cormorant Garamond", Georgia, serif',
                                fontSize: `${titleFit}px`,
                                color: content.titleColor || content.headingColor || '#ffffff',
                                whiteSpace: titleShrunk ? 'nowrap' : 'pre-wrap',
                                lineHeight: 1.2,
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textAlign: (content.textAlign as any) || 'center',
                            }}
                        >
                            {titleText}
                        </div>
                    )}
                    {/* Subtitle */}
                    {subtitleText && (
                        <div
                            ref={subRef}
                            style={{
                                fontFamily: 'system-ui, sans-serif',
                                fontSize: `${subFit}px`,
                                color: content.subtitleColor || 'rgba(255,255,255,0.6)',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                whiteSpace: subShrunk ? 'nowrap' : undefined,
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textAlign: (content.textAlign as any) || 'center',
                            }}
                        >
                            {subtitleText}
                        </div>
                    )}
                    {/* Body text preview (rich-text / text-image body) */}
                    {!titleText && !subtitleText && bodyText && (
                        <div style={{
                            fontFamily: 'system-ui, sans-serif',
                            fontSize: `${content.fontSize || content.textFontSize || 14}px`,
                            color: 'rgba(160,160,160,0.9)',
                            lineHeight: 1.7,
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textAlign: (content.textAlign as any) || 'center',
                            display: '-webkit-box',
                            WebkitLineClamp: 5,
                            WebkitBoxOrient: 'vertical',
                        } as React.CSSProperties}>
                            {bodyText}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Editor Modal Component
function EditModal({ section, onClose, onSave }: { section: Section; onClose: () => void; onSave: (s: Section) => void }) {
    const [content, setContent] = useState(section.content);
    // Fix: Manage backgroundConfig in local state to prevent modal closing on change
    const [backgroundConfig, setBackgroundConfig] = useState(section.backgroundConfig || { opacity: 1, blur: 0, grain: 0 });
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [previewContainerWidth, setPreviewContainerWidth] = useState(320);

    useEffect(() => {
        if (activeTab === 'preview' && previewContainerRef.current) {
            setPreviewContainerWidth(previewContainerRef.current.clientWidth);
        }
    }, [activeTab]);

    const handleChange = (key: string, value: any) => {
        setContent({ ...content, [key]: value });
    };

    const handleBackgroundChange = (key: string, value: any) => {
        setBackgroundConfig((prev: any) => ({ ...prev, [key]: value }));
    };

    // Current section with live content for preview
    const liveSection = { ...section, content, backgroundConfig };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
            <div className="bg-[#0a0a09] border border-white/10 w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-sm shadow-2xl">
                {/* Modal Header */}
                <div className="sticky top-0 z-10 bg-[#0a0a09] border-b border-white/5 px-4 sm:px-8 py-4 flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-white font-display text-base sm:text-xl uppercase tracking-widest">編輯 {section.type}</h2>
                        <span className="hidden sm:inline text-gray-600 text-[9px] font-mono">{section.id}</span>
                    </div>
                    {/* Edit / Preview Tabs */}
                    <div className="flex gap-1 bg-black/40 p-1 rounded-sm border border-white/5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('edit')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-sm transition-all ${activeTab === 'edit' ? 'bg-[#d8aa5b] text-black' : 'text-white/40 hover:text-white'}`}
                        >
                            <Edit size={10} /> 編輯
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('preview')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-sm transition-all ${activeTab === 'preview' ? 'bg-[#d8aa5b] text-black' : 'text-white/40 hover:text-white'}`}
                        >
                            <Monitor size={10} /> 預覽
                        </button>
                    </div>
                </div>

                {/* Preview Panel */}
                {activeTab === 'preview' && (
                    <div ref={previewContainerRef} className="px-4 sm:px-8 py-6 space-y-4">
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-relaxed">
                            以下為發布後在各裝置的文字渲染效果。<span className="text-[#d8aa5b]">橙色</span>表示字型已自動縮小以維持單行排版。
                        </p>
                        <div className="flex flex-col gap-5">
                            {[375, 768, 1280].map(w => (
                                <SectionMiniPreview
                                    key={w}
                                    section={liveSection}
                                    previewWidth={w}
                                    containerWidth={previewContainerWidth || 320}
                                />
                            ))}
                        </div>
                        <p className="text-[9px] text-gray-600 italic mt-2">
                            ※ 預覽為文字排版模擬，背景圖片不顯示於此。
                        </p>
                    </div>
                )}

                {/* Edit Panel */}
                {activeTab === 'edit' && (
                <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-6">
                    {section.type === 'hero' && (
                        <>
                            <LocalizedField label="標題" value={content.title} onChange={v => handleChange('title', v)} rows={2}
                                fontSize={content.titleFontSize} onFontSizeChange={v => handleChange('titleFontSize', v)} />
                            <LocalizedField label="副標題" value={content.subtitle} onChange={v => handleChange('subtitle', v)} rows={2}
                                fontSize={content.subtitleFontSize} onFontSizeChange={v => handleChange('subtitleFontSize', v)} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <LocalizedField label="按鈕文字 (CTA)" value={content.ctaText} onChange={v => handleChange('ctaText', v)} rows={1} placeholder="e.g. Explore" />
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-2 font-bold tracking-widest">按鈕連結</label>
                                    <textarea value={content.ctaLink || ''} onChange={e => handleChange('ctaLink', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" rows={1} placeholder="/collection" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-white/5 border border-white/10 rounded-sm">
                                <AlignControl value={content.textAlign} onChange={v => handleChange('textAlign', v)} />
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-2">容器寬度 (內容邊界)</label>
                                    <input
                                        type="range"
                                        min="40"
                                        max="100"
                                        value={content.containerWidth || 95}
                                        onChange={e => handleChange('containerWidth', parseInt(e.target.value))}
                                        className="w-full accent-[#d8aa5b] cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-500 mt-1 uppercase">
                                        <span>較窄</span>
                                        <span>目前: {content.containerWidth || 95}%</span>
                                        <span>完全無限制</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-2 text-white">標題顏色</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={content.titleColor || '#ffffff'} onChange={e => handleChange('titleColor', e.target.value)} className="w-12 h-11 bg-[#111] border border-white/10 p-1 cursor-pointer" />
                                        <input value={content.titleColor || '#ffffff'} onChange={e => handleChange('titleColor', e.target.value)} className="flex-1 bg-[#111] border border-white/10 p-3 text-white font-mono text-xs uppercase" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-2 text-white">副標題顏色</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={content.subtitleColor || '#ffffff'} onChange={e => handleChange('subtitleColor', e.target.value)} className="w-12 h-11 bg-[#111] border border-white/10 p-1 cursor-pointer" />
                                        <input value={content.subtitleColor || '#ffffff'} onChange={e => handleChange('subtitleColor', e.target.value)} className="flex-1 bg-[#111] border border-white/10 p-3 text-white font-mono text-xs uppercase" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#d8aa5b]/5 border border-[#d8aa5b]/20 p-4 rounded-sm space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Background Glow */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] uppercase text-[#d8aa5b] font-bold tracking-widest">文字背景輝光</label>
                                            <button
                                                onClick={() => handleChange('enableTitleBgGlow', !content.enableTitleBgGlow)}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${content.enableTitleBgGlow ? 'bg-[#d8aa5b]' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${content.enableTitleBgGlow ? 'left-6' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                        {content.enableTitleBgGlow && (
                                            <input type="color" value={content.titleBgGlowColor || '#d8aa5b'} onChange={e => handleChange('titleBgGlowColor', e.target.value)} className="w-full h-8 bg-[#111] border border-white/10 p-1 cursor-pointer rounded-sm" />
                                        )}
                                    </div>

                                    {/* Text Glow */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] uppercase text-[#d8aa5b] font-bold tracking-widest">文字本體輝光</label>
                                            <button
                                                onClick={() => handleChange('enableTitleGlow', !content.enableTitleGlow)}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${content.enableTitleGlow ? 'bg-[#d8aa5b]' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${content.enableTitleGlow ? 'left-6' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                        {content.enableTitleGlow && (
                                            <input type="color" value={content.titleGlowColor || '#d8aa5b'} onChange={e => handleChange('titleGlowColor', e.target.value)} className="w-full h-8 bg-[#111] border border-white/10 p-1 cursor-pointer rounded-sm" />
                                        )}
                                    </div>

                                    {/* Button Glow */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] uppercase text-[#d8aa5b] font-bold tracking-widest">按鈕呼吸輝光</label>
                                            <button
                                                onClick={() => handleChange('enableGlow', !content.enableGlow)}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${content.enableGlow ? 'bg-[#d8aa5b]' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${content.enableGlow ? 'left-6' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                        {content.enableGlow && (
                                            <input type="color" value={content.glowColor || '#d8aa5b'} onChange={e => handleChange('glowColor', e.target.value)} className="w-full h-8 bg-[#111] border border-white/10 p-1 cursor-pointer rounded-sm" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <MultiImagePicker
                                label="背景輪播圖片"
                                values={content.backgroundImages || (content.backgroundImage ? [content.backgroundImage] : [])}
                                onChange={vals => {
                                    handleChange('backgroundImages', vals);
                                    if (vals.length > 0) setContent((prev: any) => ({ ...prev, backgroundImages: vals, backgroundImage: vals[0] }));
                                    else setContent((prev: any) => ({ ...prev, backgroundImages: vals }));
                                }}
                            />
                        </>
                    )}

                    {section.type === 'text-image' && (
                        <>
                            <LocalizedField label="標題" value={content.heading} onChange={v => handleChange('heading', v)} rows={2}
                                fontSize={content.headingFontSize} onFontSizeChange={v => handleChange('headingFontSize', v)} />
                            <LocalizedField label="正文" value={content.text} onChange={v => handleChange('text', v)} rows={4}
                                fontSize={content.textFontSize} onFontSizeChange={v => handleChange('textFontSize', v)} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <AlignControl value={content.textAlign} onChange={v => handleChange('textAlign', v)} />
                                <div>
                                    <label className="block text-xs uppercase text-gray-500 mb-2">圖片位置</label>
                                    <select value={content.imagePosition || 'left'} onChange={e => handleChange('imagePosition', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]">
                                        <option value="left">左</option>
                                        <option value="right">右</option>
                                    </select>
                                </div>
                            </div>
                            <MultiImagePicker
                                label="視覺圖片"
                                values={content.images || (content.image ? [content.image] : [])}
                                onChange={vals => {
                                    if (vals.length > 0) setContent((prev: any) => ({ ...prev, images: vals, image: vals[0] }));
                                    else setContent((prev: any) => ({ ...prev, images: vals }));
                                }}
                            />
                            <LocalizedField label="圖片上的黃字 Caption (選填)" value={content.caption} onChange={v => handleChange('caption', v)} rows={2} placeholder="留空則不顯示..."
                                fontSize={content.captionFontSize} onFontSizeChange={v => handleChange('captionFontSize', v)} />
                        </>
                    )}

                    {section.type === 'full-image' && (
                        <>
                            <MultiImagePicker
                                label="高解析度輪播圖片"
                                values={content.images || (content.image ? [content.image] : [])}
                                onChange={vals => {
                                    if (vals.length > 0) setContent((prev: any) => ({ ...prev, images: vals, image: vals[0] }));
                                    else setContent((prev: any) => ({ ...prev, images: vals }));
                                }}
                            />
                            <LocalizedField label="疊蓋說明 (選填)" value={content.caption} onChange={v => handleChange('caption', v)} rows={2}
                                fontSize={content.captionFontSize} onFontSizeChange={v => handleChange('captionFontSize', v)} />
                        </>
                    )}

                    {section.type === 'rich-text' && (
                        <div className="space-y-6">
                            <AlignControl value={content.textAlign} onChange={v => handleChange('textAlign', v)} />
                            <LocalizedField label="編輯器 (支援 Markdown/HTML)" value={content.text} onChange={v => handleChange('text', v)} rows={12}
                                fontSize={content.fontSize} onFontSizeChange={v => handleChange('fontSize', v)} />
                        </div>
                    )}

                    {section.type === 'quote' && (
                        <>
                            <AlignControl value={content.textAlign} onChange={v => handleChange('textAlign', v)} />
                            <LocalizedField label="引用文字" value={content.text} onChange={v => handleChange('text', v)} rows={3}
                                fontSize={content.quoteFontSize} onFontSizeChange={v => handleChange('quoteFontSize', v)} />
                            <LocalizedField label="作者" value={content.author} onChange={v => handleChange('author', v)} rows={1}
                                fontSize={content.authorFontSize} onFontSizeChange={v => handleChange('authorFontSize', v)} />
                        </>
                    )}

                    {section.type === 'video' && (
                        <>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">影片 URL (MP4 / YouTube)</label>
                                <input value={content.videoUrl} onChange={e => handleChange('videoUrl', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" />
                            </div>
                            <MediaPicker label="影片縮圖" value={content.thumbnail} onChange={val => handleChange('thumbnail', val)} />
                            <LocalizedField label="標籤" value={content.label} onChange={v => handleChange('label', v)} rows={1} />
                        </>
                    )}

                    {section.type === 'spacer' && (
                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-2">高度 (像素)</label>
                            <input type="number" value={content.height || 60} onChange={e => handleChange('height', parseInt(e.target.value))} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" />
                        </div>
                    )}

                    {section.type === 'purchase' && (
                        <div className="space-y-10">
                            <div className="bg-[#d8aa5b]/10 p-6 border border-[#d8aa5b]/20 rounded-sm space-y-4">
                                <div>
                                    <p className="text-[#d8aa5b] text-xs uppercase tracking-widest font-bold mb-2">購買介面配置</p>
                                    <p className="text-gray-400 text-[10px] leading-relaxed italic">
                                        此區域將展示產品主圖輪播、價格以及購買按鈕。
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-4 pt-2 border-t border-[#d8aa5b]/20">
                                    <LocalizedField label="小標籤 (Label Override)" value={content.label} onChange={v => handleChange('label', v)} rows={1} placeholder="不填則顯示預設類別..." />
                                    <LocalizedField label="產品描述 (Description Override)" value={content.description} onChange={v => handleChange('description', v)} rows={3} placeholder="不填則顯示產品原描述..." />
                                </div>
                            </div>

                            <MultiImagePicker
                                label="產品輪播圖片 (多張)"
                                values={content.images || []}
                                onChange={vals => handleChange('images', vals)}
                            />

                            <hr className="border-white/5" />

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs uppercase text-gray-500 font-bold tracking-widest">屬性小卡 (Feature Cards)</label>
                                    <button
                                        onClick={() => handleChange('featureCards', [...(content.featureCards || []), { iconType: 'Scent', label: '標籤', value: '內容' }])}
                                        className="text-[10px] text-[#d8aa5b] hover:underline"
                                    >
                                        + 新增卡片
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {(content.featureCards || []).map((card: any, i: number) => (
                                        <div key={i} className="bg-white/5 p-4 rounded-sm grid grid-cols-3 gap-3 items-end">
                                            <div>
                                                <label className="block text-[9px] uppercase text-gray-600 mb-1">圖示</label>
                                                <select value={card.iconType} onChange={e => {
                                                    const newCards = [...content.featureCards];
                                                    newCards[i].iconType = e.target.value;
                                                    handleChange('featureCards', newCards);
                                                }} className="w-full bg-black border border-white/10 text-[10px] p-2 text-white outline-none">
                                                    <option value="Scent">香氣 (Scent)</option>
                                                    <option value="Material">材質 (Material)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[9px] uppercase text-gray-600 mb-1">標題</label>
                                                <input value={card.label} onChange={e => {
                                                    const newCards = [...content.featureCards];
                                                    newCards[i].label = e.target.value;
                                                    handleChange('featureCards', newCards);
                                                }} className="w-full bg-black border border-white/10 text-[10px] p-2 text-white outline-none" />
                                            </div>
                                            <div className="relative">
                                                <label className="block text-[9px] uppercase text-gray-600 mb-1">數值</label>
                                                <input value={card.value} onChange={e => {
                                                    const newCards = [...content.featureCards];
                                                    newCards[i].value = e.target.value;
                                                    handleChange('featureCards', newCards);
                                                }} className="w-full bg-black border border-white/10 text-[10px] p-2 text-white outline-none pr-8" />
                                                <button onClick={() => handleChange('featureCards', content.featureCards.filter((_: any, idx: number) => idx !== i))} className="absolute right-2 bottom-2 text-red-500/50 hover:text-red-500">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-white/5" />

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs uppercase text-gray-500 font-bold tracking-widest">產品詳情清單 (Info List)</label>
                                    <button
                                        onClick={() => handleChange('infoList', [...(content.infoList || []), { title: '新項目', description: '描述細節...' }])}
                                        className="text-[10px] text-[#d8aa5b] hover:underline"
                                    >
                                        + 新增項目
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {(content.infoList || []).map((item: any, i: number) => (
                                        <div key={i} className="bg-white/5 p-4 rounded-sm space-y-3 relative group">
                                            <button onClick={() => handleChange('infoList', content.infoList.filter((_: any, idx: number) => idx !== i))} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity">
                                                <Trash2 size={12} />
                                            </button>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[#d8aa5b] font-display text-sm">{(i + 1).toString().padStart(2, '0')}</span>
                                                <input value={item.title} onChange={e => {
                                                    const newList = [...content.infoList];
                                                    newList[i].title = e.target.value;
                                                    handleChange('infoList', newList);
                                                }} className="flex-1 bg-black border border-white/10 text-[10px] p-2 text-white outline-none font-bold tracking-widest uppercase" />
                                            </div>
                                            <textarea value={item.description} onChange={e => {
                                                const newList = [...content.infoList];
                                                newList[i].description = e.target.value;
                                                handleChange('infoList', newList);
                                            }} className="w-full bg-black border border-white/10 text-[10px] p-2 text-white outline-none h-20 leading-relaxed font-light" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section Background & Atmospheric Config */}
                    <div className="mt-12 pt-12 border-t border-white/5">
                        <h3 className="text-[#d8aa5b] text-xs uppercase tracking-[0.2em] mb-8 font-bold">氛圍引擎</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <MediaPicker
                                    label="區塊背景 (覆蓋)"
                                    value={backgroundConfig.url || ''}
                                    onChange={val => {
                                        handleBackgroundChange('url', val);
                                        handleBackgroundChange('type', val.match(/\.(mp4|webm)$/) ? 'video' : 'image');
                                    }}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase text-gray-500 mb-2">不透明度 ({backgroundConfig.opacity ?? 1})</label>
                                        <input
                                            type="range" min="0" max="1" step="0.1"
                                            value={backgroundConfig.opacity ?? 1}
                                            onChange={e => handleBackgroundChange('opacity', parseFloat(e.target.value))}
                                            className="w-full accent-[#d8aa5b]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase text-gray-500 mb-2">模糊 ({backgroundConfig.blur ?? 0}px)</label>
                                        <input
                                            type="range" min="0" max="100" step="5"
                                            value={backgroundConfig.blur ?? 0}
                                            onChange={e => handleBackgroundChange('blur', parseInt(e.target.value))}
                                            className="w-full accent-[#d8aa5b]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-500 mb-2">底片顆粒 ({backgroundConfig.grain ?? 0}%)</label>
                                    <input
                                        type="range" min="0" max="100" step="5"
                                        value={backgroundConfig.grain ?? 0}
                                        onChange={e => handleBackgroundChange('grain', parseInt(e.target.value))}
                                        className="w-full accent-[#d8aa5b]"
                                    />
                                </div>
                            </div>
                            <div className="bg-black/50 p-6 border border-white/5 rounded-sm flex flex-col justify-center">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-loose">
                                    氛圍引擎可讓您為此特定區塊設置劇院級背景。不同背景區塊之間的切換將自動淡入淡出，營造流暢的感官體驗。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                )}{/* end edit panel */}

                {/* Save / Cancel — always visible regardless of active tab */}
                <div className="sticky bottom-0 bg-[#0a0a09] border-t border-white/5 px-4 sm:px-8 py-4 flex justify-end gap-4">
                    <button onClick={onClose} className="text-white/40 hover:text-white px-4 py-2 transition-colors uppercase text-[10px] tracking-widest font-bold">取消</button>
                    <button onClick={() => onSave({ ...section, content, backgroundConfig })} className="bg-[#d8aa5b] text-black px-6 sm:px-8 py-3 font-bold uppercase tracking-widest hover:bg-white rounded-sm transition-all shadow-[0_4px_20px_rgba(216,170,91,0.2)]">儲存變更</button>
                </div>

            </div>
        </div>
    );
}

export default function UniversalSectionBuilder({
    initialSections, onSave, isSaving, onChange, metadata, onMetadataChange, isOwner = false
}: {
    initialSections: Section[];
    onSave: (sections: Section[]) => Promise<void>;
    isSaving?: boolean;
    onChange?: (sections: Section[]) => void;
    metadata?: any;
    onMetadataChange?: (meta: any) => void;
    isOwner?: boolean;
}) {
    const [sections, setSections] = useState<Section[]>(initialSections || []);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [isEditingMetadata, setIsEditingMetadata] = useState(false);

    // Sync with parent for live preview
    useEffect(() => {
        if (onChange) onChange(sections);
    }, [sections, onChange]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setSections((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleUpdateSection = (updatedSection: Section) => {
        setSections(sections.map(s => s.id === updatedSection.id ? updatedSection : s));
        setEditingSection(null);
    };

    const handleToggle = (id: string) => {
        setSections(sections.map(s => s.id === id ? { ...s, isEnabled: !s.isEnabled } : s));
    };

    const handleDelete = (id: string) => {
        if (confirm("確認刪除此區塊？")) {
            setSections(sections.filter(s => s.id !== id));
        }
    };

    const addNewSection = (type: SectionType) => {
        const defaultContent: Record<string, any> = {
            hero: { title: "新英雄區塊", subtitle: "輸入細節", ctaText: "探索", ctaLink: "/collection" },
            'text-image': { heading: "新故事", text: "長篇描述...", imagePosition: "left" },
            'rich-text': { text: "主要內容..." },
            video: { videoUrl: "", thumbnail: "", label: "觀看儀式" },
            quote: { text: "名言...", author: "SØMNS" },
            spacer: { height: 60 },
            purchase: {
                label: "儀式收藏",
                description: "",
                images: [],
                featureCards: [
                    { iconType: 'Scent', label: '香氣輪廓', value: '薰衣草與檀香' },
                    { iconType: 'Material', label: '材質', value: '100% 桑蠶絲' }
                ],
                infoList: [
                    { title: "環境營造", description: "點燃香氛蠟燭，開啟晚間的感官旅程。" },
                    { title: "沈靜包裹", description: "戴上絲綢眼罩，徹底阻絕外界視覺噪音。" }
                ]
            }
        };

        const newSection: Section = {
            id: `${type}-${Date.now()}`,
            type,
            content: defaultContent[type as string] || {},
            isEnabled: true
        };
        setSections([...sections, newSection]);
    };

    const addNewFullImage = () => {
        const newSection: Section = {
            id: `full-image-${Date.now()}`,
            type: 'full-image',
            content: { image: "", caption: "" },
            isEnabled: true
        };
        setSections([...sections, newSection]);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 mb-6">
                {metadata && (
                    <button
                        onClick={() => setIsEditingMetadata(true)}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-[#d8aa5b] text-black px-4 py-2 rounded-sm font-bold shadow-[0_0_15px_rgba(216,170,91,0.3)] hover:bg-white transition-all mr-4"
                    >
                        <Zap size={12} /> 核心資料編輯
                    </button>
                )}
                <button onClick={() => addNewSection('hero')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-sm border border-white/10 transition-colors">
                    <Layout size={12} /> + 英雄區塊
                </button>
                <button onClick={() => addNewSection('text-image')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-sm border border-white/10 transition-colors">
                    <ImageIcon size={12} /> + 故事區塊
                </button>
                <button onClick={addNewFullImage} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-[#d8aa5b]/10 hover:bg-[#d8aa5b]/20 text-[#d8aa5b] px-4 py-2 rounded-sm border border-[#d8aa5b]/20 transition-colors">
                    <ImageIcon size={12} /> + 全寬圖片區塊
                </button>
                <button onClick={() => addNewSection('rich-text')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-sm border border-white/10 transition-colors">
                    <Type size={12} /> + 內容區塊
                </button>
                <button onClick={() => addNewSection('video')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-sm border border-white/10 transition-colors">
                    <Video size={12} /> + 影片區塊
                </button>
                <button onClick={() => addNewSection('quote')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-sm border border-white/10 transition-colors">
                    <Quote size={12} /> + 引用區塊
                </button>
                <button onClick={() => addNewSection('spacer')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-sm border border-white/10 transition-colors">
                    <Layout size={12} /> + 間隔區塊
                </button>
                <button onClick={() => addNewSection('purchase')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-[#d8aa5b]/10 hover:bg-[#d8aa5b]/20 text-[#d8aa5b] px-4 py-2 rounded-sm border border-[#d8aa5b]/20 transition-colors">
                    <ShoppingBag size={12} /> + 購買區塊
                </button>
                <div className="h-6 w-[1px] bg-white/10 mx-2" />
                <button
                    onClick={() => {
                        const items = JSON.parse(localStorage.getItem('somnus-section-clipboard') || '[]');
                        if (items.length === 0) return alert('庫是空的');
                        setSections([...sections, ...items]);
                    }}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-sm border border-yellow-500/20 transition-colors"
                >
                    <Plus size={12} /> 從庫中貼上 ({JSON.parse(localStorage.getItem('somnus-section-clipboard') || '[]').length})
                </button>
            </div>

            <div className="min-h-[200px] border-l border-white/5 pl-4">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        {sections.map(section => (
                            <SortableItem
                                key={section.id}
                                section={section}
                                onEdit={setEditingSection}
                                onToggle={handleToggle}
                                onDelete={handleDelete}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {sections.length === 0 && (
                    <div className="py-20 text-center border border-dashed border-white/5 text-gray-600 text-sm">
                        尚未添加區塊。從添加英雄區塊開始吧。
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-8 mt-12 border-t border-white/5">
                <button
                    onClick={() => onSave(sections)}
                    disabled={isSaving}
                    className="bg-[#d8aa5b] text-black px-10 py-4 font-bold uppercase tracking-widest hover:bg-white disabled:opacity-50 transition-all rounded-sm shadow-xl"
                >
                    {isSaving ? "儲存中..." : "發佈頁面佈局"}
                </button>
            </div>

            {editingSection && (
                <EditModal section={editingSection} onClose={() => setEditingSection(null)} onSave={handleUpdateSection} />
            )}

            {isEditingMetadata && metadata && (
                <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#0a0a09] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm p-10 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                            <div>
                                <h2 className="text-white font-display text-3xl uppercase tracking-widest mb-1">核心資料管理</h2>
                                <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em]">同步更新產品或文章的全局屬性</p>
                            </div>
                            <button onClick={() => setIsEditingMetadata(false)} className="text-white/30 hover:text-white transition-colors">
                                <Plus size={32} className="rotate-45" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Common fields based on metadata structure */}
                            {metadata.name !== undefined && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] uppercase text-[#d8aa5b] font-bold tracking-widest">名稱 / 標題</label>
                                        <input
                                            value={metadata.name || metadata.title || ''}
                                            onChange={e => onMetadataChange?.({ ...metadata, name: e.target.value, title: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] font-display text-xl transition-all"
                                        />
                                    </div>
                                    {metadata.price !== undefined && (
                                        <div className="space-y-2">
                                            <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest">投資金額 ($)</label>
                                            <input
                                                type="number"
                                                value={metadata.price || ''}
                                                onChange={e => onMetadataChange?.({ ...metadata, price: parseFloat(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] font-display text-xl transition-all"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {isOwner && metadata.cost !== undefined && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-[10px] uppercase text-red-500/70 font-bold tracking-widest">產品成本 (Cost)</label>
                                    <input
                                        type="number"
                                        value={metadata.cost || 0}
                                        onChange={e => onMetadataChange?.({ ...metadata, cost: parseFloat(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 p-4 text-red-400 focus:outline-none focus:border-red-500 font-display text-xl transition-all font-mono"
                                    />
                                    <p className="text-[10px] text-gray-500">此欄位僅供負責人查看，用於計算淨利。</p>
                                </div>
                            )}

                            {metadata.snippet !== undefined && (
                                <div className="space-y-2">
                                    <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest">引言 (Snippet / 列表摘要)</label>
                                    <textarea
                                        value={metadata.snippet || ''}
                                        onChange={e => onMetadataChange?.({ ...metadata, snippet: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#d8aa5b] min-h-[100px] resize-none font-light leading-relaxed text-sm"
                                        placeholder="輸入吸引人的短段落..."
                                    />
                                </div>
                            )}

                            <div className="bg-[#111] p-6 border border-white/5 rounded-sm space-y-6">
                                <h3 className="text-xs uppercase tracking-[0.2em] text-[#d8aa5b] font-bold">SEO 與 搜尋優化</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[9px] uppercase text-gray-600 mb-2 tracking-widest">Meta Title (SEO 標題)</label>
                                        <input
                                            value={metadata.metaTitle || ''}
                                            onChange={e => onMetadataChange?.({ ...metadata, metaTitle: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] uppercase text-gray-600 mb-2 tracking-widest">Meta Description (SEO 描述)</label>
                                        <textarea
                                            value={metadata.metaDescription || ''}
                                            onChange={e => onMetadataChange?.({ ...metadata, metaDescription: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b] text-xs h-20 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsEditingMetadata(false)}
                                className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-[#d8aa5b] transition-all rounded-sm shadow-xl"
                            >
                                確認並繼續編輯佈局
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
