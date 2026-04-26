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
}

export default function BudgetActionModal({ 
  isOpen, 
  onClose, 
  periodId, 
  allCategories, 
  existingItems,
  onSuccess 
}: BudgetActionModalProps) {
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<{ categoryId: string; amount: string }[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    if (existingItems.length > 0) {
      setItems(existingItems.map(item => ({
        categoryId: item.categoryId,
        amount: formatRupiah(item.amount)
      })));
    } else {
      setItems([]);
    }
  }, [existingItems]);

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
      (newItems[index] as any)[field] = formatRupiah(value);
    } else {
      (newItems[index] as any)[field] = value;
    }
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const validItems = items.filter(i => i.categoryId && i.amount && parseFloat(unformatRupiah(i.amount)) > 0);
    if (validItems.length === 0 && items.length > 0) {
      toast.error("Harap isi nominal alokasi dengan benar");
      return;
    }

    startTransition(async () => {
      try {
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

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[12px] animate-in fade-in duration-500" onClick={onClose} />
      
      <GlassCard className="relative w-full max-w-2xl bg-white dark:bg-[#1E1E2D] p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Edit Alokasi Dana</h3>
            <p className="text-gray-500 text-xs font-medium mt-1 uppercase tracking-widest">Atur batas pengeluaran per kategori</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white dark:hover:bg-gray-800 rounded-2xl transition-all active:scale-90 shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
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
                  className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all"
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

          <div className="mt-10 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-8 py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
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
