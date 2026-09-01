"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import SplashScreen from "@/components/SplashScreen";

export default function RootPage() {
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);
  const targetPathRef = useRef<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    async function checkAuth() {
      try {
        const isSessionActive = typeof window !== "undefined" && localStorage.getItem("pwa_session_active");
        if (isSessionActive) {
          router.prefetch("/dashboard");
          const { data: session } = await authClient.getSession();
          if (isSubscribed) {
            targetPathRef.current = session?.user ? "/dashboard" : "/welcome";
          }
        } else {
          targetPathRef.current = "/welcome";
        }
      } catch {
        if (isSubscribed) targetPathRef.current = "/welcome";
      }
    }

    checkAuth();
    return () => {
      isSubscribed = false;
    };
  }, [router]);

  const handleSplashComplete = useCallback(() => {
    const targetPath = targetPathRef.current || "/dashboard";
    router.replace(targetPath);
    setTimeout(() => setSplashDone(true), 300);
  }, [router]);

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
    </>
  );
}

