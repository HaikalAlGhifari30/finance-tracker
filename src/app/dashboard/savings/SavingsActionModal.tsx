"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { X, Loader2, CreditCard, Calendar, FileText, Banknote, Wallet, Target, ArrowRightLeft, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { addTransaction } from "@/app/actions/transactions";
import { allocateSavings } from "@/app/actions/goals";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { formatRupiah, unformatRupiah } from "@/lib/format";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "SAVING" | "WITHDRAWAL" | "ALLOCATE";
  accounts: any[];
  goals: any[];
  unallocatedSavings: number;
}

export default function SavingsActionModal({ isOpen, onClose, mode, accounts, goals, unallocatedSavings }: Props) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isOpen) return;

    setAmount("");
    setDescription("");
    setAccountId(accounts[0]?.id || "");
    setGoalId(""); // Default to "Tabungan Umum" (Empty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(unformatRupiah(amount));
    if (!cleanAmount || isNaN(cleanAmount)) {
      toast.error("Jumlah tidak valid");
      return;
    }
    if (mode === "ALLOCATE") {
      if (cleanAmount > unallocatedSavings) {
        toast.error(`Saldo Tabungan Umum tidak mencukupi (Tersedia: Rp ${unallocatedSavings.toLocaleString('id-ID')})`);
        return;
      }
      if (!goalId) {
        toast.error("Harap pilih goal tujuan");
        return;
      }
    } else if (!accountId) {
      toast.error("Harap pilih rekening");
      return;
    }

    // Balance Validation
    if (mode === "SAVING") {
      const account = accounts.find(a => a.id === accountId);
      if (account && cleanAmount > account.balance) {
        toast.error(`Saldo rekening tidak mencukupi (Tersedia: Rp ${account.balance.toLocaleString('id-ID')})`);
        return;
      }
    } else if (mode === "WITHDRAWAL") {
      // Withdrawal check
      let availableBalance = 0;
      if (goalId === "") {
        // Unallocated savings
        availableBalance = unallocatedSavings;
      } else {
        const goal = goals.find(g => g.id === goalId);
        availableBalance = goal ? Number(goal.balance) : 0;
      }

      if (cleanAmount > availableBalance) {
        toast.error(`Saldo tabungan tidak mencukupi (Tersedia: Rp ${availableBalance.toLocaleString('id-ID')})`);
        return;
      }
    }

    startTransition(async () => {
      if (mode === "ALLOCATE") {
        const res = await allocateSavings(cleanAmount, goalId, description, date);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Dana berhasil dialokasikan ke goal!");
          onClose();
        }
        return;
      }

      let res;
      if ((mode as string) === "ALLOCATE") {
        res = await allocateSavings(
          cleanAmount,
          goalId,
          description,
          new Date(date).toISOString()
        );
      } else {
        const data = {
          amount: cleanAmount,
          description,
          date: new Date(date).toISOString(),
          type: mode as any,
          accountId: accountId,
          destinationAccountId: mode === "WITHDRAWAL" ? accountId : undefined,
          goalId: goalId,
        };

        if (mode === "WITHDRAWAL") {
          data.accountId = ""; // For withdrawal, accountId is null (Savings Pool)
          data.destinationAccountId = accountId; // destination is the bank account
        }

        res = await addTransaction(data);
      }

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          (mode as string) === "ALLOCATE" ? "Dana berhasil dialokasikan ke goal" :
            mode === "SAVING" ? "Dana berhasil disimpan ke tabungan" :
              "Dana berhasil ditarik ke rekening"
        );
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
            <div className={`p-4 rounded-[24px] transition-all duration-500 shadow-lg ${mode === 'SAVING' ? 'bg-amber-500 text-white shadow-amber-500/20' :
              mode === 'WITHDRAWAL' ? 'bg-blue-600 text-white shadow-blue-500/20' :
                'bg-emerald-600 text-white shadow-emerald-500/20'
              }`}>
              {mode === 'SAVING' ? <ArrowUpCircle className="w-6 h-6" /> :
                mode === 'WITHDRAWAL' ? <ArrowDownCircle className="w-6 h-6" /> :
                  <ArrowRightLeft className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-black text-2xl text-gray-900 dark:text-gray-100 tracking-tight">
                {mode === "SAVING" ? "Menabung" : mode === "WITHDRAWAL" ? "Tarik Tabungan" : "Alokasikan Dana"}
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                {mode === "ALLOCATE" ? "Internal Tabungan" : "Pengelolaan Dana Goals"}
              </p>
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
                  <Banknote className={`w-7 h-7 text-gray-300 transition-colors ${mode === 'SAVING' ? 'group-hover:text-amber-400' : 'group-hover:text-blue-400'}`} />
                  <span className={`font-black text-2xl group-focus-within:opacity-100 transition-colors opacity-30 ${mode === 'SAVING' ? 'text-amber-600' : 'text-blue-600'}`}>Rp</span>
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className={`w-full pl-24 pr-8 py-6 rounded-[32px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none transition-all font-black text-3xl shadow-inner ${mode === 'SAVING' ? 'text-amber-600 focus:border-amber-500/50' : 'text-blue-600 focus:border-blue-500/50'}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {mode === "ALLOCATE" ? (
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Dari Sumber</label>
                  <div className="relative">
                    <div className="w-full pl-12 pr-8 py-5 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-bold text-sm">
                      Tabungan Umum (Rp {unallocatedSavings.toLocaleString("id-ID")})
                    </div>
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">
                    {mode === 'SAVING' ? "Sumber Dana (Rekening)" : "Pindahkan ke Rekening"}
                  </label>
                  <div className="relative group">
                    <select
                      value={accountId}
                      required
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full pl-12 pr-8 py-5 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all appearance-none cursor-pointer font-bold text-sm"
                    >
                      <option value="" disabled>Pilih Rekening</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString('id-ID')})</option>
                      ))}
                    </select>
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">
                  {mode === 'SAVING' ? "Tujuan Tabungan (Goal) - Opsional" :
                    mode === 'WITHDRAWAL' ? "Tarik dari Goal" : "Pindahkan ke Goal"}
                </label>
                <div className="relative group">
                  <select
                    value={goalId}
                    required={mode === "ALLOCATE"}
                    onChange={(e) => setGoalId(e.target.value)}
                    className="w-full pl-12 pr-8 py-5 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all appearance-none cursor-pointer font-bold text-sm"
                  >
                      <option value="">
                        {mode === 'SAVING' ? "Tabungan Umum (Tanpa Alokasi)" : 
                         (mode as string) === 'WITHDRAWAL' ? `Tabungan Umum (Rp ${unallocatedSavings.toLocaleString('id-ID')})` :
                         "Pilih Goal Tabungan"}
                      </option>
                    {goals.map(goal => (
                      <option key={goal.id} value={goal.id}>{goal.name} (Saldo: Rp {Number(goal.balance).toLocaleString('id-ID')})</option>
                    ))}
                  </select>
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Keterangan</label>
              <div className="relative group">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={mode === 'SAVING' ? "cth: Setoran bulanan..." : "cth: Tarik untuk kebutuhan..."}
                  className="w-full pl-12 pr-8 py-5 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all font-medium text-sm"
                />
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                  className="w-full pl-12 pr-8 py-5 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-sm"
                />
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Konfirmasi Transaksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6" /></svg>
  )
}
