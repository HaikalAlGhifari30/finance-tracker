import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMembers } from "@/app/actions/members";
import { getGoldAssets } from "@/app/actions/gold";
import GoldClientPage from "./GoldClientPage";

export default async function GoldPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/");

  const [membersData, initialAssets] = await Promise.all([
    getMembers(),
    getGoldAssets("all"),
  ]);

  return (
    <GoldClientPage
      initialAssets={initialAssets}
      members={membersData}
    />
  );
}
