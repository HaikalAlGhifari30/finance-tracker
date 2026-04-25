"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Plus, Wallet, ArrowRightLeft, CreditCard, Landmark, Smartphone, Banknote, MoreVertical, Pencil, Trash2, X, ChevronRight, Search, ChevronLeft } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ACCOUNT_ICONS, ACCOUNT_TYPES, PRESET_ACCOUNTS } from "@/lib/constants";
import { addAccount, updateAccount, deleteAccount, getTransferHistory } from "@/app/actions/accounts";
import { addTransaction } from "@/app/actions/transactions";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { formatRupiah, unformatRupiah } from "@/lib/format";

interface Account {
  id: string;
  name: string;
  type: string;
  accountNumber: string | null;
  balance: number;
  createdAt: Date;
}

export default function AccountsClient({ initialAccounts, initialTransferHistory, initialTransferTotal, user, categories }: { initialAccounts: Account[], initialTransferHistory: any[], initialTransferTotal: number, user: any, categories: any[] }) {
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

  // Transfer States
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDesc, setTransferDesc] = useState("");

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = editingAccount 
      ? await updateAccount(editingAccount.id, name, type, accountNumber)
      : await addAccount(name, type, accountNumber);
    
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
    if (!cleanAmount || isNaN(cleanAmount)) {
      toast.error("Nominal transfer tidak valid");
      return;
    }

    setIsSubmitting(true);
    const res = await addTransaction({
      amount: cleanAmount,
      description: transferDesc || `Transfer dari ${accounts.find(a => a.id === fromAccount)?.name} ke ${accounts.find(a => a.id === toAccount)?.name}`,
      date: new Date().toISOString(),
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
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Rekening & Transfer</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Atur sumber dana dan pantau saldo Anda secara real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setFromAccount("");
              setToAccount("");
              setTransferAmount("");
              setTransferDesc("");
              setShowTransferModal(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#1E1E2D] text-emerald-600 dark:text-emerald-400 font-bold rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" /> Transfer
          </button>
          <button 
            onClick={() => {
              setEditingAccount(null);
              setName("");
              setType("BANK");
              setAccountNumber("");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Tambah Rekening
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <GlassCard className="p-8 bg-gradient-to-br from-emerald-600 to-teal-600 border-none relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wallet className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10">
          <p className="text-emerald-50/80 font-bold uppercase tracking-widest text-xs mb-2">Total Seluruh Saldo</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Rp {totalBalance.toLocaleString('id-ID')}
          </h2>
          <div className="mt-6 flex items-center gap-4">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <p className="text-xs text-emerald-50/70 font-medium">Jumlah Rekening</p>
              <p className="text-white font-bold">{accounts.length} Akun</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => {
          const config = getIcon(acc.name, acc.type);
          const Icon = config.icon;
          
          return (
            <GlassCard key={acc.id} className="p-6 hover:shadow-xl transition-all group relative border-gray-100 dark:border-gray-800/50">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl ${config.bgColor} flex items-center justify-center shadow-inner`}>
                  <Icon className="w-7 h-7" style={{ color: config.color }} />
                </div>
                <div className="flex items-center gap-1">
                   <button 
                     onClick={() => {
                        setEditingAccount(acc);
                        setName(acc.name);
                        setType(acc.type);
                        setAccountNumber(acc.accountNumber || "");
                        setShowAddModal(true);
                     }}
                     className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                   >
                     <Pencil className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => handleDelete(acc.id)}
                     className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{acc.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">
                  {acc.type === 'BANK' ? 'Rekening Bank' : acc.type === 'EWALLET' ? 'E-Wallet' : 'Tunai'}
                  {acc.accountNumber && ` • ${acc.accountNumber}`}
                </p>
                
                <div className="h-px bg-gray-50 dark:bg-gray-800/50 mb-4" />
                
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">Saldo Saat Ini</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  Rp {acc.balance.toLocaleString('id-ID')}
                </p>
              </div>
            </GlassCard>
          );
        })}

      </div>
      
      {/* Riwayat Transfer Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Riwayat Transfer</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-900/50 p-1.5 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex p-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100/50 dark:border-gray-700/50">
              <button
                onClick={() => { setTransferViewMode("monthly"); setTransferPage(1); }}
                className={`text-[9px] px-4 py-2 rounded-lg font-black uppercase tracking-widest transition-all ${transferViewMode === 'monthly' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}
              >
                Bln
              </button>
              <button
                onClick={() => { setTransferViewMode("yearly"); setTransferPage(1); }}
                className={`text-[9px] px-4 py-2 rounded-lg font-black uppercase tracking-widest transition-all ${transferViewMode === 'yearly' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}
              >
                Thn
              </button>
            </div>

            <div className="flex items-center gap-1 pr-2">
              <button onClick={() => changeTransferPeriod(-1)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90 text-gray-400 hover:text-gray-600">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-2 min-w-[100px] text-center">
                <span className="font-bold text-[10px] text-gray-900 dark:text-white tracking-widest uppercase">
                  {transferViewMode === "monthly" ? format(transferDate, "MMM yyyy", { locale: id }) : format(transferDate, "yyyy", { locale: id })}
                </span>
              </div>
              <button onClick={() => changeTransferPeriod(1)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90 text-gray-400 hover:text-gray-600">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <GlassCard className={`p-0 overflow-hidden border-gray-100 dark:border-gray-800 shadow-sm transition-opacity duration-300 ${isLoadingTransfers ? 'opacity-50' : 'opacity-100'}`}>
          {transferHistory.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700">
                <ArrowRightLeft className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-400">Belum ada aktivitas transfer di periode ini</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {transferHistory.map((transfer) => (
                  <div key={transfer.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Aktivitas</span>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100/50 dark:border-blue-800/50">
                            Transfer
                          </span>
                          <span className="text-xs font-bold text-gray-400">
                            {format(new Date(transfer.date), "dd MMM yyyy", { locale: id })}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Perpindahan</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-gray-700 dark:text-gray-200">{transfer.fromAccountName}</span>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                          <span className="text-sm font-black text-gray-700 dark:text-gray-200">{transfer.toAccountName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">Nominal</span>
                      <span className="text-lg font-black text-blue-600 dark:text-blue-400 tracking-tight">
                        Rp {Number(transfer.amount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination UI */}
              <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Menampilkan {Math.min((transferPage - 1) * transferLimit + 1, totalTransfers)}–{Math.min(transferPage * transferLimit, totalTransfers)} dari {totalTransfers}
                </p>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 mr-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Per Halaman:</span>
                    <select 
                      value={transferLimit}
                      onChange={(e) => { setTransferLimit(Number(e.target.value)); setTransferPage(1); }}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold px-2 py-1 outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <button 
                    disabled={transferPage <= 1 || isLoadingTransfers}
                    onClick={() => setTransferPage(p => p - 1)}
                    className="p-2 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-700 transition-all disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setTransferPage(i + 1)}
                        className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${transferPage === i + 1 ? 'bg-slate-800 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button 
                    disabled={transferPage >= totalPages || isLoadingTransfers}
                    onClick={() => setTransferPage(p => p + 1)}
                    className="p-2 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-700 transition-all disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </>
          )}
        </GlassCard>
      </div>


      {/* Add/Edit Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <GlassCard className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border-none shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingAccount ? "Edit Rekening" : "Tambah Rekening Baru"}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleAddAccount} className="p-6 space-y-5">
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
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTransferModal(false)} />
          <GlassCard className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border-none shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Transfer Saldo</h2>
              <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleTransfer} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Dari Rekening</label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-[#13111C] border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-gray-800 dark:text-white appearance-none"
                >
                  <option value="">Pilih Sumber Dana</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (Rp {a.balance.toLocaleString('id-ID')})</option>)}
                </select>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                 <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-4 border-white dark:border-[#1E1E2D]">
                    <ChevronRight className="w-6 h-6 rotate-90" />
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Ke Rekening</label>
                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-[#13111C] border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-gray-800 dark:text-white appearance-none"
                >
                  <option value="">Pilih Rekening Tujuan</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
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
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (() => {
        const acc = accounts.find(a => a.id === accountToDelete);
        const hasBalance = (acc?.balance || 0) > 0;
        
        if (showDoubleConfirm) {
          return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowDoubleConfirm(false)} />
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => {
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
                          {accounts.filter(a => a.id !== accountToDelete).map(a => (
                            <option key={a.id} value={a.id}>{a.name} (Rp {a.balance.toLocaleString('id-ID')})</option>
                          ))}
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
      })()}
    </div>
  );
}
