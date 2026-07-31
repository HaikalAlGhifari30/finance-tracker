"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Save, Plus, Trash2, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { upsertBudgetItems } from "@/app/actions/budget";
import { toast } from "sonner";
import { formatRupiah, unformatRupiah } from "@/lib/format";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface BudgetActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodId: string;
  allCategories: any[];
  existingItems: any[];
  onSuccess: () => void;
  totalBudget: number;
  availableBalance: number;
}

export default function BudgetActionModal({ 
  isOpen, 
  onClose, 
  periodId, 
  allCategories, 
  existingItems,
  onSuccess,
  totalBudget,
  availableBalance
}: BudgetActionModalProps) {
  const [isPending, startTransition] = useTransition();
  const [localTotalBudget, setLocalTotalBudget] = useState("");
  const [items, setItems] = useState<{ categoryId: string; amount: string }[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    setLocalTotalBudget(formatRupiah(totalBudget.toString()));
    if (existingItems.length > 0) {
      setItems(existingItems.map(item => ({
        categoryId: item.categoryId,
        amount: formatRupiah(Number(item.amount))
      })));
    } else {
      setItems([]);
    }
  }, [existingItems, totalBudget]);

  if (!isOpen || !mounted) return null;

  const handleAddItem = () => {
    // Find first category not already in items
    const availableCategory = allCategories.find(c => !items.find(i => i.categoryId === c.id));
    if (!availableCategory) {
      toast.error("Semua kategori sudah ditambahkan");
      return;
    }
    setItems([...items, { categoryId: availableCategory.id, amount: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItemToDeleteIndex(index);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmRemove = () => {
    if (itemToDeleteIndex !== null) {
      setItems(items.filter((_, i) => i !== itemToDeleteIndex));
      setItemToDeleteIndex(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleUpdateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    if (field === "amount") {
      const cleanVal = parseFloat(unformatRupiah(value)) || 0;
      const targetBudgetVal = parseFloat(unformatRupiah(localTotalBudget)) || 0;
      
      newItems[index].amount = formatRupiah(value);
      
      // Proportional Adjustment for other categories
      const otherItemsIndices = items.map((_, i) => i).filter(i => i !== index);
      
      if (otherItemsIndices.length > 0) {
        const remainingBudget = targetBudgetVal - cleanVal;
        
        const sumOtherCurrent = otherItemsIndices.reduce((sum, i) => {
          return sum + (parseFloat(unformatRupiah(items[i].amount)) || 0);
        }, 0);
        
        if (sumOtherCurrent > 0) {
          let distributedSoFar = 0;
          otherItemsIndices.forEach((i, idx) => {
            const currentVal = parseFloat(unformatRupiah(items[i].amount)) || 0;
            let newVal = Math.round((currentVal / sumOtherCurrent) * remainingBudget);
            if (newVal < 0) newVal = 0;
            
            if (idx === otherItemsIndices.length - 1) {
              const exactVal = remainingBudget - distributedSoFar;
              newItems[i].amount = formatRupiah(Math.max(0, exactVal).toString());
            } else {
              newItems[i].amount = formatRupiah(newVal.toString());
              distributedSoFar += newVal;
            }
          });
        } else {
          const equalShare = Math.floor(remainingBudget / otherItemsIndices.length);
          otherItemsIndices.forEach((i, idx) => {
            if (idx === otherItemsIndices.length - 1) {
              const exactVal = remainingBudget - (equalShare * (otherItemsIndices.length - 1));
              newItems[i].amount = formatRupiah(Math.max(0, exactVal).toString());
            } else {
              newItems[i].amount = formatRupiah(Math.max(0, equalShare).toString());
            }
          });
        }
      }
    } else {
      newItems[index].categoryId = value;
    }
    setItems(newItems);
  };

  const handleAutoDistribute = () => {
    const targetBudgetVal = parseFloat(unformatRupiah(localTotalBudget)) || 0;
    if (items.length === 0) return;
    const share = Math.floor(targetBudgetVal / items.length);
    const newItems = items.map((item, idx) => {
      const amount = idx === items.length - 1
        ? targetBudgetVal - (share * (items.length - 1))
        : share;
      return {
        ...item,
        amount: formatRupiah(amount.toString())
      };
    });
    setItems(newItems);
    toast.success("Budget dibagi rata ke setiap kategori");
  };

  const handleScaleProportionally = () => {
    const targetBudgetVal = parseFloat(unformatRupiah(localTotalBudget)) || 0;
    const currentSum = items.reduce((sum, item) => sum + (parseFloat(unformatRupiah(item.amount)) || 0), 0);
    if (currentSum === 0) {
      handleAutoDistribute();
      return;
    }
    let distributedSoFar = 0;
    const newItems = items.map((item, idx) => {
      const currentVal = parseFloat(unformatRupiah(item.amount)) || 0;
      let newVal = Math.round((currentVal / currentSum) * targetBudgetVal);
      if (newVal < 0) newVal = 0;
      
      if (idx === items.length - 1) {
        newVal = targetBudgetVal - distributedSoFar;
      } else {
        distributedSoFar += newVal;
      }
      return {
        ...item,
        amount: formatRupiah(Math.max(0, newVal).toString())
      };
    });
    setItems(newItems);
    toast.success("Kategori disesuaikan secara proporsional");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetBudgetVal = parseFloat(unformatRupiah(localTotalBudget)) || 0;
    if (targetBudgetVal > availableBalance) {
      toast.error(`Total budget melebihi saldo tersedia (Tersedia: Rp ${availableBalance.toLocaleString('id-ID')})`);
      return;
    }

    const validItems = items.filter(i => i.categoryId && i.amount && parseFloat(unformatRupiah(i.amount)) >= 0);
    const sumItems = validItems.reduce((sum, i) => sum + parseFloat(unformatRupiah(i.amount)), 0);

    if (sumItems !== targetBudgetVal && items.length > 0) {
      toast.error(`Jumlah nominal kategori (Rp ${sumItems.toLocaleString("id-ID")}) harus sama dengan Total Budget (Rp ${targetBudgetVal.toLocaleString("id-ID")})`);
      return;
    }

    startTransition(async () => {
      try {
        const { updateBudgetPeriodTotal } = await import("@/app/actions/budget");
        await updateBudgetPeriodTotal(periodId, targetBudgetVal);
        await upsertBudgetItems(periodId, validItems.map(i => ({
          categoryId: i.categoryId,
          amount: parseFloat(unformatRupiah(i.amount))
        })));
        toast.success("Alokasi berhasil disimpan");
        onSuccess();
        onClose();
      } catch (error) {
        toast.error("Gagal menyimpan alokasi");
      }
    });
  };

  const sumCategories = items.reduce((sum, item) => sum + (parseFloat(unformatRupiah(item.amount)) || 0), 0);
  const targetBudgetNumber = parseFloat(unformatRupiah(localTotalBudget)) || 0;
  const isBudgetUnbalanced = sumCategories !== targetBudgetNumber && items.length > 0;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[12px] animate-in fade-in duration-500" onClick={onClose} />
      
      <GlassCard className="relative w-full max-w-2xl bg-white dark:bg-[#1E1E2D] p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]">
        <div className="p-6 md:p-8 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Edit Alokasi Dana</h3>
            <p className="text-gray-500 text-xs font-medium mt-1 uppercase tracking-widest">Atur batas pengeluaran per kategori</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white dark:hover:bg-gray-800 rounded-2xl transition-all active:scale-90 shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 flex flex-col space-y-6">
          {/* Total Budget Input */}
          <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest ml-1">Total Budget Bulanan (Rp)</label>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Saldo Tersedia: Rp {availableBalance.toLocaleString("id-ID")}</p>
              </div>
              <input
                type="text"
                required
                value={localTotalBudget}
                onChange={(e) => setLocalTotalBudget(formatRupiah(e.target.value))}
                placeholder="Contoh: 4.000.000"
                className="w-full sm:w-48 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 text-base font-black text-emerald-600 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-right"
              />
            </div>
            
            {isBudgetUnbalanced && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-in fade-in duration-200">
                <div className="text-[10px] font-bold text-amber-800 dark:text-amber-400">
                  ⚠️ Jumlah nominal kategori (Rp {sumCategories.toLocaleString("id-ID")}) belum sesuai dengan Total Budget (Rp {targetBudgetNumber.toLocaleString("id-ID")})
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleScaleProportionally}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Sesuaikan
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoDistribute}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Bagi Rata
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 flex-1">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-end gap-4 p-5 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800 group transition-all hover:border-emerald-500/30">
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pilih Kategori</label>
                  <select
                    value={item.categoryId}
                    onChange={(e) => handleUpdateItem(index, "categoryId", e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                  >
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={cat.id} disabled={items.some((i, idx) => i.categoryId === cat.id && idx !== index)} className="text-gray-900">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nominal Budget (Rp)</label>
                  <input
                    type="text"
                    value={item.amount}
                    onChange={(e) => handleUpdateItem(index, "amount", e.target.value)}
                    placeholder="Contoh: 1.000.000"
                    className="w-full bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            {items.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
                <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-400">Belum ada kategori ditambahkan</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl text-gray-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" /> Tambah Kategori
            </button>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-3 md:gap-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-3 md:py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-8 py-3 md:py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : <><Save className="w-4 h-4" /> Simpan Alokasi</>}
            </button>
          </div>
        </form>
      </GlassCard>

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmRemove}
        title="Hapus Kategori?"
        message="Apakah Anda yakin ingin menghapus kategori ini dari alokasi dana? Anggaran untuk kategori ini akan dihilangkan."
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}
