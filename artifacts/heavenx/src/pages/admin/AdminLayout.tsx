import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import {
  LayoutDashboard, BookOpen, Upload, Users, MessageSquare,
  Share2, Bell, Settings, Image, BarChart3, Menu, X, ChevronRight, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sections = [
  { href: "/admin", label: "dashboard", icon: LayoutDashboard },
  { href: "/admin/series", label: "manageSeries", icon: BookOpen },
  { href: "/admin/chapters", label: "manageChapters", icon: Upload },
  { href: "/admin/users", label: "manageUsers", icon: Users },
  { href: "/admin/comments", label: "manageComments", icon: MessageSquare },
  { href: "/admin/social-links", label: "socialLinks", icon: Share2 },
  { href: "/admin/popups", label: "popups", icon: Bell },
  { href: "/admin/banners", label: "banners", icon: Image },
  { href: "/admin/settings", label: "systemSettings", icon: Settings },
  { href: "/admin/analytics", label: "analytics", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user || user.role !== "ADMIN") {
    navigate("/login");
    return null;
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
            <span className="text-white font-black text-sm">HX</span>
          </div>
          <div>
            <div className="font-black text-gray-900">HEAVEN<span className="text-indigo-600">x</span></div>
            <div className="text-[10px] text-gray-400 font-medium">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {sections.map((s) => {
          const Icon = s.icon;
          const active = location === s.href || (s.href !== "/admin" && location.startsWith(s.href));
          return (
            <Link key={s.href} href={s.href}>
              <div
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={16} />
                <span className="flex-1">{t(s.label)}</span>
                {active && <ChevronRight size={13} className="opacity-70" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-bold text-xs">{user.username.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{user.username}</p>
            <p className="text-[10px] text-indigo-600 font-medium">{user.role}</p>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 flex-shrink-0 shadow-sm">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-56 bg-white border-r border-gray-100 shadow-xl">
              <button className="absolute top-4 right-3 text-gray-400" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-100 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900">
            <Menu size={20} />
          </button>
          <span className="font-bold text-gray-900">HEAVEN<span className="text-indigo-600">x</span> Admin</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
