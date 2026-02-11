
import { getHomeLayout } from "@/lib/db";
import AdminHomeBuilder from "@/components/admin/AdminHomeBuilder";

export default async function AdminHomePage() {
    const layout = await getHomeLayout();
    // Ensure sections exist, fallback to empty array
    const sections = layout?.sections || [];

    return (
        <div>
            <header className="mb-12">
                <h1 className="font-display text-4xl text-white mb-2">首頁佈局</h1>
                <p className="text-gray-500 text-sm">拖放區塊以組成劇院級體驗。</p>
            </header>

            <div className="bg-[#111] border border-white/5 p-8 rounded-sm max-w-4xl">
                <AdminHomeBuilder initialSections={sections} />
            </div>
        </div>
    );
}
