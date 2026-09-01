import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUsers } from "@/app/actions/user";
import UsersClientPage from "./UsersClientPage";

export default async function UsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isSuperAdmin = (session?.user as any)?.role === "SUPERADMIN" || session?.user?.email === "bokal@gmail.com";

  if (!isSuperAdmin) {
    redirect("/dashboard");
  }

  const result = await getUsers();
  const initialUsers = result.success ? result.data : [];

  return <UsersClientPage initialUsers={initialUsers} currentUser={session?.user} />;
}
