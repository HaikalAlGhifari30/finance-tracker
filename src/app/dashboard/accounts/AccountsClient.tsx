"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Plus, Wallet, ArrowRightLeft, CreditCard, Landmark, Smartphone, Banknote, MoreVertical, Pencil, Trash2, X, ChevronRight, Search, ChevronLeft, Calendar } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ACCOUNT_ICONS, ACCOUNT_TYPES, PRESET_ACCOUNTS } from "@/lib/constants";
import { addAccount, updateAccount, deleteAccount, getTransferHistory } from "@/app/actions/accounts";
import { addTransaction } from "@/app/actions/transactions";
import { toast } from "sonner";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { formatRupiah, unformatRupiah } from "@/lib/format";
import { createPortal } from "react-dom";
import { MemberFilter } from "@/components/MemberFilter";
import { useSearchParams } from "next/navigation";

interface Account {
  id: string;
  name: string;
  type: string;
  accountNumber: string | null;
  balance: number;
  createdAt: Date;
  memberId?: string | null;
}

export default function AccountsClient({ initialAccounts, initialTransferHistory, initialTransferTotal, user, categories, members }: { initialAccounts: Account[], initialTransferHistory: any[], initialTransferTotal: number, user: any, categories: any[], members: any[] }) {
  const searchParams = useSearchParams();
  const currentMember = searchParams.get("member") || "all";

  // Filter accounts client-side
  const filteredAccounts = initialAccounts.filter(acc => 
    currentMember === "all" ? true : acc.memberId === currentMember
  );

  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  
  // Transfer History State
  const [transferHistory, setTransferHistory] = useState(initialTransferHistory);
  const [totalTransfers, setTotalTransfers] = useState(initialTransferTotal);
  const [transferPage, setTransferPage] = useState(1);
  const [transferLimit, setTransferLimit] = useState(10);
  const [transferViewMode, setTransferViewMode] = useState<"monthly" | "yearly">("monthly");
  const [transferDate, setTransferDate] = useState(new Date());
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [transferToAccount, setTransferToAccount] = useState<string>("");
  const [deleteMode, setDeleteMode] = useState<"TRANSFER" | "DIRECT">("TRANSFER");
  const [isPermanentDeleteConfirmed, setIsPermanentDeleteConfirmed] = useState(false);
  const [showDoubleConfirm, setShowDoubleConfirm] = useState(false);

  // Form States
  const [name, setName] = useState("");
  const [type, setType] = useState("BANK");
  const [accountNumber, setAccountNumber] = useState("");
  const [memberId, setMemberId] = useState("");

  // Transfer States
  const [fromMember, setFromMember] = useState("");
  const [fromAccount, setFromAccount] = useState("");
  const [toMember, setToMember] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDesc, setTransferDesc] = useState("");

  const totalBalance = filteredAccounts.reduce((acc, curr) => acc + curr.balance, 0);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = editingAccount 
      ? await updateAccount(editingAccount.id, name, type, accountNumber) // note: memberId is usually not updated
      : await addAccount(name, type, memberId, accountNumber);
    
    if (res.success) {
      toast.success(editingAccount ? "Rekening diperbarui" : "Rekening ditambahkan");
      window.location.reload(); // Simple way to refresh data
    } else {
      toast.error(res.error || "Gagal menyimpan rekening");
    }
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    setAccountToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    
    const account = accounts.find(a => a.id === accountToDelete);
    if (!account) return;

    if (deleteMode === "TRANSFER" && account.balance > 0 && !transferToAccount) {
      toast.error("Harap pilih rekening tujuan untuk memindahkan saldo");
      return;
    }

    if (deleteMode === "DIRECT" && account.balance > 0 && !isPermanentDeleteConfirmed) {
      toast.error("Harap konfirmasi bahwa Anda memahami saldo akan hilang");
      return;
    }

    setIsSubmitting(true);
    const res = await deleteAccount(
      accountToDelete, 
      deleteMode === "TRANSFER" ? transferToAccount : undefined,
      deleteMode === "DIRECT"
    );

    if (res.success) {
      toast.success("Rekening berhasil dihapus");
      window.location.reload();
    } else {
      toast.error(res.error || "Gagal menghapus rekening");
    }
    setIsSubmitting(false);
    setIsDeleteDialogOpen(false);
    setAccountToDelete(null);
    setTransferToAccount("");
    setDeleteMode("TRANSFER");
    setIsPermanentDeleteConfirmed(false);
    setShowDoubleConfirm(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransferAmount(formatRupiah(e.target.value));
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccount === toAccount) {
      toast.error("Rekening asal dan tujuan tidak boleh sama");
      return;
    }
    
    const cleanAmount = Number(unformatRupiah(transferAmount));
    if (!cleanAmount || isNaN(cleanAmount) || cleanAmount <= 0) {
      toast.error("Nominal transfer tidak valid");
      return;
    }

    const senderAcc = accounts.find(a => a.id === fromAccount);
    if (senderAcc && cleanAmount > (senderAcc.balance || 0)) {
      toast.error(`Saldo ${senderAcc.name} tidak mencukupi (Tersedia: Rp ${(senderAcc.balance || 0).toLocaleString('id-ID')})`);
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    setIsSubmitting(true);
    const res = await addTransaction({
      amount: cleanAmount,
      description: transferDesc || `Transfer dari ${accounts.find(a => a.id === fromAccount)?.name} ke ${accounts.find(a => a.id === toAccount)?.name}`,
      date: localDateStr,
      type: 'TRANSFER',
      accountId: fromAccount,
      destinationAccountId: toAccount
    });

    if (res.success) {
      toast.success("Transfer berhasil");
      window.location.reload();
    } else {
      toast.error(res.error || "Gagal melakukan transfer");
    }
    setIsSubmitting(false);
  };

  // Fetch Transfers Effect
  useEffect(() => {
    const loadTransfers = async () => {
      setIsLoadingTransfers(true);
      try {
        const result = await getTransferHistory({
          month: transferDate.getMonth() + 1,
          year: transferDate.getFullYear(),
          viewMode: transferViewMode,
          page: transferPage,
          limit: transferLimit
        });
        setTransferHistory(result.data);
        setTotalTransfers(result.total);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingTransfers(false);
      }
    };

    loadTransfers();
  }, [transferDate, transferViewMode, transferPage, transferLimit]);

  const changeTransferPeriod = (delta: number) => {
    const newDate = new Date(transferDate);
    if (transferViewMode === "monthly") {
      newDate.setMonth(newDate.getMonth() + delta);
    } else {
      newDate.setFullYear(newDate.getFullYear() + delta);
    }
    setTransferDate(newDate);
    setTransferPage(1); // Reset page on period change
  };

  const totalPages = Math.ceil(totalTransfers / transferLimit);

  const getIcon = (accName: string, accType: string) => {
    const key = accName.toUpperCase();
    const config = ACCOUNT_ICONS[key] || ACCOUNT_ICONS[accType] || ACCOUNT_ICONS.DEFAULT;
    return config;
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in text-left pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-6">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white tracking-tight leading-tight">Rekening & Transfer</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium mt-1">Atur sumber dana dan pantau saldo Anda secara real-time.</p>
        </div>
        <div className="flex flex-col items-center lg:items-end gap-4 w-full lg:w-auto">
          <MemberFilter members={members} className="w-full sm:w-auto" />
          <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto">
            <button 
              onClick={() => {
                const defaultSender = currentMember !== "all" ? currentMember : (members[0]?.id || "");
                setFromMember(defaultSender);
                setFromAccount("");
                setToMember("");
                setToAccount("");
                setTransferAmount("");
                setTransferDesc("");
                setShowTransferModal(true);
              }}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-3.5 bg-white dark:bg-[#1E1E2D] text-emerald-600 dark:text-emerald-400 text-xs md:text-sm font-bold rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all whitespace-nowrap active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4 md:w-5 md:h-5" /> <span>Transfer</span>
            </button>
            <button 
              onClick={() => {
                setEditingAccount(null);
                setName("");
                setType("BANK");
                setAccountNumber("");
                setMemberId(currentMember !== "all" ? currentMember : members[0]?.id);
                setShowAddModal(true);
              }}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs md:text-sm font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" /> <span>Tambah</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <GlassCard className="p-6 md:p-8 bg-gradient-to-br from-emerald-600 to-teal-600 border-none relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
          <Wallet className="w-24 md:w-40 h-24 md:h-40 text-white" />
        </div>
        <div className="relative z-10 text-center md:text-left">
          <p className="text-emerald-50/80 font-black uppercase tracking-[0.2em] text-[9px] md:text-xs mb-1 md:mb-2">Total Seluruh Saldo</p>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
            Rp {totalBalance.toLocaleString('id-ID')}
          </h2>
          <div className="mt-4 md:mt-6 flex items-center justify-center md:justify-start gap-4">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <p className="text-[10px] text-emerald-50/70 font-black uppercase tracking-widest">Jumlah Rekening</p>
              <p className="text-white font-bold text-sm md:text-base">{filteredAccounts.length} Akun</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Accounts List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredAccounts.map((acc) => {
          const config = getIcon(acc.name, acc.type);
          const Icon = config.icon;
          
          return (
            <GlassCard key={acc.id} className="p-5 md:p-6 hover:shadow-xl transition-all group relative border-gray-100 dark:border-gray-800/50 hover:translate-y-[-4px]">
              <div className="flex items-start justify-between mb-4 md:mb-6">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${config.bgColor} flex items-center justify-center shadow-inner`}>
                  <Icon className="w-6 h-6 md:w-7 md:h-7" style={{ color: config.color }} />
                </div>
                <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={() => {
                        setEditingAccount(acc);
                        setName(acc.name);
                        setType(acc.type);
                        setAccountNumber(acc.accountNumber || "");
                        setShowAddModal(true);
                     }}
                     className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                   >
                     <Pencil className="w-3.5 h-3.5 md:w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => handleDelete(acc.id)}
                     className="p-2 text-gray-400 hover:text-rose-600 transition-colors bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                   >
                     <Trash2 className="w-3.5 h-3.5 md:w-4 h-4" />
                   </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-1 truncate">
                  {acc.name}
                  {currentMember === "all" && members.find(m => m.id === acc.memberId) && (
                    <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {members.find(m => m.id === acc.memberId)?.name}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] md:text-sm text-gray-500 dark:text-gray-400 font-medium mb-3 md:mb-4">
                  {acc.type === 'BANK' ? 'Rekening Bank' : acc.type === 'EWALLET' ? 'E-Wallet' : 'Tunai'}
                  {acc.accountNumber && ` • ${acc.accountNumber}`}
                </p>
                
                <div className="h-px bg-gray-50 dark:bg-gray-800/50 mb-3 md:mb-4" />
                
                <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.15em] mb-1">Saldo Saat Ini</p>
                <p className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  Rp {acc.balance.toLocaleString('id-ID')}
                </p>
              </div>
            </GlassCard>
          );
        })}
      </div>
      
      {/* Riwayat Transfer Section */}
      <div className="space-y-4 md:space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <ArrowRightLeft className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white tracking-tight">Riwayat Transfer</h2>
          </div>

          <div className="flex items-center gap-2 md:gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-1.5 rounded-[20px] md:rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm w-full sm:w-auto justify-center">
            <button onClick={() => changeTransferPeriod(-1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronLeft className="w-3.5 h-3.5 md:w-4 h-4 text-gray-600" /></button>
            <div className="px-3 md:px-4 min-w-[100px] md:min-w-[140px] text-center flex items-center justify-center gap-2">
              <span className="font-bold text-[10px] md:text-xs text-gray-900 dark:text-white tracking-tight uppercase whitespace-nowrap">
                {transferViewMode === "monthly" ? format(transferDate, "MMMM yyyy", { locale: id }) : format(transferDate, "yyyy", { locale: id })}
              </span>
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <button onClick={() => changeTransferPeriod(1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronRight className="w-3.5 h-3.5 md:w-4 h-4 text-gray-600" /></button>
          </div>
        </div>

        <GlassCard className={`p-0 overflow-hidden border-gray-100 dark:border-gray-800 shadow-sm transition-opacity duration-300 ${isLoadingTransfers ? 'opacity-50' : 'opacity-100'}`}>
          {transferHistory.length === 0 ? (
            <div className="p-10 md:p-16 text-center">
              <div className="w-12 md:w-16 h-12 md:h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700">
                <ArrowRightLeft className="w-6 md:w-8 h-6 md:h-8 text-gray-300" />
              </div>
              <p className="text-[11px] md:text-sm font-bold text-gray-400">Belum ada aktivitas transfer di periode ini</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {transferHistory.map((transfer) => (
                  <div key={transfer.id} className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group gap-4">
                    <div className="flex flex-wrap items-center gap-4 md:gap-8 flex-1">
                      <div className="flex flex-col min-w-[100px]">
                        <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 md:mb-2">Aktivitas</span>
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className="px-2 md:px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100/50 dark:border-blue-800/50 whitespace-nowrap">
                            Transfer
                          </span>
                          <span className="text-[10px] md:text-xs font-bold text-gray-400 whitespace-nowrap">
                            {(() => {
                              // Split date string to extract parts directly to avoid Date constructor timezone shifts
                              if (typeof transfer.date === 'string') {
                                const parts = transfer.date.split('T')[0].split('-');
                                if (parts.length === 3) {
                                  // parts = [YYYY, MM, DD]
                                  const localDateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                                  return format(localDateObj, "dd MMM yyyy", { locale: id });
                                }
                              }
                              return format(new Date(transfer.date), "dd MMM yyyy", { locale: id });
                            })()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col flex-1">
                        <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 md:mb-2">Perpindahan Dana</span>
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] md:text-sm font-black text-gray-700 dark:text-gray-200 truncate max-w-[120px] md:max-w-none">{transfer.fromAccountName}</span>
                            {transfer.fromMemberName && (
                              <span className="text-[6px] md:text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                {transfer.fromMemberName}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 md:w-4 h-4 text-gray-300 shrink-0" />
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] md:text-sm font-black text-gray-700 dark:text-gray-200 truncate max-w-[120px] md:max-w-none">{transfer.toAccountName}</span>
                            {transfer.toMemberName && (
                              <span className="text-[6px] md:text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                {transfer.toMemberName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-50 dark:border-gray-800 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start">
                      <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Nominal</span>
                      <span className="text-base md:text-lg font-black text-blue-600 dark:text-blue-400 tracking-tight">
                        Rp {Number(transfer.amount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination UI */}
              <div className="px-4 md:px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center md:text-left order-2 md:order-1">
                  Menampilkan {Math.min((transferPage - 1) * transferLimit + 1, totalTransfers)}–{Math.min(transferPage * transferLimit, totalTransfers)} dari {totalTransfers}
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 order-1 md:order-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Per Halaman:</span>
                    <select 
                      value={transferLimit}
                      onChange={(e) => { setTransferLimit(Number(e.target.value)); setTransferPage(1); }}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[9px] md:text-[10px] font-bold px-2 py-1 outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 md:gap-2">
                    <button 
                      disabled={transferPage <= 1 || isLoadingTransfers}
                      onClick={() => setTransferPage(p => p - 1)}
                      className="p-2 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-700 transition-all disabled:opacity-30"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 md:w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    
                    <div className="hidden sm:flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setTransferPage(i + 1)}
                          className={`w-7 h-7 md:w-8 md:h-8 rounded-xl text-[9px] md:text-[10px] font-black transition-all ${transferPage === i + 1 ? 'bg-slate-800 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <div className="sm:hidden px-3 py-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 text-[10px] font-black">
                       {transferPage} / {totalPages}
                    </div>
  
                    <button 
                      disabled={transferPage >= totalPages || isLoadingTransfers}
                      onClick={() => setTransferPage(p => p + 1)}
                      className="p-2 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-700 transition-all disabled:opacity-30"
                    >
                      <ChevronRight className="w-3.5 h-3.5 md:w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </GlassCard>
      </div>


      {/* Add/Edit Account Modal */}
      {showAddModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-[8px] animate-in fade-in duration-500" onClick={() => setShowAddModal(false)} />
          <GlassCard className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingAccount ? "Edit Rekening" : "Tambah Rekening Baru"}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleAddAccount} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {!editingAccount && (
                currentMember === "all" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Pilih Anggota</label>
                    <select
                      value={memberId}
                      onChange={(e) => setMemberId(e.target.value)}
                      required
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-[#13111C] border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-gray-800 dark:text-white appearance-none"
                    >
                      <option value="">Pilih Anggota Pemilik Rekening</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Pilih Anggota</label>
                    <div className="w-full px-5 py-4 bg-gray-100/50 dark:bg-[#13111C]/50 border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 font-bold text-base">
                      {members.find(m => m.id === memberId)?.name || memberId}
                    </div>
                  </div>
                )
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Tipe Rekening</label>
                <div className="grid grid-cols-3 gap-2">
                  {ACCOUNT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setType(t.value);
                        setName(""); // Reset name when type changes
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                        type === t.value 
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" 
                          : "border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200"
                      }`}
                    >
                      <t.icon className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">{t.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
                  {type === 'BANK' ? 'Nama Rekening' : type === 'EWALLET' ? 'Nama E-Wallet' : 'Nama Kas'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="preset-accounts"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={type === 'BANK' ? "Contoh: BCA, Mandiri..." : type === 'EWALLET' ? "Contoh: DANA, OVO, GoPay..." : "Contoh: Dompet Utama, Kas Toko..."}
                    required
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-[#13111C] border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-gray-800 dark:text-white"
                  />
                  <datalist id="preset-accounts">
                    {PRESET_ACCOUNTS
                      .filter(p => p.type === type)
                      .map(p => <option key={p.name} value={p.name} />)
                    }
                  </datalist>
                </div>
              </div>

              {type !== 'CASH' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
                    {type === 'BANK' ? 'Nomor Rekening' : 'Nomor / ID E-Wallet'} (Opsional)
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={type === 'BANK' ? "Masukkan nomor rekening..." : "Masukkan nomor HP atau ID..."}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-[#13111C] border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-gray-800 dark:text-white"
                  />
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : (editingAccount ? "Perbarui Rekening" : "Simpan Rekening")}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>, document.body
      )}

      {/* Transfer Modal */}
      {showTransferModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-[8px] animate-in fade-in duration-500" onClick={() => setShowTransferModal(false)} />
          <GlassCard className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Transfer Saldo</h2>
              <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleTransfer} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">Dari Rekening</h3>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Anggota Pengirim</label>
                  {currentMember !== "all" ? (
                    <div className="w-full px-5 py-4 bg-gray-100 dark:bg-[#1A1825] border border-gray-200 dark:border-gray-800 rounded-2xl font-bold text-gray-800 dark:text-white text-sm flex items-center justify-between">
                      <span>{members.find(m => m.id === fromMember)?.name || "Anggota Terpilih"}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Pengirim</span>
                    </div>
                  ) : (
                    <select
                      value={fromMember}
                      onChange={(e) => {
                        setFromMember(e.target.value);
                        setFromAccount(""); // Reset account when member changes
                      }}
                      required
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-[#13111C] border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-gray-800 dark:text-white appearance-none"
                    >
                      <option value="">Pilih Anggota Pengirim</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Sumber Dana</label>
                  <select
                    value={fromAccount}
                    onChange={(e) => setFromAccount(e.target.value)}
                    required
                    disabled={!fromMember}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-[#13111C] border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-gray-800 dark:text-white appearance-none disabled:opacity-50"
                  >
                    <option value="">Pilih Sumber Dana</option>
                    {accounts.filter(a => a.memberId === fromMember).map(a => (
                      <option key={a.id} value={a.id}>{a.name} - Rp {a.balance.toLocaleString('id-ID')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                 <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-4 border-white dark:border-[#1E1E2D]">
                    <ChevronRight className="w-6 h-6 rotate-90" />
                 </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">Ke Rekening</h3>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Pilih Anggota</label>
                  <select
                    value={toMember}
                    onChange={(e) => {
                      setToMember(e.target.value);
                      setToAccount(""); // Reset account when member changes
                    }}
                    required
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-[#13111C] border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-gray-800 dark:text-white appearance-none"
                  >
                    <option value="">Pilih Anggota Penerima</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Rekening Tujuan</label>
                  <select
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value)}
                    required
                    disabled={!toMember}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-[#13111C] border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-gray-800 dark:text-white appearance-none disabled:opacity-50"
                  >
                    <option value="">Pilih Rekening Tujuan</option>
                    {accounts.filter(a => a.memberId === toMember).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Nominal Transfer</label>
                <div className="relative">
                   <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-emerald-600">Rp</div>
                   <input
                    type="text"
                    value={transferAmount}
                    onChange={handleAmountChange}
                    placeholder="0"
                    required
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-[#13111C] border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-black text-gray-800 dark:text-white text-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Keterangan (Opsional)</label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  placeholder="Contoh: Isi saldo, pindah dana..."
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-[#13111C] border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-gray-800 dark:text-white"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : "Lakukan Transfer"}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>, document.body
      )}
      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && typeof document !== "undefined" && createPortal((() => {
        const acc = accounts.find(a => a.id === accountToDelete);
        const hasBalance = (acc?.balance || 0) > 0;
        
        if (showDoubleConfirm) {
          return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/70 backdrop-blur-[8px] animate-in fade-in duration-500" onClick={() => setShowDoubleConfirm(false)} />
              <GlassCard className="w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border-rose-500/30 shadow-2xl p-8 flex flex-col items-center text-center bg-white dark:bg-[#1E1E2D]">
                <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <X className="w-10 h-10 text-rose-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Konfirmasi Akhir</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold leading-relaxed mb-8">
                  Semua saldo dalam rekening ini (<span className="text-rose-600">Rp {acc?.balance.toLocaleString('id-ID')}</span>) akan <span className="text-rose-600 underline">dicatat sebagai pengeluaran penyesuaian</span> dan saldo rekening akan menjadi nol sebelum dihapus permanen.
                  <br /><br />
                  Apakah Anda benar-benar yakin?
                </p>
                <div className="flex w-full gap-4">
                  <button
                    onClick={() => setShowDoubleConfirm(false)}
                    className="flex-1 rounded-2xl bg-gray-100 dark:bg-gray-800 py-4 text-sm font-bold text-gray-600 dark:text-gray-300"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isSubmitting}
                    className="flex-[1.5] rounded-2xl bg-rose-600 hover:bg-rose-700 py-4 text-sm font-bold text-white shadow-lg shadow-rose-500/40 active:scale-95"
                  >
                    {isSubmitting ? "Menghapus..." : "Ya, Hapus Semua"}
                  </button>
                </div>
              </GlassCard>
            </div>
          );
        }

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-[8px] animate-in fade-in duration-500" onClick={() => {
                setIsDeleteDialogOpen(false);
                setAccountToDelete(null);
                setTransferToAccount("");
                setDeleteMode("TRANSFER");
                setIsPermanentDeleteConfirmed(false);
            }} />
            <GlassCard className="w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border-none shadow-2xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="w-8 h-8 text-rose-600" />
              </div>
              
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Hapus Rekening</h3>
              <p className="text-gray-500 dark:text-gray-400 font-bold mb-8 uppercase text-[10px] tracking-widest">{acc?.name}</p>
              
              {hasBalance ? (
                <div className="space-y-6 w-full mb-8">
                  <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl gap-1">
                    <button 
                      onClick={() => setDeleteMode("TRANSFER")}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${deleteMode === "TRANSFER" ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      Pindahkan & Hapus
                    </button>
                    <button 
                      onClick={() => setDeleteMode("DIRECT")}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${deleteMode === "DIRECT" ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-500'}`}
                    >
                      Hapus Tanpa Memindahkan
                    </button>
                  </div>

                  {deleteMode === "TRANSFER" ? (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                        Pindahkan saldo sebesar <span className="font-bold text-emerald-600 dark:text-emerald-400">Rp {acc?.balance.toLocaleString('id-ID')}</span> ke rekening lain.
                      </p>
                      
                      <div className="text-left space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Pindahkan Saldo Ke:</label>
                        <select
                          value={transferToAccount}
                          onChange={(e) => setTransferToAccount(e.target.value)}
                          required
                          className="w-full px-5 py-4 bg-gray-50 dark:bg-[#13111C] border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-gray-800 dark:text-white appearance-none"
                        >
                          <option value="">Pilih Rekening Tujuan</option>
                          {accounts.filter(a => a.id !== accountToDelete).map(a => {
                            const memberName = members.find(m => m.id === a.memberId)?.name;
                            return (
                              <option key={a.id} value={a.id}>
                                {a.name} {memberName ? `(${memberName})` : ''} - Rp {a.balance.toLocaleString('id-ID')}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="p-6 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-[24px] text-left">
                        <p className="text-sm text-rose-700 dark:text-rose-400 font-bold mb-4 flex items-start gap-3">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">!</span>
                          Semua saldo dalam rekening ini akan dihapus permanen dan tidak dapat dikembalikan.
                        </p>
                        
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox"
                            checked={isPermanentDeleteConfirmed}
                            onChange={(e) => setIsPermanentDeleteConfirmed(e.target.checked)}
                            className="w-5 h-5 rounded-lg border-rose-300 text-rose-600 focus:ring-rose-500 transition-all"
                          />
                          <span className="text-xs font-black text-gray-600 dark:text-gray-300 group-hover:text-rose-600 transition-colors">
                            Saya memahami bahwa saldo akan hilang permanen
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed">
                  Apakah Anda yakin ingin menghapus rekening ini? Semua data transaksi yang berhubungan dengan rekening ini juga akan dihapus secara permanen.
                </p>
              )}
              
              <div className="flex w-full gap-4">
                <button
                  type="button"
                  onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setAccountToDelete(null);
                      setTransferToAccount("");
                      setDeleteMode("TRANSFER");
                      setIsPermanentDeleteConfirmed(false);
                  }}
                  className="flex-1 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 py-4 text-sm font-bold text-gray-600 dark:text-gray-300 transition-all active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteMode === "DIRECT" && hasBalance) {
                      setShowDoubleConfirm(true);
                    } else {
                      handleConfirmDelete();
                    }
                  }}
                  disabled={isSubmitting || (deleteMode === "TRANSFER" && hasBalance && !transferToAccount) || (deleteMode === "DIRECT" && hasBalance && !isPermanentDeleteConfirmed)}
                  className={`flex-[1.5] rounded-2xl py-4 text-sm font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 ${deleteMode === "DIRECT" ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'}`}
                >
                  {isSubmitting ? "Memproses..." : (deleteMode === "DIRECT" && hasBalance ? "Hapus Permanen" : (hasBalance ? "Pindahkan & Hapus" : "Hapus Sekarang"))}
                </button>
              </div>
            </GlassCard>
          </div>
        );
      })(), document.body)}
    </div>
  );
}
