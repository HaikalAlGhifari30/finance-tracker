"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Pencil, ChevronDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import UserModal from "./UserModal";
import DeleteUserButton from "./DeleteUserButton";
import { Pagination } from "@/components/ui/Pagination";
import { Toast, useToast } from "@/components/ui/Toast";
import { format } from "date-fns";

const ROLES = ["SEMUA", "USER", "SUPERADMIN"];

export default function UsersClientPage({ users: initialUsers }: { users: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [filterRole, setFilterRole] = useState("SEMUA");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { toast, show: showToast, hide: hideToast } = useToast();

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const openCreateModal = () => { setModalMode("create"); setSelectedUser(null); setIsModalOpen(true); };
  const openEditModal = (user: any) => { setModalMode("edit"); setSelectedUser(user); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);

  const filtered = useMemo(() => {
    let result = users;
    
    if (filterRole !== "SEMUA") {
      result = result.filter((u) => u.role === filterRole);
    }
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      result = result.filter((u) => 
        u.name.toLowerCase().includes(search) || 
        u.email.toLowerCase().includes(search)
      );
    }

    result = [...result].sort((a, b) => {
      if (a.email === "admin@combiphar.com") return 1;
      if (b.email === "admin@combiphar.com") return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return result;
  }, [users, filterRole, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterRole, searchTerm]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tighter">Manajemen Pengguna</h1>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest opacity-70">Kelola akun dan hak akses seluruh pengguna sistem finance</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-[3] group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-[#1E1E2D]/50 dark:bg-[#1E1E2D] border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="relative flex-1 min-w-[180px]">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="appearance-none block w-full pl-4 pr-10 py-3 bg-[#1E1E2D]/50 dark:bg-[#1E1E2D] border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === "SEMUA" ? "Semua Peran" : r === "USER" ? "User Reguler" : "Super Admin"}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center px-6 py-3 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-bold rounded-xl shadow-sm transition-all whitespace-nowrap"
        >
          <Plus className="mr-2 h-5 w-5" />
          Tambah Pengguna Baru
        </button>
      </div>

      <div className="bg-[#1E1E2D]/20 dark:bg-[#1E1E2D]/10 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800/50">
            <thead className="bg-[#1A1A2E] dark:bg-[#0F0F1A]">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Pengguna</th>
                <th className="hidden lg:table-cell px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">NIK / NPWP</th>
                <th className="hidden md:table-cell px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">No. Telp</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alamat Email</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hak Akses</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/30">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                paginated.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-[#252538] transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{user.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{format(new Date(user.createdAt), "dd MMM yyyy")}</div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-mono italic">
                      {user.npwp || "-"}
                    </td>
                    <td className="hidden md:table-cell px-6 py-5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {user.phoneNumber || "-"}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        user.role === "SUPERADMIN"
                          ? "bg-white text-black shadow-sm"
                          : "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50"
                      }`}>
                        {user.role === "SUPERADMIN" ? "Super Admin" : "User Reguler"}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-500 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {user.email !== "admin@combiphar.com" ? (
                          <DeleteUserButton
                            id={user.id}
                            onSuccess={() => showToast("Dihapus", "success")}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={Math.ceil(filtered.length / itemsPerPage)}
          totalItems={filtered.length}
          pageSize={itemsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={() => {}} // User management currently has fixed size, can add state if needed
        />
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={closeModal}
        mode={modalMode}
        initialData={selectedUser}
        onSuccess={(msg) => showToast(msg, "success")}
      />
    </div>
  );
}
