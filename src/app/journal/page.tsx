
import { getArticles } from "@/lib/db";
import JournalListClient from "./JournalListClient";


export default async function JournalPage() {
    const articles = await getArticles();

    return (
        <main className="min-h-screen pt-28 md:pt-32 px-4 md:px-6 pb-20 bg-[#050505]">
            <div className="container mx-auto">
                <JournalListClient initialArticles={articles} />
            </div>
        </main>
    );
}
