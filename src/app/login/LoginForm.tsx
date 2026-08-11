"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginForm({ initialMode = false }: { initialMode?: boolean }) {
  const [isRegister, setIsRegister] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{name?: string, email?: string, password?: string}>({});
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    let hasError = false;
    const newErrors: {name?: string, email?: string, password?: string} = {};

    if (isRegister && !name.trim()) {
      newErrors.name = "Nama lengkap wajib diisi";
      hasError = true;
    }
    if (!email.trim()) {
      newErrors.email = "Email wajib diisi";
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Format email tidak valid";
      hasError = true;
    }
    if (!password) {
      newErrors.password = "Password wajib diisi";
      hasError = true;
    } else if (isRegister && password.length < 8) {
      newErrors.password = "Password minimal 8 karakter";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
         const { data, error } = await authClient.signUp.email({
             email,
             password,
             name,
             // Optional: Set role default to SUPERADMIN for the very first user
             // or keep default to USER from schema.
         });
         
         if (error) {
             setError(error?.message === "User already exists" ? "Email ini sudah terdaftar." : "Gagal mendaftar. Silakan coba lagi.");
             setLoading(false);
             return;
         }
      } else {
        const { data, error } = await authClient.signIn.email({
          email,
          password,
        });

        if (error) {
          setError(
            error?.message?.includes("Invalid") || error?.code === "INVALID_EMAIL_OR_PASSWORD" 
              ? "Email atau password yang Anda masukkan salah." 
              : `Error: ${error?.message || error?.code || "Terjadi kesalahan."}`
          );
          setLoading(false);
          return;
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };  return (
    <form onSubmit={handleAuth} className="flex flex-col space-y-5" noValidate>
      {error && (
        <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm text-center">
          {error}
        </div>
      )}
      
      {isRegister && (
        <div>
          <label className="block text-[11px] font-bold tracking-wider text-gray-700 dark:text-gray-400 uppercase mb-1.5 px-0.5">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
            }}
            required={isRegister}
            className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-white dark:bg-white/[0.02] text-gray-900 dark:text-gray-100 focus:outline-none transition-all font-medium text-sm border-gray-100 dark:border-white/[0.08] focus:border-emerald-500 dark:focus:border-emerald-500 ${
              fieldErrors.name ? "border-red-500 dark:border-red-500" : ""
            }`}
            placeholder="Nama lengkap sesuai identitas"
          />
          {fieldErrors.name && (
            <p className="text-red-500 text-xs mt-1.5 flex items-center font-medium">
              <span className="mr-1">⚠️</span> {fieldErrors.name}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold tracking-wider text-gray-700 dark:text-gray-400 uppercase mb-1.5 px-0.5">
          Alamat Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
          }}
          required
          autoComplete="email"
          className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-white dark:bg-white/[0.02] text-gray-900 dark:text-gray-100 focus:outline-none transition-all font-medium text-sm border-gray-100 dark:border-white/[0.08] focus:border-emerald-500 dark:focus:border-emerald-500 shadow-sm ${
            fieldErrors.email ? "border-red-500 dark:border-red-500" : ""
          }`}
          placeholder="nama@email.com"
        />
        {fieldErrors.email && (
          <p className="text-red-500 text-xs mt-1.5 flex items-center font-medium">
            <span className="mr-1">⚠️</span> {fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-bold tracking-wider text-gray-700 dark:text-gray-400 uppercase mb-1.5 px-0.5">
          Kata Sandi <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
            }}
            required
            className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-white dark:bg-white/[0.02] text-gray-900 dark:text-gray-100 focus:outline-none transition-all pr-12 font-medium text-sm border-gray-100 dark:border-white/[0.08] focus:border-emerald-500 dark:focus:border-emerald-500 shadow-sm ${
              fieldErrors.password ? "border-red-500 dark:border-red-500" : ""
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-red-500 text-xs mt-1.5 flex items-center font-medium">
            <span className="mr-1">⚠️</span> {fieldErrors.password}
          </p>
        )}
        {!isRegister && (
          <div className="flex justify-end mt-2">
            <Link href="/forgot-password" className="text-[11px] font-bold text-emerald-400 hover:underline">
              Lupa Kata Sandi?
            </Link>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold py-3.5 px-4 rounded-2xl transition-all disabled:opacity-70 flex justify-center items-center gap-2 shadow-md hover:shadow-lg text-sm cursor-pointer"
      >
        {loading && <Loader2 className="animate-spin h-5 w-5" />}
        {loading ? "Memverifikasi..." : (isRegister ? "Mulai Sekarang (Gratis)" : "Masuk ke Dashboard")}
      </button>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="text-sm text-emerald-400 hover:underline font-medium cursor-pointer"
        >
          {isRegister ? "Sudah terdaftar? Masuk ke akun Anda" : "Belum memiliki akun? Daftar gratis sekarang"}
        </button>
      </div>
    </form>
  );
}
