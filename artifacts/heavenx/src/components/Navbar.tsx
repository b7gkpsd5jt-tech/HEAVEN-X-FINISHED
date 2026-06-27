import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, Home, BookOpen, Settings } from "lucide-react";
import type { Lang } from "@/i18n";

export default function Navbar() {
  const { t, lang, setLang } = useLang();
  // WICHTIG: Hier holen wir die Location direkt aus dem Browser
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`#/library?search=${encodeURIComponent(searchQuery)}`);
      setMobileOpen(false);
    }
  };

  const navItems = [
    { href: "/", label: t("home"), icon: Home },
    { href: "#/library", label: t("library"), icon: BookOpen },
    { href: "#/admin", label: "Admin", icon: Settings },
  ];

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{ background: "#000000", borderBottom: "1px solid #1a1a1a" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer select-none">
              <span style={{ color: "#60cfff", fontWeight: 700 }}>HEAVENx</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              // Korrekte Prüfung auf Hash-Location
              const active = location === item.href || (item.href === "/" && location === "/");
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all"
                    style={{
                      background: active ? "#1a1a1a" : "transparent",
                      color: active ? "#ffffff" : "#888888",
                    }}
                  >
                    <Icon size={15} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: "#888" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
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
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className="px-3 py-2.5 text-sm font-medium cursor-pointer"
                    style={{ color: "#cccccc" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
