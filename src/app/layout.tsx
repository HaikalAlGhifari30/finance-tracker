import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinTrack - Sistem Keuangan",
  description: "Kelola keuangan Anda dengan mudah dan efisien",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className} suppressHydrationWarning>
        <Script id="theme-detector" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('theme')||'system';var d=document.documentElement;var m=window.matchMedia('(prefers-color-scheme: dark)');var isDark=t==='dark'||(t==='system'&&m.matches);d.classList.toggle('dark',isDark)}catch(e){}})()`}
        </Script>
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
