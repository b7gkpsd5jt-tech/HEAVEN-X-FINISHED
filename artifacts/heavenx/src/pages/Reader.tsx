import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, Redirect } from "wouter";
import { apiFetch, getImageUrl } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Settings, Moon, Sun, ZoomIn, ZoomOut,
  List, X, Star, MessageSquare, Send, RotateCcw, Contrast
} from "lucide-react";

interface Page { id: string; pageNumber: number; filePath: string; fileName: string; order: number }
interface Chapter {
  id: string; number: number; title?: string; views: number;
  series: { id: string; title: string };
  pages: Page[];
  prevChapter?: { id: string; number: number } | null;
  nextChapter?: { id: string; number: number } | null;
}
interface Comment { id: string; username: string; text: string; createdAt: string }

interface ReaderSettings {
  zoom: number;
  brightness: number;
  nightMode: boolean;
  invertColors: boolean;
  readMode: "vertical" | "horizontal";
}

function loadSettings(): ReaderSettings {
  try {
    return JSON.parse(localStorage.getItem("hx_reader_settings") || "null") || {
      zoom: 100, brightness: 100, nightMode: false, invertColors: false, readMode: "vertical"
    };
  } catch {
    return { zoom: 100, brightness: 100, nightMode: false, invertColors: false, readMode: "vertical" };
  }
}

function saveSettings(s: ReaderSettings) {
  localStorage.setItem("hx_reader_settings", JSON.stringify(s));
}

const DARK = {
  bg: "#000000",
  bar: "rgba(10,10,10,0.97)",
  panel: "#111111",
  border: "#222222",
  text: "#e8e8e8",
  textMuted: "#888888",
  hover: "#1a1a1a",
  accent: "#60cfff",
};

export default function Reader() {
  const { id } = useParams();
  const { t } = useLang();
  const { user, loading: authLoading } = useAuth();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ReaderSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentHPage, setCurrentHPage] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [rating, setRating] = useState(0);
  const [ratingData, setRatingData] = useState<{ average: number; count: number; userRating?: number } | null>(null);
  const [allChapters, setAllChapters] = useState<{ id: string; number: number; title?: string }[]>([]);
  const lastScrollRef = useRef(0);
  const progressSavedRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setCurrentPage(1);
    setCurrentHPage(0);
    progressSavedRef.current = false;
    apiFetch<Chapter>(`/chapters/${id}`)
      .then(setChapter).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!chapter) return;
    apiFetch<Comment[]>(`/comments/chapter/${chapter.id}`).then(setComments).catch(() => {});
    apiFetch<{ id: string; number: number; title?: string }[]>(`/chapters/series/${chapter.series.id}`)
      .then(setAllChapters).catch(() => {});
    apiFetch<{ average: number; count: number; userRating: number }>(`/ratings/chapter/${chapter.id}`)
      .then(data => {
        setRatingData({ average: data.average, count: data.count });
        if (data.userRating > 0) setRating(data.userRating);
      }).catch(() => {});
  }, [chapter]);

  useEffect(() => {
    if (!user || !chapter || progressSavedRef.current) return;
    if (currentPage >= chapter.pages.length * 0.8) {
      progressSavedRef.current = true;
      apiFetch("/users/progress", {
        method: "POST",
        body: JSON.stringify({ seriesId: chapter.series.id, chapterId: chapter.id, page: currentPage }),
      }).catch(() => {});
    }
  }, [currentPage, chapter, user]);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      if (current < 50 || current < lastScrollRef.current) setHeaderVisible(true);
      else setHeaderVisible(false);
      lastScrollRef.current = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const updateSettings = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const submitComment = async () => {
    if (!commentText.trim() || !chapter || !user) return;
    try {
      const c = await apiFetch<Comment>(`/comments/chapter/${chapter.id}`, {
        method: "POST",
        body: JSON.stringify({ text: commentText }),
      });
      setComments(prev => [...prev, c]);
      setCommentText("");
    } catch {}
  };

  const submitRating = async (stars: number) => {
    if (!chapter || !user) return;
    setRating(stars);
    try {
      const res = await apiFetch<{ average: number; count: number; userRating: number }>(`/ratings/chapter/${chapter.id}`, {
        method: "POST",
        body: JSON.stringify({ stars }),
      });
      setRatingData({ average: res.average, count: res.count });
    } catch {}
  };

  const buildFilter = () => {
    const parts: string[] = [];
    if (settings.brightness !== 100) parts.push(`brightness(${settings.brightness / 100})`);
    if (settings.nightMode) parts.push("sepia(0.3) hue-rotate(180deg)");
    if (settings.invertColors) parts.push("invert(1)");
    return parts.join(" ") || "none";
  };

  if (!authLoading && !user) return <Redirect to="/login" />;

  if (loading || authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: DARK.bg }}>
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: `${DARK.accent} ${DARK.accent} ${DARK.accent} transparent` }} />
    </div>
  );

  if (!chapter) return (
    <div className="min-h-screen flex items-center justify-center text-sm" style={{ background: DARK.bg, color: DARK.textMuted }}>
      Chapter not found
    </div>
  );

  const filterStyle = buildFilter();

  return (
    <div className="min-h-screen select-none" style={{ background: DARK.bg }}>

      {/* ── Top Bar ── */}
      <AnimatePresence>
        {headerVisible && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md"
            style={{ background: DARK.bar, borderBottom: `1px solid ${DARK.border}` }}
          >
            <div className="max-w-3xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
              <Link href={`/series/${chapter.series.id}`}>
                <div className="flex items-center gap-1.5 text-sm font-medium truncate max-w-[160px] transition-colors"
                  style={{ color: DARK.textMuted }}>
                  <ChevronLeft size={16} />
                  <span className="truncate">{chapter.series.title}</span>
                </div>
              </Link>

              <div className="text-sm font-semibold flex-shrink-0" style={{ color: DARK.text }}>
                {t("chapter")} {chapter.number}
              </div>

              <div className="flex items-center gap-0.5">
                {[
                  { icon: <List size={17} />, action: () => setShowChapterList(!showChapterList), badge: null },
                  { icon: <MessageSquare size={17} />, action: () => setShowComments(!showComments), badge: comments.length > 0 ? comments.length : null },
                  { icon: <Settings size={17} />, action: () => setShowSettings(!showSettings), badge: null },
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    className="p-2 rounded-xl relative transition-colors"
                    style={{ color: DARK.textMuted }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = DARK.hover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    {btn.icon}
                    {btn.badge && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center"
                        style={{ background: DARK.accent, color: "#000" }}>
                        {btn.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Settings Panel ── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-14 right-4 z-50 rounded-2xl shadow-2xl p-4 w-72"
            style={{ background: DARK.panel, border: `1px solid ${DARK.border}` }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm" style={{ color: DARK.text }}>{t("settings")}</h3>
              <button onClick={() => setShowSettings(false)} style={{ color: DARK.textMuted }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Night mode */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm" style={{ color: DARK.text }}>
                  {settings.nightMode ? <Moon size={14} /> : <Sun size={14} />}
                  {t("nightMode")}
                </div>
                <button
                  onClick={() => updateSettings({ nightMode: !settings.nightMode })}
                  className="relative w-11 h-6 rounded-full transition-colors"
                  style={{ background: settings.nightMode ? DARK.accent : "#333" }}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.nightMode ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {/* Invert Colors */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm" style={{ color: DARK.text }}>
                  <Contrast size={14} />
                  Invert Colors
                </div>
                <button
                  onClick={() => updateSettings({ invertColors: !settings.invertColors })}
                  className="relative w-11 h-6 rounded-full transition-colors"
                  style={{ background: settings.invertColors ? DARK.accent : "#333" }}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.invertColors ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {/* Brightness */}
              <div>
                <div className="flex justify-between text-sm mb-1.5" style={{ color: DARK.text }}>
                  <span>{t("brightness")}</span>
                  <span style={{ color: DARK.textMuted }}>{settings.brightness}%</span>
                </div>
                <input type="range" min="30" max="150" value={settings.brightness}
                  onChange={(e) => updateSettings({ brightness: Number(e.target.value) })}
                  className="w-full" style={{ accentColor: DARK.accent }} />
              </div>

              {/* Zoom */}
              <div>
                <div className="flex justify-between text-sm mb-1.5" style={{ color: DARK.text }}>
                  <span>{t("zoom")}</span>
                  <span style={{ color: DARK.textMuted }}>{settings.zoom}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSettings({ zoom: Math.max(50, settings.zoom - 10) })}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ background: DARK.hover, color: DARK.text }}
                  >
                    <ZoomOut size={14} />
                  </button>
                  <input type="range" min="50" max="200" value={settings.zoom}
                    onChange={(e) => updateSettings({ zoom: Number(e.target.value) })}
                    className="flex-1" style={{ accentColor: DARK.accent }} />
                  <button
                    onClick={() => updateSettings({ zoom: Math.min(200, settings.zoom + 10) })}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ background: DARK.hover, color: DARK.text }}
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
              </div>

              {/* Read mode */}
              <div>
                <p className="text-sm mb-2" style={{ color: DARK.text }}>Mode</p>
                <div className="flex gap-2">
                  {(["vertical", "horizontal"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => updateSettings({ readMode: m })}
                      className="flex-1 py-2 text-xs font-medium rounded-xl transition-all"
                      style={settings.readMode === m
                        ? { background: DARK.accent, color: "#000" }
                        : { background: DARK.hover, color: DARK.textMuted }}
                    >
                      {m === "vertical" ? "⬇ Vertical" : "➡ Horizontal"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={() => updateSettings({ zoom: 100, brightness: 100, nightMode: false, invertColors: false, readMode: "vertical" })}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs rounded-xl transition-colors"
                style={{ background: DARK.hover, color: DARK.textMuted }}
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chapter List Panel ── */}
      <AnimatePresence>
        {showChapterList && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-14 right-4 z-50 rounded-2xl shadow-2xl w-64 max-h-96 overflow-y-auto"
            style={{ background: DARK.panel, border: `1px solid ${DARK.border}` }}
          >
            <div className="sticky top-0 px-4 py-3 flex justify-between items-center"
              style={{ background: DARK.panel, borderBottom: `1px solid ${DARK.border}` }}>
              <h3 className="font-semibold text-sm" style={{ color: DARK.text }}>{t("chapterList")}</h3>
              <button onClick={() => setShowChapterList(false)} style={{ color: DARK.textMuted }}>
                <X size={14} />
              </button>
            </div>
            <div>
              {[...allChapters].reverse().map((ch) => (
                <Link key={ch.id} href={`/reader/${ch.id}`}>
                  <div
                    onClick={() => setShowChapterList(false)}
                    className="px-4 py-2.5 text-sm cursor-pointer transition-colors"
                    style={ch.id === id
                      ? { background: "rgba(96,207,255,0.1)", color: DARK.accent, fontWeight: 600 }
                      : { color: DARK.text }}
                    onMouseEnter={e => { if (ch.id !== id) (e.currentTarget as HTMLDivElement).style.background = DARK.hover; }}
                    onMouseLeave={e => { if (ch.id !== id) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    {t("chapter")} {ch.number}{ch.title ? `: ${ch.title}` : ""}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pages ── */}
      <div className="pt-14 pb-20">
        {settings.readMode === "vertical" ? (
          <div className="flex flex-col items-center gap-0.5">
            {chapter.pages.map((page, idx) => (
              <img
                key={page.id}
                src={getImageUrl(page.filePath) || ""}
                alt=""
                loading="lazy"
                onLoad={() => { if (idx + 1 > currentPage) setCurrentPage(idx + 1); }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                style={{ width: `${settings.zoom}%`, maxWidth: "900px", filter: filterStyle, display: "block", margin: "0 auto" }}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 h-[calc(100vh-120px)] flex flex-col">
            {chapter.pages[currentHPage] && (
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <img
                  src={getImageUrl(chapter.pages[currentHPage].filePath) || ""}
                  alt=""
                  style={{ maxHeight: "100%", maxWidth: "100%", filter: filterStyle, width: `${settings.zoom}%` }}
                  className="object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
            <div className="flex items-center justify-center gap-6 py-4">
              <button
                disabled={currentHPage === 0}
                onClick={() => setCurrentHPage(p => p - 1)}
                className="p-3 rounded-xl disabled:opacity-40 transition-colors"
                style={{ background: DARK.hover, color: DARK.text, border: `1px solid ${DARK.border}` }}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium tabular-nums" style={{ color: DARK.textMuted }}>
                {currentHPage + 1} / {chapter.pages.length}
              </span>
              <button
                disabled={currentHPage >= chapter.pages.length - 1}
                onClick={() => setCurrentHPage(p => p + 1)}
                className="p-3 rounded-xl disabled:opacity-40 transition-colors"
                style={{ background: DARK.hover, color: DARK.text, border: `1px solid ${DARK.border}` }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md"
        style={{ background: DARK.bar, borderTop: `1px solid ${DARK.border}` }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {chapter.prevChapter ? (
            <Link href={`/reader/${chapter.prevChapter.id}`}>
              <button
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all"
                style={{ background: DARK.hover, color: DARK.text, border: `1px solid ${DARK.border}` }}
              >
                <ChevronLeft size={15} /> Ch.{chapter.prevChapter.number}
              </button>
            </Link>
          ) : <div />}

          <div className="text-xs text-center tabular-nums" style={{ color: DARK.textMuted }}>
            {settings.readMode === "vertical" ? (
              <>{currentPage} / {chapter.pages.length}</>
            ) : (
              <>Ch.{chapter.number}</>
            )}
          </div>

          {chapter.nextChapter ? (
            <Link href={`/reader/${chapter.nextChapter.id}`}>
              <button
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all"
                style={{ background: DARK.accent, color: "#000" }}
              >
                Ch.{chapter.nextChapter.number} <ChevronRight size={15} />
              </button>
            </Link>
          ) : (
            <Link href={`/series/${chapter.series.id}`}>
              <button
                className="px-4 py-2 text-sm font-medium rounded-xl transition-colors"
                style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}
              >
                ✓ Done
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Comments & Rating Drawer ── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-80 z-50 flex flex-col"
            style={{ background: DARK.panel, borderLeft: `1px solid ${DARK.border}` }}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${DARK.border}` }}>
              <h2 className="font-bold" style={{ color: DARK.text }}>{t("comments")}</h2>
              <button onClick={() => setShowComments(false)} style={{ color: DARK.textMuted }}>
                <X size={18} />
              </button>
            </div>

            {/* Rating */}
            <div className="px-4 py-3" style={{ background: DARK.hover, borderBottom: `1px solid ${DARK.border}` }}>
              <p className="text-xs font-medium mb-2" style={{ color: DARK.textMuted }}>{t("rating")}</p>
              <div className="flex gap-1 items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => submitRating(s)} disabled={!user}>
                    <Star size={20} className={s <= rating ? "text-yellow-400 fill-yellow-400" : ""} style={{ color: s <= rating ? "#facc15" : "#444" }} />
                  </button>
                ))}
                {ratingData && (
                  <span className="text-xs ml-2 self-center" style={{ color: DARK.textMuted }}>
                    {Number(ratingData.average).toFixed(1)} ({ratingData.count})
                  </span>
                )}
              </div>
            </div>

            {/* Comment list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="rounded-xl p-3" style={{ background: DARK.hover }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold" style={{ color: DARK.accent }}>{c.username}</span>
                    <span className="text-[10px]" style={{ color: DARK.textMuted }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm" style={{ color: DARK.text }}>{c.text}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center py-8 text-sm" style={{ color: DARK.textMuted }}>{t("noResults")}</div>
              )}
            </div>

            {/* Add comment */}
            {user && (
              <div className="p-4" style={{ borderTop: `1px solid ${DARK.border}` }}>
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t("addComment")}
                    className="flex-1 px-3 py-2 text-sm rounded-xl focus:outline-none"
                    style={{ background: DARK.hover, color: DARK.text, border: `1px solid ${DARK.border}` }}
                    onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  />
                  <button
                    onClick={submitComment}
                    className="p-2 rounded-xl transition-colors"
                    style={{ background: DARK.accent, color: "#000" }}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
