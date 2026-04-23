"use client";

import { useTransition, useState, useEffect } from "react";
import { createUser, updateUser, resetUserPassword } from "@/app/actions/user";
import { Loader2, Eye, EyeOff, X, KeyRound, Users } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: any;
  onSuccess?: (msg: string) => void;
}

const SYSTEM_ADMIN_EMAIL = "admin@combiphar.com";

export default function UserModal({ isOpen, onClose, mode, initialData, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formDataState, setFormDataState] = useState<FormData | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [changePassword, setChangePassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(initialData?.role || "USER");

  useEffect(() => {
    if (isOpen) {
      setFieldErrors({});
      setChangePassword(false);
      setShowConfirm(false);
      setSelectedRole(initialData?.role || "USER");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isSystemAdmin = mode === "edit" && initialData?.email === SYSTEM_ADMIN_EMAIL;

  const validate = (formData: FormData) => {
    const errs: Record<string, string> = {};
    if (!formData.get("name")?.toString().trim()) errs.name = "Nama wajib diisi";
    const email = formData.get("email")?.toString().trim() || "";
    if (!email) errs.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Format email tidak valid";
    
    if (mode === "create") {
      const pwd = formData.get("password")?.toString() || "";
      if (!pwd) errs.password = "Kata sandi wajib diisi";
      else if (pwd.length < 6) errs.password = "Kata sandi minimal 6 karakter";
    }
    
    if (mode === "edit" && changePassword) {
      const newPwd = formData.get("newPassword")?.toString() || "";
      if (!newPwd) errs.newPassword = "Password baru wajib diisi";
      else if (newPwd.length < 6) errs.newPassword = "Password minimal 6 karakter";
    }

    if (!isSystemAdmin && !formData.get("role")?.toString()) {
      errs.role = "Peran wajib dipilih";
    }

    return errs;
  };

  const performSubmit = async () => {
    if (!formDataState) return;
    setShowConfirm(false);

    startTransition(async () => {
      // 1. Update name / email / role
      const res = mode === "create"
        ? await createUser(formDataState)
        : await updateUser(initialData.id, formDataState);

      if (res.error) { setFieldErrors({ _global: res.error }); return; }

      // 2. If admin opted to change password, do it separately
      if (mode === "edit" && changePassword) {
        const newPwd = formDataState.get("newPassword")?.toString() || "";
        const pwdRes = await resetUserPassword(initialData.id, newPwd);
        if (pwdRes.error) { setFieldErrors({ _global: pwdRes.error }); return; }
      }

      onSuccess?.(mode === "create" ? "Pengguna berhasil ditambahkan!" : "Data pengguna berhasil diperbarui!");
      onClose();
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    // Lock role for system admin
    if (isSystemAdmin) formData.set("role", "SUPERADMIN");

    const errs = validate(formData);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});

    setFormDataState(formData);
    setShowConfirm(true);
  };

  const inputClass = (field: string) =>
    `w-full rounded-xl border px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all placeholder-gray-400 dark:placeholder-gray-500 ${
      fieldErrors[field]
        ? "border-red-400 focus:ring-red-400/20 bg-red-50 dark:bg-red-900/20"
        : "border-gray-200 dark:border-gray-700 focus:border-[#4f2b7f] focus:ring-[#4f2b7f]/20"
    }`;

  const Req = () => <span className="text-red-500 ml-0.5">*</span>;
  const ErrMsg = ({ field }: { field: string }) =>
    fieldErrors[field] ? <p className="text-xs text-red-500 mt-1.5 flex items-center font-medium"><span className="mr-1">⚠️</span> {fieldErrors[field]}</p> : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1E1E2D] shadow-2xl overflow-hidden ring-1 ring-gray-900/5 dark:ring-gray-700 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {mode === "create" ? "Tambah Pengguna Baru" : "Edit Data Pengguna"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none rounded-full p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {fieldErrors._global && (
            <div className="mb-6 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-4 rounded-2xl border border-red-100 dark:border-red-900/50 flex items-start gap-2">
               <span className="mt-0.5">⚠️</span>
               <span>{fieldErrors._global}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* Nama */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-wider text-gray-700 dark:text-gray-400 uppercase px-1">Nama Lengkap<Req /></label>
              <input type="text" name="name" defaultValue={initialData?.name} className={inputClass("name")} placeholder="Masukkan nama lengkap" />
              <ErrMsg field="name" />
            </div>

            {/* Alamat Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-wider text-gray-700 dark:text-gray-400 uppercase px-1">Alamat Email<Req /></label>
              <input type="email" name="email" defaultValue={mode === "edit" ? initialData?.email : ""} autoComplete="off" className={inputClass("email")} placeholder="contoh@email.com" />
              <ErrMsg field="email" />
            </div>

            {/* Password — hanya saat CREATE */}
            {mode === "create" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-gray-700 dark:text-gray-400 uppercase px-1">Kata Sandi<Req /></label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" autoComplete="new-password" className={`${inputClass("password")} pr-10`} placeholder="Minimal 6 karakter" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 h-4" />}
                  </button>
                </div>
                <ErrMsg field="password" />
              </div>
            )}

            {/* ── RESET PASSWORD (hanya mode EDIT dan BUKAN system admin) ── */}
            {mode === "edit" && !isSystemAdmin && (
              <div className="rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50/30 dark:bg-gray-800/20">
                {/* Toggle header */}
                <button
                  type="button"
                  onClick={() => { setChangePassword(!changePassword); setFieldErrors(e => ({ ...e, newPassword: "" })); }}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Ganti Password
                  </span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider transition-colors ${changePassword ? "bg-emerald-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                    {changePassword ? "Aktif" : "Opsional"}
                  </span>
                </button>

                {/* Expandable password field */}
                {changePassword && (
                  <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                      Masukkan password baru untuk pengguna ini. Password lama akan langsung diganti setelah Anda menekan tombol Simpan.
                    </p>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        autoComplete="new-password"
                        className={`${inputClass("newPassword")} pr-10`}
                        placeholder="Password baru (min. 6 karakter)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <ErrMsg field="newPassword" />
                  </div>
                )}
              </div>
            )}

            {/* Role */}
            {isSystemAdmin ? (
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 px-5 py-4 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold leading-relaxed">
                🛡️ PERAN <strong className="uppercase">Super Admin</strong> BERSIFAT PERMANEN UNTUK KEAMANAN SISTEM.
                <input type="hidden" name="role" value="SUPERADMIN" />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-gray-700 dark:text-gray-400 uppercase px-1">Peran (Role)<Req /></label>
                <div className="relative">
                   <select 
                     name="role" 
                     value={selectedRole} 
                     onChange={(e) => setSelectedRole(e.target.value)}
                     className={`${inputClass("role")} appearance-none cursor-pointer`}
                   >
                     <option value="USER">User Reguler</option>
                     <option value="SUPERADMIN">System Administrator</option>
                   </select>
                </div>
                <ErrMsg field="role" />
              </div>
            )}

            {/* Actions */}
            <div className="pt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 px-4 py-3.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-[1.5] flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-md active:scale-95"
              >
                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (mode === "create" ? "Buat Pengguna" : "Simpan Perubahan")}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showConfirm}
        title={mode === "create" ? "Konfirmasi Tambah Pengguna" : "Konfirmasi Simpan Perubahan"}
        message={mode === "create" 
          ? "Apakah Anda yakin ingin menambahkan pengguna baru ini ke sistem?" 
          : "Apakah Anda yakin ingin menyimpan perubahan pada data pengguna ini?"}
        confirmLabel={mode === "create" ? "Ya, Tambah" : "Ya, Simpan"}
        onConfirm={performSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
