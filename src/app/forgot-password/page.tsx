import Link from "next/link";
import { getSetting } from "@/app/actions/settings";
import { ShieldAlert, MessageCircle, ArrowLeft } from "lucide-react";

export default async function ForgotPasswordPage() {
  const waResult = await getSetting("admin_whatsapp");
  const waNumbers = waResult.value 
    ? waResult.value.split(",").map(n => n.trim()).filter(Boolean) 
    : ["081388058331"];

  return (
    <div className="dark min-h-screen bg-[#13111C] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium organic background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[60%] bg-[radial-gradient(circle,rgba(16,185,129,0.06)_0%,transparent_75%)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-[radial-gradient(circle,rgba(20,184,166,0.04)_0%,transparent_75%)] blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl p-8 sm:p-10 rounded-[32px] shadow-[0_24px_50px_rgba(0,0,0,0.35)] flex flex-col items-center text-center animate-fade-in fade-in">
        
        <div className="w-16 h-16 bg-amber-500/10 rounded-[22px] border border-amber-500/20 flex items-center justify-center mb-6">
           <ShieldAlert className="w-8 h-8 text-amber-400" />
        </div>

        <h2 className="text-2xl font-black text-white mb-4 tracking-tight uppercase">LUPA KATA SANDI?</h2>
        
        <p className="text-xs text-gray-400 mb-8 leading-relaxed max-w-[280px]">
           Demi keamanan akun Anda, silakan hubungi <strong className="text-gray-300">Admin FinTrack</strong> melalui WhatsApp untuk melakukan verifikasi identitas dan reset kata sandi Anda.
        </p>

        <div className="w-full space-y-3 mb-8">
           {waNumbers.map((num, idx) => (
              <a
                key={idx}
                href={`https://wa.me/${num.replace(/^0/, "62")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3.5 px-4 rounded-2xl flex justify-center items-center gap-3 font-bold text-sm transition-all shadow-[0_8px_25px_rgba(16,185,129,0.25)] hover:brightness-110 active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5" />
                HUBUNGI ADMIN WHATSAPP {waNumbers.length > 1 ? idx + 1 : ""}
              </a>
           ))}
        </div>

        <Link href="/login" className="text-xs font-bold text-gray-500 hover:text-emerald-400 flex items-center gap-2 transition-colors">
           <ArrowLeft className="w-3 h-3" />
           Kembali ke Halaman Login
        </Link>
      </div>

      <div className="absolute bottom-8 text-white/20 text-[9px] font-bold uppercase tracking-[0.2em]">
         LACAK KEUANGAN, AMANKAN MASA DEPAN
      </div>
    </div>
  );
}
