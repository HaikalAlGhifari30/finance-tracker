"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { X, Loader2, CreditCard, Calendar, Tag, FileText, Banknote, Award, Wallet, Target, Trophy, ChevronDown } from "lucide-react";
import { addTransaction, updateTransaction } from "@/app/actions/transactions";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { formatRupiah, unformatRupiah } from "@/lib/format";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: any;
  categories: any[];
  goals: any[];
  accounts: any[];
  totalSavings: number;
}

const isSaving = (name?: string) => name?.toLowerCase() === "tabungan";

export default function ExpenseModal({ isOpen, onClose, mode, initialData, categories, goals, accounts, totalSavings }: Props) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
  });
  const [mounted, setMounted] = useState(false);

  // Filter out 'Tabungan' category to prevent conflicts with new logic
  const filteredCategories = useMemo(() => 
    categories.filter(c => c.name.toLowerCase() !== "tabungan"),
    [categories]
  );

  useEffect(() => {
    setMounted(true);
    if (!isOpen) return;

    if (mode === "edit" && initialData) {
      setAmount(formatRupiah(initialData.amount));
      setDescription(initialData.description || "");
      setCategoryId(initialData.categoryId || "");
      setAccountId(initialData.accountId || accounts[0]?.id || "");
      setDate(new Date(initialData.date).toISOString().split('T')[0]);
    } else {
      // Initialize only if opening the modal or resetting
      setAmount("");
      setDescription("");
      setCategoryId(filteredCategories[0]?.id || "");
      setAccountId(accounts[0]?.id || "");
      const now = new Date();
      const offset = now.getTimezoneOffset();
      setDate(new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]);
    }
    // We only want to run this when the modal opens or data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); 

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(unformatRupiah(amount));
    if (!cleanAmount || isNaN(cleanAmount)) {
      toast.error("Nominal tidak valid");
      return;
    }

    // Balance Validation
    if (accountId === "SAVINGS") {
      if (cleanAmount > totalSavings) {
        toast.error(`Saldo tabungan tidak mencukupi (Tersedia: Rp ${totalSavings.toLocaleString('id-ID')})`);
        return;
      }
    } else {
      const selectedAcc = accounts.find(a => a.id === accountId);
      if (selectedAcc && cleanAmount > (selectedAcc.balance || 0)) {
        toast.error(`Saldo ${selectedAcc.name} tidak mencukupi (Tersedia: Rp ${selectedAcc.balance.toLocaleString('id-ID')})`);
        return;
      }
    }

    startTransition(async () => {
      const data = {
        amount: cleanAmount,
        categoryId,
        description,
        date,
        type: 'EXPENSE' as const,
        accountId: accountId === "SAVINGS" ? "" : accountId,
      };

      const res = mode === "create"
        ? await addTransaction(data)
        : await updateTransaction(initialData.id, data);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(mode === "create" ? "Pengeluaran berhasil dicatat" : "Data berhasil diupdate");
        onClose();
      }
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(formatRupiah(e.target.value));
  };

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 text-left">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[12px] animate-in fade-in duration-500" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-[#1E1E2D] rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
        <div className="px-10 py-10 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[24px] bg-rose-600 text-white shadow-lg shadow-rose-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-2xl text-gray-900 dark:text-gray-100 tracking-tight">
                {mode === "create" ? "Catat Pengeluaran" : "Edit Pengeluaran"}
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
                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
                  <Banknote className="w-7 h-7 text-gray-300 group-hover:text-rose-400 transition-colors" />
                  <span className="font-black text-2xl text-rose-600/30 group-focus-within:text-rose-600 transition-colors">Rp</span>
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="w-full pl-24 pr-8 py-6 rounded-[32px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-rose-500/50 transition-all font-black text-3xl text-rose-600 shadow-inner group-hover:border-rose-200 dark:group-hover:border-rose-800"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Keluar dari rekening</label>
              <div className="relative group">
                <select
                  value={accountId}
                  required
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full pl-12 pr-8 py-5 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer font-bold text-sm group-hover:border-emerald-200 dark:group-hover:border-emerald-800"
                >
                  <option value="" disabled>Pilih Sumber Dana</option>
                  <optgroup label="Rekening Personal">
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Rp {acc.balance?.toLocaleString('id-ID') || 0})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Tabungan & Simpanan">
                    <option value="SAVINGS">
                      Tabungan (Rp {totalSavings.toLocaleString('id-ID')})
                    </option>
                  </optgroup>
                </select>
                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Kategori</label>
                <div className="relative group">
                  <select
                    value={categoryId}
                    required
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full pl-12 pr-8 py-5 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-rose-500/50 transition-all appearance-none cursor-pointer font-bold text-sm group-hover:border-rose-200 dark:group-hover:border-rose-800"
                  >
                    {filteredCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Tanggal</label>
                <div className="relative group">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-12 pr-8 py-5 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-rose-500/50 transition-all font-bold text-sm group-hover:border-rose-200 dark:group-hover:border-rose-800"
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Keterangan Opsional</label>
              <div className="relative group">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="cth: Makan siang, bayar kos, dll..."
                  className="w-full pl-12 pr-8 py-5 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-rose-500/50 transition-all font-medium text-sm group-hover:border-rose-200 dark:group-hover:border-rose-800"
                />
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
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
