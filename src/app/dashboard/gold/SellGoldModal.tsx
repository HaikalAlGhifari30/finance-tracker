"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { X, Banknote, Calendar, FileText, Loader2, DollarSign, TrendingUp, TrendingDown, Info } from "lucide-react";
import { sellGoldAsset } from "@/app/actions/gold";
import { formatRupiah } from "@/lib/format";

interface SellGoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: any;
  onSuccess?: () => void;
}

export default function SellGoldModal({ isOpen, onClose, asset, onSuccess }: SellGoldModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [salePrice, setSalePrice] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  useEffect(() => {
    setMounted(true);
    if (asset) {
      setSalePrice("");
      setSaleDate(new Date().toISOString().split("T")[0]);
      setNote("");
    }
  }, [asset]);

  if (!isOpen || !mounted || !asset) return null;

  const rawSalePrice = Number(salePrice.replace(/[^0-9]/g, ""));
  const purchasePrice = Number(asset.purchasePrice || 0);
  const diff = rawSalePrice - purchasePrice;
  const isProfit = diff >= 0;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSalePrice(formatRupiah(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(rawSalePrice) || rawSalePrice <= 0) {
      alert("Mohon masukkan harga jual dengan benar.");
      return;
    }

    startTransition(async () => {
      const res = await sellGoldAsset(asset.id, {
        salePrice: rawSalePrice,
        saleDate,
        note,
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(res.error || "Gagal mencatat penjualan emas");
      }
    });
  };

  const content = (
    <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center md:p-4 text-left">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[12px] animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative w-full md:max-w-lg bg-white dark:bg-[#1E1E2D] rounded-t-[32px] md:rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom md:zoom-in-95 duration-300 flex flex-col max-h-[85dvh] md:max-h-[90vh]">
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600/80" />
        </div>

        {/* Modal Header */}
        <div className="px-5 md:px-10 py-3.5 md:py-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-900/10">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="p-2.5 md:p-4 rounded-[16px] md:rounded-[24px] bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
              <DollarSign className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="font-black text-base md:text-2xl text-gray-900 dark:text-gray-100 tracking-tight">
                Jual Emas Physical
              </h3>
              <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Catatan Penjualan & Histori</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 md:p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl">
            <X className="w-5 h-5 md:w-7 md:h-7" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 md:p-10 space-y-4 md:space-y-6 text-left overflow-y-auto custom-scrollbar pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {/* Target Asset Summary Box */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-[20px] border border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Aset Yang Dijual</p>
              <h4 className="font-black text-sm md:text-base text-gray-900 dark:text-gray-100 mt-0.5">
                {asset.productName || `${asset.type === 'LOGAM_MULIA' ? 'Logam Mulia' : 'Perhiasan'} ${asset.weight}g`}
              </h4>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                Berat: {asset.weight} gram • Pemilik: {asset.memberName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Harga Beli</p>
              <p className="font-black text-sm text-amber-600">Rp {purchasePrice.toLocaleString("id-ID")}</p>
            </div>
          </div>

          <div className="space-y-3.5 md:space-y-5">
            {/* Harga Jual */}
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Harga Penjualan (Rp)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-base text-emerald-600">Rp</span>
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="off"
                  name="gold_sell_price"
                  value={salePrice}
                  onChange={handlePriceChange}
                  placeholder="0"
                  className="w-full pl-14 pr-4 py-3.5 md:py-4 rounded-[18px] md:rounded-[28px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500/50 transition-all font-black text-xl md:text-2xl text-emerald-600"
                />
              </div>
            </div>

            {/* Difference / Gain-Loss Box */}
            {rawSalePrice > 0 && (
              <div className={`p-4 rounded-[20px] border flex items-center justify-between transition-all ${
                isProfit 
                  ? "bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-50/60 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300"
              }`}>
                <div className="flex items-center gap-2">
                  {isProfit ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-rose-500" />}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Estimasi Selisih</p>
                    <p className="text-xs font-bold">{isProfit ? "Keuntungan (Profit)" : "Kerugian (Loss)"}</p>
                  </div>
                </div>
                <p className="font-black text-base md:text-lg tracking-tight">
                  {isProfit ? "+" : ""}Rp {diff.toLocaleString("id-ID")}
                </p>
              </div>
            )}

            {/* Tanggal & Catatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Tanggal Jual</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500/50 transition-all font-bold text-xs md:text-sm"
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Catatan (Opsional)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="cth: Dijual ke toko emas..."
                    className="w-full pl-11 pr-4 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500/50 transition-all font-medium text-xs md:text-sm"
                  />
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Standalone module disclaimer note */}
            <div className="p-3 bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                Penjualan emas ini hanya menjadi catatan histori modul Emas dan <strong>tidak akan otomatis menambah saldo rekening</strong> FinTrack.
              </p>
            </div>

          </div>

          {/* Action Buttons */}
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
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Konfirmasi Jual"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
