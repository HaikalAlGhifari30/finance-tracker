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
    <div className="space-y-10 animate-fade-in text-left">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h2 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Manajemen Pengguna</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Kelola akun dan hak akses seluruh pengguna sistem finance.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1E1E2D] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium shadow-sm"
            />
          </div>

          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="appearance-none pl-5 pr-10 py-3.5 bg-white dark:bg-[#1E1E2D] border border-gray-100 dark:border-gray-800 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm min-w-[160px]"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === "SEMUA" ? "Semua Peran" : r === "USER" ? "User Reguler" : "Super Admin"}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white text-sm font-black rounded-2xl shadow-lg shadow-blue-400/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#1E1E2D] border border-gray-100 dark:border-gray-800 rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800/50">
                <th className="px-8 py-6 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Data Pengguna</th>
                <th className="px-8 py-6 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Alamat Email</th>
                <th className="px-8 py-6 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Hak Akses</th>
                <th className="px-8 py-6 text-right text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/30">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <p className="text-gray-400 font-medium italic">Tidak ada data pengguna ditemukan.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                          {user.name}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                          Bergabung: {format(new Date(user.createdAt), "dd MMM yyyy")}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {user.email}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${user.role === "SUPERADMIN"
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
                          : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50"
                        }`}>
                        {user.role === "SUPERADMIN" ? "Super Admin" : "User Reguler"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                          title="Edit Pengguna"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {user.email !== "admin@combiphar.com" ? (
                          <DeleteUserButton
                            id={user.id}
                            onSuccess={() => showToast("Pengguna berhasil dihapus", "success")}
                          />
                        ) : (
                          <div className="w-9 h-9" /> // Spacer for the root admin
                        )}
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
          onPageSizeChange={() => { }} // User management currently has fixed size, can add state if needed
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
