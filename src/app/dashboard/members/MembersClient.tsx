"use client";

import { useState } from "react";
import { User, Plus, Edit2, Trash2, Shield, Loader2, Users } from "lucide-react";
import { addMember, updateMember, deactivateMember } from "@/app/actions/members";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  isOwner: boolean;
  isActive: boolean;
}

export function MembersClient({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const sortedMembers = [...members].sort((a, b) => {
    if (a.isOwner) return -1;
    if (b.isOwner) return 1;
    return a.name.localeCompare(b.name);
  });

  const openAddModal = () => {
    setEditingMember(null);
    setName("");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setName(member.name);
    setError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      if (editingMember) {
        const res = await updateMember(editingMember.id, name);
        if (res.error) throw new Error(res.error);
        
        setMembers(members.map(m => m.id === editingMember.id ? { ...m, name } : m));
        toast.success("Nama anggota berhasil diperbarui");
      } else {
        const res = await addMember(name);
        if (res.error) throw new Error(res.error);
        
        // Optimistic add (will be refreshed on next load anyway)
        setMembers([...members, { id: crypto.randomUUID(), name, isOwner: false, isActive: true }]);
        toast.success("Anggota baru berhasil ditambahkan");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      const res = await deactivateMember(memberToDelete.id);
      if (res.error) throw new Error(res.error);
      
      setMembers(members.filter(m => m.id !== memberToDelete.id));
      toast.success("Anggota berhasil dihapus");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setMemberToDelete(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in text-left pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800/60">
        <div className="text-left">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">Anggota Keluarga 👥</h2>
          <p className="text-xs md:text-sm font-bold text-gray-400 dark:text-gray-500 mt-1">Kelola anggota keluarga dan alokasi akun FinTrack Anda.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E1E2D] rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 dark:border-gray-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Daftar Anggota</h3>
              <p className="text-sm text-gray-500">Terdapat {members.length} anggota aktif</p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Tambah Anggota
          </button>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
          {sortedMembers.map((member) => (
            <div key={member.id} className={`p-6 md:px-8 flex items-center justify-between group transition-colors ${member.isOwner ? 'bg-blue-50/30 dark:bg-blue-900/10 hover:bg-blue-50/60 dark:hover:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-[#2A2A3C]'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${member.isOwner ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  {member.isOwner ? <Shield className="w-5 h-5 text-blue-500" /> : <User className="w-5 h-5 text-gray-500" />}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {member.name}
                    {member.isOwner && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        <Shield className="w-3 h-3" /> Pemilik
                      </span>
                    )}
                  </h4>
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(member)}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                  title="Edit Nama"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {!member.isOwner && (
                  <button
                    onClick={() => setMemberToDelete(member)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#1E1E2D] rounded-3xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {editingMember ? "Edit Anggota" : "Tambah Anggota"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Masukkan nama panggilan untuk anggota ini.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                  Nama Panggilan
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Haikal"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={memberToDelete !== null}
        onCancel={() => setMemberToDelete(null)}
        onConfirm={confirmDelete}
        title="Hapus Anggota"
        message={memberToDelete ? `Apakah Anda yakin ingin menghapus anggota ${memberToDelete.name}?` : ""}
        confirmLabel="Ya, Hapus"
      />
    </div>
  );
}
