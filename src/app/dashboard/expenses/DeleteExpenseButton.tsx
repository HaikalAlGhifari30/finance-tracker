"use client";

import { useTransition, useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteExpense } from "@/app/actions/expenses";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function DeleteExpenseButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    setShowConfirm(false);
    startTransition(async () => {
      await deleteExpense(id);
    });
  };

  return (
    <>
      <button 
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>

      <ConfirmDialog 
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Hapus Pengeluaran"
        message="Apakah Anda yakin ingin menghapus catatan pengeluaran ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
      />
    </>
  );
}
