"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { X, Loader2, CreditCard, Calendar, Tag, FileText, Banknote, Award, Wallet, Target, Trophy, ChevronDown } from "lucide-react";
import { addTransaction, updateTransaction } from "@/app/actions/transactions";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { formatRupiah, unformatRupiah } from "@/lib/format";
import { getBudgetPeriod, getCategoryExpensesForPeriod } from "@/app/actions/budget";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: any;
  categories: any[];
  goals: any[];
  accounts: any[];
  totalSavings: number;
  members: any[];
  currentMember: string;
}

const isSaving = (name?: string) => name?.toLowerCase() === "tabungan";

export default function ExpenseModal({ isOpen, onClose, mode, initialData, categories, goals, accounts, totalSavings, members, currentMember }: Props) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
  });
  const [mounted, setMounted] = useState(false);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<Record<string, number>>({});

  // Filter out 'Tabungan' category to prevent conflicts with new logic
  const filteredCategories = useMemo(() => 
    categories.filter(c => c.name.toLowerCase() !== "tabungan"),
    [categories]
  );

  const fetchBudgetData = async (selectedDate: string, selectedMemberId: string) => {
    try {
      if (!selectedDate) return;
      
      const parts = selectedDate.split('-');
      const year = parts[0];
      const month = String(parseInt(parts[1], 10)); // e.g. "08" -> "8"
      
      let [period, expenses] = await Promise.all([
        getBudgetPeriod(month, year, selectedMemberId || undefined),
        getCategoryExpensesForPeriod(month, year, selectedMemberId || undefined)
      ]);

      // If no member-specific budget found or no items, fallback to overall/null member budget
      if (!period || !period.items || period.items.length === 0) {
        const fallbackPeriod = await getBudgetPeriod(month, year);
        if (fallbackPeriod && fallbackPeriod.items && fallbackPeriod.items.length > 0) {
          period = fallbackPeriod;
        }
      }

      setBudgetItems(period?.items || []);
      setCategoryExpenses(expenses || {});
    } catch (error) {
      console.error("Error fetching budget data:", error);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (!isOpen) return;

    if (mode === "edit" && initialData) {
      setAmount(formatRupiah(Number(initialData.amount)));
      setDescription(initialData.description || "");
      setCategoryId(initialData.categoryId || "");
      setAccountId(initialData.accountId || accounts[0]?.id || "");
      setMemberId(initialData.memberId || "");
      const dStr = new Date(initialData.date).toISOString().split('T')[0];
      setDate(dStr);
    } else {
      setAmount("");
      setDescription("");
      setCategoryId(filteredCategories[0]?.id || "");
      setAccountId("");
      const targetMember = currentMember !== "all" ? currentMember : (members[0]?.id || "");
      setMemberId(targetMember);
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const initialDate = new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
      setDate(initialDate);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && date) {
      fetchBudgetData(date, memberId);
    }
  }, [date, memberId, isOpen]);

  const filteredAccounts = accounts.filter(acc => acc.memberId === memberId);

  useEffect(() => {
    if (memberId && accountId !== "SAVINGS") {
      if (filteredAccounts.length > 0 && !filteredAccounts.find(a => a.id === accountId)) {
        setAccountId(filteredAccounts[0].id);
      } else if (filteredAccounts.length === 0) {
        setAccountId("SAVINGS");
      }
    } else if (!memberId) {
      setAccountId("");
    }
  }, [memberId, accountId, accounts]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(unformatRupiah(amount));
    if (!cleanAmount || isNaN(cleanAmount)) {
      toast.error("Nominal tidak valid");
      return;
    }
    if (!memberId) {
      toast.error("Harap pilih anggota");
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
        memberId
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
    <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center md:p-4 text-left">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[12px] animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-white dark:bg-[#1E1E2D] rounded-t-[32px] md:rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom md:zoom-in-95 duration-300 flex flex-col max-h-[85dvh] md:max-h-[90vh]">
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600/80" />
        </div>
        <div className="px-5 md:px-10 py-3.5 md:py-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="p-2.5 md:p-4 rounded-[16px] md:rounded-[24px] bg-rose-600 text-white shadow-lg shadow-rose-500/20">
              <CreditCard className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="font-black text-base md:text-2xl text-gray-900 dark:text-gray-100 tracking-tight">
                {mode === "create" ? "Catat Pengeluaran" : "Edit Pengeluaran"}
              </h3>
              <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Sistem Keuangan Terpadu</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 md:p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl">
            <X className="w-5 h-5 md:w-7 md:h-7" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="p-5 md:p-10 space-y-4 md:space-y-6 text-left overflow-y-auto custom-scrollbar pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="space-y-3.5 md:space-y-6">
            <div className="space-y-1.5 md:space-y-3">
              <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Jumlah Nominal (Rp)</label>
              <div className="relative group">
                <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
                  <Banknote className="hidden sm:block w-7 h-7 text-gray-300 group-hover:text-rose-400 transition-colors" />
                  <span className="font-black text-base md:text-2xl text-rose-500 group-focus-within:text-rose-600 transition-colors">Rp</span>
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="w-full pl-14 sm:pl-24 pr-4 md:pr-8 py-3 md:py-5 rounded-[18px] md:rounded-[32px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-rose-500/50 transition-all font-black text-xl md:text-3xl text-rose-600 shadow-inner group-hover:border-rose-200 dark:group-hover:border-rose-800 no-spinner"
                />
              </div>
            </div>

            {(mode === "edit" || currentMember === "all") ? (
              <div className="space-y-1.5 md:space-y-3">
                <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Anggota</label>
                <div className="relative group">
                  <select
                    value={memberId}
                    required
                    onChange={(e) => setMemberId(e.target.value)}
                    className="w-full pl-11 pr-8 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-rose-500/50 transition-all appearance-none cursor-pointer font-bold text-xs md:text-sm group-hover:border-rose-200 dark:group-hover:border-rose-800"
                  >
                    <option value="" disabled>Pilih Anggota</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 md:space-y-3">
                <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Anggota</label>
                <div className="relative">
                  <div className="w-full pl-11 pr-8 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-bold text-xs md:text-sm flex items-center">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    {members.find(m => m.id === memberId)?.name || memberId}
                  </div>
                </div>
              </div>
            )}

            {memberId && (
              <div className="space-y-1.5 md:space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Keluar dari rekening</label>
                <div className="relative group">
                  <select
                    value={accountId}
                    required
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full pl-11 pr-8 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer font-bold text-xs md:text-sm group-hover:border-emerald-200 dark:group-hover:border-emerald-800"
                  >
                    <option value="" disabled>Pilih Sumber Dana</option>
                    <optgroup label="Rekening Personal">
                      {filteredAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (Rp {acc.balance?.toLocaleString('id-ID') || 0})
                        </option>
                      ))}
                      {filteredAccounts.length === 0 && <option value="" disabled>Tidak ada rekening personal</option>}
                    </optgroup>
                    <optgroup label="Tabungan & Simpanan">
                      <option value="SAVINGS">
                        Tabungan (Rp {totalSavings.toLocaleString('id-ID')})
                      </option>
                    </optgroup>
                  </select>
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
              <div className="space-y-1.5 md:space-y-3">
                <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Kategori</label>
                <div className="relative group">
                  <select
                    value={categoryId}
                    required
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full pl-11 pr-8 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-rose-500/50 transition-all appearance-none cursor-pointer font-bold text-xs md:text-sm group-hover:border-rose-200 dark:group-hover:border-rose-800"
                  >
                    {filteredCategories.map(cat => {
                      const budget = budgetItems.find(item => item.categoryId === cat.id);
                      let label = cat.name;
                      if (budget) {
                        const spent = categoryExpenses[cat.id] || 0;
                        const remaining = budget.amount - spent;
                        label += ` (Sisa: Rp ${remaining.toLocaleString('id-ID')})`;
                      }
                      return (
                        <option key={cat.id} value={cat.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Budget Info Display */}
                {categoryId && budgetItems.length > 0 && (
                  <div className="mt-1 px-2 flex items-center justify-between">
                    {(() => {
                      const budget = budgetItems.find(item => item.categoryId === categoryId);
                      if (!budget) return <span className="text-[10px] text-gray-400 font-bold italic">Belum ada alokasi dana</span>;
                      
                      const spent = categoryExpenses[categoryId] || 0;
                      const remaining = budget.amount - spent;
                      const isOver = remaining < 0;
                      
                      return (
                        <div className="flex flex-col gap-0.5 w-full">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sisa Alokasi:</span>
                            <span className={`text-[10px] font-black tracking-tight ${isOver ? 'text-rose-500' : 'text-emerald-500'}`}>
                              Rp {remaining.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
                            <div 
                              className={`h-full transition-all duration-500 ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, (spent / budget.amount) * 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 md:space-y-3">
                <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Tanggal</label>
                <div className="relative group">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-11 pr-8 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-rose-500/50 transition-all font-bold text-xs md:text-sm group-hover:border-rose-200 dark:group-hover:border-rose-800"
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-3">
              <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Keterangan Opsional</label>
              <div className="relative group">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="cth: Makan siang, bayar kos, dll..."
                  className="w-full pl-11 pr-8 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-rose-500/50 transition-all font-medium text-xs md:text-sm group-hover:border-rose-200 dark:group-hover:border-rose-800"
                />
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="pt-3 md:pt-6 flex flex-row gap-3 md:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 md:py-5 rounded-[16px] md:rounded-[28px] border-2 border-gray-100 dark:border-gray-800 font-black text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95 text-[10px] md:text-[11px] uppercase tracking-[0.2em]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-[1.5] bg-rose-500 hover:bg-rose-600 text-white font-black py-3 md:py-5 rounded-[16px] md:rounded-[28px] shadow-xl shadow-rose-500/30 disabled:opacity-70 transition-all active:scale-95 flex items-center justify-center text-[10px] md:text-[11px] uppercase tracking-[0.2em]"
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
