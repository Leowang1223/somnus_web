'use client';

import { Section } from "@/types/cms";
import UniversalSectionBuilder from "@/components/admin/UniversalSectionBuilder";
import { updateArticleSectionsAction } from "@/app/actions";
import { useState } from "react";

export default function ArticleBuilderClient({ id, initialSections }: { id: string, initialSections: Section[] }) {
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (sections: Section[]) => {
        setIsSaving(true);
        try {
            await updateArticleSectionsAction(id, sections);
            alert("Article Published Successfully.");
        } catch (e) {
            alert("Error saving layout.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <UniversalSectionBuilder
            initialSections={initialSections}
            onSave={handleSave}
            isSaving={isSaving}
        />
    );
}
