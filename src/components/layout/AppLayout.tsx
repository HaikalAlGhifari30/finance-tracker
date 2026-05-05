"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Home, Users, List, PlusCircle, CreditCard, Moon, Sun, Settings, ChevronLeft, ChevronRight, TrendingUp, Trophy, TrendingDown, Wallet, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
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
  const [showMobileNav, setShowMobileNav] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setIsClient(true);
    // On mobile, start with closed sidebar
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    // Disable auto-hide on important form/profile pages so it doesn't get in the way
    const isFormPage = pathname.includes('/add') || pathname.includes('/edit') || pathname.includes('/profile');
    if (isFormPage) {
      setShowMobileNav(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If at the very top, always show
      if (currentScrollY < 50) {
        setShowMobileNav(true);
      } 
      // If scrolling down, hide
      else if (currentScrollY > lastScrollY.current) {
        setShowMobileNav(false);
      } 
      // If scrolling up, show
      else {
        setShowMobileNav(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

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
    { label: "Alokasi Dana", href: "/dashboard/budget", icon: List },
    { label: "Pengeluaran", href: "/dashboard/expenses", icon: TrendingDown },
    { label: "Rekening & Transfer", href: "/dashboard/accounts", icon: Wallet },
    { label: "Tabungan", href: "/dashboard/savings", icon: Trophy },
  ];

  if (!isClient) return null;

  const NavContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full py-6 px-4 overflow-hidden">
      <div className={`flex items-center gap-3 px-2 mb-8 mt-2 transition-all ${!mobile && !isSidebarOpen && 'justify-center px-0'}`}>
        <div className="flex items-center gap-3 transition-all duration-300">
          <div className="w-10 h-10 min-w-[40px] rounded-2xl flex items-center justify-center shadow-md overflow-hidden bg-transparent">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          {(mobile || isSidebarOpen) && (
            <div className="flex flex-col justify-center">
              <h1 className="font-black text-gray-900 dark:text-gray-100 text-xl leading-none tracking-tight">FinTrack</h1>
              <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">— Finance Tracking —</p>
            </div>
          )}
        </div>
      </div>

      {(mobile || isSidebarOpen) && <div className="h-px bg-gray-100 dark:bg-gray-800 mx-3 mb-6 opacity-50" />}
      <div className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 px-3 tracking-widest whitespace-nowrap overflow-hidden">
        {(mobile || isSidebarOpen) ? "MENU UTAMA" : "MENU"}
      </div>
      
      <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar pb-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!mobile && !isSidebarOpen ? item.label : undefined}
              className={`flex items-center gap-3 rounded-2xl transition-all font-medium whitespace-nowrap ${ (mobile || isSidebarOpen) ? 'px-4 py-3.5' : 'px-0 py-3.5 justify-center w-12 h-12 mx-auto'} ${
                isActive 
                  ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md" 
                  : "text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-[#2A2A3C] hover:text-emerald-600"
              }`}
            >
              <Icon className={`mb-0.5 ${(mobile || isSidebarOpen) ? 'w-5 h-5 min-w-[20px]' : 'w-6 h-6'}`} />
              {(mobile || isSidebarOpen) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-gray-50 dark:border-gray-800/50">
        <div className={`flex flex-col items-center transition-opacity duration-300 ${(mobile || isSidebarOpen) ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em]">FinTrack System</p>
          <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 mt-1">v1.0.4 • 2026</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#13111C] flex flex-col md:flex-row transition-colors duration-300 overflow-x-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-white/90 dark:bg-[#1E1E2D]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-[60]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-black text-gray-900 dark:text-gray-100 text-lg leading-none tracking-tight">FinTrack</h1>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#1E1E2D] shadow-[2px_0_20px_rgba(0,0,0,0.03)] hidden md:flex flex-col rounded-r-3xl my-4 ml-4 h-[calc(100vh-2rem)] transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-24'}`}>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3.5 top-20 bg-white dark:bg-[#1E1E2D] text-gray-500 hover:text-gray-800 dark:hover:text-white p-1.5 rounded-full shadow-md border border-gray-100 dark:border-gray-800 z-50 transition-colors"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-4 pb-24 md:p-10 md:pb-10 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-[280px]' : 'md:ml-[120px]'}`}>
        
        {/* Top Header */}
        <header className="flex justify-end items-center mb-6 md:mb-12 gap-4 relative">
          
          {/* Theme Toggle Switch */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#1E1E2D] p-1 rounded-full shadow-inner border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-12 md:w-14 h-6 md:h-7 rounded-full relative flex items-center transition-colors bg-gray-300 dark:bg-emerald-600"
            >
               <div className={`w-4 h-4 md:w-5 md:h-5 bg-white dark:bg-[#1E1E2D] rounded-full absolute top-1 shadow-sm transition-transform duration-300 flex items-center justify-center ${theme === 'dark' ? 'translate-x-[26px] md:translate-x-[30px]' : 'translate-x-1'}`}>
                  {theme === 'dark' ? <Moon className="w-2.5 md:w-3 h-2.5 md:h-3 text-emerald-600" /> : <Sun className="w-2.5 md:w-3 h-2.5 md:h-3 text-gray-500" />}
               </div>
            </button>
          </div>

          <div className="relative">
             <button 
               onClick={() => setShowUserMenu(!showUserMenu)}
               className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 shadow-md text-white font-bold flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none overflow-hidden text-xs md:text-sm"
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
                 <div className="absolute top-full right-0 mt-3 w-48 md:w-56 bg-white dark:bg-[#1E1E2D] rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-800/50 mb-2">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Akun Saya</p>
                       <p className="text-xs md:text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{user?.name}</p>
                    </div>
                    <Link 
                      href="/dashboard/profile" 
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-5 py-2.5 text-xs md:text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-colors"
                    >
                       <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4" /> Edit Profil
                    </Link>
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-xs md:text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                       <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" /> Keluar
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

        <div className="flex-1 w-full max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/95 dark:bg-[#1E1E2D]/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none transition-transform duration-300 ease-in-out ${showMobileNav ? 'translate-y-0' : 'translate-y-[120%]'}`}>
        <div className="flex items-center justify-around px-2 py-2">
          {(role === "SUPERADMIN" ? navItems : [
            { label: "Dashboard", shortLabel: "Home", href: "/dashboard", icon: Home },
            { label: "Pemasukan", shortLabel: "Masuk", href: "/dashboard/income", icon: TrendingUp },
            { label: "Pengeluaran", shortLabel: "Keluar", href: "/dashboard/expenses", icon: TrendingDown },
            { label: "Rekening & Transfer", shortLabel: "Rekening", href: "/dashboard/accounts", icon: Wallet },
            { label: "Tabungan", shortLabel: "Tabungan", href: "/dashboard/savings", icon: Trophy },
          ]).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex flex-col items-center justify-center w-16 gap-1 p-1 transition-all ${isActive ? 'scale-105' : 'hover:scale-105'}`}
              >
                <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-bold tracking-wide transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {('shortLabel' in item) ? (item as any).shortLabel : item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
