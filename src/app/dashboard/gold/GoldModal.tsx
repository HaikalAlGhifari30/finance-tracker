"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { X, Award, Banknote, Calendar, FileText, Loader2, Sparkles, User, Tag, ShieldCheck } from "lucide-react";
import { createGoldAsset, updateGoldAsset } from "@/app/actions/gold";
import { formatRupiah } from "@/lib/format";

interface GoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: any[];
  initialData?: any;
  onSuccess?: () => void;
}

export default function GoldModal({ isOpen, onClose, members, initialData, onSuccess }: GoldModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(initialData);

  const [memberId, setMemberId] = useState("");
  const [type, setType] = useState<"LOGAM_MULIA" | "PERHIASAN">("LOGAM_MULIA");
  const [brand, setBrand] = useState("");
  const [productName, setProductName] = useState("");
  const [jewelryType, setJewelryType] = useState("Cincin");
  const STANDARD_PURITY_OPTIONS = [
    "37.5%", "42%", "58.5%", "70%", "75%", "80%", "83.3%", "87.5%", "91.6%", "95.8%", "99.9%"
  ];

  const [puritySelect, setPuritySelect] = useState("75%");
  const [customPurity, setCustomPurity] = useState("");
  const [weight, setWeight] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialData) {
      setMemberId(initialData.memberId || "");
      setType(initialData.type || "LOGAM_MULIA");
      setBrand(initialData.brand || "");
      setProductName(initialData.productName || "");
      setJewelryType(initialData.jewelryType || "Cincin");
      
      const initPurity = initialData.purity || "75%";
      if (STANDARD_PURITY_OPTIONS.includes(initPurity)) {
        setPuritySelect(initPurity);
        setCustomPurity("");
      } else {
        setPuritySelect("CUSTOM");
        setCustomPurity(initPurity);
      }

      setWeight(initialData.weight ? String(initialData.weight) : "");
      setPurchasePrice(initialData.purchasePrice ? formatRupiah(String(initialData.purchasePrice)) : "");
      setPurchaseDate(initialData.purchaseDate ? initialData.purchaseDate.split("T")[0] : new Date().toISOString().split("T")[0]);
      setNote(initialData.note || "");
    } else {
      setMemberId(members && members.length > 0 ? members[0].id : "");
      setType("LOGAM_MULIA");
      setBrand("Antam");
      setProductName("");
      setJewelryType("Cincin");
      setPuritySelect("75%");
      setCustomPurity("");
      setWeight("");
      setPurchasePrice("");
      setPurchaseDate(new Date().toISOString().split("T")[0]);
      setNote("");
    }
  }, [initialData, isOpen, members]);

  if (!isOpen || !mounted) return null;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPurchasePrice(formatRupiah(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawPrice = Number(purchasePrice.replace(/[^0-9]/g, ""));
    const numWeight = Number(weight.replace(",", "."));

    if (!memberId || isNaN(rawPrice) || rawPrice <= 0 || isNaN(numWeight) || numWeight <= 0) {
      alert("Mohon lengkapi data dengan benar.");
      return;
    }

    startTransition(async () => {
      const finalPurity = puritySelect === "CUSTOM" ? (customPurity || "Karat Custom") : puritySelect;

      const payload = {
        memberId,
        type,
        brand: type === "LOGAM_MULIA" ? (brand || "Antam") : (brand || undefined),
        productName: type === "LOGAM_MULIA" ? (productName || `${brand || "Antam"} ${numWeight} gram`) : `${jewelryType} Emas`,
        jewelryType: type === "PERHIASAN" ? jewelryType : undefined,
        purity: type === "PERHIASAN" ? finalPurity : undefined,
        weight: numWeight,
        purchasePrice: rawPrice,
        purchaseDate,
        note,
      };

      let res;
      if (isEdit && initialData) {
        res = await updateGoldAsset(initialData.id, payload);
      } else {
        res = await createGoldAsset(payload);
      }

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(res.error || "Gagal menyimpan aset emas");
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
        <div className="px-5 md:px-10 py-3.5 md:py-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="p-2.5 md:p-4 rounded-[16px] md:rounded-[24px] bg-amber-500 text-white shadow-lg shadow-amber-500/20">
              <Sparkles className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="font-black text-base md:text-2xl text-gray-900 dark:text-gray-100 tracking-tight">
                {isEdit ? "Edit Aset Emas" : "Tambah Emas Physical"}
              </h3>
              <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Physical Asset Tracker</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 md:p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl">
            <X className="w-5 h-5 md:w-7 md:h-7" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 md:p-10 space-y-4 md:space-y-6 text-left overflow-y-auto custom-scrollbar pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="space-y-3.5 md:space-y-5">

            {/* Pilihan Jenis Emas */}
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Jenis Emas</label>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 dark:bg-gray-900 rounded-[20px] border border-gray-200/50 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setType("LOGAM_MULIA")}
                  className={`py-2.5 md:py-3 rounded-[16px] font-black text-xs transition-all flex items-center justify-center gap-2 ${
                    type === "LOGAM_MULIA"
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  🪙 Logam Mulia
                </button>
                <button
                  type="button"
                  onClick={() => setType("PERHIASAN")}
                  className={`py-2.5 md:py-3 rounded-[16px] font-black text-xs transition-all flex items-center justify-center gap-2 ${
                    type === "PERHIASAN"
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  💍 Perhiasan
                </button>
              </div>
            </div>

            {/* Pemilik */}
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Pemilik Aset</label>
              <div className="relative group">
                <select
                  value={memberId}
                  required
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full pl-11 pr-8 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all appearance-none cursor-pointer font-bold text-xs md:text-sm"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Field khusus Logam Mulia vs Perhiasan */}
            {type === "LOGAM_MULIA" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Brand / Produsen</label>
                    <div className="relative group">
                      <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full pl-11 pr-8 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all appearance-none cursor-pointer font-bold text-xs md:text-sm"
                      >
                        <option value="Antam">Antam</option>
                        <option value="UBS">UBS</option>
                        <option value="Lotus Archi">Lotus Archi</option>
                        <option value="King Halim">King Halim</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                      <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Nama Produk / Ket.</label>
                    <input
                      type="text"
                      autoComplete="off"
                      name="gold_product_name"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="cth: Antam 5 gram (Red-Cert)"
                      className="w-full px-4 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-xs md:text-sm"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Jenis Perhiasan</label>
                    <select
                      value={jewelryType}
                      onChange={(e) => setJewelryType(e.target.value)}
                      className="w-full px-4 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-xs md:text-sm"
                    >
                      <option value="Cincin">Cincin</option>
                      <option value="Kalung">Kalung</option>
                      <option value="Gelang">Gelang</option>
                      <option value="Anting">Anting</option>
                      <option value="Liontin">Liontin</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Kadar / Karat Emas</label>
                    <select
                      value={puritySelect}
                      onChange={(e) => setPuritySelect(e.target.value)}
                      className="w-full px-4 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-xs md:text-sm"
                    >
                      <option value="37.5%">37.5% (9 Karat)</option>
                      <option value="42%">42% (10 Karat)</option>
                      <option value="58.5%">58.5% (14 Karat)</option>
                      <option value="70%">70% (16-17 Karat)</option>
                      <option value="75%">75% (18 Karat)</option>
                      <option value="80%">80% (19 Karat)</option>
                      <option value="83.3%">83.3% (20 Karat)</option>
                      <option value="87.5%">87.5% (21 Karat)</option>
                      <option value="91.6%">91.6% (22 Karat)</option>
                      <option value="95.8%">95.8% (23 Karat)</option>
                      <option value="99.9%">99.9% (24 Karat - Murni)</option>
                      <option value="CUSTOM">Lainnya (Input Sendiri)</option>
                    </select>

                    {puritySelect === "CUSTOM" && (
                      <input
                        type="text"
                        autoComplete="off"
                        name="gold_custom_purity"
                        value={customPurity}
                        onChange={(e) => setCustomPurity(e.target.value)}
                        placeholder="Masukkan Karat (cth: 85% atau 15 Karat)"
                        className="w-full mt-2 px-4 py-3 md:py-3.5 rounded-[16px] md:rounded-[20px] border-2 border-amber-500/40 bg-amber-50/10 dark:bg-amber-900/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500 font-bold text-xs md:text-sm"
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Brand / Toko (Opsional)</label>
                  <input
                    type="text"
                    autoComplete="off"
                    name="gold_brand_store"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="cth: Toko Emas Semar, UBS Jewelry, dll"
                    className="w-full px-4 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-xs md:text-sm"
                  />
                </div>
              </>
            )}

            {/* Berat & Harga Beli */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Berat (Gram)</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  autoComplete="off"
                  name="gold_weight_gram"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all font-black text-base md:text-lg text-amber-600"
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Harga Beli (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm text-amber-500">Rp</span>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    name="gold_buy_price"
                    value={purchasePrice}
                    onChange={handlePriceChange}
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all font-black text-base md:text-lg text-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* Tanggal & Catatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Tanggal Beli</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    autoComplete="off"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-xs md:text-sm"
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Catatan (Opsional)</label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="off"
                    name="gold_note_text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="cth: Pembelian pribadi, kado, dll..."
                    className="w-full pl-11 pr-4 py-3 md:py-4 rounded-[16px] md:rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500/50 transition-all font-medium text-xs md:text-sm"
                  />
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
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
              className="flex-[1.5] bg-amber-500 hover:bg-amber-600 text-white font-black py-3 md:py-5 rounded-[16px] md:rounded-[28px] shadow-xl shadow-amber-500/30 disabled:opacity-70 transition-all active:scale-95 flex items-center justify-center text-[10px] md:text-[11px] uppercase tracking-[0.2em]"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEdit ? "Simpan Perubahan" : "Konfirmasi Aset")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
