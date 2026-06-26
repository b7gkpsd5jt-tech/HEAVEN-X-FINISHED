import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, Heart, Home, BookOpen, Shield, Globe, LogOut, LogIn } from "lucide-react";
import type { Lang } from "@/i18n";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, lang, setLang, isRTL } = useLang();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/library?search=${encodeURIComponent(searchQuery)}`);
      setMobileOpen(false);
    }
  };

  const navItems = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/library", label: t("library"), icon: BookOpen },
    ...(user ? [{ href: "/favorites", label: t("favorites"), icon: Heart }] : []),
    ...(user?.role === "ADMIN" ? [{ href: "/admin", label: t("admin"), icon: Shield }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer select-none">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
                <span className="text-white font-black text-sm tracking-tight">HX</span>
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-gray-900">HEAVEN</span>
                <span className="font-black text-lg tracking-tight text-indigo-600">x</span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                      active
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search")}
                className="w-44 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-gray-50"
              />
            </form>

            {/* Language switcher */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(["DE", "EN", "FA"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                    lang === l ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-xs">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <LogOut size={14} />
                  {t("logout")}
                </button>
              </div>
            ) : (
              <Link href="/login">
                <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm">
                  <LogIn size={14} />
                  {t("login")}
                </button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-gray-100 bg-white"
          >
            <div className="p-4 space-y-2">
              <form onSubmit={handleSearch} className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("search")}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
                />
              </form>

              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon size={16} />
                      {item.label}
                    </div>
                  </Link>
                );
              })}

              <div className="flex gap-2 pt-2">
                {(["DE", "EN", "FA"] as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      lang === l ? "bg-indigo-100 text-indigo-600" : "text-gray-500 bg-gray-100"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {user ? (
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut size={16} />
                  {t("logout")}
                </button>
              ) : (
                <Link href="/login">
                  <button
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LogIn size={16} />
                    {t("login")}
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
