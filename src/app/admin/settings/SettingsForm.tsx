"use client";

import { useState } from "react";
import { Loader2, Save, Phone, X, Plus } from "lucide-react";
import { updateSetting } from "@/app/actions/settings";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { GlassCard } from "@/components/ui/GlassCard";

interface SettingsFormProps {
  initialWaNumber: string;
}

export default function SettingsForm({ initialWaNumber }: SettingsFormProps) {
  const [waNumbers, setWaNumbers] = useState<string[]>(() => {
    const split = initialWaNumber.split(",").map(n => n.trim()).filter(Boolean);
    return split.length > 0 ? split : ["081388058331"];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [successMsg, setSuccessMsg] = useState("");

  const handleAddNumber = () => {
    setWaNumbers([...waNumbers, ""]);
  };

  const handleRemoveNumber = (index: number) => {
    if (waNumbers.length <= 1) {
      setErrors({ [index]: "Minimal harus ada satu nomor WhatsApp" });
      setTimeout(() => setErrors({}), 3000);
      return;
    }
    const newNumbers = [...waNumbers];
    newNumbers.splice(index, 1);
    setWaNumbers(newNumbers);
    
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const handleNumberChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const newNumbers = [...waNumbers];
    newNumbers[index] = numericValue;
    setWaNumbers(newNumbers);

    if (numericValue.trim()) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const handleSave = async () => {
    setShowConfirm(false);
    
    const currErrors: Record<number, string> = {};
    waNumbers.forEach((num, idx) => {
      if (!num.trim()) {
        currErrors[idx] = "nomor harus diisi";
      }
    });

    if (Object.keys(currErrors).length > 0) {
      setErrors(currErrors);
      return;
    }

    const cleanedWa = waNumbers.map(n => n.trim()).filter(Boolean);

    setIsLoading(true);
    setSuccessMsg("");
    try {
      const waResult = await updateSetting("admin_whatsapp", cleanedWa.join(","));
      if (waResult.success) {
        setSuccessMsg("Nomor WhatsApp berhasil disimpan!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <GlassCard className="p-8 border-none shadow-xl shadow-gray-200/50 dark:shadow-none space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100 dark:border-gray-800/50">
          <div className="p-3.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
            <Phone className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Bantuan WhatsApp</h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Konfigurasi nomor darurat untuk bantuan akses akun.</p>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 rounded-2xl text-sm font-bold border border-emerald-100/50 dark:border-emerald-800/20 animate-in zoom-in-95 duration-300">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {successMsg}
             </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">
              Daftar Kontak Admin
            </label>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
              {waNumbers.length} Kontak
            </span>
          </div>

          <div className="space-y-4">
            {waNumbers.map((num, idx) => (
              <div key={idx} className="group space-y-2 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                      <span className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-tighter">WA {idx + 1}</span>
                      <div className="w-px h-3 bg-gray-100 dark:bg-gray-800" />
                    </div>
                    <input
                      type="tel"
                      value={num}
                      onChange={(e) => handleNumberChange(idx, e.target.value)}
                      placeholder="8123456789"
                      className={`w-full rounded-2xl border-2 transition-all pl-16 pr-4 py-4 text-sm font-bold tracking-wide shadow-sm ${
                        errors[idx] 
                          ? "border-rose-100 bg-rose-50/30 text-rose-600 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10" 
                          : "border-gray-50 dark:border-gray-800 bg-white dark:bg-[#13111C] text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveNumber(idx)}
                    className="p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-900/10 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all active:scale-95 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-rose-500/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {errors[idx] && (
                  <p className="text-[10px] font-black text-rose-500 px-4 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <span className="w-1 h-1 bg-rose-500 rounded-full" />
                    {errors[idx]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddNumber}
            className="flex items-center gap-2 text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-5 py-3 rounded-xl transition-all active:scale-95 w-fit"
          >
            <Plus className="h-4 w-4" />
            TAMBAH NOMOR BARU
          </button>
        </div>

        <div className="pt-6 border-t border-gray-50 dark:border-gray-800/50">
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={isLoading}
            className="group relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 px-8 py-4 text-sm font-black text-white disabled:opacity-50 transition-all shadow-xl shadow-emerald-500/20 w-full active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 h-5 group-hover:scale-110 transition-transform" />}
            SIMPAN PENGATURAN GLOBAL
          </button>
        </div>
      </GlassCard>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Simpan Pengaturan"
        message="Apakah Anda yakin ingin menyimpan perubahan nomor WhatsApp bantuan ini?"
        confirmLabel="Ya, Simpan"
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
