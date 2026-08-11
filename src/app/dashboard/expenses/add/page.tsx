import { GlassCard } from "@/components/ui/GlassCard";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ExpenseForm } from "./ExpenseForm";

export default async function AddExpensePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/");

  const userCats = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, session.user.id))
    .orderBy(categories.name);

  return (
    <div className="space-y-6 animate-fade-in fade-in max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Catat Pengeluaran</h2>
        <p className="text-gray-600">Masukkan total pengeluaran per hari untuk tiap kategori.</p>
      </div>

      <GlassCard className="p-6 md:p-8">
        <ExpenseForm categories={userCats} />
      </GlassCard>
    </div>
  );
}
