import Link from "next/link";
import { getSetting } from "@/app/actions/settings";
import { ShieldAlert, MessageCircle, ArrowLeft } from "lucide-react";

export default async function ForgotPasswordPage() {
  const waResult = await getSetting("admin_whatsapp");
  const waNumbers = waResult.value 
    ? waResult.value.split(",").map(n => n.trim()).filter(Boolean) 
    : ["081388058331"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 flex items-center justify-center p-4">
       <div className="w-full max-w-md bg-white dark:bg-[#1E1E2D] rounded-[32px] shadow-2xl p-8 flex flex-col items-center text-center animate-fade-in fade-in">
          
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-6">
             <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">LUPA KATA SANDI?</h2>
          
          <p className="text-sm text-gray-500 mb-8 leading-relaxed px-4">
             Demi keamanan akun Anda, silakan hubungi <strong className="text-gray-700">Admin Sistem Keuangan</strong> melalui WhatsApp untuk melakukan verifikasi identitas dan reset kata sandi Anda.
          </p>

          <div className="w-full space-y-3 mb-8">
             {waNumbers.map((num, idx) => (
                <a
                  key={idx}
                  href={`https://wa.me/${num.replace(/^0/, "62")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-3.5 px-4 rounded-2xl flex justify-center items-center gap-3 font-bold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  <MessageCircle className="w-5 h-5" />
                  HUBUNGI ADMIN WHATSAPP {waNumbers.length > 1 ? idx + 1 : ""}
                </a>
             ))}
          </div>

          <Link href="/login" className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-2 transition-colors">
             <ArrowLeft className="w-3 h-3" />
             Kembali ke Halaman Login
          </Link>
       </div>

       <div className="absolute bottom-8 text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">
          SISTEM KEUANGAN
       </div>
    </div>
  );
}
