"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Award, Scale, Banknote, Calendar, User, FileText, Trash2, Edit3, DollarSign, TrendingUp, TrendingDown, Info } from "lucide-react";
import { getMemberTagClass } from "@/lib/memberColors";

interface GoldDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: any;
  onEdit?: (asset: any) => void;
  onSell?: (asset: any) => void;
  onDelete?: (id: string) => void;
}

export default function GoldDetailModal({
  isOpen,
  onClose,
  asset,
  onEdit,
  onSell,
  onDelete,
}: GoldDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !asset) return null;

  const isOwned = asset.status === "OWNED";
  const purchasePrice = Number(asset.purchasePrice || 0);
  const salePrice = Number(asset.salePrice || 0);
  const diff = salePrice - purchasePrice;
  const isProfit = diff >= 0;
  const memberTagClass = getMemberTagClass(asset.memberName, "sm");

  const content = (
    <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center md:p-4 text-left">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[12px] animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative w-full md:max-w-lg bg-white dark:bg-[#1E1E2D] rounded-t-[32px] md:rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom md:zoom-in-95 duration-300 flex flex-col max-h-[85dvh] md:max-h-[90vh]">
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600/80" />
        </div>

        {/* Modal Header */}
        <div className="px-5 md:px-8 py-4 border-b border-gray-100 dark:border-gray-800/80 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl text-2xl flex items-center justify-center ${
              asset.type === "LOGAM_MULIA" 
                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-500" 
                : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500"
            }`}>
              {asset.type === "LOGAM_MULIA" ? "🪙" : "💍"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base md:text-xl text-gray-900 dark:text-gray-100 tracking-tight">
                  {asset.productName || (asset.type === "LOGAM_MULIA" ? `${asset.brand || 'Antam'} ${asset.weight}g` : `${asset.jewelryType || 'Perhiasan'} Emas`)}
                </h3>
              </div>
              <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                {asset.type === "LOGAM_MULIA" ? `Logam Mulia • ${asset.brand || 'Antam'}` : `Perhiasan • ${asset.purity || '75%'}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detail Content */}
        <div className="p-5 md:p-8 space-y-5 overflow-y-auto custom-scrollbar pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {/* Status Badge & Main Weight/Price Banner */}
          <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-500/10 border border-amber-500/20 rounded-[24px] flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Berat Aset</p>
              <h4 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight mt-0.5">
                {Number(asset.weight).toLocaleString("id-ID", { maximumFractionDigits: 3 })} <span className="text-sm font-bold text-gray-400">gram</span>
              </h4>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isOwned 
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30" 
                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                {isOwned ? "DIMILIKI" : "TERJUAL"}
              </span>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Spesifikasi & Info Aset</h5>
            <div className="bg-gray-50 dark:bg-gray-900/60 rounded-[20px] p-4 border border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/60 text-xs">
                <span className="font-bold text-gray-400 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Pemilik:
                </span>
                <span className={memberTagClass}>{asset.memberName || "Haikal"}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/60 text-xs">
                <span className="font-bold text-gray-400 flex items-center gap-2">
                  <Banknote className="w-3.5 h-3.5 text-emerald-500" /> Harga Beli (Modal):
                </span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  Rp {purchasePrice.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/60 text-xs">
                <span className="font-bold text-gray-400 flex items-center gap-2">
                  <Award className="w-3.5 h-3.5" /> Jenis Emas:
                </span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {asset.type === "LOGAM_MULIA" ? "Logam Mulia" : "Perhiasan"}
                </span>
              </div>

              {asset.brand && (
                <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/60 text-xs">
                  <span className="font-bold text-gray-400">Brand / Toko:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{asset.brand}</span>
                </div>
              )}

              {asset.type === "PERHIASAN" && (
                <>
                  {asset.jewelryType && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/60 text-xs">
                      <span className="font-bold text-gray-400">Jenis Perhiasan:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{asset.jewelryType}</span>
                    </div>
                  )}
                  {asset.purity && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/60 text-xs">
                      <span className="font-bold text-gray-400">Kadar Emas:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{asset.purity}</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/60 text-xs">
                <span className="font-bold text-gray-400 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Tanggal Pembelian:
                </span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {new Date(asset.purchaseDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>

              {asset.note && (
                <div className="py-1 text-xs">
                  <span className="font-bold text-gray-400 block mb-1">Catatan:</span>
                  <p className="text-gray-700 dark:text-gray-300 italic bg-white dark:bg-gray-800/80 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/60">
                    "{asset.note}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sold History Details */}
          {!isOwned && (
            <div className="space-y-2">
              <h5 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest px-1">Histori Penjualan</h5>
              <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[20px] p-4 border border-emerald-200/50 dark:border-emerald-800/30 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-500">Harga Jual:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    Rp {salePrice.toLocaleString("id-ID")}
                  </span>
                </div>
                {asset.saleDate && (
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-500">Tanggal Jual:</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {new Date(asset.saleDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-emerald-200/40 dark:border-emerald-800/30">
                  <span className="font-bold text-gray-500">Selisih (Profit / Loss):</span>
                  <span className={`font-black text-sm ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {isProfit ? "+" : ""}Rp {diff.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-row gap-2.5">
            {isOwned && onSell && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSell(asset);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                <span>Jual Emas</span>
              </button>
            )}

            {isOwned && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(asset);
                }}
                className="px-4 py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-black rounded-2xl text-xs transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(asset.id);
                }}
                className="px-4 py-3.5 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-black rounded-2xl text-xs transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
