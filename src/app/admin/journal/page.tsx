
import { getArticles } from "@/lib/db";
import AdminJournalClient from "./AdminJournalClient";

export const dynamic = 'force-dynamic';

export default async function AdminJournalPage() {
    const articles = await getArticles();

    return (
        <div>
            <header className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="font-display text-4xl text-white mb-2">Journal</h1>
                    <p className="text-gray-500 text-sm">Curate scientific and ritual content.</p>
                </div>
            </header>

            <AdminJournalClient initialArticles={articles} />
        </div>
    );
}
