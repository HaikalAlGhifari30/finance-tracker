import SettingsForm from "./SettingsForm";
import { getSetting } from "@/app/actions/settings";

export default async function SettingsPage() {
  const waResult = await getSetting("admin_whatsapp");
  const initialWaNumber = waResult.value || "081388058331";

  return (
    <div className="space-y-10 animate-fade-in text-left">
      <div>
        <h2 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Pengaturan Sistem</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Kelola konfigurasi global dan parameter operasional aplikasi.</p>
      </div>

      <SettingsForm initialWaNumber={initialWaNumber} />
    </div>
  );
}
