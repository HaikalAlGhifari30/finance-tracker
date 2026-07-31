import { getMembers } from "@/app/actions/members";
import { MembersClient } from "./MembersClient";

export const metadata = {
  title: 'Anggota Akun | FinTrack',
  description: 'Kelola identitas anggota dalam akun FinTrack Anda',
};

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Manajemen Anggota</h2>
        <p className="text-sm text-gray-500 mt-1">Kelola anggota (pasangan/keluarga) yang menggunakan akun ini.</p>
      </div>
      
      <MembersClient initialMembers={members} />
    </div>
  );
}
