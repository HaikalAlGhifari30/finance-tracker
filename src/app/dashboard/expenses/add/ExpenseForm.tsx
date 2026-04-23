"use client";

import { useState } from "react";
import { addExpense } from "@/app/actions/expenses";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export function ExpenseForm({ categories }: { categories: any[] }) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !date) return;
    
    setLoading(true);
    setError("");
    setSuccess(false);
    
    const parsedAmount = parseInt(amount.replace(/\D/g, ""), 10);
    
    const res = await addExpense(parsedAmount, categoryId, description, date);
    
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setAmount("");
      setDescription("");
    }
    
    setLoading(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val) {
      setAmount(parseInt(val, 10).toLocaleString("id-ID"));
    } else {
      setAmount("");
    }
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-red-500 mb-2">Anda belum memiliki kategori pengeluaran.</p>
        <a href="/dashboard/categories" className="text-emerald-600 font-semibold underline">Buat Kategori Dulu</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-2xl border border-green-200">
          Pengeluaran berhasil dicatat!
        </div>
      )}
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-2xl">{error}</div>}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-[#1E1E2D]"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Total Nominal (Rp)</label>
        <input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          required
          placeholder="50.000"
          className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-lg text-emerald-700"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan / Rincian (Opsional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Makan siang dan kopi sore..."
          className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold py-4 px-4 rounded-2xl transition-all disabled:opacity-70 flex justify-center items-center gap-2 shadow-lg hover:shadow-xl"
      >
        {loading && <Loader2 className="animate-spin h-5 w-5" />}
        {loading ? "Menyimpan..." : "Simpan Pengeluaran"}
      </button>
    </form>
  );
}
