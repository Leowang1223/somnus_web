import { getHomeLayout } from "@/lib/db";
import SectionRenderer from "@/components/sections/SectionRenderer";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
    const layout = await getHomeLayout();

    // Ensure sections exist, fallback to empty array
    const sections = layout?.sections || [];

    return (
        <main className="min-h-screen relative flex flex-col">
            <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
                <SectionRenderer sections={sections} />
            </Suspense>
        </main>
    );
}
