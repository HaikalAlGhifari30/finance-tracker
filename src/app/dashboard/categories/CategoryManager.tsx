"use client";

import { useState } from "react";
import { addCategory, deleteCategory } from "@/app/actions/categories";
import { Loader2, Plus, Trash2 } from "lucide-react";

export function CategoryManager({ initialCategories }: { initialCategories: any[] }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    setError("");
    
    const res = await addCategory(name.trim());
    if (res.error) setError(res.error);
    else setName("");
    
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kategori ini? Data pengeluaran terkait mungkin terpengaruh.")) return;
    await deleteCategory(id);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama Kategori (Makan, Minum...)"
          className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <button 
          disabled={loading}
          type="submit" 
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-medium flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Tambah
        </button>
      </form>
      
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
        {initialCategories.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Belum ada kategori yang dibuat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800 dark:bg-black">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-300 uppercase tracking-widest">Nama Kategori</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-300 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-gray-800">
                {initialCategories.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-700 dark:text-gray-200 uppercase text-sm">{cat.name}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
