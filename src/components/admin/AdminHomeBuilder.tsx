'use client';

import { Section } from "@/types/cms";
import UniversalSectionBuilder from "./UniversalSectionBuilder";
import { updateHomeLayoutAction } from "@/app/actions";
import { useState } from "react";

export default function AdminHomeBuilder({ initialSections }: { initialSections: Section[] }) {
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (sections: Section[]) => {
        setIsSaving(true);
        try {
            await updateHomeLayoutAction(sections);
            alert("首頁已成功發佈。");
        } catch (e) {
            alert("儲存佈局時出錯。");
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
