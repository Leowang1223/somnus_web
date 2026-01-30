
import { getArticles } from "@/lib/db";
import JournalListClient from "./JournalListClient";

export const dynamic = 'force-dynamic';

export default async function JournalPage() {
    const articles = await getArticles();

    return (
        <main className="min-h-screen pt-32 px-6 pb-20 bg-[#050505]">
            <div className="container mx-auto">
                <header className="mb-20">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-[1px] bg-[#d8aa5b]"></div>
                        <span className="text-[#d8aa5b] text-xs tracking-widest uppercase">Sleep Journal</span>
                    </div>
                    <h1 className="font-display text-5xl md:text-7xl text-white max-w-3xl leading-none">
                        The Science of <br /> <span className="opacity-50 italic">Sanctuary.</span>
                    </h1>
                </header>

                <JournalListClient initialArticles={articles} />
            </div>
        </main>
    );
}
