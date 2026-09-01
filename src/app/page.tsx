"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import SplashScreen from "@/components/SplashScreen";

export default function RootPage() {
  const router = useRouter();
  // Keep splash mounted until well after navigation so no white flash appears
  const [splashDone, setSplashDone] = useState(false);
  const navigatingRef = useRef(false);

  const handleSplashComplete = useCallback(async () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;

    try {
      // Check if session is active in localStorage (persistent across browser restarts)
      const isSessionActive = localStorage.getItem("pwa_session_active");

      let targetPath = "/welcome";
      if (isSessionActive) {
        const { data: session } = await authClient.getSession();
        if (session?.user) {
          targetPath = "/dashboard";
        }
      } else {
        await authClient.signOut();
      }

      // Navigate first, THEN remove splash after a delay so the new
      // page has time to paint — eliminates white flash on mobile.
      router.replace(targetPath);
      setTimeout(() => setSplashDone(true), 500);
    } catch {
      router.replace("/welcome");
      setTimeout(() => setSplashDone(true), 500);
    }
  }, [router]);

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
    </>
  );
}

