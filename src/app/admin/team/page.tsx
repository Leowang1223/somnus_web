import { getUsersAction } from "@/app/actions";
import AdminTeamClient from "./AdminTeamClient";

export default async function AdminTeamPage() {
    const response = await getUsersAction();
    const users = response.users || [];
    return <AdminTeamClient initialUsers={users} />;
}
