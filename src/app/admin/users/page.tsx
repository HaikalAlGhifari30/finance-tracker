import { db } from "@/db";
import { user } from "@/db/schema";
import UsersClientPage from "./UsersClientPage";
import { desc } from "drizzle-orm";

export default async function AdminUsersPage() {
  // Fetch users from database
  const usersList = await db.select().from(user).orderBy(desc(user.createdAt));

  return (
    <div className="w-full pb-20">
      <UsersClientPage users={usersList} />
    </div>
  );
}
