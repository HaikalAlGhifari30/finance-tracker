"use client";

import { useState, useMemo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { format, parseISO, isSameMonth, isSameYear } from "date-fns";
import { id } from "date-fns/locale";
import { Plus, Search, Edit2, CreditCard, Download, ListPlus, ChevronLeft, ChevronRight, Calendar, FileText, ChevronDown, Filter, Wallet, TrendingDown, MoreVertical, Trash2 } from "lucide-react";
import ExpenseModal from "./ExpenseModal";
import CategoryModal from "./CategoryModal";
import DeleteExpenseButton from "./DeleteExpenseButton";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useTransition } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { getCategoryColorBadge } from "@/lib/constants";
import { deleteTransaction } from "@/app/actions/transactions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MemberFilter } from "@/components/MemberFilter";
import { useSearchParams } from "next/navigation";

export default function ExpensesClientPage({ initialExpenses, categories, goals, accounts, totalSavings, members }: { initialExpenses: any[], categories: any[], goals: any[], accounts: any[], totalSavings: number, members: any[] }) {
  const searchParams = useSearchParams();
  const currentMember = searchParams.get("member") || "all";
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, currentDate, viewMode, selectedCategory]);

  const filteredExpenses = useMemo(() => {
    return initialExpenses.filter(item => {
      const itemDate = typeof item.date === 'string' ? parseISO(item.date) : new Date(item.date);
      const matchesSearch = (item.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.categoryName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.accountName || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPeriod = viewMode === "monthly"
        ? isSameMonth(itemDate, currentDate) && isSameYear(itemDate, currentDate)
        : isSameYear(itemDate, currentDate);

      const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory;
      const matchesMember = currentMember === "all" || item.memberId === currentMember;
      return matchesSearch && matchesPeriod && matchesCategory && matchesMember;
    }).sort((a, b) => {
      const dateA = typeof a.date === 'string' ? parseISO(a.date) : new Date(a.date);
      const dateB = typeof b.date === 'string' ? parseISO(b.date) : new Date(b.date);
      const dateDiff = dateB.getTime() - dateA.getTime();
      if (dateDiff !== 0) return dateDiff;
      
      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return createdB - createdA;
    });
  }, [initialExpenses, searchTerm, currentDate, viewMode, selectedCategory, currentMember]);

  const totalFilteredAmount = filteredExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  const groupedExpenses = useMemo(() => {
    const groups: { date: string; items: any[] }[] = [];
    const today = new Date();
    
    paginatedExpenses.forEach(t => {
      const tDate = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
      let dateStr = "";
      
      if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear()) {
        dateStr = "Hari Ini";
      } else {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (tDate.getDate() === yesterday.getDate() && tDate.getMonth() === yesterday.getMonth() && tDate.getFullYear() === yesterday.getFullYear()) {
          dateStr = "Kemarin";
        } else {
           dateStr = format(tDate, "dd MMMM yyyy", { locale: id });
        }
      }
      
      let group = groups.find(g => g.date === dateStr);
      if (!group) {
        group = { date: dateStr, items: [] };
        groups.push(group);
      }
      group.items.push(t);
    });
    
    return groups;
  }, [paginatedExpenses]);

  const confirmDelete = () => {
    if (expenseToDelete) {
      startDeleteTransition(async () => {
        await deleteTransaction(expenseToDelete);
        setExpenseToDelete(null);
      });
    }
  };

  const handleExportExcel = () => {
    if (filteredExpenses.length === 0) {
      toast.error("Tidak ada data yang dapat diexport");
      return;
    }
    const dataToExport = filteredExpenses.map(item => ({
      Tanggal: format(new Date(item.date), "dd/MM/yyyy"),
      Kategori: item.categoryName || "-",
      Rekening: item.accountName || "-",
      Deskripsi: item.description || "-",
      Nominal: Number(item.amount)
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran");
    const fileName = `Pengeluaran_${viewMode === 'monthly' ? format(currentDate, 'MMM_yyyy') : format(currentDate, 'yyyy')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel Berhasil Diexport");
  };

  const handleExportPDF = () => {
    if (filteredExpenses.length === 0) {
      toast.error("Tidak ada data yang dapat diexport");
      return;
    }
    const doc = new jsPDF();
    const periodText = viewMode === 'monthly'
      ? format(currentDate, 'MMMM yyyy', { locale: id })
      : format(currentDate, 'yyyy');

    doc.setFontSize(18);
    doc.text("Laporan Pengeluaran", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Periode: ${periodText}`, 14, 28);

    const tableData = filteredExpenses.map(item => [
      format(new Date(item.date), "dd/MM/yyyy"),
      item.categoryName || "-",
      item.accountName || "-",
      item.description || "-",
      `Rp ${Number(item.amount).toLocaleString("id-ID")}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Tanggal', 'Kategori', 'Rekening', 'Deskripsi', 'Nominal']],
      body: tableData,
      foot: [['', '', '', 'TOTAL PENGELUARAN', `Rp ${totalFilteredAmount.toLocaleString("id-ID")}`]],
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], halign: 'center' },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 4: { halign: 'right' } }
    });

    doc.save(`Pengeluaran_${periodText}.pdf`);
    toast.success("PDF Berhasil Diexport");
  };

  const changePeriod = (offset: number) => {
    const nextDate = new Date(currentDate);
    if (viewMode === "monthly") {
      nextDate.setMonth(nextDate.getMonth() + offset);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + offset);
    }
    setCurrentDate(nextDate);
  };

  const handleEdit = (item: any) => {
    setSelectedExpense(item);
    setModalMode("edit");
    setIsExpenseModalOpen(true);
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in text-left pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-6">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">Pengeluaran & Transaksi</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium mt-1">Catat dan pantau arus kas keluar harian Anda dengan mudah.</p>
        </div>
        {/* MemberFilter moved down */}
      </div>

      {/* Control Panel */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3 w-full lg:max-w-md">
          <div className="flex-1">
            <MemberFilter members={members} className="w-full" />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className={`p-3 md:p-3.5 bg-white dark:bg-[#1E1E2D] border ${isFilterDropdownOpen || selectedCategory !== 'all' ? 'border-rose-500 shadow-lg shadow-rose-500/10' : 'border-gray-100 dark:border-gray-800'} rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all shadow-sm flex items-center justify-center relative`}
            >
              <Filter className={`w-4 h-4 md:w-5 md:h-5 ${selectedCategory !== 'all' ? 'text-rose-500' : 'text-gray-400'}`} />
              {selectedCategory !== 'all' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#1E1E2D]"></span>
              )}
            </button>

            {isFilterDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsFilterDropdownOpen(false)}
                ></div>
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#1E1E2D] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in zoom-in duration-200">
                  <div className="px-5 py-2 mb-1 border-b border-gray-50 dark:border-gray-800/50">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pilih Kategori</span>
                  </div>
                  <button
                    onClick={() => { setSelectedCategory("all"); setIsFilterDropdownOpen(false); }}
                    className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors ${selectedCategory === 'all' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                  >
                    Semua Kategori
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setIsFilterDropdownOpen(false); }}
                      className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors ${selectedCategory === cat.id ? 'bg-rose-50 text-rose-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 md:gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-1.5 rounded-[20px] md:rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm w-full lg:w-auto justify-center">
          <button onClick={() => changePeriod(-1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronLeft className="w-3.5 h-3.5 md:w-4 h-4 text-gray-600" /></button>
          <div className="px-3 md:px-4 min-w-[100px] md:min-w-[140px] text-center flex items-center justify-center gap-2">
            <span className="font-bold text-[10px] md:text-xs text-gray-900 dark:text-white tracking-tight uppercase whitespace-nowrap">
              {format(currentDate, "MMMM yyyy", { locale: id })}
            </span>
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <button onClick={() => changePeriod(1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronRight className="w-3.5 h-3.5 md:w-4 h-4 text-gray-600" /></button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-3.5 rounded-2xl bg-white dark:bg-[#1E1E2D] border border-emerald-100 dark:border-emerald-800 text-xs md:text-sm font-black text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              <ListPlus className="w-4 h-4 md:w-5 md:h-5" />
              <span>Kategori</span>
            </button>

            <button
              onClick={() => {
                setModalMode("create");
                setSelectedExpense(null);
                setIsExpenseModalOpen(true);
              }}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 md:px-6 py-3 md:py-3.5 rounded-2xl text-xs md:text-sm font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span>Tambah</span>
            </button>
          </div>

          <div className="hidden lg:block relative w-full sm:w-auto">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1E1E2D] text-xs md:text-sm font-black text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 md:w-4 md:h-4 opacity-50 transition-transform" />
            </button>
            {isExportDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsExportDropdownOpen(false)}></div>
                <div className="absolute top-full right-0 left-0 sm:left-auto mt-2 w-full sm:w-48 bg-white dark:bg-[#1E1E2D] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in zoom-in duration-200">
                  <button
                    onClick={() => { handleExportExcel(); setIsExportDropdownOpen(false); }}
                    className="w-full flex items-center justify-center sm:justify-start gap-3 px-5 py-3 text-xs md:text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:text-emerald-600 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                    Excel Spreadsheet
                  </button>
                  <button
                    onClick={() => { handleExportPDF(); setIsExportDropdownOpen(false); }}
                    className="w-full flex items-center justify-center sm:justify-start gap-3 px-5 py-3 text-xs md:text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-500" />
                    Dokumen PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
        {filteredExpenses.length === 0 ? (
          <div className="p-10 md:p-20 text-center">
            <div className="w-16 md:w-20 h-16 md:h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-8 md:w-10 h-8 md:h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-black text-base md:text-lg">Data Kosong</p>
            <p className="text-xs md:text-sm text-gray-400 mt-1 italic">Belum ada catatan pengeluaran pada periode ini.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="bg-gray-100/70 dark:bg-gray-800/50">
                    <th className="px-6 py-5 text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Tanggal</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Kategori</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Sumber</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Deskripsi</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 text-center">Nominal</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {paginatedExpenses.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                      <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap font-bold">
                        {(() => {
                          if (typeof item.date === 'string') {
                            const parts = item.date.split('T')[0].split('-');
                            if (parts.length === 3) {
                              const localD = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                              return format(localD, "dd/MM/yyyy", { locale: id });
                            }
                          }
                          return format(new Date(item.date), "dd/MM/yyyy", { locale: id });
                        })()}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getCategoryColorBadge(item.categoryName)}`}>
                          {item.categoryName || "Umum"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <Wallet className="w-3 h-3 text-gray-400" />
                           <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                             {item.accountName || "Utama"}
                             {currentMember === "all" && item.memberName && (
                               <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                 {item.memberName}
                               </span>
                             )}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600 dark:text-gray-400 max-w-[300px] truncate font-medium">
                        {item.description || "-"}
                      </td>
                      <td className="px-6 py-5 text-sm font-black text-rose-600 text-center whitespace-nowrap">
                        - Rp {Number(item.amount).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <DeleteExpenseButton id={item.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List (Grouped) */}
            <div className="md:hidden flex flex-col p-4 bg-white dark:bg-[#1E1E2D] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mx-4 mb-4">
              {groupedExpenses.map((group, groupIdx) => (
                <div key={group.date} className={groupIdx > 0 ? "mt-6" : ""}>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">{group.date}</h4>
                  <div className="flex flex-col">
                    {group.items.map((item, itemIdx) => (
                      <div key={item.id} className={`flex items-start justify-between gap-3 py-3 px-1 relative group ${itemIdx !== group.items.length - 1 ? 'border-b border-gray-50 dark:border-gray-800/50' : ''}`}>
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center min-w-[40px] bg-rose-50 text-rose-600 dark:bg-rose-900/20 mt-0.5`}>
                            <TrendingDown className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1 mt-0.5">
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight mb-0.5 truncate">{item.description}</p>
                            <p className="text-[10px] text-gray-400 font-medium tracking-wide truncate">
                               {item.categoryName || "Umum"} • {item.accountName || "Utama"}
                            </p>
                            {currentMember === "all" && item.memberName && (
                              <div className="mt-1">
                                <span className="text-[7px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20 px-1.5 py-0.5 rounded-full">
                                  {item.memberName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black whitespace-nowrap text-rose-600">
                              -Rp {Number(item.amount).toLocaleString("id-ID")}
                            </span>
                            <div className="relative">
                              <button onClick={() => setOpenActionMenuId(openActionMenuId === item.id ? null : item.id)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openActionMenuId === item.id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setOpenActionMenuId(null)} />
                                  <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#1E1E2D] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-gray-100 dark:border-gray-800 py-1 z-50 animate-in fade-in zoom-in duration-200">
                                    <button onClick={() => { setOpenActionMenuId(null); handleEdit(item); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                      <Edit2 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button onClick={() => { setOpenActionMenuId(null); setExpenseToDelete(item.id); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredExpenses.length / pageSize)}
              totalItems={filteredExpenses.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </GlassCard>

      {/* Mobile Bottom Controls */}
      <div className="lg:hidden flex flex-col gap-4 mt-6">
        <div className="flex items-center gap-2 md:gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-1.5 rounded-[20px] md:rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm w-full justify-center">
          <button onClick={() => changePeriod(-1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronLeft className="w-3.5 h-3.5 md:w-4 h-4 text-gray-600" /></button>
          <div className="px-3 md:px-4 min-w-[100px] md:min-w-[140px] text-center flex items-center justify-center gap-2">
            <span className="font-bold text-[10px] md:text-xs text-gray-900 dark:text-white tracking-tight uppercase whitespace-nowrap">
              {format(currentDate, "MMMM yyyy", { locale: id })}
            </span>
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <button onClick={() => changePeriod(1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"><ChevronRight className="w-3.5 h-3.5 md:w-4 h-4 text-gray-600" /></button>
        </div>

        <div className="relative w-full">
          <button
            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1E1E2D] text-sm font-black text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span>Export Data</span>
            <ChevronDown className="w-4 h-4 opacity-50 transition-transform" />
          </button>
          {isExportDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsExportDropdownOpen(false)}></div>
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-[#1E1E2D] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button
                  onClick={() => { handleExportExcel(); setIsExportDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:text-emerald-600 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-500" />
                  Excel Spreadsheet
                </button>
                <button
                  onClick={() => { handleExportPDF(); setIsExportDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 transition-colors"
                >
                  <FileText className="w-4 h-4 text-rose-500" />
                  Dokumen PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Card at Bottom */}
      {filteredExpenses.length > 0 && (
        <div className="flex justify-center md:justify-end">
          <GlassCard className="w-full md:max-w-md p-6 md:p-8 bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 text-white border-none shadow-2xl shadow-rose-500/30 flex flex-col relative overflow-hidden group hover:scale-[1.01] transition-all duration-300 text-center md:text-left">
            <div className="absolute -top-10 -right-10 p-4 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
              <CreditCard className="w-32 md:w-40 h-32 md:h-40" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/30">
                  <TrendingDown className="w-3.5 md:w-4 h-3.5 md:h-4 text-white" />
                </div>
                <p className="text-rose-100 text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] opacity-90">Total Pengeluaran Periode Ini</p>
              </div>
              <h3 className="text-3xl md:text-4xl font-black tracking-tighter">Rp {totalFilteredAmount.toLocaleString("id-ID")}</h3>
            </div>
            <div className="relative z-10 mt-6 md:mt-8 flex items-center justify-center md:justify-start gap-4 px-4 md:px-5 py-3 md:py-4 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-inner w-full md:w-fit">
              <Calendar className="w-4 md:w-5 h-4 md:h-5 text-rose-100" />
              <div className="flex flex-col text-left">
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-rose-200/70">Periode Aktif</span>
                <span className="text-xs md:text-sm font-black text-white uppercase tracking-tight">
                  {viewMode === 'monthly' ? format(currentDate, 'MMMM yyyy', { locale: id }) : format(currentDate, 'yyyy')}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Confirmation Dialog for Mobile Action Menu */}
      <ConfirmDialog 
        isOpen={expenseToDelete !== null}
        onCancel={() => setExpenseToDelete(null)}
        onConfirm={confirmDelete}
        title="Hapus Pengeluaran"
        message="Apakah Anda yakin ingin menghapus catatan pengeluaran ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        mode={modalMode}
        initialData={selectedExpense}
        categories={categories}
        goals={goals}
        accounts={accounts}
        totalSavings={totalSavings}
        members={members}
        currentMember={currentMember}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
      />
    </div>
  );
}
