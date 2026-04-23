import SettingsForm from "./SettingsForm";
import { getSetting } from "@/app/actions/settings";

export default async function SettingsPage() {
  const waResult = await getSetting("admin_whatsapp");
  const initialWaNumber = waResult.value || "081388058331";

  return (
    <div className="space-y-6 animate-fade-in fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 uppercase">PENGATURAN SISTEM</h2>
        <p className="text-gray-500 text-sm mt-1">Kelola konfigurasi global aplikasi keuangan</p>
      </div>

      <SettingsForm initialWaNumber={initialWaNumber} />
    </div>
  );
}
