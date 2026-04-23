import { GlassCard } from "@/components/ui/GlassCard";
import { db } from "@/db";
import { user } from "@/db/schema";
import { sql } from "drizzle-orm";
import { Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [userResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(user)
    .execute();
  
  const totalUsers = userResult?.count || 0;

  return (
    <div className="space-y-10 animate-fade-in text-left">
      <div>
        <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Sistem manajemen dan pengawasan keuangan terpusat.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/users" className="group">
          <GlassCard className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-500/20 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
              <Users className="w-24 h-24" />
            </div>
            
            <div className="relative z-10">
              <div className="p-3 bg-white/20 rounded-2xl w-fit mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-blue-100 text-[11px] font-black uppercase tracking-[0.2em] mb-1">Total Pengguna Sistem</p>
              <h3 className="text-5xl font-black tracking-tighter mb-6">{totalUsers} <span className="text-lg font-medium opacity-60">Pengguna</span></h3>
              
              <div className="flex items-center gap-2 text-[10px] font-black bg-white/20 w-fit px-5 py-2.5 rounded-xl backdrop-blur-md">
                Kelola Pengguna <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
