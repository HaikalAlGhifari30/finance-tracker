"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Home, Users, List, PlusCircle, CreditCard, Moon, Sun, Settings, ChevronLeft, ChevronRight, TrendingUp, Trophy, TrendingDown, Wallet } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function AppLayout({ children, user }: { children: React.ReactNode, user?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
    await authClient.signOut();
    router.push("/login");
  };

  const role = user?.role || "USER";

  const navItems = role === "SUPERADMIN" ? [
    { label: "Dashboard", href: "/admin", icon: Home },
    { label: "Kelola Pengguna", href: "/admin/users", icon: Users },
    { label: "Pengaturan", href: "/admin/settings", icon: Settings },
  ] : [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Pemasukan", href: "/dashboard/income", icon: TrendingUp },
    { label: "Pengeluaran", href: "/dashboard/expenses", icon: TrendingDown },
    { label: "Rekening & Transfer", href: "/dashboard/accounts", icon: Wallet },
    { label: "Tabungan", href: "/dashboard/savings", icon: Trophy },
  ];

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#13111C] flex transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#1E1E2D] shadow-[2px_0_20px_rgba(0,0,0,0.03)] hidden md:flex flex-col rounded-r-3xl my-4 ml-4 h-[calc(100vh-2rem)] transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-24'}`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3.5 top-20 bg-white dark:bg-[#1E1E2D] text-gray-500 hover:text-gray-800 dark:hover:text-white p-1.5 rounded-full shadow-md border border-gray-100 dark:border-gray-800 z-50 transition-colors"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className="flex flex-col h-full py-6 px-4 overflow-hidden">
          <div className={`flex items-center gap-3 px-2 mb-8 mt-2 transition-all ${!isSidebarOpen && 'justify-center px-0'}`}>
             <div className="w-10 h-10 min-w-[40px] bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">Keu</span>
             </div>
             {isSidebarOpen && (
               <h1 className="font-bold text-gray-800 dark:text-gray-100 text-xl tracking-tight transition-opacity whitespace-nowrap">FinTrack</h1>
             )}
          </div>

          {isSidebarOpen && <div className="h-px bg-gray-100 dark:bg-gray-800 mx-3 mb-6 opacity-50" />}
          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 px-3 tracking-widest whitespace-nowrap overflow-hidden">
             {isSidebarOpen ? "MENU UTAMA" : "MENU"}
          </div>
          
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!isSidebarOpen ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-2xl transition-all font-medium whitespace-nowrap ${isSidebarOpen ? 'px-4 py-3.5' : 'px-0 py-3.5 justify-center w-12 h-12 mx-auto'} ${
                    isActive 
                      ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md" 
                      : "text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-[#2A2A3C] hover:text-emerald-600"
                  }`}
                >
                  <Icon className={`mb-0.5 ${isSidebarOpen ? 'w-5 h-5 min-w-[20px]' : 'w-6 h-6'}`} />
                  {isSidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-50 dark:border-gray-800/50">
              <div className={`flex flex-col items-center transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                  <p className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em]">FinTrack System</p>
                  <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 mt-1">v1.0.4 • 2026</p>
              </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-6 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-[280px]' : 'md:ml-[120px]'}`}>
        
        {/* Top Header */}
        <header className="flex justify-end items-center mb-12 gap-4 relative">
          
          {/* Theme Toggle Switch */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#1E1E2D] p-1 rounded-full shadow-inner border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-14 h-7 rounded-full relative flex items-center transition-colors bg-gray-300 dark:bg-emerald-600"
            >
               <div className={`w-5 h-5 bg-white dark:bg-[#1E1E2D] rounded-full absolute top-1 shadow-sm transition-transform duration-300 flex items-center justify-center ${theme === 'dark' ? 'translate-x-[30px]' : 'translate-x-1'}`}>
                  {theme === 'dark' ? <Moon className="w-3 h-3 text-emerald-600" /> : <Sun className="w-3 h-3 text-gray-500" />}
               </div>
            </button>
          </div>

          <div className="relative">
             <button 
               onClick={() => setShowUserMenu(!showUserMenu)}
               className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 shadow-md text-white font-bold flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none overflow-hidden"
             >
               {user?.image ? (
                 <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <span>{user?.name ? user.name.charAt(0).toUpperCase() : (role === "SUPERADMIN" ? "A" : "U")}</span>
               )}
             </button>

             {showUserMenu && (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                 <div className="absolute top-full right-0 mt-3 w-56 bg-white dark:bg-[#1E1E2D] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-800/50 mb-2">
                       <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Akun Saya</p>
                       <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{user?.name}</p>
                    </div>
                    <Link 
                      href="/dashboard/profile" 
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-colors"
                    >
                       <CreditCard className="w-4 h-4" /> Edit Profil
                    </Link>
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                       <LogOut className="w-4 h-4" /> Keluar
                    </button>
                 </div>
               </>
             )}
          </div>

          <ConfirmDialog 
            isOpen={showLogoutConfirm}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={handleLogout}
            title="Konfirmasi Keluar"
            message="Apakah Anda yakin ingin keluar? Sesi Anda akan diakhiri dan tema akan dikembalikan ke mode terang."
            confirmLabel="Ya, Keluar"
          />

        </header>

        {children}
      </main>

    </div>
  );
}
