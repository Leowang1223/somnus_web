'use client';

import { Section, SectionType } from "@/types/cms";
import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Eye, EyeOff, Trash2, Plus, Type, Image as ImageIcon, Video, Quote, Layout, Upload, Loader2, ShoppingBag } from "lucide-react";
import { uploadFileAction } from "@/app/actions";

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
                    {section.type === 'hero' ? section.content.title : (section.content.heading || section.content.text || 'Untitled Block')}
                </p>
            </div>

            <div className="flex items-center gap-1">
                <button onClick={() => {
                    const sections = JSON.parse(localStorage.getItem('somnus-section-clipboard') || '[]');
                    localStorage.setItem('somnus-section-clipboard', JSON.stringify([...sections, { ...section, id: `${section.type}-${Date.now()}` }]));
                    alert('Section copied to library');
                }} className="p-2 text-yellow-400/70 hover:bg-yellow-400/10 rounded-sm transition-colors" title="Copy to Library">
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
            onChange(result.url);
        } catch (err) {
            alert("Upload failed");
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
                    placeholder="URL or Upload ->"
                />
                <label className="bg-white/5 border border-white/10 p-4 text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center min-w-[60px]">
                    {isUploading ? <Loader2 size={18} className="animate-spin text-[#d8aa5b]" /> : <Upload size={18} />}
                    <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*" />
                </label>
            </div>

            {value && onFocusChange && (
                <div className="space-y-2">
                    <p className="text-[10px] uppercase text-gray-600 tracking-widest">Set Focus Point (Click image)</p>
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
                            <img src={value} className="w-full h-full object-cover opacity-50" alt="Focus Preview" />
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

// Editor Modal Component
function EditModal({ section, onClose, onSave }: { section: Section; onClose: () => void; onSave: (s: Section) => void }) {
    const [content, setContent] = useState(section.content);

    const handleChange = (key: string, value: any) => {
        setContent({ ...content, [key]: value });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0a0a09] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                    <h2 className="text-white font-display text-2xl uppercase tracking-widest">Edit {section.type}</h2>
                    <span className="text-gray-500 text-[10px] font-mono uppercase">{section.id}</span>
                </div>

                <div className="space-y-6">
                    {section.type === 'hero' && (
                        <>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">Title</label>
                                <textarea value={content.title} onChange={e => handleChange('title', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" rows={2} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">Subtitle</label>
                                <textarea value={content.subtitle} onChange={e => handleChange('subtitle', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" rows={2} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">CTA Text</label>
                                <input value={content.ctaText} onChange={e => handleChange('ctaText', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" />
                            </div>
                            <MediaPicker label="Background Image" value={content.backgroundImage} onChange={val => handleChange('backgroundImage', val)} />
                        </>
                    )}

                    {section.type === 'text-image' && (
                        <>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">Heading</label>
                                <input value={content.heading} onChange={e => handleChange('heading', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">Text Body</label>
                                <textarea value={content.text} onChange={e => handleChange('text', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" rows={4} />
                            </div>
                            <MediaPicker label="Main Image" value={content.image} onChange={val => handleChange('image', val)} />
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">Image Position</label>
                                <select value={content.imagePosition || 'left'} onChange={e => handleChange('imagePosition', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]">
                                    <option value="left">Left</option>
                                    <option value="right">Right</option>
                                </select>
                            </div>
                        </>
                    )}

                    {section.type === 'full-image' && (
                        <>
                            <MediaPicker label="High-Res Image" value={content.image} onChange={val => handleChange('image', val)} />
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">Overlay Caption (Optional)</label>
                                <input value={content.caption} onChange={e => handleChange('caption', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" />
                            </div>
                        </>
                    )}

                    {section.type === 'rich-text' && (
                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-2">Editor (Markdown/HTML Support)</label>
                            <textarea value={content.text} onChange={e => handleChange('text', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" rows={12} />
                        </div>
                    )}

                    {section.type === 'quote' && (
                        <>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">Quote Text</label>
                                <textarea value={content.text} onChange={e => handleChange('text', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" rows={3} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">Author</label>
                                <input value={content.author} onChange={e => handleChange('author', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" />
                            </div>
                        </>
                    )}

                    {section.type === 'video' && (
                        <>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">Video URL (MP4 / YouTube)</label>
                                <input value={content.videoUrl} onChange={e => handleChange('videoUrl', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" />
                            </div>
                            <MediaPicker label="Video Thumbnail" value={content.thumbnail} onChange={val => handleChange('thumbnail', val)} />
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-2">Label</label>
                                <input value={content.label} onChange={e => handleChange('label', e.target.value)} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" />
                            </div>
                        </>
                    )}

                    {section.type === 'spacer' && (
                        <div>
                            <label className="block text-xs uppercase text-gray-500 mb-2">Height (pixels)</label>
                            <input type="number" value={content.height || 60} onChange={e => handleChange('height', parseInt(e.target.value))} className="w-full bg-[#111] border border-white/10 p-3 text-white focus:outline-none focus:border-[#d8aa5b]" />
                        </div>
                    )}

                    {section.type === 'purchase' && (
                        <div className="text-center py-10 border border-dashed border-white/10">
                            <ShoppingBag className="mx-auto mb-4 text-[#d8aa5b]" size={32} />
                            <p className="text-white text-sm font-display">Purchase Interface</p>
                            <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-2 px-10">This block will automatically display the Buy/Add buttons for the current product.</p>
                        </div>
                    )}

                    {/* Section Background & Atmospheric Config */}
                    <div className="mt-12 pt-12 border-t border-white/5">
                        <h3 className="text-[#d8aa5b] text-xs uppercase tracking-[0.2em] mb-8 font-bold">Atmospheric Engine</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <MediaPicker
                                    label="Section Background (Override)"
                                    value={section.backgroundConfig?.url || ''}
                                    onChange={val => {
                                        const config = section.backgroundConfig || {};
                                        onSave({ ...section, backgroundConfig: { ...config, url: val, type: val.match(/\.(mp4|webm)$/) ? 'video' : 'image' } });
                                    }}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase text-gray-500 mb-2">Opacity ({section.backgroundConfig?.opacity ?? 1})</label>
                                        <input
                                            type="range" min="0" max="1" step="0.1"
                                            value={section.backgroundConfig?.opacity ?? 1}
                                            onChange={e => {
                                                const config = section.backgroundConfig || {};
                                                onSave({ ...section, backgroundConfig: { ...config, opacity: parseFloat(e.target.value) } });
                                            }}
                                            className="w-full accent-[#d8aa5b]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase text-gray-500 mb-2">Blur ({section.backgroundConfig?.blur ?? 0}px)</label>
                                        <input
                                            type="range" min="0" max="100" step="5"
                                            value={section.backgroundConfig?.blur ?? 0}
                                            onChange={e => {
                                                const config = section.backgroundConfig || {};
                                                onSave({ ...section, backgroundConfig: { ...config, blur: parseInt(e.target.value) } });
                                            }}
                                            className="w-full accent-[#d8aa5b]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-500 mb-2">Film Grain ({section.backgroundConfig?.grain ?? 0}%)</label>
                                    <input
                                        type="range" min="0" max="100" step="5"
                                        value={section.backgroundConfig?.grain ?? 0}
                                        onChange={e => {
                                            const config = section.backgroundConfig || {};
                                            onSave({ ...section, backgroundConfig: { ...config, grain: parseInt(e.target.value) } });
                                        }}
                                        className="w-full accent-[#d8aa5b]"
                                    />
                                </div>
                            </div>
                            <div className="bg-black/50 p-6 border border-white/5 rounded-sm flex flex-col justify-center">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-loose">
                                    The Atmospheric Engine allows you to set a cinematic backdrop for this specific section.
                                    Transitions between different backgrounded sections will automatically cross-fade for a fluid sensory experience.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-white/5">
                    <button onClick={onClose} className="text-white/40 hover:text-white px-4 py-2 transition-colors uppercase text-[10px] tracking-widest font-bold">Cancel</button>
                    <button onClick={() => onSave({ ...section, content })} className="bg-[#d8aa5b] text-black px-8 py-3 font-bold uppercase tracking-widest hover:bg-white rounded-sm transition-all shadow-[0_4px_20px_rgba(216,170,91,0.2)]">Save Changes</button>
                </div>
            </div>
        </div>
    );
}

export default function UniversalSectionBuilder({
    initialSections,
    onSave,
    onChange,
    isSaving = false
}: {
    initialSections: Section[];
    onSave: (sections: Section[]) => Promise<void>;
    onChange?: (sections: Section[]) => void;
    isSaving?: boolean;
}) {
    const [sections, setSections] = useState<Section[]>(initialSections || []);
    const [editingSection, setEditingSection] = useState<Section | null>(null);

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
        if (confirm("Delete this block?")) {
            setSections(sections.filter(s => s.id !== id));
        }
    };

    const addNewSection = (type: SectionType) => {
        const defaultContent: Record<string, any> = {
            hero: { title: "New Hero", subtitle: "Enter details", ctaText: "Explore", ctaLink: "/collection" },
            'text-image': { heading: "New Story", text: "Long description...", imagePosition: "left" },
            'rich-text': { text: "Main content..." },
            video: { videoUrl: "", thumbnail: "", label: "Watch Ritual" },
            quote: { text: "Wise words...", author: "SØMNUS" },
            spacer: { height: 60 }
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
                <button onClick={() => addNewSection('hero')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-sm border border-white/10 transition-colors">
                    <Layout size={12} /> + Hero
                </button>
                <button onClick={() => addNewSection('text-image')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-sm border border-white/10 transition-colors">
                    <ImageIcon size={12} /> + Story
                </button>
                <button onClick={addNewFullImage} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-[#d8aa5b]/10 hover:bg-[#d8aa5b]/20 text-[#d8aa5b] px-4 py-2 rounded-sm border border-[#d8aa5b]/20 transition-colors">
                    <ImageIcon size={12} /> + Full Image Block
                </button>
                <button onClick={() => addNewSection('rich-text')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-sm border border-white/10 transition-colors">
                    <Type size={12} /> + Content
                </button>
                <button onClick={() => addNewSection('video')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-sm border border-white/10 transition-colors">
                    <Video size={12} /> + Video
                </button>
                <button onClick={() => addNewSection('quote')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-sm border border-white/10 transition-colors">
                    <Quote size={12} /> + Quote
                </button>
                <button onClick={() => addNewSection('spacer')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-sm border border-white/10 transition-colors">
                    <Layout size={12} /> + Spacer
                </button>
                <button onClick={() => addNewSection('purchase')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-[#d8aa5b]/10 hover:bg-[#d8aa5b]/20 text-[#d8aa5b] px-4 py-2 rounded-sm border border-[#d8aa5b]/20 transition-colors">
                    <ShoppingBag size={12} /> + Purchase Block
                </button>
                <div className="h-6 w-[1px] bg-white/10 mx-2" />
                <button
                    onClick={() => {
                        const items = JSON.parse(localStorage.getItem('somnus-section-clipboard') || '[]');
                        if (items.length === 0) return alert('Library is empty');
                        setSections([...sections, ...items]);
                    }}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-sm border border-yellow-500/20 transition-colors"
                >
                    <Plus size={12} /> Paste from Library ({JSON.parse(localStorage.getItem('somnus-section-clipboard') || '[]').length})
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
                        No sections added yet. Start by adding a Hero block.
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-8 mt-12 border-t border-white/5">
                <button
                    onClick={() => onSave(sections)}
                    disabled={isSaving}
                    className="bg-[#d8aa5b] text-black px-10 py-4 font-bold uppercase tracking-widest hover:bg-white disabled:opacity-50 transition-all rounded-sm shadow-xl"
                >
                    {isSaving ? "Saving..." : "Publish Page Layout"}
                </button>
            </div>

            {editingSection && (
                <EditModal section={editingSection} onClose={() => setEditingSection(null)} onSave={handleUpdateSection} />
            )}
        </div>
    );
}
