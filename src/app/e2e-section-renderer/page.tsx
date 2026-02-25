import SectionRenderer from "@/components/sections/SectionRenderer";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function SectionRendererRegressionPage() {
    if (process.env.NODE_ENV === 'production') {
        notFound();
    }

    const sections: any[] = [
        {
            id: "bad-type-hero",
            type: { en: "hero", zh: "hero", jp: "hero", ko: "hero" },
            isEnabled: true,
            content: {
                title: { en: "Regression Hero", zh: "Regression Hero", jp: "Regression Hero", ko: "Regression Hero" },
                subtitle: { en: "Should not crash on object section.type", zh: "Should not crash on object section.type", jp: "Should not crash on object section.type", ko: "Should not crash on object section.type" },
                ctaText: { en: "Open", zh: "Open", jp: "Open", ko: "Open" },
                ctaLink: "/",
                textAlign: "center",
                backgroundImages: [],
            },
        },
        {
            id: "bad-type-quote",
            type: { en: "quote", zh: "quote", jp: "quote", ko: "quote" },
            isEnabled: true,
            content: {
                text: { en: "Localized object payload in runtime section metadata should be tolerated.", zh: "Localized object payload in runtime section metadata should be tolerated.", jp: "Localized object payload in runtime section metadata should be tolerated.", ko: "Localized object payload in runtime section metadata should be tolerated." },
                author: { en: "E2E", zh: "E2E", jp: "E2E", ko: "E2E" },
                textAlign: "center",
            },
        },
    ];

    return (
        <main className="min-h-screen bg-[#050505] pt-24">
            <div className="px-6 py-4 text-white/70 text-sm">E2E SectionRenderer regression harness</div>
            <SectionRenderer sections={sections as any} showNav={true} noSnap={true} />
        </main>
    );
}
