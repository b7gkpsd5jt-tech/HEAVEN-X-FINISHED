import { useEffect, useState } from "react";
import { apiFetch, getImageUrl } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import SeriesCard from "@/components/SeriesCard";
import { motion } from "framer-motion";
import { TrendingUp, Clock, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface Series {
  id: string;
  title: string;
  cover?: string;
  status?: string;
  views?: number;
  genres?: { genre: { name: string } }[];
  _count?: { chapters: number };
  latestChapter?: { number: number; title?: string } | null;
}

interface Settings {
  bannerUrl?: string;
  bannerOverlayText?: string;
  siteName?: string;
  announcement?: string;
}

export default function Home() {
  const { t } = useLang();
  const [trending, setTrending] = useState<Series[]>([]);
  const [latest, setLatest] = useState<Series[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<Series[]>("/series/trending"),
      apiFetch<Series[]>("/series/latest"),
      apiFetch<Settings>("/settings"),
    ])
      .then(([t, l, s]) => { setTrending(t); setLatest(l); setSettings(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const bannerUrl = getImageUrl(settings.bannerUrl);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* ── Hero Banner ── */}
      <div className="relative w-full overflow-hidden" style={{ height: "clamp(200px, 40vh, 480px)" }}>
        {/* Background layer */}
        <div
          className="absolute inset-0"
          style={{
            background: bannerUrl
              ? `url(${bannerUrl}) center/cover no-repeat`
              : "linear-gradient(135deg, #111 0%, #1a1a1a 50%, #0a0a0a 100%)",
          }}
        />

        {/* Dark overlay for readability (50% opacity) */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 100%)" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Angel-wing banner title */}
            <div className="flex items-center justify-center gap-3 mb-2">

              {/* Left wing */}
              <svg width="70" height="90" viewBox="0 0 70 90" fill="none" style={{ opacity: 0.88, flexShrink: 0 }}>
                <path d="M62 45 C44 32 12 18 2 2 C10 22 20 34 30 45 C20 56 10 68 2 88 C12 72 44 58 62 45Z" fill="white" opacity="0.95"/>
                <path d="M62 45 C48 34 22 22 8 6 C14 26 22 36 32 45 C22 54 14 64 8 84 C22 68 48 56 62 45Z" fill="white" opacity="0.55"/>
                <path d="M62 45 C52 36 32 26 16 12 C20 30 26 38 34 45 C26 52 20 60 16 78 C32 64 52 54 62 45Z" fill="white" opacity="0.3"/>
                <path d="M62 45 C56 38 42 30 26 18 C28 34 32 40 36 45 C32 50 28 56 26 72 C42 60 56 52 62 45Z" fill="white" opacity="0.15"/>
                <path d="M30 45 C18 32 8 18 2 2" stroke="white" strokeWidth="0.7" strokeOpacity="0.5" fill="none"/>
                <path d="M32 45 C22 34 12 22 8 6" stroke="white" strokeWidth="0.6" strokeOpacity="0.35" fill="none"/>
              </svg>

              {/* Text */}
              <div style={{ position: "relative" }}>
                {/* Blue lightning glow behind X */}
                <div style={{
                  position: "absolute", right: "-4px", top: "50%", transform: "translateY(-50%)",
                  width: "38px", height: "100%",
                  background: "radial-gradient(ellipse at center, rgba(0,160,255,0.55) 0%, transparent 70%)",
                  filter: "blur(6px)",
                  pointerEvents: "none",
                }} />
                <h1
                  style={{
                    fontSize: "clamp(2.2rem, 7vw, 4.5rem)",
                    fontWeight: 900,
                    letterSpacing: "0.04em",
                    color: "#ffffff",
                    textShadow: "0 0 20px rgba(255,255,255,0.7), 0 2px 8px rgba(0,0,0,0.8)",
                    lineHeight: 1,
                    margin: 0,
                    position: "relative",
                  }}
                >
                  HEAVEN
                  <span style={{
                    color: "#60cfff",
                    textShadow: "0 0 12px rgba(0,180,255,1), 0 0 28px rgba(0,140,255,0.8), 0 0 48px rgba(0,100,220,0.5)",
                  }}>x</span>
                </h1>
              </div>

              {/* Right wing (mirrored — dark/blue tinted like logo) */}
              <svg width="70" height="90" viewBox="0 0 70 90" fill="none" style={{ opacity: 0.88, flexShrink: 0, transform: "scaleX(-1)" }}>
                <path d="M62 45 C44 32 12 18 2 2 C10 22 20 34 30 45 C20 56 10 68 2 88 C12 72 44 58 62 45Z" fill="#4ab8ff" opacity="0.6"/>
                <path d="M62 45 C48 34 22 22 8 6 C14 26 22 36 32 45 C22 54 14 64 8 84 C22 68 48 56 62 45Z" fill="#60d0ff" opacity="0.35"/>
                <path d="M62 45 C52 36 32 26 16 12 C20 30 26 38 34 45 C26 52 20 60 16 78 C32 64 52 54 62 45Z" fill="#80e0ff" opacity="0.2"/>
                <path d="M30 45 C18 32 8 18 2 2" stroke="#60cfff" strokeWidth="0.9" strokeOpacity="0.8" fill="none"/>
                <path d="M32 45 C22 34 12 22 8 6" stroke="#40b8ff" strokeWidth="0.7" strokeOpacity="0.5" fill="none"/>
                {/* Lightning bolt on right wing */}
                <path d="M48 20 L38 40 L44 40 L34 65" stroke="#60cfff" strokeWidth="1.5" strokeOpacity="0.85" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M48 20 L38 40 L44 40 L34 65" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

            </div>
            <p className="text-white/75 mb-1" style={{ fontSize: "clamp(0.8rem, 2vw, 1.1rem)" }}>
              {settings.bannerOverlayText || "بهشت منهوا — بهترین مانهواها به زبان فارسی"}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4"
          >
            <Link href="/library">
              <button
                className="px-6 py-2.5 font-semibold text-sm rounded-xl transition-all hover:-translate-y-0.5"
                style={{
                  background: "#ffffff",
                  color: "#000000",
                  boxShadow: "0 4px 20px rgba(255,255,255,0.2)",
                }}
              >
                {t("allSeries")} <ChevronRight className="inline w-4 h-4 ml-1" />
              </button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Announcement */}
      {settings.announcement && (
        <div className="px-4 py-2 text-center text-sm text-white/70 border-b" style={{ background: "#111", borderColor: "#222" }}>
          {settings.announcement}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Trending */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1a1a1a" }}>
                <TrendingUp size={16} style={{ color: "#aaa" }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: "#f0f0f0" }}>{t("trending")}</h2>
            </div>
            <Link href="/library?sort=popular">
              <span className="text-sm font-medium cursor-pointer flex items-center gap-1" style={{ color: "#aaa" }}>
                {t("allSeries")} <ChevronRight size={14} />
              </span>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="rounded-xl aspect-[3/4]" style={{ background: "#1a1a1a" }} />
                  <div className="mt-2 h-3 rounded w-3/4" style={{ background: "#1a1a1a" }} />
                  <div className="mt-1 h-3 rounded w-1/2" style={{ background: "#1a1a1a" }} />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            >
              {trending.map((s) => <SeriesCard key={s.id} series={s} />)}
              {trending.length === 0 && (
                <div className="col-span-full text-center py-16" style={{ color: "#555" }}>{t("noResults")}</div>
              )}
            </motion.div>
          )}
        </section>

        {/* Latest Updates */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1a1a1a" }}>
                <Clock size={16} style={{ color: "#aaa" }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: "#f0f0f0" }}>{t("latest")}</h2>
            </div>
            <Link href="/library?sort=newest">
              <span className="text-sm font-medium cursor-pointer flex items-center gap-1" style={{ color: "#aaa" }}>
                {t("allSeries")} <ChevronRight size={14} />
              </span>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="rounded-xl aspect-[3/4]" style={{ background: "#1a1a1a" }} />
                  <div className="mt-2 h-3 rounded w-3/4" style={{ background: "#1a1a1a" }} />
                  <div className="mt-1 h-3 rounded w-1/2" style={{ background: "#1a1a1a" }} />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}
            >
              {latest.map((s) => <SeriesCard key={s.id} series={s} />)}
              {latest.length === 0 && (
                <div className="col-span-full text-center py-16" style={{ color: "#555" }}>{t("noResults")}</div>
              )}
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}
