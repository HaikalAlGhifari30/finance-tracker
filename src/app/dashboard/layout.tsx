import { AppLayout } from "@/components/layout/AppLayout";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  if ((session?.user as any)?.role === "SUPERADMIN") {
    redirect("/admin");
  }

  return <AppLayout user={session.user as any}>{children}</AppLayout>;
}
