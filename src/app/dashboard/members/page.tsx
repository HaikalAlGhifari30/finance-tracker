import { getMembers } from "@/app/actions/members";
import { MembersClient } from "./MembersClient";

export const metadata = {
  title: 'Anggota Akun | FinTrack',
  description: 'Kelola identitas anggota dalam akun FinTrack Anda',
};

export default async function MembersPage() {
  const members = await getMembers();

  return <MembersClient initialMembers={members} />;
}
