import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { apiFetch, getImageUrl } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Eye, Heart, ChevronDown, ChevronUp, MessageSquare, Send } from "lucide-react";
import SafeImage from "@/components/SafeImage";

interface Genre { genre: { id: string; name: string } }
interface Chapter { id: string; number: number; title?: string; views: number; uploadDate: string }
interface Series {
  id: string; title: string; altTitle?: string; description?: string;
  cover?: string; banner?: string; author?: string; artist?: string;
  status?: string; views: number; likes: number; genres: Genre[]; chapters: Chapter[];
}
interface SeriesComment {
  id: string; chapterId: string; userId: string; username: string;
  text: string; createdAt: string; chapterNumber?: number;
}

const STATUS_COLORS: Record<string, string> = {
  ONGOING: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  HIATUS: "bg-yellow-100 text-yellow-700",
  DROPPED: "bg-red-100 text-red-700",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "همین الان";
  if (m < 60) return `${m} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ساعت پیش`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} روز پیش`;
  return new Date(date).toLocaleDateString("fa-IR");
}

function AvatarCircle({ name }: { name: string }) {
  const colors = ["#60cfff","#a78bfa","#34d399","#fb923c","#f472b6","#facc15"];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
      style={{ background: color + "22", border: `1.5px solid ${color}55`, color }}>
      {name[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function SeriesDetail() {
  const { id } = useParams();
  const { t } = useLang();
  const { user } = useAuth();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [chaptersExpanded, setChaptersExpanded] = useState(false);
  const [chaptersDesc, setChaptersDesc] = useState(true);

  const [comments, setComments] = useState<SeriesComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [firstChapterId, setFirstChapterId] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch<Series>(`/series/${id}`)
      .then(s => { setSeries(s); setFirstChapterId(s.chapters[0]?.id || ""); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const loadComments = async () => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const data = await apiFetch<SeriesComment[]>(`/comments/series/${id}?sort=${sort}`);
      setComments(data);
    } catch {} finally { setCommentsLoading(false); }
  };

  useEffect(() => { loadComments(); }, [id, sort]);

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

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !firstChapterId || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await apiFetch<SeriesComment>(`/comments/chapter/${firstChapterId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      setCommentText("");
      if (sort === "newest") {
        setComments(prev => [{ ...newComment, chapterNumber: series?.chapters[0]?.number } as SeriesComment, ...prev]);
      } else {
        setComments(prev => [...prev, { ...newComment, chapterNumber: series?.chapters[0]?.number } as SeriesComment]);
      }
    } catch {} finally { setSubmitting(false); }
  };

  const coverUrl = getImageUrl(series?.cover);

  if (loading) return (
    <div className="min-h-screen" style={{ background: "#000" }}>
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#60cfff", borderTopColor: "transparent" }} />
      </div>
    </div>
  );

  if (!series) return (
    <div className="min-h-screen flex items-center justify-center text-sm" style={{ background: "#000", color: "#555" }}>
      Series not found
    </div>
  );

  const chapters = chaptersDesc ? [...series.chapters].reverse() : series.chapters;
  const visibleChapters = chaptersExpanded ? chapters : chapters.slice(0, 10);

  return (
    <div className="min-h-screen" style={{ background: "#000" }}>
      {/* Banner blur */}
      <div className="relative h-44 md:h-56 overflow-hidden" style={{ background: "#0a0a0a" }}>
        {coverUrl && (
          <SafeImage
            src={coverUrl} alt="" variant="banner"
            className="absolute inset-0 w-full h-full object-cover opacity-20 scale-110 blur-md"
          />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, #000 100%)" }} />
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-24 relative z-10 pb-20">
        <div className="flex gap-5">
          {/* Cover */}
          <div className="shrink-0">
            <div className="w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 0 30px rgba(96,207,255,0.3), 0 8px 32px rgba(0,0,0,0.8)" }}>
              <SafeImage src={coverUrl} alt={series.title} variant="cover" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-24 sm:pt-28 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-xl font-black" style={{ color: "#f0f0f0" }}>{series.title}</h1>
                {series.altTitle && <p className="text-xs mt-0.5" style={{ color: "#555" }}>{series.altTitle}</p>}
              </div>
              {user && (
                <button onClick={toggleFavorite}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={isFavorite
                    ? { background: "#2a0a0a", color: "#ff6b6b", border: "1px solid #ff3a3a33" }
                    : { background: "#141414", color: "#888", border: "1px solid #222" }}>
                  <Heart size={13} fill={isFavorite ? "currentColor" : "none"} />
                  {isFavorite ? t("removeFavorite") : t("addFavorite")}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {series.status && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[series.status] || "bg-gray-100 text-gray-700"}`}>
                  {t(series.status.toLowerCase())}
                </span>
              )}
              {series.genres?.map((g) => (
                <span key={g.genre.id} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "#60cfff11", color: "#60cfff", border: "1px solid #60cfff22" }}>
                  {g.genre.name}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: "#555" }}>
              {series.author && <span><span style={{ color: "#777" }}>{t("author")}:</span> {series.author}</span>}
              <span className="flex items-center gap-1"><Eye size={11} /> {series.views}</span>
            </div>

            {series.description && (
              <p className="text-sm mt-2 leading-relaxed line-clamp-3" style={{ color: "#888" }}>{series.description}</p>
            )}

            {series.chapters.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                <Link href={`/reader/${series.chapters[0].id}`}>
                  <button className="px-4 py-2 text-sm font-bold rounded-xl transition-all"
                    style={{ background: "#60cfff", color: "#000" }}>
                    {t("readNow")} — Ch.{series.chapters[0].number}
                  </button>
                </Link>
                {series.chapters.length > 1 && (
                  <Link href={`/reader/${series.chapters[series.chapters.length - 1].id}`}>
                    <button className="px-4 py-2 text-sm font-semibold rounded-xl transition-all"
                      style={{ background: "#141414", color: "#aaa", border: "1px solid #222" }}>
                      Latest — Ch.{series.chapters[series.chapters.length - 1].number}
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chapter List */}
        <motion.div className="mt-8 rounded-2xl overflow-hidden"
          style={{ background: "#0d0d0d", border: "1px solid #1e1e1e" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: "1px solid #1a1a1a" }}>
            <h2 className="font-bold text-sm" style={{ color: "#e8e8e8" }}>{t("chapters")} ({series.chapters.length})</h2>
            <button onClick={() => setChaptersDesc(!chaptersDesc)}
              className="text-xs transition-all" style={{ color: "#555" }}>
              {chaptersDesc ? "Newest First" : "Oldest First"}
            </button>
          </div>

          <div>
            {visibleChapters.map((ch, idx) => (
              <Link key={ch.id} href={`/reader/${ch.id}`}>
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                  style={{ borderBottom: idx < visibleChapters.length - 1 ? "1px solid #141414" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#141414")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "#60cfff11", border: "1px solid #60cfff22" }}>
                      <span className="text-xs font-bold" style={{ color: "#60cfff" }}>{ch.number}</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#ccc" }}>
                      {ch.title || `${t("chapter")} ${ch.number}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "#444" }}>
                    <span className="flex items-center gap-1"><Eye size={10} /> {ch.views}</span>
                    <span>{new Date(ch.uploadDate).toLocaleDateString("fa-IR")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {series.chapters.length > 10 && (
            <button onClick={() => setChaptersExpanded(!chaptersExpanded)}
              className="w-full flex items-center justify-center gap-1.5 py-3 text-xs transition-all"
              style={{ color: "#60cfff", borderTop: "1px solid #1a1a1a" }}>
              {chaptersExpanded
                ? <><ChevronUp size={13} /> کمتر نشان بده</>
                : <><ChevronDown size={13} /> همه {series.chapters.length} فصل</>}
            </button>
          )}

          {series.chapters.length === 0 && (
            <div className="text-center py-10 text-sm" style={{ color: "#333" }}>{t("noResults")}</div>
          )}
        </motion.div>

        {/* ── Comments Section ── */}
        <motion.div className="mt-6 rounded-2xl overflow-hidden"
          style={{ background: "#0d0d0d", border: "1px solid #1e1e1e" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: "1px solid #1a1a1a" }}>
            <div className="flex items-center gap-2">
              <MessageSquare size={15} style={{ color: "#60cfff" }} />
              <span className="font-bold text-sm" style={{ color: "#e8e8e8" }}>
                {comments.length} {comments.length === 1 ? "کامنت" : "کامنت"}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "#141414" }}>
              {(["newest", "oldest"] as const).map(s => (
                <button key={s} onClick={() => setSort(s)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={sort === s
                    ? { background: "#60cfff", color: "#000" }
                    : { color: "#555" }}>
                  {s === "newest" ? "جدیدترین" : "قدیمی‌ترین"}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-4 py-4" style={{ borderBottom: "1px solid #1a1a1a" }}>
            {user ? (
              <div className="flex gap-3">
                <AvatarCircle name={user.username} />
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmitComment(); }}
                    placeholder="نظر خود را بنویسید..."
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm rounded-xl resize-none focus:outline-none transition-all"
                    style={{
                      background: "#141414", color: "#e0e0e0",
                      border: "1px solid #222", fontFamily: "inherit",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#60cfff44")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#222")}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: "#333" }}>Ctrl+Enter برای ارسال</span>
                    <button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || submitting}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                      style={{ background: "#60cfff", color: "#000" }}>
                      {submitting
                        ? <div className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                        : <Send size={12} />}
                      ارسال
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between py-1">
                <span className="text-sm" style={{ color: "#555" }}>برای نظر دادن وارد شوید</span>
                <Link href="/login">
                  <button className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background: "#60cfff", color: "#000" }}>
                    ورود
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Comment list */}
          {commentsLoading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-9 h-9 rounded-full animate-pulse shrink-0" style={{ background: "#1a1a1a" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded animate-pulse" style={{ background: "#1a1a1a" }} />
                    <div className="h-4 w-full rounded animate-pulse" style={{ background: "#1a1a1a" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare size={28} className="mx-auto mb-2 opacity-20" style={{ color: "#60cfff" }} />
              <p className="text-sm" style={{ color: "#333" }}>اولین نفری باش که نظر میذاری!</p>
            </div>
          ) : (
            <div>
              {comments.map((c, idx) => (
                <div key={c.id}
                  className="flex gap-3 px-4 py-4"
                  style={{ borderBottom: idx < comments.length - 1 ? "1px solid #141414" : "none" }}>
                  <AvatarCircle name={c.username} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold" style={{ color: "#e0e0e0" }}>{c.username}</span>
                      {c.chapterNumber != null && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md"
                          style={{ background: "#60cfff11", color: "#60cfff88", border: "1px solid #60cfff22" }}>
                          فصل {c.chapterNumber}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "#333" }}>{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#aaa" }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
