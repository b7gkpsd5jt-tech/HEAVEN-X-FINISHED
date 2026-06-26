import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
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
      .then(([t, l, s]) => {
        setTrending(t);
        setLatest(l);
        setSettings(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-96 overflow-hidden bg-gradient-to-br from-indigo-900 via-violet-900 to-purple-900">
        {settings.bannerUrl && (
          <img
            src={settings.bannerUrl}
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-3">
              HEAVEN<span className="text-indigo-400">x</span>
            </h1>
            {settings.bannerOverlayText && (
              <p className="text-white/80 text-lg md:text-xl max-w-lg">{settings.bannerOverlayText}</p>
            )}
            {!settings.bannerOverlayText && (
              <p className="text-white/70 text-sm md:text-base">بهشت منهوا — بهترین مانهواها به زبان فارسی</p>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5"
          >
            <Link href="/library">
              <button className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5">
                {t("allSeries")} <ChevronRight className="inline w-4 h-4 ml-1" />
              </button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Announcement */}
      {settings.announcement && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 text-center text-sm text-indigo-700">
          {settings.announcement}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Trending */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <TrendingUp size={16} className="text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{t("trending")}</h2>
            </div>
            <Link href="/library?sort=popular">
              <span className="text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer flex items-center gap-1">
                {t("allSeries")} <ChevronRight size={14} />
              </span>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="rounded-xl bg-gray-200 aspect-[3/4]" />
                  <div className="mt-2 h-3 bg-gray-200 rounded w-3/4" />
                  <div className="mt-1 h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {trending.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
              {trending.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-400">
                  {t("noResults")}
                </div>
              )}
            </motion.div>
          )}
        </section>

        {/* Latest Updates */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock size={16} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{t("latest")}</h2>
            </div>
            <Link href="/library?sort=newest">
              <span className="text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer flex items-center gap-1">
                {t("allSeries")} <ChevronRight size={14} />
              </span>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="rounded-xl bg-gray-200 aspect-[3/4]" />
                  <div className="mt-2 h-3 bg-gray-200 rounded w-3/4" />
                  <div className="mt-1 h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {latest.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
              {latest.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-400">
                  {t("noResults")}
                </div>
              )}
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}
