"use client";

import { useState, useTransition } from "react";
import { X, Loader2, Target, DollarSign, Trophy } from "lucide-react";
import { addGoal, updateGoal } from "@/app/actions/goals";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export default function GoalModal({ isOpen, onClose, initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setTargetAmount(Number(initialData.targetAmount).toLocaleString("id-ID"));
    } else {
      setName("");
      setTargetAmount("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(targetAmount.replace(/\D/g, ""));
    if (!cleanAmount || isNaN(cleanAmount)) {
      toast.error("Target nominal tidak valid");
      return;
    }

    startTransition(async () => {
      const res = initialData 
        ? await updateGoal(initialData.id, name, cleanAmount)
        : await addGoal(name, cleanAmount);
        
      if (res.error) {
        toast.error(res.error);
      } else {
        setName("");
        setTargetAmount("");
        toast.success(initialData ? "Goal berhasil diperbarui!" : "Goal baru berhasil ditambahkan!");
        onClose();
      }
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val) {
      setTargetAmount(parseInt(val, 10).toLocaleString("id-ID"));
    } else {
      setTargetAmount("");
    }
  };

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[10px] animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-[#1E1E2D] rounded-[40px] shadow-[0_30px_70px_rgba(0,0,0,0.4)] overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
        <div className="px-10 py-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-amber-50/50 dark:bg-amber-900/10">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-2xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight">{initialData ? 'Edit Goal' : 'Tambah Goal'}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{initialData ? 'Perbarui Target Finansial Anda' : 'Tentukan Target Finansial Anda'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 text-left">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Nama Goal / Tujuan</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="cth: Tabungan Nikah, Beli HP, Dana Darurat..."
                  className="w-full pl-12 pr-6 py-5 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-sm shadow-sm"
                />
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Target Nominal (Rp)</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={targetAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="w-full pl-12 pr-6 py-5 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all font-black text-xl text-amber-600 shadow-sm"
                />
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-5 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 font-black text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95 text-[11px] uppercase tracking-widest"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-[1.5] bg-amber-500 hover:bg-amber-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-amber-500/20 disabled:opacity-70 transition-all active:scale-95 flex items-center justify-center text-[11px] uppercase tracking-widest"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData ? "Simpan Perubahan" : "Simpan Goal")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
