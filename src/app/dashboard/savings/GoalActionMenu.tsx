"use client";

import { useState, useTransition } from "react";
import { MoreVertical, Edit2, Trash2, Loader2 } from "lucide-react";
import { deleteGoal } from "@/app/actions/goals";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

interface GoalActionMenuProps {
    goal: any;
    onEdit: (goal: any) => void;
}

export default function GoalActionMenu({ goal, onEdit }: GoalActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        setShowConfirm(false);
        startTransition(async () => {
            const res = await deleteGoal(goal.id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Goal berhasil dihapus");
            }
        });
    };

    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                disabled={isPending}
                className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-2xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700 active:scale-95"
            >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <MoreVertical className="w-5 h-5" />}
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                    />
                    <div 
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1E1E2D] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onEdit(goal);
                            }}
                            className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit Goal
                        </button>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setShowConfirm(true);
                            }}
                            className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Hapus Goal
                        </button>
                    </div>
                </>
            )}

            <ConfirmDialog
                isOpen={showConfirm}
                onCancel={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Hapus Goal"
                message={`Apakah Anda yakin ingin menghapus goal "${goal.name}"? Semua data yang terkait dengan goal ini akan tetap ada namun tidak lagi terhubung ke goal ini.`}
                confirmLabel="Ya, Hapus"
            />
        </div>
    );
}
