"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Filter, Award, Scale, Banknote, Trash2, Edit3, DollarSign, Calendar, Info, CheckCircle2, History, ChevronRight, X, MoreVertical, SlidersHorizontal, RotateCcw, RefreshCw } from "lucide-react";
import { getMemberTagClass } from "@/lib/memberColors";
import { MemberFilter } from "@/components/MemberFilter";
import { GoldBarIcon } from "@/components/icons/GoldBarIcon";
import GoldModal from "./GoldModal";
import SellGoldModal from "./SellGoldModal";
import GoldDetailModal from "./GoldDetailModal";
import { deleteGoldAsset } from "@/app/actions/gold";
import { getGoldAssetIcon } from "@/lib/goldIcons";
import { GoldCoinIcon, GoldRingIcon } from "@/components/icons/GoldAssetIcons";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatPurityPercentage } from "@/lib/format";
import { createPortal } from "react-dom";

interface GoldClientPageProps {
  initialAssets: any[];
  members: any[];
}

export default function GoldClientPage({ initialAssets, members }: GoldClientPageProps) {
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>(initialAssets);

  // Sync state with server props when initialAssets revalidate
  useEffect(() => {
    setAssets(initialAssets);
  }, [initialAssets]);
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("OWNED"); // OWNED | SOLD | all

  // Hero Card Flip View Toggle
  const [isSummaryFlipped, setIsSummaryFlipped] = useState(false);

  // Temp state for bottom sheet filter
  const [tempType, setTempType] = useState<string>("all");

  // Dropdowns & Modals state
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isGoldModalOpen, setIsGoldModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<any>(null);

  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [targetSellAsset, setTargetSellAsset] = useState<any>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailAsset, setDetailAsset] = useState<any>(null);

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filtered Assets based on Member, Type, and Status
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Member filter
      if (selectedMember !== "all" && asset.memberId !== selectedMember) {
        return false;
      }
      // Type filter
      if (selectedType !== "all" && asset.type !== selectedType) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "all" && asset.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [assets, selectedMember, selectedType, selectedStatus]);

  // Summary Metrics (ONLY for status OWNED, filtered by active member)
  const summaryMetrics = useMemo(() => {
    const ownedAssets = assets.filter((asset) => {
      if (asset.status !== "OWNED") return false;
      if (selectedMember !== "all" && asset.memberId !== selectedMember) return false;
      return true;
    });

    const totalWeight = ownedAssets.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
    const totalCount = ownedAssets.length;
    const totalPurchaseCost = ownedAssets.reduce((acc, curr) => acc + (Number(curr.purchasePrice) || 0), 0);

    return {
      totalWeight,
      totalCount,
      totalPurchaseCost,
    };
  }, [assets, selectedMember]);

  // Category Breakdown Metrics for Flipped Card View
  const breakdownMetrics = useMemo(() => {
    const ownedAssets = assets.filter((asset) => {
      if (asset.status !== "OWNED") return false;
      if (selectedMember !== "all" && asset.memberId !== selectedMember) return false;
      return true;
    });

    const logamMulia = ownedAssets.filter(a => a.type === "LOGAM_MULIA");
    const perhiasan = ownedAssets.filter(a => a.type === "PERHIASAN");

    const lmWeight = logamMulia.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
    const lmCost = logamMulia.reduce((acc, curr) => acc + (Number(curr.purchasePrice) || 0), 0);

    const pWeight = perhiasan.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
    const pCost = perhiasan.reduce((acc, curr) => acc + (Number(curr.purchasePrice) || 0), 0);

    return {
      lmCount: logamMulia.length,
      lmWeight,
      lmCost,
      pCount: perhiasan.length,
      pWeight,
      pCost,
    };
  }, [assets, selectedMember]);

  const handleOpenAdd = () => {
    setModalInitialData(null);
    setIsGoldModalOpen(true);
  };

  const handleOpenEdit = (asset: any) => {
    setModalInitialData(asset);
    setIsGoldModalOpen(true);
  };

  const handleOpenSell = (asset: any) => {
    setTargetSellAsset(asset);
    setIsSellModalOpen(true);
  };

  const handleOpenDetail = (asset: any) => {
    setDetailAsset(asset);
    setIsDetailModalOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    const res = await deleteGoldAsset(deleteTargetId);
    if (res.success) {
      setAssets((prev) => prev.filter((a) => a.id !== deleteTargetId));
      setDeleteTargetId(null);
      router.refresh();
    } else {
      alert(res.error || "Gagal menghapus aset emas");
    }
  };

  return (
    <div className="space-y-4 md:space-y-5 pb-3">
      {/* 1. Header Breadcrumb */}
      <div className="pb-2.5 border-b border-gray-100 dark:border-gray-800/60">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
            <span>Emas</span>
            <GoldCoinIcon className="w-6 h-6 md:w-8 md:h-8 shrink-0" />
          </h1>
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="p-1 text-gray-400 hover:text-amber-500 transition-colors rounded-lg"
            title="Informasi Fitur Emas"
          >
            <Info className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
        <p className="text-xs md:text-sm font-bold text-gray-400 dark:text-gray-500 mt-0.5">
          Kelola dan pantau aset emas Anda.
        </p>
      </div>

      {/* 2. Member Filter + Tambah Emas (Side-by-side row on Mobile & Desktop) */}
      <div className="flex items-center justify-between gap-2 md:gap-3 w-full pb-3 border-b border-gray-100 dark:border-gray-800/60">
        <div className="flex-1 min-w-0 sm:max-w-[220px]">
          <MemberFilter
            members={members}
            value={selectedMember}
            onChange={setSelectedMember}
            className="w-full"
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex-1 sm:flex-none min-w-0 flex items-center justify-center gap-1.5 md:gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black px-3.5 md:px-6 py-3 rounded-2xl shadow-md shadow-amber-500/20 transition-all active:scale-95 text-xs whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[3] shrink-0" />
          <span className="truncate">Tambah Emas</span>
        </button>
      </div>

      {/* 3. HERO SUMMARY CARD (PORTFOLIO SUMMARY - Dynamic Auto-Fitting 3D Card Flip) */}
      <div
        onClick={() => setIsSummaryFlipped(!isSummaryFlipped)}
        className={`w-full max-w-3xl cursor-pointer select-none [perspective:1000px] transition-all duration-300 group mt-1 mb-3 md:mt-2 md:mb-5 ${
          isSummaryFlipped ? "min-h-[200px]" : "min-h-[115px]"
        }`}
      >
        <div
          className={`w-full relative transition-all duration-500 [transform-style:preserve-3d] ${
            isSummaryFlipped ? "[transform:rotateY(180deg)] min-h-[200px]" : "[transform:rotateY(0deg)] min-h-[115px]"
          }`}
        >
          {/* FRONT FACE (TOTAL EMAS OVERVIEW - Compact & Tight 115px) */}
          <div className="w-full min-h-[115px] bg-gradient-to-br from-[#1E1E2D] via-[#242436] to-[#1E1E2D] rounded-[24px] md:rounded-[32px] p-4 md:p-5 border border-amber-500/30 shadow-lg relative overflow-hidden [backface-visibility:hidden] text-white flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] md:text-[11px] font-black text-amber-400 uppercase tracking-[0.2em]">Total Emas</p>
                  <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5" /> Flip rincian ↻
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-3xl md:text-4xl font-black text-amber-400 tracking-tight">
                    {summaryMetrics.totalWeight.toLocaleString("id-ID", { maximumFractionDigits: 3 })}
                  </h2>
                  <span className="text-sm md:text-base font-bold text-gray-300">gram</span>
                </div>
                
                {/* Inline Summary Sub-text (Clean & Minimal) */}
                <p className="text-xs font-bold text-gray-400 mt-1.5">
                  <span>{summaryMetrics.totalCount} aset aktif</span>
                </p>
              </div>

              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <GoldBarIcon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
          </div>

          {/* BACK FACE (RINCIAN KATEGORI & DANA PEMBELIAN - Generous 200px height & bottom padding) */}
          <div className="w-full min-h-[200px] absolute inset-0 bg-gradient-to-br from-[#1E1E2D] via-[#242436] to-[#1E1E2D] rounded-[24px] md:rounded-[32px] p-4 md:p-6 border border-amber-500/30 shadow-lg overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] text-white flex flex-col justify-between pb-6">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center border-b border-gray-700/60 pb-2">
                <div>
                  <p className="text-[10px] md:text-[11px] font-black text-amber-400 uppercase tracking-[0.2em]">Rincian Kategori Emas</p>
                  <p className="text-[10px] md:text-[11px] font-bold text-gray-300 mt-0.5">
                    Dana Pembelian: <span className="text-amber-400 font-black">Rp {summaryMetrics.totalPurchaseCost.toLocaleString("id-ID")}</span>
                  </p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                  <RefreshCw className="w-2.5 h-2.5" /> Flip total ↻
                </span>
              </div>

              <div className="space-y-2 pt-1 pb-2">
                {/* Logam Mulia Breakdown */}
                <div className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-gray-900/70 border border-amber-500/20">
                  <div className="flex items-center gap-2.5">
                    <GoldCoinIcon className="w-5 h-5 shrink-0" />
                    <div>
                      <span className="text-xs md:text-sm font-black text-white">Logam Mulia</span>
                      <span className="text-[10px] md:text-xs font-bold text-gray-400 ml-1.5">
                        ({breakdownMetrics.lmCount} aset · {breakdownMetrics.lmWeight.toLocaleString("id-ID", { maximumFractionDigits: 3 })}g)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm font-black text-amber-400">
                    Rp {breakdownMetrics.lmCost.toLocaleString("id-ID")}
                  </p>
                </div>

                {/* Perhiasan Breakdown */}
                <div className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-gray-900/70 border border-amber-500/20">
                  <div className="flex items-center gap-2.5">
                    <GoldRingIcon className="w-5 h-5 shrink-0" />
                    <div>
                      <span className="text-xs md:text-sm font-black text-white">Perhiasan</span>
                      <span className="text-[10px] md:text-xs font-bold text-gray-400 ml-1.5">
                        ({breakdownMetrics.pCount} aset · {breakdownMetrics.pWeight.toLocaleString("id-ID", { maximumFractionDigits: 3 })}g)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm font-black text-amber-400">
                    Rp {breakdownMetrics.pCost.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FILTER ROW (STATUS DROPDOWN PILL + JENIS EMAS FILTER PILL IN ONE ROW) */}
      <div className="flex items-center justify-between gap-2.5 w-full mt-2 md:mt-3">
        {/* Status Filter Dropdown Pill */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1E1E2D] border border-gray-100 dark:border-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all text-xs font-bold text-gray-700 dark:text-gray-300 justify-between"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${selectedStatus === "OWNED" ? 'bg-amber-500' : (selectedStatus === "SOLD" ? 'bg-emerald-500' : 'bg-blue-500')}`} />
              <span className="font-bold">{selectedStatus === "OWNED" ? "Dimiliki" : (selectedStatus === "SOLD" ? "Terjual" : "Semua Status")}</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-90' : ''}`} />
          </button>

          {isStatusDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
              <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#1E1E2D] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-1.5 mb-1 border-b border-gray-50 dark:border-gray-800/50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status Aset</span>
                </div>
                <button
                  onClick={() => { setSelectedStatus("OWNED"); setIsStatusDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors ${selectedStatus === 'OWNED' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Dimiliki</span>
                  </div>
                  {selectedStatus === 'OWNED' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />}
                </button>
                <button
                  onClick={() => { setSelectedStatus("SOLD"); setIsStatusDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors ${selectedStatus === 'SOLD' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Terjual</span>
                  </div>
                  {selectedStatus === 'SOLD' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
                <button
                  onClick={() => { setSelectedStatus("all"); setIsStatusDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors ${selectedStatus === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Semua</span>
                  </div>
                  {selectedStatus === 'all' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Jenis Emas Filter Button (Opens Bottom Sheet) */}
        <button
          onClick={() => { setTempType(selectedType); setIsTypeFilterOpen(true); }}
          className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            selectedType !== "all" 
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm"
              : "bg-white dark:bg-[#1E1E2D] border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
          <span>{selectedType === "LOGAM_MULIA" ? "Logam Mulia" : (selectedType === "PERHIASAN" ? "Perhiasan" : "Semua Jenis")}</span>
          {selectedType !== "all" && (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>
      </div>

      {/* 5. Section Header "EMAS SAYA" */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Emas Saya
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-400">
            {filteredAssets.length} aset
          </span>
        </div>
      </div>

      {/* 6. INDIVIDUAL ASSET CARDS (NEUTRAL & COMPACT) */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1E2D] rounded-[24px] p-8 text-center border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
          <div className="flex justify-center">
            <GoldCoinIcon className="w-10 h-10" />
          </div>
          <div className="max-w-xs mx-auto space-y-1">
            <h3 className="font-black text-sm text-gray-900 dark:text-gray-100">Belum ada aset emas</h3>
            <p className="text-xs text-gray-400 font-medium">
              Tambahkan emas pertama Anda untuk mulai mencatat aset.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black px-4 py-2.5 rounded-xl shadow-md text-xs active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Emas</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredAssets.map((asset) => {
            const isOwned = asset.status === "OWNED";
            const memberTagClass = getMemberTagClass(asset.memberName, "sm");
            const purchasePrice = Number(asset.purchasePrice || 0);

            return (
              <div
                key={asset.id}
                onClick={() => handleOpenDetail(asset)}
                className="bg-white dark:bg-[#1E1E2D]/80 rounded-[20px] md:rounded-[24px] p-4 border border-gray-100 dark:border-gray-800/60 shadow-none hover:border-amber-500/40 transition-all cursor-pointer space-y-2.5 group"
              >
                {/* Row 1: Icon + Title + Status Badge */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl shrink-0">
                      {getGoldAssetIcon(asset)}
                    </span>
                    <div>
                      <h4 className="font-black text-sm text-gray-900 dark:text-gray-100 tracking-tight group-hover:text-amber-500 transition-colors">
                        {asset.productName || (asset.type === "LOGAM_MULIA" ? `${asset.brand || 'Antam'} ${asset.weight}g` : `${asset.jewelryType || 'Perhiasan'} Emas`)}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400">
                        {asset.type === "LOGAM_MULIA" ? `Logam Mulia • ${asset.brand || 'Antam'}` : `Perhiasan • ${formatPurityPercentage(asset.purity || '75%')}`}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider shrink-0 ${
                    isOwned 
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                    {isOwned ? "AKTIF" : "TERJUAL"}
                  </span>
                </div>

                {/* Row 2: Weight */}
                <div className="flex justify-between items-baseline pt-0.5">
                  <div>
                    <span className="font-black text-base text-gray-900 dark:text-gray-100">
                      {Number(asset.weight).toLocaleString("id-ID", { maximumFractionDigits: 3 })}
                    </span>
                    <span className="text-xs font-bold text-gray-400 ml-1">gram</span>
                  </div>
                </div>

                {/* Row 3: Member Tag + Date + Action Buttons */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                    <span className={memberTagClass}>
                      {asset.memberName || "Haikal"}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(asset.purchaseDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(asset);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      title="Detail Aset"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Modal for "Prinsip Fitur Emas" */}
      {isInfoModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 text-left">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-[12px] animate-in fade-in duration-300" onClick={() => setIsInfoModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#1E1E2D] rounded-[28px] p-6 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-base text-gray-900 dark:text-gray-100">Prinsip Fitur Emas</h3>
              </div>
              <button onClick={() => setIsInfoModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
              Modul Emas digunakan untuk mencatat aset emas fisik. Pembelian dan penjualan emas tidak otomatis mengubah saldo rekening, pemasukan, pengeluaran, tabungan, atau alokasi dana FinTrack.
            </p>
            <button
              onClick={() => setIsInfoModalOpen(false)}
              className="w-full py-2.5 bg-amber-500 text-white font-black rounded-xl text-xs shadow-md active:scale-95"
            >
              Mengerti
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Filter Jenis Emas Bottom Sheet */}
      {isTypeFilterOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-4 text-left">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-[12px] animate-in fade-in duration-300" onClick={() => setIsTypeFilterOpen(false)} />
          <div className="relative w-full sm:max-w-xs bg-white dark:bg-[#1E1E2D] rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 space-y-4">
            {/* Top Drag Indicator */}
            <div className="sm:hidden flex justify-center -mt-2 mb-1">
              <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800/80 pb-3">
              <div>
                <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-gray-100">Filter Jenis Emas</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Pilih jenis aset emas</p>
              </div>
              <div className="flex items-center gap-2">
                {tempType !== "all" && (
                  <button
                    onClick={() => setTempType("all")}
                    className="text-[10px] font-bold text-amber-500 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
                <button onClick={() => setIsTypeFilterOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setTempType("all")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${tempType === "all" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-500/30" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <span>Semua Jenis Emas</span>
                {tempType === "all" && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
              </button>
              <button
                onClick={() => setTempType("LOGAM_MULIA")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${tempType === "LOGAM_MULIA" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-500/30" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <span className="flex items-center gap-2">
                  <GoldCoinIcon className="w-4 h-4" /> Logam Mulia
                </span>
                {tempType === "LOGAM_MULIA" && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
              </button>
              <button
                onClick={() => setTempType("PERHIASAN")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${tempType === "PERHIASAN" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-500/30" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <span>💍 Perhiasan</span>
                {tempType === "PERHIASAN" && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedType(tempType);
                setIsTypeFilterOpen(false);
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl text-xs shadow-md active:scale-95 transition-all"
            >
              Terapkan
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Modals */}
      <GoldModal
        isOpen={isGoldModalOpen}
        onClose={() => setIsGoldModalOpen(false)}
        members={members}
        initialData={modalInitialData}
        onSuccess={handleSuccess}
      />

      <SellGoldModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        asset={targetSellAsset}
        onSuccess={handleSuccess}
      />

      <GoldDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        asset={detailAsset}
        onEdit={handleOpenEdit}
        onSell={handleOpenSell}
        onDelete={(id) => setDeleteTargetId(id)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Hapus Aset Emas"
        message="Apakah Anda yakin ingin menghapus data emas ini? Data yang dihapus tidak dapat dikembalikan."
        confirmLabel="Ya, Hapus"
      />
    </div>
  );
}
