"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { X, Loader2, CreditCard, Calendar, Tag, FileText, Banknote, Award, Wallet, Target, Trophy, ChevronDown } from "lucide-react";
import { updateExpense, addExpense } from "@/app/actions/expenses";
import { createPortal } from "react-dom";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: any;
  categories: any[];
  goals: any[];
}

const isSaving = (name?: string) => name?.toLowerCase() === "tabungan";

export default function ExpenseModal({ isOpen, onClose, mode, initialData, categories, goals }: Props) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
  });
  const [source, setSource] = useState("MAIN");
  const [goalId, setGoalId] = useState("");
  const [mounted, setMounted] = useState(false);

  // Custom Dropdown State
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const sourceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setAmount(initialData.amount.toLocaleString("id-ID"));
        setDescription(initialData.description || "");
        setCategoryId(initialData.categoryId || "");
        setDate(new Date(initialData.date).toISOString().split('T')[0]);
        setSource(initialData.source || "MAIN");
        setGoalId(initialData.goalId || "");
      } else {
        setAmount("");
        setDescription("");
        setCategoryId(categories[0]?.id || "");
        const now = new Date();
        const offset = now.getTimezoneOffset();
        setDate(new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]);
        setSource("MAIN");
        setGoalId("");
      }
    }
  }, [isOpen, mode, initialData, categories]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) {
        setIsSourceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Constraints Logic
  const selectedCategory = categories.find(c => c.id === categoryId);
  const isSavingSelected = isSaving(selectedCategory?.name);

  useEffect(() => {
    if (isSavingSelected) {
      setSource("MAIN");
    }
  }, [isSavingSelected]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(amount.replace(/\D/g, ""));
    if (!cleanAmount || isNaN(cleanAmount)) {
      toast.error("Jumlah tidak valid");
      return;
    }

    startTransition(async () => {
      const res = mode === "create"
        ? await addExpense(cleanAmount, categoryId, description, date, source, isSavingSelected ? goalId : undefined)
        : await updateExpense(initialData.id, cleanAmount, categoryId, description, date, source, isSavingSelected ? goalId : undefined);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(mode === "create" ? "Pengeluaran berhasil dicatat" : "Data berhasil diupdate");
        onClose();
      }
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val) {
      setAmount(parseInt(val, 10).toLocaleString("id-ID"));
    } else {
      setAmount("");
    }
  };

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 text-left">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[12px] animate-in fade-in duration-500" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-[#1E1E2D] rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
        <div className="px-10 py-10 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-[24px] transition-all duration-500 shadow-lg ${isSavingSelected ? 'bg-amber-500 text-white shadow-amber-500/20 rotate-12' : 'bg-orange-500 text-white shadow-orange-500/20'}`}>
              {isSavingSelected ? <Award className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-black text-2xl text-gray-900 dark:text-gray-100 tracking-tight">
                {mode === "create" ? "Catat Transaksi" : "Edit Transaksi"}
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Sistem Keuangan Terpadu</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl">
            <X className="w-7 h-7" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Jumlah Nominal (Rp)</label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  autoFocus
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="w-full pl-16 pr-8 py-6 rounded-[32px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-orange-500/50 transition-all font-black text-3xl text-orange-600 shadow-inner group-hover:border-orange-200 dark:group-hover:border-orange-800"
                />
                <Banknote className="absolute left-6 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-300 group-hover:text-orange-400 transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Custom Source Dropdown */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Sumber Dana</label>
                <div className="relative" ref={sourceRef}>
                  <button
                    type="button"
                    disabled={isSavingSelected}
                    onClick={() => setIsSourceOpen(!isSourceOpen)}
                    className={`w-full h-[68px] flex items-center justify-between px-5 rounded-[28px] border-2 transition-all font-black text-[13px] disabled:opacity-70 ${isSourceOpen
                        ? 'border-orange-500 shadow-xl bg-white dark:bg-[#1E1E2D]'
                        : source === "SAVINGS"
                          ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40 text-amber-600 shadow-sm shadow-amber-500/5'
                          : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-2 h-full">
                      <div className={`flex-shrink-0 flex items-center justify-center p-2.5 rounded-2xl transition-colors ${source === 'SAVINGS' ? 'bg-amber-100 dark:bg-amber-800/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        {source === "MAIN" ? (
                          <Wallet className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <Trophy className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                      <span className="leading-none tracking-tight uppercase text-[10px] sm:text-[11px] font-black whitespace-nowrap min-w-0">{source === "MAIN" ? "Saldo Utama" : "Tabungan"}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isSourceOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSourceOpen && !isSavingSelected && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#2A2A3C] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-[99] animate-in fade-in zoom-in-95 duration-200">
                      <button
                        type="button"
                        onClick={() => { setSource("MAIN"); setIsSourceOpen(false); }}
                        className={`w-full flex items-center gap-3 px-6 py-4 text-sm font-bold transition-colors ${source === 'MAIN' ? 'bg-orange-50 dark:bg-orange-900/10 text-orange-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        <Wallet className={`w-5 h-5 ${source === 'MAIN' ? 'text-orange-500' : 'text-gray-400'}`} />
                        Saldo Utama
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSource("SAVINGS"); setIsSourceOpen(false); }}
                        className={`w-full flex items-center gap-3 px-6 py-4 text-sm font-bold transition-colors ${source === 'SAVINGS' ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        <Trophy className={`w-5 h-5 ${source === 'SAVINGS' ? 'text-amber-500' : 'text-gray-400'}`} />
                        Tabungan
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Kategori</label>
                <div className="relative group">
                  <select
                    value={categoryId}
                    required
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      const newCat = categories.find(c => c.id === newCatId);
                      if (source === "SAVINGS" && isSaving(newCat?.name)) {
                        toast.error("Pengeluaran dari tabungan tidak boleh kategori Tabungan");
                        return;
                      }
                      setCategoryId(newCatId);
                    }}
                    className={`w-full pl-12 pr-8 py-5 rounded-[24px] border-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer font-bold text-sm ${isSavingSelected ? 'border-amber-500/50 text-amber-600' : 'border-gray-100 dark:border-gray-800'
                      }`}
                  >
                    {categories.map(cat => (
                      <option
                        key={cat.id}
                        value={cat.id}
                        disabled={source === "SAVINGS" && isSaving(cat.name)}
                        className={isSaving(cat.name) ? "text-amber-600 font-bold bg-amber-50" : ""}
                      >
                        {cat.name} {isSaving(cat.name) ? "✨" : ""}
                      </option>
                    ))}
                  </select>
                  {isSavingSelected ? (
                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 pointer-events-none" />
                  ) : (
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  )}
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {isSavingSelected && (
              <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
                <label className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] px-1">Tujuan Tabungan (Opsional)</label>
                <div className="relative group">
                  <select
                    value={goalId}
                    onChange={(e) => setGoalId(e.target.value)}
                    className="w-full pl-12 pr-8 py-5 rounded-[24px] border-2 border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer font-black text-sm shadow-lg shadow-amber-500/5"
                  >
                    <option value="">Pilih Goal (Umum)</option>
                    {goals.map(goal => (
                      <option key={goal.id} value={goal.id}>{goal.name} (Rp {Number(goal.targetAmount).toLocaleString("id-ID")})</option>
                    ))}
                  </select>
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 pointer-events-none" />
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Tanggal</label>
                <div className="relative group">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-12 pr-8 py-5 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-orange-500/50 transition-all font-bold text-sm group-hover:border-orange-200 dark:group-hover:border-orange-800"
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Keterangan</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Opsional..."
                    className="w-full pl-12 pr-8 py-5 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-orange-500/50 transition-all font-medium text-sm group-hover:border-orange-200 dark:group-hover:border-orange-800"
                  />
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-6 rounded-[28px] border-2 border-gray-100 dark:border-gray-800 font-black text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95 text-[11px] uppercase tracking-[0.2em]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-[1.5] bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-[28px] shadow-2xl shadow-emerald-500/30 disabled:opacity-70 transition-all active:scale-95 flex items-center justify-center text-[11px] uppercase tracking-[0.2em]"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === "create" ? "Konfirmasi" : "Simpan Perubahan")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
