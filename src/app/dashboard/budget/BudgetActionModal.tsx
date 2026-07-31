"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Save, Plus, Trash2, AlertCircle, Lock, Unlock } from "lucide-react";
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
  const [items, setItems] = useState<{ categoryId: string; amount: string; locked: boolean }[]>([]);
  // Ref always holds the latest items — avoids stale closure in blur/submit handlers
  const itemsRef = useRef<{ categoryId: string; amount: string; locked: boolean }[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState<number | null>(null);

  // Keep ref in sync with state
  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    setMounted(true);
    setLocalTotalBudget(formatRupiah(totalBudget.toString()));
    if (existingItems.length > 0) {
      setItems(existingItems.map(item => ({
        categoryId: item.categoryId,
        amount: formatRupiah(Number(item.amount)),
        locked: false  // All start unlocked; user locking happens on blur
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
    setItems([...items, { categoryId: availableCategory.id, amount: "", locked: false }]);
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
    // Use functional update to always work on latest state (avoids stale closure)
    setItems(prev => {
      const newItems = prev.map(item => ({ ...item }));
      if (field === "amount") {
        newItems[index].amount = formatRupiah(value);
      } else {
        newItems[index].categoryId = value;
      }
      return newItems;
    });
  };

  const roundToK = (val: number) => Math.round(val / 1000) * 1000;

  // Distribute `budget` across `indices` proportionally (or equally if sumCurrent=0).
  // Returns new amounts as integers (rounded to 1000). Last index absorbs remainder.
  const distributeRemaining = (
    budget: number,
    indices: number[],
    currentItems: typeof items
  ): Record<number, number> => {
    const result: Record<number, number> = {};
    if (indices.length === 0) return result;

    const sumCurrent = indices.reduce(
      (s, i) => s + (Math.round(parseFloat(unformatRupiah(currentItems[i].amount)) || 0)), 0
    );

    let distributed = 0;
    indices.forEach((i, idx) => {
      let newVal: number;
      const isLast = idx === indices.length - 1;
      if (isLast) {
        newVal = Math.max(0, budget - distributed);
      } else if (sumCurrent > 0) {
        const currentVal = Math.round(parseFloat(unformatRupiah(currentItems[i].amount)) || 0);
        newVal = roundToK(Math.round((currentVal / sumCurrent) * budget));
        if (newVal < 0) newVal = 0;
        distributed += newVal;
      } else {
        newVal = roundToK(Math.floor(budget / indices.length));
        distributed += newVal;
      }
      result[i] = newVal;
    });
    return result;
  };

  /**
   * onBlur handler for a budget amount field.
   * Uses setItems(prev=>) so it always reads the LATEST state (no stale closure).
   * - Locks the current field.
   * - Distributes remaining budget to all UNLOCKED fields proportionally.
   */
  const handleBlurAmount = (index: number) => {
    const targetBudgetVal = Math.round(parseFloat(unformatRupiah(localTotalBudget)) || 0);

    setItems(prevItems => {
      const thisVal = Math.round(parseFloat(unformatRupiah(prevItems[index].amount)) || 0);
      const newItems = prevItems.map(item => ({ ...item }));
      newItems[index].amount = formatRupiah(thisVal.toString());
      newItems[index].locked = true;

      const lockedSum = newItems.reduce(
        (s, item) => item.locked ? s + (Math.round(parseFloat(unformatRupiah(item.amount)) || 0)) : s, 0
      );
      const remaining = targetBudgetVal - lockedSum;
      const unlockedIndices = newItems.map((_, i) => i).filter(i => !newItems[i].locked);

      if (unlockedIndices.length > 0 && remaining >= 0) {
        const distributed = distributeRemaining(remaining, unlockedIndices, newItems);
        unlockedIndices.forEach(i => {
          newItems[i].amount = formatRupiah((distributed[i] ?? 0).toString());
        });
      }

      return newItems;
    });
  };

  // Unlock a single locked item (allow it to be freely distributed again)
  const handleUnlockItem = (index: number) => {
    setItems(prev => prev.map((item, i) => ({
      ...item,
      locked: i === index ? false : item.locked
    })));
    toast.info("Kunci dilepas. Nominal akan disesuaikan otomatis.");
  };

  // Bagi Rata: unlock all and distribute equally
  const handleAutoDistribute = () => {
    const targetBudgetVal = Math.round(parseFloat(unformatRupiah(localTotalBudget)) || 0);
    if (items.length === 0) return;
    const share = roundToK(Math.floor(targetBudgetVal / items.length));
    const newItems = items.map((item, idx) => ({
      ...item,
      locked: false,
      amount: formatRupiah((
        idx === items.length - 1
          ? Math.max(0, targetBudgetVal - share * (items.length - 1))
          : share
      ).toString())
    }));
    setItems(newItems);
    toast.success("Budget dibagi rata — semua kunci dilepas");
  };

  // Sesuaikan Proporsional: unlock all and scale proportionally
  const handleScaleProportionally = () => {
    const targetBudgetVal = Math.round(parseFloat(unformatRupiah(localTotalBudget)) || 0);
    const currentSum = items.reduce(
      (s, item) => s + (Math.round(parseFloat(unformatRupiah(item.amount)) || 0)), 0
    );
    if (currentSum === 0) { handleAutoDistribute(); return; }

    let distributedSoFar = 0;
    const newItems = items.map((item, idx) => {
      const currentVal = Math.round(parseFloat(unformatRupiah(item.amount)) || 0);
      let newVal: number;
      if (idx === items.length - 1) {
        newVal = Math.max(0, targetBudgetVal - distributedSoFar);
      } else {
        newVal = roundToK(Math.round((currentVal / currentSum) * targetBudgetVal));
        if (newVal < 0) newVal = 0;
        distributedSoFar += newVal;
      }
      return { ...item, locked: false, amount: formatRupiah(newVal.toString()) };
    });
    setItems(newItems);
    toast.success("Disesuaikan proporsional — semua kunci dilepas");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetBudgetVal = parseFloat(unformatRupiah(localTotalBudget)) || 0;
    if (targetBudgetVal > availableBalance) {
      toast.error(`Total budget melebihi saldo tersedia (Tersedia: Rp ${availableBalance.toLocaleString('id-ID')})`);
      return;
    }

    // Read from ref to get the LATEST state (not stale closure from submit event)
    const currentItems = itemsRef.current;
    const validItems = currentItems.filter(i =>
      i.categoryId && i.amount !== "" && parseFloat(unformatRupiah(i.amount)) > 0
    );
    const sumItems = validItems.reduce((sum, i) => sum + parseFloat(unformatRupiah(i.amount)), 0);

    if (Math.round(sumItems) !== Math.round(targetBudgetVal) && currentItems.length > 0) {
      toast.error(`Jumlah nominal kategori (Rp ${Math.round(sumItems).toLocaleString("id-ID")}) harus sama dengan Total Budget (Rp ${Math.round(targetBudgetVal).toLocaleString("id-ID")})`);
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
            
            {/* Warning banner when unbalanced */}
            {isBudgetUnbalanced && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-in fade-in duration-200">
                <div className="text-[10px] font-bold text-amber-800 dark:text-amber-400">
                  ⚠️ Total kategori (Rp {sumCategories.toLocaleString("id-ID")}) belum sesuai dengan Budget (Rp {targetBudgetNumber.toLocaleString("id-ID")})
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

            {/* Always-visible distribution buttons */}
            {items.length > 0 && !isBudgetUnbalanced && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleScaleProportionally}
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  ↕ Sesuaikan Proporsional
                </button>
                <button
                  type="button"
                  onClick={handleAutoDistribute}
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  ÷ Bagi Rata
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4 flex-1">
            {items.map((item, index) => (
              <div
                key={index}
                className={`flex flex-col sm:flex-row items-end gap-3 p-5 rounded-3xl border group transition-all ${
                  item.locked
                    ? "bg-amber-50/5 dark:bg-amber-950/10 border-amber-500/30 dark:border-amber-500/20"
                    : "bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 hover:border-emerald-500/30"
                }`}
              >
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pilih Kategori</label>
                  <select
                    value={item.categoryId}
                    onChange={(e) => handleUpdateItem(index, "categoryId", e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                  >
                    {allCategories.map((cat) => (
                      <option
                        key={cat.id}
                        value={cat.id}
                        disabled={items.some((i, idx) => i.categoryId === cat.id && idx !== index)}
                      >
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Nominal Budget (Rp)
                  </label>
                  <input
                    type="text"
                    value={item.amount}
                    onChange={(e) => handleUpdateItem(index, "amount", e.target.value)}
                    onBlur={() => handleBlurAmount(index)}
                    placeholder="Contoh: 1.000.000"
                    className={`w-full bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white border focus:outline-none focus:ring-2 transition-all ${
                      item.locked
                        ? "border-amber-400/50 focus:ring-amber-500/20"
                        : "border-gray-200 dark:border-gray-700 focus:ring-emerald-500/20"
                    }`}
                  />
                </div>

                {/* Lock / Unlock toggle button */}
                <button
                  type="button"
                  onClick={() => item.locked ? handleUnlockItem(index) : handleBlurAmount(index)}
                  title={item.locked ? "Klik untuk buka kunci (nilai bisa berubah)" : "Klik untuk kunci nilai ini"}
                  className={`p-3 rounded-2xl transition-all shrink-0 ${
                    item.locked
                      ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                      : "text-gray-300 dark:text-gray-600 hover:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {item.locked
                    ? <Lock className="w-5 h-5" />
                    : <Unlock className="w-5 h-5" />
                  }
                </button>

                {/* Delete button */}
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
