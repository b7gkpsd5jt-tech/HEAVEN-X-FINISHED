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

    if (username !== "Dexter" || password !== "Hamid4747") {
      setError("نام کاربری یا رمز عبور اشتباه است.");
      setLoading(false);
      return;
    }

    try {
      await login(username, password);
    } catch (err: any) {
      setError(t("loginError"));
      setLoading(false);
    }
  };

  const isRTL = (text: string) => /[\u0600-\u06FF]/.test(text);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: "#000000" }}>
      <WelcomePopup />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "#111", border: "1px solid #222" }}>
            <Globe size={13} style={{ color: "#555" }} className="ml-1" />
            {(["DE", "EN", "FA"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all${lang === l ? " btn-on-white" : ""}`}
                style={lang === l ? { background: "#ffffff", color: "#000000" } : { background: "transparent", color: "#666" }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div style={{ borderRadius: "22px", padding: "4px", background: "linear-gradient(145deg, rgba(0,180,255,0.25), rgba(0,80,160,0.1))", boxShadow: "0 0 28px rgba(0,180,255,0.55), 0 0 60px rgba(0,120,220,0.3), 0 8px 24px rgba(0,0,0,0.7)", transform: "perspective(400px) rotateX(4deg)" }}>
              <img src="/logo.png" alt="HEAVENx Logo" className="h-28 w-28 object-contain" style={{ borderRadius: "18px", display: "block", filter: "drop-shadow(0 0 8px rgba(0,180,255,0.3))" }} />
            </div>
          </div>
          <h1 dir="rtl" style={{ fontFamily: "'Reem Kufi', sans-serif", fontSize: "2.2rem", lineHeight: "1.5", color: "#60cfff", fontWeight: 700, letterSpacing: "0.01em", textShadow: "0 0 12px rgba(0,180,255,0.85), 0 0 28px rgba(0,140,220,0.5)" }}>
            بهشت منهوا
          </h1>
        </div>

        <div className="rounded-2xl p-7" style={{ background: "#0f0f0f", border: "1px solid #1a3a55", boxShadow: "0 0 40px rgba(0,136,204,0.18), 0 0 80px rgba(0,100,180,0.10), inset 0 0 30px rgba(0,80,160,0.06)" }}>
          <h2 className="mb-1 text-center" style={{ fontWeight: 700, fontSize: "1.2rem", color: "#60cfff", textShadow: "0 0 10px rgba(0,180,255,0.8)" }}>{t("login")}</h2>
          <div className="mb-5 mx-auto rounded-full" style={{ height: "2px", width: "80px", background: "linear-gradient(90deg, rgba(0,180,255,0.1), #60cfff, rgba(0,180,255,0.1))", boxShadow: "0 0 6px rgba(0,180,255,0.6)" }} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1" style={{ fontWeight: 700, fontSize: "0.85rem", color: "#60cfff", textShadow: "0 0 10px rgba(0,180,255,0.8)" }}>{t("username")}</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#555" }} />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", color: "#f0f0f0", border: "1px solid rgba(255,255,255,0.12)" }} />
              </div>
            </div>
            <div>
              <label className="block mb-1" style={{ fontWeight: 700, fontSize: "0.85rem", color: "#60cfff", textShadow: "0 0 10px rgba(0,180,255,0.8)" }}>{t("password")}</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#555" }} />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", color: "#f0f0f0", border: "1px solid rgba(255,255,255,0.12)" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#555" }}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            {error && <div className="p-3 rounded-xl text-sm" style={{ background: "#1a0808", border: "1px solid #2a1010", color: "#ff6b6b" }} dir={isRTL(error) ? "rtl" : "ltr"}>{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl transition-all" style={{ fontWeight: 700, background: "rgba(255,255,255,0.12)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)" }}>
              {loading ? t("loading") : t("loginBtn")}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
