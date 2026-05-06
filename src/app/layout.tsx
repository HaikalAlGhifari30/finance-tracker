import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinTrack - Sistem Keuangan",
  description: "Kelola keuangan Anda dengan mudah dan efisien",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FinTrack",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon",
    apple: [
      { url: "/logo.png", sizes: "180x180" }
    ]
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F9FD" },
    { media: "(prefers-color-scheme: dark)", color: "#13111C" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value || "system";
  const isDark = theme === "dark";

  return (
    <html lang="en" className={isDark ? "dark" : ""} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${inter.className} min-h-[100dvh] w-full bg-[#F8F9FD] dark:bg-[#13111C] antialiased selection:bg-emerald-500/30`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
