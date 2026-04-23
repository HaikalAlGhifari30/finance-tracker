import { GlassCard } from "@/components/ui/GlassCard";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
        <p className="text-gray-600">Overview sistem manajemen keuangan.</p>
      </div>

      <GlassCard className="p-8 text-center min-h-[300px] flex items-center justify-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Selamat datang, SuperAdmin!</h3>
          <p className="text-gray-600">Anda dapat beralih ke menu <b>Kelola User</b> untuk melihat daftar pengguna sistem.</p>
        </div>
      </GlassCard>
    </div>
  );
}
