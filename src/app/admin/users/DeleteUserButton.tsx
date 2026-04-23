"use client";

import { useState, useTransition } from "react";
import { deleteUser } from "@/app/actions/user";
import { Trash2, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function DeleteUserButton({ id, onSuccess }: { id: string; onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = () => {
    setShowConfirm(false);
    startTransition(async () => {
      const res = await deleteUser(id);
      if (res?.success) {
        onSuccess?.();
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors focus:outline-none disabled:opacity-50"
        title="Hapus Pengguna"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Hapus Pengguna"
        message="Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan dan akses pengguna tersebut akan langsung dicabut."
        confirmLabel="Ya, Hapus"
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
