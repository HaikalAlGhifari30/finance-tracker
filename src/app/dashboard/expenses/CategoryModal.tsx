"use client";

import { useState, useTransition } from "react";
import { X, Loader2, ListPlus, Trash2, Award } from "lucide-react";
import { addCategory, deleteCategory } from "@/app/actions/categories";
import { createPortal } from "react-dom";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
}

const isSaving = (name?: string) => name?.toLowerCase() === "tabungan";

export default function CategoryModal({ isOpen, onClose, categories }: Props) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError("");
    startTransition(async () => {
      const res = await addCategory(name.trim());
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        setName("");
        toast.success("Kategori berhasil ditambahkan");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kategori ini? Pengeluaran dengan kategori ini akan tetap ada namun tanpa nama kategori.")) return;
    const res = await deleteCategory(id);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Kategori berhasil dihapus");
    }
  };

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[6px] animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white dark:bg-[#1E1E2D] rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        <div className="px-10 py-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl">
              <ListPlus className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-black text-2xl text-gray-900 dark:text-gray-100 tracking-tight">Manajemen Kategori</h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">Atur pengelompokan pengeluaran Anda</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10 space-y-10 overflow-y-auto no-scrollbar text-left">
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Buat Kategori Baru</h4>
            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="cth: Makan, Tabungan..."
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500/50 transition-all font-bold"
                />
                {isSaving(name) && <Award className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 animate-pulse" />}
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-emerald-500/20 disabled:opacity-70 transition-all active:scale-95 whitespace-nowrap"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tambah"}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Daftar Kategori</h4>
            {categories.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[32px]">
                <p className="text-gray-400 font-bold italic">Belum ada kategori yang terdaftar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((cat) => {
                  const special = isSaving(cat.name);
                  return (
                    <div
                      key={cat.id}
                      className={`flex items-center justify-between p-5 rounded-[24px] border-2 transition-all group ${special
                          ? 'bg-amber-50/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 shadow-md shadow-amber-500/10'
                          : 'bg-white dark:bg-gray-900/50 border-gray-50 dark:border-gray-800 hover:border-emerald-500/30'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {special && <Award className="w-4 h-4 text-amber-600" />}
                        <span className={`font-black text-sm ${special ? 'text-amber-700 dark:text-amber-400' : 'text-gray-800 dark:text-gray-200'}`}>
                          {cat.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-gray-400 hover:text-rose-500 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
