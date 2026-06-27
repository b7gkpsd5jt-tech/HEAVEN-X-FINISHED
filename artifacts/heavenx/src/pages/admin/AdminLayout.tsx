import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import {
  LayoutDashboard, BookOpen, Upload, Users, MessageSquare,
  Share2, Bell, Settings, Image, BarChart3, Menu, X, ChevronRight, LogOut, ArrowLeft
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
  const { t } = useLang();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <Link href="/">
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 cursor-pointer transition-all">
            <ArrowLeft size={13} />
            بازگشت به سایت
          </div>
        </Link>
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
            <span className="text-indigo-600 font-bold text-xs">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">Admin</p>
            <p className="text-[10px] text-indigo-600 font-medium">ADMIN</p>
          </div>
          <Link href="/">
            <button className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={15} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
