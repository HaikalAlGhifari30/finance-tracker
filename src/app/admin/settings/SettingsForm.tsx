"use client";

import { useState } from "react";
import { Loader2, Save, Phone, X, Plus } from "lucide-react";
import { updateSetting } from "@/app/actions/settings";
import { ConfirmDialog } from "@/components/ConfirmDialog";

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
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bantuan Lupa Password</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Atur daftar nomor WhatsApp admin bantuan</p>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-bold border border-emerald-100 dark:border-emerald-800/50">
             {successMsg}
          </div>
        )}

        <div className="space-y-4">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Daftar Nomor WhatsApp Admin
          </label>

          <div className="space-y-4">
            {waNumbers.map((num, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">WA {idx + 1}</span>
                    <input
                      type="tel"
                      value={num}
                      onChange={(e) => handleNumberChange(idx, e.target.value)}
                      placeholder="Contoh: 081388058331"
                      className={`w-full rounded-xl border ${errors[idx] ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 pl-14 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveNumber(idx)}
                    className="p-3 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {errors[idx] && (
                  <p className="text-[10px] font-bold text-red-500 px-2 italic">*{errors[idx]}</p>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddNumber}
            className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1"
          >
            <Plus className="h-4 w-4" />
            Tambah Nomor Lainnya
          </button>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-50 transition-all shadow-md w-full md:w-auto"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Perubahan
          </button>
        </div>
      </div>

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
