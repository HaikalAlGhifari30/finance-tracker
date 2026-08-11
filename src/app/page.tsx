"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import SplashScreen from "@/components/SplashScreen";

export default function RootPage() {
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashComplete = useCallback(async () => {
    setSplashDone(true);
    try {
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        router.replace("/dashboard");
      } else {
        router.replace("/welcome");
      }
    } catch {
      router.replace("/welcome");
    }
  }, [router]);

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
    </>
  );
}

