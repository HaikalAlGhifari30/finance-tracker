"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  KeyRound,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Eye,
  EyeOff
} from "lucide-react";
import { getUsers, createUser, updateUser, toggleUserStatus, resetUserPassword } from "@/app/actions/user";
import { useRouter } from "next/navigation";

export default function UsersClientPage({
  initialUsers,
  currentUser
}: {
  initialUsers: any[];
  currentUser: any;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Password Visibility States
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showAddConfirmPassword, setShowAddConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  // Portal Mount State
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showToggleConfirmModal, setShowToggleConfirmModal] = useState(false);

  const isAnyModalOpen = showAddModal || showEditModal || showResetPasswordModal || showToggleConfirmModal;

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isAnyModalOpen]);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add User Form State
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER",
  });

  // Edit User Form State
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    isActive: true,
  });

  // Reset Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const refreshData = async () => {
    router.refresh();
    const res = await getUsers();
    if (res.success && res.data) {
      setUsers(res.data);
    }
  };

  // Filtered Users
  const filteredUsers = users
    .filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
          ? u.isActive !== false
          : u.isActive === false;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const isSuperA = a.role === "SUPERADMIN" || a.email === "bokal@gmail.com";
      const isSuperB = b.role === "SUPERADMIN" || b.email === "bokal@gmail.com";
      if (isSuperA && !isSuperB) return -1;
      if (!isSuperA && isSuperB) return 1;
      return 0;
    });

  // ---------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (addForm.password !== addForm.confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", addForm.name);
    formData.append("email", addForm.email);
    formData.append("password", addForm.password);
    formData.append("confirmPassword", addForm.confirmPassword);
    formData.append("role", "USER");

    const res = await createUser(formData);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg("Akun pengguna berhasil dibuat!");
      setShowAddModal(false);
      setAddForm({ name: "", email: "", password: "", confirmPassword: "", role: "USER" });
      await refreshData();
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("name", editForm.name);
    formData.append("email", editForm.email);
    formData.append("isActive", String(editForm.isActive));

    const res = await updateUser(selectedUser.id, formData);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg("Data pengguna berhasil diperbarui!");
      setShowEditModal(false);
      await refreshData();
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    setLoading(true);
    setErrorMsg("");

    const currentStatus = selectedUser.isActive !== false;
    const res = await toggleUserStatus(selectedUser.id, currentStatus);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg(
        `Akun ${selectedUser.name} berhasil ${res.isActive ? "diaktifkan" : "dinonaktifkan"}.`
      );
      setShowToggleConfirmModal(false);
      await refreshData();
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    setErrorMsg("");

    if (newPassword !== confirmNewPassword) {
      setErrorMsg("Konfirmasi password baru tidak cocok.");
      setLoading(false);
      return;
    }

    const res = await resetUserPassword(selectedUser.id, newPassword);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg(`Password pengguna ${selectedUser.name} berhasil di-reset!`);
      setShowResetPasswordModal(false);
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1E1E2D] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              Manajemen Pengguna
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Kelola akun pengguna yang dapat mengakses sistem FinTrack.
          </p>
        </div>

        <button
          onClick={() => {
            setAddForm({ name: "", email: "", password: "", confirmPassword: "", role: "USER" });
            setErrorMsg("");
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold py-3 px-5 rounded-2xl transition-all shadow-md hover:shadow-lg text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari pengguna berdasarkan nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1E1E2D] border border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500 transition-colors shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(["ALL", "ACTIVE", "INACTIVE"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-white dark:bg-[#1E1E2D] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#2A2A3C]"
              }`}
            >
              {st === "ALL" ? "Semua" : st === "ACTIVE" ? "Aktif" : "Nonaktif"}
            </button>
          ))}
        </div>
      </div>

      {/* User List Table / Cards */}
      <div className="bg-white dark:bg-[#1E1E2D] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative min-h-[220px]">
        {filteredUsers.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Belum Ada Pengguna
            </h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Buat akun pengguna baru untuk memberikan akses ke FinTrack.
            </p>
            <button
              onClick={() => {
                setAddForm({ name: "", email: "", password: "", confirmPassword: "", role: "USER" });
                setErrorMsg("");
                setShowAddModal(true);
              }}
              className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengguna</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[260px] pb-20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-gray-800/30">
                  <th className="py-4 px-6">Nama Pengguna</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Tanggal Dibuat</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {filteredUsers.map((u, index) => {
                  const isSuperAdmin = u.role === "SUPERADMIN" || u.email === "bokal@gmail.com";
                  const isActive = u.isActive !== false;
                  const isLastRow = index >= filteredUsers.length - 1 && filteredUsers.length > 1;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                    >
                      {/* Name */}
                      <td className="py-4 px-6 font-bold text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black flex items-center justify-center text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{u.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 font-medium text-gray-600 dark:text-gray-300">
                        {u.email}
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-6">
                        {isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            User
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-500/10 border border-gray-500/20 text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Date Created */}
                      <td className="py-4 px-6 font-medium text-gray-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>

                      {/* Action Dropdown Menu */}
                      <td className="py-4 px-6 text-right relative">
                        <button
                          onClick={() =>
                            setOpenDropdownId(openDropdownId === u.id ? null : u.id)
                          }
                          className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openDropdownId === u.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                            <div
                              className={`absolute right-6 z-50 w-48 bg-white dark:bg-[#252538] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl py-1.5 text-left text-xs font-medium animate-in fade-in zoom-in-95 ${
                                isLastRow ? "bottom-10 origin-bottom-right" : "top-10 origin-top-right"
                              }`}
                            >
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setEditForm({
                                    name: u.name,
                                    email: u.email,
                                    isActive: u.isActive !== false,
                                  });
                                  setErrorMsg("");
                                  setShowEditModal(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center gap-2 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Edit Profil</span>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setNewPassword("");
                                  setConfirmNewPassword("");
                                  setErrorMsg("");
                                  setShowResetPasswordModal(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center gap-2 cursor-pointer"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                                <span>Reset Password</span>
                              </button>

                              {isSuperAdmin ? (
                                <div className="px-4 py-2 text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-2 border-t border-gray-100 dark:border-gray-800/60 mt-1 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-2xl cursor-not-allowed">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span>Super Admin (Utama)</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setErrorMsg("");
                                    setShowToggleConfirmModal(true);
                                    setOpenDropdownId(null);
                                  }}
                                  className={`w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 cursor-pointer border-t border-gray-100 dark:border-gray-800/60 ${
                                    isActive ? "text-red-500" : "text-emerald-500"
                                  }`}
                                >
                                  {isActive ? (
                                    <>
                                      <UserX className="w-3.5 h-3.5 text-red-500" />
                                      <span>Nonaktifkan</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>Aktifkan</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------- */}
      {/* MODAL: TAMBAH PENGGUNA */}
      {/* --------------------------------------------------------- */}
      {mounted && showAddModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowAddModal(false)}
          />

          <div className="relative bg-white dark:bg-[#1E1E2D] w-full max-w-md rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 fade-in duration-300 z-10">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">
                  Tambah Pengguna Baru
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} autoComplete="off" className="space-y-4 text-xs font-semibold">
              <input type="text" name="fakeusernameremembered" className="hidden" tabIndex={-1} aria-hidden="true" />
              <input type="password" name="fakepasswordremembered" className="hidden" tabIndex={-1} aria-hidden="true" />

              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Masukkan nama lengkap..."
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#252538] border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1.5">
                  Alamat Email *
                </label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="contoh@gmail.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#252538] border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1.5">
                  Password * (Minimal 8 karakter)
                </label>
                <div className="relative">
                  <input
                    type={showAddPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full px-4 py-3 pr-11 bg-gray-50 dark:bg-[#252538] border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1.5">
                  Konfirmasi Password *
                </label>
                <div className="relative">
                  <input
                    type={showAddConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={addForm.confirmPassword}
                    onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-11 bg-gray-50 dark:bg-[#252538] border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddConfirmPassword(!showAddConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showAddConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1.5">
                  Role Akses
                </label>
                <input
                  type="text"
                  disabled
                  value="USER (Pengguna Biasa)"
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-[#1A1A26] border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-500 cursor-not-allowed font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold hover:from-emerald-700 hover:to-teal-600 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Buat Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL: EDIT PENGGUNA */}
      {/* --------------------------------------------------------- */}
      {mounted && showEditModal && selectedUser && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowEditModal(false)}
          />

          <div className="relative bg-white dark:bg-[#1E1E2D] w-full max-w-md rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 fade-in duration-300 z-10">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">
                  Edit Pengguna
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#252538] border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1.5">
                  Alamat Email *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#252538] border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1.5">
                  Status Akun
                </label>
                <select
                  disabled={selectedUser.role === "SUPERADMIN" || selectedUser.email === "bokal@gmail.com"}
                  value={editForm.isActive ? "true" : "false"}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "true" })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#252538] border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  <option value="true">AKTIF</option>
                  <option value="false">NONAKTIF</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold hover:from-emerald-700 hover:to-teal-600 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL: RESET PASSWORD */}
      {/* --------------------------------------------------------- */}
      {mounted && showResetPasswordModal && selectedUser && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowResetPasswordModal(false)}
          />

          <div className="relative bg-white dark:bg-[#1E1E2D] w-full max-w-md rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 fade-in duration-300 z-10">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">
                  Reset Password
                </h3>
              </div>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Reset password untuk pengguna <span className="font-bold text-gray-900 dark:text-gray-100">{selectedUser.name}</span> ({selectedUser.email}).
            </p>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1.5">
                  Password Baru * (Minimal 8 karakter)
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 bg-gray-50 dark:bg-[#252538] border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1.5">
                  Konfirmasi Password Baru *
                </label>
                <div className="relative">
                  <input
                    type={showResetConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 bg-gray-50 dark:bg-[#252538] border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Reset Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL: KONFIRMASI NONAKTIFKAN / AKTIFKAN */}
      {/* --------------------------------------------------------- */}
      {mounted && showToggleConfirmModal && selectedUser && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowToggleConfirmModal(false)}
          />

          <div className="relative bg-white dark:bg-[#1E1E2D] w-full max-w-sm rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 fade-in duration-300 z-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
                {selectedUser.isActive !== false
                  ? `Nonaktifkan Akun ${selectedUser.name}?`
                  : `Aktifkan Akun ${selectedUser.name}?`}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedUser.isActive !== false
                  ? `${selectedUser.name} tidak akan dapat login ke FinTrack setelah akun dinonaktifkan. Data keuangan tetap tersimpan.`
                  : `${selectedUser.name} akan dapat kembali login dan mengakses FinTrack.`}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowToggleConfirmModal(false)}
                className="w-1/2 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleToggleStatus}
                className={`w-1/2 py-3 rounded-2xl text-white font-bold transition-colors flex justify-center items-center gap-2 cursor-pointer text-xs disabled:opacity-50 ${
                  selectedUser.isActive !== false
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-emerald-500 hover:bg-emerald-600"
                }`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {selectedUser.isActive !== false ? "Nonaktifkan" : "Aktifkan"}
                </span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
