import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, Heart, Home, BookOpen, Shield, Globe, LogOut, LogIn } from "lucide-react";
import type { Lang } from "@/i18n";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLang();
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
    <nav
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{ background: "#000000", borderBottom: "1px solid #1a1a1a" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer select-none">
              <img
                src="/logo.png"
                alt="HEAVENx"
                className="h-10 w-10 object-contain"
                style={{ filter: "drop-shadow(0 0 6px rgba(100,160,255,0.35))" }}
              />
              <span
                dir="rtl"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.15rem",
                  color: "#ffffff",
                  textShadow: "0 0 8px rgba(0,180,255,0.9), 0 0 18px rgba(0,140,220,0.6)",
                }}
              >
                بهشت منهوا
              </span>
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
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all"
                    style={{
                      background: active ? "#1a1a1a" : "transparent",
                      color: active ? "#ffffff" : "#888888",
                    }}
                    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.color = "#ffffff"; (e.currentTarget as HTMLDivElement).style.background = "#111111"; } }}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.color = "#888888"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; } }}
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
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#555" }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search")}
                className="w-44 pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none transition-all"
                style={{ background: "#111", color: "#f0f0f0", border: "1px solid #2a2a2a" }}
              />
            </form>

            {/* Language switcher */}
            <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "#111" }}>
              {(["DE", "EN", "FA"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="px-2 py-1 text-xs font-bold rounded-md transition-all"
                  style={lang === l
                    ? { background: "#ffffff", color: "#000000" }
                    : { background: "transparent", color: "#666" }}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#1a1a1a" }}>
                  <span className="font-bold text-xs" style={{ color: "#f0f0f0" }}>
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all"
                  style={{ color: "#888" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#ff6b6b"; (e.currentTarget as HTMLButtonElement).style.background = "#1a0a0a"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#888"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <LogOut size={14} />
                  {t("logout")}
                </button>
              </div>
            ) : (
              <Link href="/login">
                <button
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all"
                  style={{ background: "#ffffff", color: "#000000" }}
                >
                  <LogIn size={14} />
                  {t("login")}
                </button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg transition-all"
            style={{ color: "#888" }}
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
            className="md:hidden overflow-hidden"
            style={{ borderTop: "1px solid #1a1a1a", background: "#000" }}
          >
            <div className="p-4 space-y-2">
              <form onSubmit={handleSearch} className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#555" }} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("search")}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{ background: "#111", color: "#f0f0f0", border: "1px solid #2a2a2a" }}
                />
              </form>

              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
                      style={{ color: "#cccccc" }}
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
                    className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
                    style={lang === l
                      ? { background: "#ffffff", color: "#000000" }
                      : { background: "#1a1a1a", color: "#666" }}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {user ? (
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-all"
                  style={{ color: "#ff6b6b" }}
                >
                  <LogOut size={16} />
                  {t("logout")}
                </button>
              ) : (
                <Link href="/login">
                  <button
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-lg"
                    style={{ background: "#ffffff", color: "#000000" }}
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
