'use client';

import { Section } from "@/types/cms";
import UniversalSectionBuilder from "@/components/admin/UniversalSectionBuilder";
import SectionRenderer from "@/components/sections/SectionRenderer";
import { updateProductSectionsAction, updateProductMetadataAction } from "@/app/actions";
import { useState } from "react";
import { Eye, Monitor, Smartphone, Globe, ChevronLeft } from "lucide-react";
import Link from 'next/link';
import { useAuth } from "@/context/AuthContext";

export default function ProductBuilderClient({ id, initialSections, product }: { id: string, initialSections: Section[], product: any }) {
    const { isOwner } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [sections, setSections] = useState<Section[]>(initialSections);
    const [meta, setMeta] = useState(product);
    const [isLiveStudio, setIsLiveStudio] = useState(false);
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

    const handleSave = async (publishedSections: Section[]) => {
        setIsSaving(true);
        try {
            await updateProductSectionsAction(id, publishedSections);
            await updateProductMetadataAction(id, meta);
            alert("產品資料與佈局已成功同步發佈。");
        } catch (e) {
            alert("儲存時出錯。");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={`transition-all duration-700 ${isLiveStudio ? 'fixed inset-0 z-[200] bg-[#050505] overflow-hidden flex flex-col' : ''}`}>
            {/* Studio Toolbar */}
            <div className={`flex justify-between items-center bg-[#0a0a09] border-b border-white/10 ${isLiveStudio ? 'p-4' : 'mb-8'}`}>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsLiveStudio(!isLiveStudio)}
                        className={`flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm ${isLiveStudio ? 'bg-[#d8aa5b] text-black shadow-[0_0_20px_rgba(216,170,91,0.3)]' : 'bg-white/5 text-white/50 hover:text-white'}`}
                    >
                        <Eye size={14} /> {isLiveStudio ? '退出工作室' : '實時工作室模式'}
                    </button>

                    {isLiveStudio && (
                        <div className="flex bg-black/50 p-1 rounded-sm border border-white/5">
                            <button onClick={() => setPreviewDevice('desktop')} className={`p-2 transition-colors ${previewDevice === 'desktop' ? 'text-[#d8aa5b]' : 'text-white/20'}`}><Monitor size={14} /></button>
                            <button onClick={() => setPreviewDevice('mobile')} className={`p-2 transition-colors ${previewDevice === 'mobile' ? 'text-[#d8aa5b]' : 'text-white/20'}`}><Smartphone size={14} /></button>
                        </div>
                    )}
                </div>

                {isLiveStudio && (
                    <span className="text-gray-500 text-[10px] uppercase tracking-[0.4em] font-display">SØMNUS 實時工作室</span>
                )}
            </div>

            <div className={`flex flex-1 overflow-hidden ${isLiveStudio ? '' : 'flex-col'}`}>
                {/* Editor Pane */}
                <div className={`transition-all duration-700 ${isLiveStudio ? 'w-1/3 border-r border-white/10 overflow-y-auto p-8 custom-scrollbar' : 'w-full'}`}>
                    <UniversalSectionBuilder
                        initialSections={sections}
                        onSave={handleSave}
                        isSaving={isSaving}
                        onChange={setSections}
                        metadata={meta}
                        onMetadataChange={setMeta}
                        isOwner={isOwner}
                    />
                </div>

                {/* Preview Pane */}
                {isLiveStudio && (
                    <div className="flex-1 bg-[#000] overflow-hidden flex flex-col items-center justify-center relative p-12">
                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat"></div>

                        <div className={`bg-[#050505] shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/5 transition-all duration-700 overflow-y-auto h-full ${previewDevice === 'mobile' ? 'w-[375px] max-h-[812px] rounded-[40px] border-[8px] border-[#111]' : 'w-full h-full'}`}>
                            <SectionRenderer sections={sections} productContext={meta} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
