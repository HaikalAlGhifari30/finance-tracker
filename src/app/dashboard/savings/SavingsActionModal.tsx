"use client";

import { useState, useEffect, useTransition } from "react";

import { X, Loader2, Calendar, FileText, Banknote, Wallet, Target, ArrowRightLeft, ChevronDown, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { addTransaction } from "@/app/actions/transactions";
import { allocateSavings } from "@/app/actions/goals";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { formatRupiah, unformatRupiah } from "@/lib/format";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "SAVING" | "WITHDRAWAL" | "ALLOCATE";
  accounts: { id: string; name: string; balance: number; memberId?: string | null }[];
  goals: { id: string; name: string; balance: string | number }[];
  unallocatedSavings: number;
  members: { id: string; name: string }[];
}

export default function SavingsActionModal({ isOpen, onClose, mode, accounts, goals, unallocatedSavings, members }: Props) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [memberId, setMemberId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [goalId, setGoalId] = useState(""); // Destination Goal
  const [sourceGoalId, setSourceGoalId] = useState(""); // Source Goal
  const [fromBudget, setFromBudget] = useState(false); // Whether this saving should reduce budget allocation
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
    setMemberId("");
    setAccountId("");
    setGoalId(""); // Default to "Tabungan Umum" (Empty)
    setSourceGoalId(""); // Default to "Tabungan Umum" (Empty)
    setFromBudget(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const filteredAccounts = accounts.filter(acc => acc.memberId === memberId);

  useEffect(() => {
    setAccountId("");
  }, [memberId]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(unformatRupiah(amount));
    if (!cleanAmount || isNaN(cleanAmount)) {
      toast.error("Jumlah tidak valid");
      return;
    }
    if (mode === "ALLOCATE") {
      if (sourceGoalId === goalId) {
        toast.error("Goal asal dan tujuan tidak boleh sama");
        return;
      }
      // Balance Validation for ALLOCATE
      let availableBalance = 0;
      if (sourceGoalId === "") {
        availableBalance = unallocatedSavings;
      } else {
        const goal = goals.find(g => g.id === sourceGoalId);
        availableBalance = goal ? Number(goal.balance) : 0;
      }

      if (cleanAmount > availableBalance) {
        toast.error(`Saldo ${sourceGoalId === "" ? "Tabungan Umum" : "goal asal"} tidak mencukupi (Tersedia: Rp ${availableBalance.toLocaleString('id-ID')})`);
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
        const res = await allocateSavings(cleanAmount, goalId, sourceGoalId, description, date);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Dana berhasil dipindahkan!");
          onClose();
        }
        return;
      }

      const data = {
        amount: cleanAmount,
        description,
        date: new Date(date).toISOString(),
        type: mode as "SAVING" | "WITHDRAWAL",
        accountId: accountId,
        destinationAccountId: mode === "WITHDRAWAL" ? accountId : undefined,
        goalId: goalId,
        memberId: memberId,
        fromBudget: mode === "SAVING" ? fromBudget : undefined,
      };

      if (mode === "WITHDRAWAL") {
        data.accountId = ""; // For withdrawal, accountId is null (Savings Pool)
        data.destinationAccountId = accountId; // destination is the bank account
      }

      const res = await addTransaction(data);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
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
    <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center md:p-4 text-left">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[12px] animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative w-full md:max-w-lg bg-white dark:bg-[#1E1E2D] rounded-t-[32px] md:rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom md:zoom-in-95 duration-300 flex flex-col max-h-[85dvh] md:max-h-[90vh]">
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600/80" />
        </div>
        <div className="px-5 md:px-10 py-3.5 md:py-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <div className="flex items-center gap-3 md:gap-5">
            <div className={`p-2.5 md:p-4 rounded-[16px] md:rounded-[24px] transition-all duration-500 shadow-lg ${mode === 'SAVING' ? 'bg-amber-500 text-white shadow-amber-500/20' :
              mode === 'WITHDRAWAL' ? 'bg-blue-600 text-white shadow-blue-500/20' :
                'bg-emerald-600 text-white shadow-emerald-500/20'
              }`}>
              {mode === 'SAVING' ? <ArrowUpCircle className="w-4 h-4 md:w-6 md:h-6" /> :
                mode === 'WITHDRAWAL' ? <ArrowDownCircle className="w-4 h-4 md:w-6 md:h-6" /> :
                  <ArrowRightLeft className="w-4 h-4 md:w-6 md:h-6" />}
            </div>
            <div>
              <h3 className="font-black text-base md:text-2xl text-gray-900 dark:text-gray-100 tracking-tight">
                {mode === "SAVING" ? "Menabung" : mode === "WITHDRAWAL" ? "Tarik Tabungan" : "Alokasikan Dana"}
              </h3>
              <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                {mode === "ALLOCATE" ? "Internal Tabungan" : "Pengelolaan Dana Goals"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 md:p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl">
            <X className="w-5 h-5 md:w-7 md:h-7" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="p-5 md:p-10 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="space-y-3.5 md:space-y-6">
            <div className="space-y-1.5 md:space-y-3">
              <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Jumlah Nominal (Rp)</label>
              <div className="relative group">
                <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
                  <Banknote className={`hidden sm:block w-7 h-7 text-gray-300 transition-colors ${mode === 'SAVING' ? 'group-hover:text-amber-400' : 'group-hover:text-blue-400'}`} />
                  <span className={`font-black text-base md:text-2xl group-focus-within:opacity-100 transition-colors ${mode === 'SAVING' ? 'text-amber-500' : 'text-blue-500'}`}>Rp</span>
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className={`w-full pl-14 sm:pl-24 pr-4 md:pr-8 py-3 md:py-5 rounded-[18px] md:rounded-[32px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none transition-all font-black text-xl md:text-3xl shadow-inner ${mode === 'SAVING' ? 'text-amber-600 focus:border-amber-500/50' : 'text-blue-600 focus:border-blue-500/50'}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {mode !== "ALLOCATE" && (
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Pilih Anggota</label>
                  <div className="relative group">
                    <select
                      value={memberId}
                      required
                      onChange={(e) => setMemberId(e.target.value)}
                      className="w-full pl-12 pr-8 py-4 md:py-5 rounded-[20px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all appearance-none cursor-pointer font-bold text-xs md:text-sm"
                    >
                      <option value="" disabled>Pilih Anggota</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {mode === "ALLOCATE" ? (
                <>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Alokasi ke Target Goal</label>
                    <div className="relative group">
                      <select
                        value={goalId}
                        required
                        onChange={(e) => setGoalId(e.target.value)}
                        className="w-full pl-12 pr-8 py-4 md:py-5 rounded-[20px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer font-bold text-xs md:text-sm"
                      >
                        <option value="" disabled>Pilih Target Goal</option>
                        {goals.map(goal => (
                          <option key={goal.id} value={goal.id}>{goal.name} (Saldo: Rp {Number(goal.balance).toLocaleString('id-ID')})</option>
                        ))}
                      </select>
                      <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    </div>
                  </div>

                  {memberId && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Sumber Rekening (Opsional)</label>
                      <div className="relative group">
                        <select
                          value={accountId}
                          onChange={(e) => setAccountId(e.target.value)}
                          className="w-full pl-12 pr-8 py-4 md:py-5 rounded-[20px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer font-bold text-xs md:text-sm"
                        >
                          <option value="" disabled>Pilih Rekening</option>
                          {filteredAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString('id-ID')})</option>
                          ))}
                        </select>
                        <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {memberId && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">
                        Sumber Dana (Rekening)
                      </label>
                      <div className="relative group">
                        <select
                          value={accountId}
                          required
                          onChange={(e) => setAccountId(e.target.value)}
                          className="w-full pl-12 pr-8 py-4 md:py-5 rounded-[20px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all appearance-none cursor-pointer font-bold text-xs md:text-sm"
                        >
                          <option value="" disabled>Pilih Rekening</option>
                          {filteredAccounts.map(acc => (
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
                      {mode === 'SAVING' ? "Tujuan Tabungan (Goal) - Opsional" : "Pindahkan ke Goal"}
                    </label>
                    <div className="relative group">
                      <select
                        value={goalId}
                        onChange={(e) => setGoalId(e.target.value)}
                        className="w-full pl-12 pr-8 py-4 md:py-5 rounded-[20px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer font-bold text-xs md:text-sm"
                      >
                        <option value="">
                          {mode === 'SAVING' ? "Tabungan Umum (Tanpa Alokasi)" : `Tabungan Umum (Pindahkan Balik)`}
                        </option>
                        {goals.map(goal => (
                          <option key={goal.id} value={goal.id}>{goal.name} (Saldo: Rp {Number(goal.balance).toLocaleString('id-ID')})</option>
                        ))}
                      </select>
                      <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Keterangan</label>
              <div className="relative group">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={mode === 'SAVING' ? "cth: Setoran bulanan..." : "cth: Tarik untuk kebutuhan..."}
                  className="w-full pl-12 pr-8 py-4 md:py-5 rounded-[20px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all font-medium text-xs md:text-sm"
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
                  className="w-full pl-12 pr-8 py-4 md:py-5 rounded-[20px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-xs md:text-sm"
                />
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Toggle: Potong dari Budget Alokasi? (only for SAVING mode) */}
            {mode === 'SAVING' && (
              <button
                type="button"
                onClick={() => setFromBudget(v => !v)}
                className={`w-full flex items-center justify-between gap-4 px-5 py-4 rounded-[20px] border-2 transition-all duration-300 ${
                  fromBudget
                    ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10'
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50'
                }`}
              >
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Potong dari Budget Alokasi?
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                    {fromBudget
                      ? 'Tabungan ini akan mengurangi Budget Alokasi bulan ini'
                      : 'Tabungan dari pemasukan tambahan, tidak mempengaruhi budget'
                    }
                  </p>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${
                  fromBudget ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${
                    fromBudget ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'
                  }`} />
                </div>
              </button>
            )}

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
              className="flex-[1.5] bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 md:py-5 rounded-[16px] md:rounded-[28px] shadow-xl shadow-emerald-500/30 disabled:opacity-70 transition-all active:scale-95 flex items-center justify-center text-[10px] md:text-[11px] uppercase tracking-[0.2em]"
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


