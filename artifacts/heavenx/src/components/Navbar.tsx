import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, Home, BookOpen } from "lucide-react";
import type { Lang } from "@/i18n";

export default function Navbar() {
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
              <div
                style={{
                  borderRadius: "14px",
                  padding: "3px",
                  background: "linear-gradient(145deg, rgba(0,180,255,0.25), rgba(0,80,160,0.1))",
                  boxShadow: "0 0 18px rgba(0,180,255,0.55), 0 0 40px rgba(0,120,220,0.25), 0 4px 14px rgba(0,0,0,0.7)",
                  transform: "perspective(400px) rotateX(4deg)",
                  flexShrink: 0,
                }}
              >
                <img
                  src={`${import.meta.env.BASE_URL}logo.png`}
                  alt="HEAVENx"
                  className="h-10 w-10 object-contain"
                  style={{ borderRadius: "11px", display: "block" }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <span
                dir="rtl"
                style={{
                  fontFamily: "'Reem Kufi', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.15rem",
                  color: "#60cfff",
                  textShadow: "0 0 10px rgba(0,180,255,0.85), 0 0 22px rgba(0,140,220,0.5)",
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
                      color:
