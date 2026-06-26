import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { apiFetch, getImageUrl } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Eye, BookOpen, Heart, HeartOff, Star, ChevronDown, ChevronUp } from "lucide-react";

interface Genre { genre: { id: string; name: string } }
interface Chapter { id: string; number: number; title?: string; views: number; uploadDate: string }
interface Series {
  id: string; title: string; altTitle?: string; description?: string;
  cover?: string; banner?: string; author?: string; artist?: string;
  status?: string; views: number; likes: number; genres: Genre[]; chapters: Chapter[];
}

const STATUS_COLORS: Record<string, string> = {
  ONGOING: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  HIATUS: "bg-yellow-100 text-yellow-700",
  DROPPED: "bg-red-100 text-red-700",
};

export default function SeriesDetail() {
  const { id } = useParams();
  const { t } = useLang();
  const { user } = useAuth();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [chaptersExpanded, setChaptersExpanded] = useState(false);
  const [chaptersDesc, setChaptersDesc] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch<Series>(`/series/${id}`)
      .then(setSeries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const toggleFavorite = async () => {
    if (!user || !id) return;
    try {
      if (isFavorite) {
        await apiFetch(`/users/favorites/${id}`, { method: "DELETE" });
        setIsFavorite(false);
      } else {
        await apiFetch(`/users/favorites/${id}`, { method: "POST" });
        setIsFavorite(true);
      }
    } catch {}
  };

  const coverUrl = getImageUrl(series?.cover);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!series) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
      Series not found
    </div>
  );

  const chapters = chaptersDesc ? [...series.chapters].reverse() : series.chapters;
  const visibleChapters = chaptersExpanded ? chapters : chapters.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden bg-gradient-to-br from-indigo-900 to-violet-900">
        {coverUrl && <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 scale-105 blur-sm" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 relative z-10 pb-12">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Cover */}
          <div className="flex-shrink-0">
            <div className="w-36 h-48 sm:w-44 sm:h-60 rounded-xl overflow-hidden shadow-xl border-2 border-white">
              {coverUrl ? (
                <img src={coverUrl} alt={series.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-200 to-violet-200 flex items-center justify-center">
                  <BookOpen size={32} className="text-indigo-400" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-20 sm:pt-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl font-black text-gray-900">{series.title}</h1>
                {series.altTitle && <p className="text-gray-500 text-sm mt-0.5">{series.altTitle}</p>}
              </div>
              {user && (
                <button
                  onClick={toggleFavorite}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isFavorite ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {isFavorite ? <Heart size={15} fill="currentColor" /> : <Heart size={15} />}
                  {isFavorite ? t("removeFavorite") : t("addFavorite")}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {series.status && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[series.status] || "bg-gray-100 text-gray-700"}`}>
                  {t(series.status.toLowerCase())}
                </span>
              )}
              {series.genres?.map((g) => (
                <span key={g.genre.id} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                  {g.genre.name}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              {series.author && <span><span className="font-medium">{t("author")}:</span> {series.author}</span>}
              {series.artist && <span><span className="font-medium">{t("artist")}:</span> {series.artist}</span>}
              <span className="flex items-center gap-1"><Eye size={14} /> {series.views}</span>
            </div>

            {series.description && (
              <p className="text-sm text-gray-700 mt-3 leading-relaxed line-clamp-3">{series.description}</p>
            )}

            {series.chapters.length > 0 && (
              <div className="mt-4 flex gap-2">
                <Link href={`/reader/${series.chapters[0].id}`}>
                  <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all">
                    {t("readNow")} — Ch.{series.chapters[0].number}
                  </button>
                </Link>
                {series.chapters.length > 1 && (
                  <Link href={`/reader/${series.chapters[series.chapters.length - 1].id}`}>
                    <button className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-all">
                      Latest — Ch.{series.chapters[series.chapters.length - 1].number}
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chapter List */}
        <motion.div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">{t("chapters")} ({series.chapters.length})</h2>
            <button
              onClick={() => setChaptersDesc(!chaptersDesc)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              {chaptersDesc ? "Newest First" : "Oldest First"}
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {visibleChapters.map((ch) => (
              <Link key={ch.id} href={`/reader/${ch.id}`}>
                <div className="flex items-center justify-between px-4 py-3 hover:bg-indigo-50/50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                      <span className="text-xs font-bold text-indigo-600">{ch.number}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      {ch.title || `${t("chapter")} ${ch.number}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Eye size={11} /> {ch.views}</span>
                    <span>{new Date(ch.uploadDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {series.chapters.length > 10 && (
            <button
              onClick={() => setChaptersExpanded(!chaptersExpanded)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              {chaptersExpanded ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Show All {series.chapters.length} Chapters</>}
            </button>
          )}

          {series.chapters.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">{t("noResults")}</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
