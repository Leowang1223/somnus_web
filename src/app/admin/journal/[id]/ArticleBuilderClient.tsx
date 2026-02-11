'use client';

import { Section } from "@/types/cms";
import UniversalSectionBuilder from "@/components/admin/UniversalSectionBuilder";
import { updateArticleSectionsAction, updateArticleMetadataAction } from "@/app/actions";
import { useState } from "react";

export default function ArticleBuilderClient({ id, initialSections, article }: { id: string, initialSections: Section[], article: any }) {
    const [isSaving, setIsSaving] = useState(false);
    const [sections, setSections] = useState<Section[]>(initialSections);
    const [meta, setMeta] = useState(article);

    const handleSave = async (publishedSections: Section[]) => {
        setIsSaving(true);
        try {
            await updateArticleSectionsAction(id, publishedSections);
            await updateArticleMetadataAction(id, meta);
            alert("文章內容與基本資料已成功發佈。");
        } catch (e) {
            alert("儲存時出錯。");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <UniversalSectionBuilder
            initialSections={initialSections}
            onSave={handleSave}
            isSaving={isSaving}
            onChange={setSections}
            metadata={meta}
            onMetadataChange={setMeta}
        />
    );
}
