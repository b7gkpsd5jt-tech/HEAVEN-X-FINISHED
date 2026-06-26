import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { apiFetch } from "@/lib/api";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, User, Globe } from "lucide-react";
import WelcomePopup from "@/components/WelcomePopup";
import type { Lang } from "@/i18n";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  label: string;
  isEnabled: boolean;
}

const PLATFORM_ICONS: Record<string, string> = {
  telegram: "✈",
  instagram: "📸",
  twitter: "𝕏",
  youtube: "▶",
  discord: "💬",
  whatsapp: "💚",
  tiktok: "🎵",
};

const PLATFORM_COLORS: Record<string, string> = {
  telegram: "bg-sky-500 hover:bg-sky-600",
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
  twitter: "bg-gray-900 hover:bg-gray-800",
  youtube: "bg-red-600 hover:bg-red-700",
  discord: "bg-indigo-500 hover:bg-indigo-600",
  whatsapp: "bg-green-500 hover:bg-green-600",
  tiktok: "bg-gray-900 hover:bg-gray-800",
};

export default function Login() {
  const { login } = useAuth();
  const { t, lang, setLang } = useLang();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    apiFetch<SocialLink[]>("/social-links")
      .then((links) => setSocialLinks(links.filter((l) => l.isEnabled)))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || t("loginError");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isRTL = (text: string) => /[\u0600-\u06FF]/.test(text);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-4 relative">
      {/* Welcome popup shown on login page */}
      <WelcomePopup />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Language switcher */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
            <Globe size={13} className="text-gray-400 ml-1" />
            {(["DE", "EN", "FA"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  lang === l
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 items-center justify-center shadow-lg mb-3">
            <span className="text-white font-black text-2xl tracking-tight">HX</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            HEAVEN<span className="text-indigo-600">x</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">بهشت منهوا</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-5 text-center">{t("login")}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1.5">
                {t("username")}
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-gray-50 transition-all"
                  placeholder="username"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1.5">
                {t("password")}
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-gray-50 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700"
                dir={isRTL(error) ? "rtl" : "ltr"}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow-indigo-200 hover:shadow-md bg-foreground"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t("loading")}
                </span>
              ) : (
                t("loginBtn")
              )}
            </button>
          </form>

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-3">{t("followUs") || "ما را دنبال کنید"}</p>
              <div className="flex flex-col gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all ${
                      PLATFORM_COLORS[link.platform] || "bg-gray-700 hover:bg-gray-800"
                    }`}
                  >
                    <span className="text-base">{PLATFORM_ICONS[link.platform] || "🔗"}</span>
                    {link.label || link.platform}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © {new Date().getFullYear()} HEAVENx — بهشت منهوا
        </p>
      </motion.div>
    </div>
  );
}
