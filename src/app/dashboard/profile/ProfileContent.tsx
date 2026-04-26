"use client";

import { useState, useTransition, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2, Camera, LogOut, User, Check, X, Image as ImageIcon, Smartphone } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { createPortal } from "react-dom";

export default function ProfileContent({ user }: { user: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(user.name || "");
  const [image, setImage] = useState(user.image || "");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = async () => {
    setError("");
    setSuccess(false);
    startTransition(async () => {
      const finalImage = previewImage || image;
      const { error } = await authClient.updateUser({
        name,
        image: finalImage,
      });

      if (error) {
        setError(error.message || "Gagal memperbarui profil");
      } else {
        setSuccess(true);
        setShowEditModal(false);
        setImage(finalImage);
        setPreviewImage(null);
        router.refresh();
        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  };

  const handleLogout = async () => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
    await authClient.signOut();
    router.push("/login");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("Ukuran gambar maksimal 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setShowPhotoOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerGallery = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  const editModalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowEditModal(false)} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-[#1E1E2D] rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <h3 className="font-bold text-gray-900 dark:text-white">Edit Profil</h3>
          <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Avatar Edit Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden border-4 border-white dark:border-gray-800">
                {previewImage || image ? (
                  <img src={previewImage || image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span>{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <button 
                onClick={() => setShowPhotoOptions(true)}
                className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg border-2 border-white dark:border-gray-800 hover:bg-emerald-700"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest cursor-pointer hover:underline" onClick={() => setShowPhotoOptions(true)}>
              Ubah Foto
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Nama Lengkap</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  placeholder="Masukkan nama lengkap"
                />
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => {
                setShowEditModal(false);
                setPreviewImage(null);
                setName(user.name || "");
              }}
              className="flex-1 px-4 py-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={handleUpdate}
              disabled={isPending}
              className="flex-[1.5] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 disabled:opacity-70 flex items-center justify-center"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan"}
            </button>
          </div>
        </div>
      </div>

      {/* Photo Options Modal (Nested) */}
      {showPhotoOptions && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPhotoOptions(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-6 sm:hidden" />
            <h3 className="text-center font-bold text-gray-800 dark:text-white mb-6">Pilih Sumber Foto</h3>
            
            <div className="space-y-3">
              <button 
                onClick={triggerGallery}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800"
              >
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800 dark:text-white text-sm">Pilih dari Galeri</p>
                  <p className="text-xs text-gray-500">Gunakan foto yang sudah ada</p>
                </div>
              </button>

              <button 
                onClick={triggerCamera}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800"
              >
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800 dark:text-white text-sm">Ambil dari Kamera</p>
                  <p className="text-xs text-gray-500">Ambil foto baru sekarang</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in px-2 md:px-4 max-w-2xl mx-auto pb-10">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white tracking-tight">Profil Pengguna</h2>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Informasi personal akun Anda</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs md:text-sm font-bold rounded-2xl border border-emerald-100 dark:border-emerald-900/50 text-center flex items-center justify-center gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" /> Profil berhasil diperbarui!
        </div>
      )}

      <GlassCard className="p-8 md:p-12 flex flex-col items-center gap-6 md:gap-8 shadow-xl border border-gray-100 dark:border-gray-800/50 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-500" />
        
        <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-4xl md:text-5xl font-black shadow-2xl overflow-hidden border-4 border-white dark:border-gray-800 group-hover:scale-105 transition-transform duration-500">
          {image ? (
            <img src={image} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span>{user.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="text-center space-y-1.5">
          <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{user.name}</h3>
          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
            <User className="w-3.5 h-3.5" />
            <p className="text-xs md:text-sm font-medium">{user.email}</p>
          </div>
        </div>

        <div className="w-full h-px bg-gray-50 dark:bg-gray-800/50" />

        <button 
          onClick={() => setShowEditModal(true)}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs md:text-sm uppercase tracking-widest px-10 py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          Edit Profil
        </button>
      </GlassCard>

      {/* Hidden Inputs */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />

      {/* Portals */}
      {showEditModal && createPortal(editModalContent, document.body)}
    </div>
  );
}
