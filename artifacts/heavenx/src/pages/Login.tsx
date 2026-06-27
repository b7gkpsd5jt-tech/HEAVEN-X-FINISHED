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

const TelegramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.64-.203-.657-.64.136-.954l11.57-4.461c.537-.194 1.006.131.828.943z" fill="white"/>
  </svg>
);

const PLATFORM_ICONS: Record<string, string> = {
  telegram: "✈",
  instagram: "📸",
  twitter: "𝕏",
  youtube: "▶",
  discord: "💬",
  whatsapp: "💚",
  tiktok: "🎵",
};

const PLATFORM_COLORS: Record<string, { bg: string; hover: string }> = {
  telegram:  { bg: "#0088cc", hover: "#0077b5" },
  instagram: { bg: "#c13584", hover: "#a02d6e" },
  twitter:   { bg: "#1a1a1a", hover: "#2a2a2a" },
  youtube:   { bg: "#cc0000", hover: "#aa0000" },
  discord:   { bg: "#5865f2", hover: "#4752c4" },
  whatsapp:  { bg: "#25d366", hover: "#1db954" },
  tiktok:    { bg: "#1a1a1a", hover: "#2a2a2a" },
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
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: "#000000" }}
    >
      <WelcomePopup />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Language switcher */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "#111", border: "1px solid #222" }}>
            <Globe size={13} style={{ color: "#555" }} className="ml-1" />
            {(["DE", "EN", "FA"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg transition-all"
                style={lang === l
                  ? { background: "#ffffff", color: "#000000" }
                  : { background: "transparent", color: "#666" }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="HEAVENx Logo"
              className="h-28 w-28 object-contain"
              style={{ filter: "drop-shadow(0 0 16px rgba(100,160,255,0.4))" }}
            />
          </div>
          <h1
            dir="rtl"
            style={{
              fontFamily: "'Reem Kufi', sans-serif",
              fontSize: "2.2rem",
              lineHeight: "1.5",
              color: "#f0f0f0",
              fontWeight: 700,
              letterSpacing: "0.01em",
            }}
          >
            بهشت منهوا
          </h1>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{ background: "#0f0f0f", border: "1px solid #1a3a55", boxShadow: "0 0 40px rgba(0,136,204,0.18), 0 0 80px rgba(0,100,180,0.10), inset 0 0 30px rgba(0,80,160,0.06)" }}
        >
          <h2
            className="mb-5 text-center"
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "1.1rem", letterSpacing: "0.06em", color: "#ffffff", textShadow: "0 1px 10px rgba(255,255,255,0.25)" }}
          >
            {t("login")}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label
                className="block mb-1.5"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.06em", color: "#aaaaaa", textShadow: "0 1px 6px rgba(255,255,255,0.15)" }}
              >
                {t("username")}
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#555" }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#f0f0f0", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block mb-1.5"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.06em", color: "#aaaaaa", textShadow: "0 1px 6px rgba(255,255,255,0.15)" }}
              >
                {t("password")}
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#555" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#f0f0f0", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#555" }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="p-3 rounded-xl text-sm"
                style={{ background: "#1a0808", border: "1px solid #2a1010", color: "#ff6b6b" }}
                dir={isRTL(error) ? "rtl" : "ltr"}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl disabled:opacity-60 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                letterSpacing: "0.06em",
                textShadow: "0 1px 8px rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.12)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 20px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  {t("loading")}
                </span>
              ) : (
                t("loginBtn")
              )}
            </button>
          </form>

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div className="mt-5 pt-5" style={{ borderTop: "1px solid #1e1e1e" }}>
              <p
                className="text-center mb-3"
                style={{ color: "#666", fontFamily: "'Lalezar', cursive", fontSize: "0.95rem" }}
              >
                مارو دنبال کن
              </p>
              <div className="flex flex-col gap-2">
                {socialLinks.map((link) => {
                  const isTelegram = link.platform === "telegram";
                  const colors = PLATFORM_COLORS[link.platform] || { bg: "#1a1a1a", hover: "#2a2a2a" };
                  return isTelegram ? (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: "rgba(0, 136, 204, 0.15)",
                        border: "1px solid rgba(0, 136, 204, 0.4)",
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 4px 20px rgba(0,136,204,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
                      }}
                    >
                      <TelegramIcon />
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 700,
                          fontSize: "1rem",
                          letterSpacing: "0.06em",
                          color: "#ffffff",
                          textShadow: "0 1px 8px rgba(0,136,204,0.6)",
                        }}
                      >
                        {link.label || "Telegram"}
                      </span>
                    </a>
                  ) : (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                      style={{ background: colors.bg }}
                    >
                      <span className="text-base">{PLATFORM_ICONS[link.platform] || "🔗"}</span>
                      {link.label || link.platform}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <p
          className="text-center mt-3 leading-5"
          dir="rtl"
          style={{ color: "#444", fontFamily: "'Lalezar', cursive", fontSize: "0.82rem" }}
        >
          بهشت منهوا آرشیو بزرگ منهوا ساخت سایت در سال 2026
          <br />
          برای هر مشکلی لطفاً به آدمین در تلگرام اطلاع بدهید
        </p>
      </motion.div>
    </div>
  );
}
