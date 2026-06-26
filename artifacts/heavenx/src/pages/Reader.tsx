import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import { apiFetch, API_BASE } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Settings, Moon, Sun, ZoomIn, ZoomOut,
  List, X, Star, MessageSquare, Send, Eye, RotateCcw, ChevronDown
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
  readMode: "vertical" | "horizontal";
}

function loadSettings(): ReaderSettings {
  try {
    return JSON.parse(localStorage.getItem("hx_reader_settings") || "null") || {
      zoom: 100, brightness: 100, nightMode: false, readMode: "vertical"
    };
  } catch {
    return { zoom: 100, brightness: 100, nightMode: false, readMode: "vertical" };
  }
}

function saveSettings(s: ReaderSettings) {
  localStorage.setItem("hx_reader_settings", JSON.stringify(s));
}

export default function Reader() {
  const { id } = useParams();
  const { t } = useLang();
  const { user } = useAuth();
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
  const [ratingData, setRatingData] = useState<{ average: number; count: number } | null>(null);
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
      .then(setChapter)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!chapter) return;
    apiFetch<Comment[]>(`/comments/chapter/${chapter.id}`).then(setComments).catch(() => {});
    // Fetch all chapters for the series
    apiFetch<{ id: string; number: number; title?: string }[]>(`/chapters/series/${chapter.series.id}`)
      .then(setAllChapters)
      .catch(() => {});
  }, [chapter]);

  // Save reading progress when reaching last pages
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

  // Header hide on scroll
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      if (current < 50 || current < lastScrollRef.current) {
        setHeaderVisible(true);
      } else {
        setHeaderVisible(false);
      }
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
      const res = await apiFetch<{ average: number; count: number }>(`/ratings/chapter/${chapter.id}`, {
        method: "POST",
        body: JSON.stringify({ stars }),
      });
      setRatingData(res);
    } catch {}
  };

  const getPageUrl = (page: Page) => {
    if (page.filePath.startsWith("/uploads")) {
      return `${API_BASE.replace("/api", "")}${page.filePath}`;
    }
    return page.filePath;
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${settings.nightMode ? "bg-gray-950" : "bg-gray-100"}`}>
      <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!chapter) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">Chapter not found</div>
  );

  const bgColor = settings.nightMode ? "#0f0f0f" : "#f9f9f9";
  const filterStyle = `brightness(${settings.brightness / 100}) ${settings.nightMode ? "sepia(0.4) hue-rotate(180deg)" : ""}`;

  return (
    <div className="min-h-screen select-none" style={{ background: bgColor }}>
      {/* Sticky Header */}
      <AnimatePresence>
        {headerVisible && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
          >
            <div className="max-w-3xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
              <Link href={`/series/${chapter.series.id}`}>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors truncate max-w-[160px]">
                  <ChevronLeft size={16} />
                  <span className="truncate">{chapter.series.title}</span>
                </div>
              </Link>

              <div className="text-sm font-semibold text-gray-900 flex-shrink-0">
                {t("chapter")} {chapter.number}
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => setShowChapterList(!showChapterList)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                  <List size={17} />
                </button>
                <button onClick={() => setShowComments(!showComments)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 relative">
                  <MessageSquare size={17} />
                  {comments.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {comments.length}
                    </span>
                  )}
                </button>
                <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                  <Settings size={17} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-14 right-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-72"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">{t("settings")}</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              {/* Night mode */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  {settings.nightMode ? <Moon size={14} /> : <Sun size={14} />}
                  {t("nightMode")}
                </div>
                <button
                  onClick={() => updateSettings({ nightMode: !settings.nightMode })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${settings.nightMode ? "bg-indigo-600" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.nightMode ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {/* Brightness */}
              <div>
                <div className="flex justify-between text-sm text-gray-700 mb-1.5">
                  <span>{t("brightness")}</span>
                  <span className="font-medium">{settings.brightness}%</span>
                </div>
                <input
                  type="range" min="30" max="150" value={settings.brightness}
                  onChange={(e) => updateSettings({ brightness: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Zoom */}
              <div>
                <div className="flex justify-between text-sm text-gray-700 mb-1.5">
                  <span>{t("zoom")}</span>
                  <span className="font-medium">{settings.zoom}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateSettings({ zoom: Math.max(50, settings.zoom - 10) })} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                    <ZoomOut size={14} />
                  </button>
                  <input
                    type="range" min="50" max="200" value={settings.zoom}
                    onChange={(e) => updateSettings({ zoom: Number(e.target.value) })}
                    className="flex-1 accent-indigo-600"
                  />
                  <button onClick={() => updateSettings({ zoom: Math.min(200, settings.zoom + 10) })} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                    <ZoomIn size={14} />
                  </button>
                </div>
              </div>

              {/* Read mode */}
              <div>
                <p className="text-sm text-gray-700 mb-2">Mode</p>
                <div className="flex gap-2">
                  {(["vertical", "horizontal"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => updateSettings({ readMode: m })}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${settings.readMode === m ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}
                    >
                      {m === "vertical" ? "⬇ Vertical" : "➡ Horizontal"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={() => { const def = { zoom: 100, brightness: 100, nightMode: false, readMode: "vertical" as const }; updateSettings(def); }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 rounded-lg"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter list panel */}
      <AnimatePresence>
        {showChapterList && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-14 right-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 w-64 max-h-96 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 text-sm">{t("chapterList")}</h3>
              <button onClick={() => setShowChapterList(false)} className="text-gray-400"><X size={14} /></button>
            </div>
            <div className="divide-y divide-gray-50">
              {[...allChapters].reverse().map((ch) => (
                <Link key={ch.id} href={`/reader/${ch.id}`}>
                  <div
                    onClick={() => setShowChapterList(false)}
                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50 transition-colors ${ch.id === id ? "bg-indigo-50 text-indigo-600 font-semibold" : "text-gray-700"}`}
                  >
                    {t("chapter")} {ch.number}{ch.title ? `: ${ch.title}` : ""}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pages */}
      <div className="pt-14 pb-20">
        {settings.readMode === "vertical" ? (
          <div className="flex flex-col items-center gap-1 px-2">
            {chapter.pages.map((page, idx) => (
              <img
                key={page.id}
                src={getPageUrl(page)}
                alt={`Page ${page.pageNumber}`}
                loading="lazy"
                onLoad={() => { if (idx + 1 > currentPage) setCurrentPage(idx + 1); }}
                style={{
                  width: `${settings.zoom}%`,
                  maxWidth: "900px",
                  filter: filterStyle,
                  display: "block",
                  margin: "0 auto",
                }}
                className="shadow-md"
              />
            ))}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 h-[calc(100vh-120px)] flex flex-col">
            {chapter.pages[currentHPage] && (
              <div className="flex-1 flex items-center justify-center">
                <img
                  src={getPageUrl(chapter.pages[currentHPage])}
                  alt={`Page ${currentHPage + 1}`}
                  style={{ maxHeight: "100%", maxWidth: "100%", filter: filterStyle, width: `${settings.zoom}%` }}
                  className="object-contain"
                />
              </div>
            )}
            <div className="flex items-center justify-center gap-6 py-4">
              <button disabled={currentHPage === 0} onClick={() => setCurrentHPage(p => p - 1)} className="p-3 rounded-xl bg-white shadow-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600 font-medium">
                {t("page")} {currentHPage + 1} {t("of")} {chapter.pages.length}
              </span>
              <button disabled={currentHPage >= chapter.pages.length - 1} onClick={() => setCurrentHPage(p => p + 1)} className="p-3 rounded-xl bg-white shadow-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {chapter.prevChapter ? (
            <Link href={`/reader/${chapter.prevChapter.id}`}>
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                <ChevronLeft size={15} /> Ch.{chapter.prevChapter.number}
              </button>
            </Link>
          ) : <div />}

          <div className="text-xs text-gray-500 text-center">
            {settings.readMode === "vertical" ? (
              <>p.{currentPage} / {chapter.pages.length}</>
            ) : (
              <>Ch.{chapter.number}</>
            )}
          </div>

          {chapter.nextChapter ? (
            <Link href={`/reader/${chapter.nextChapter.id}`}>
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all">
                Ch.{chapter.nextChapter.number} <ChevronRight size={15} />
              </button>
            </Link>
          ) : (
            <Link href={`/series/${chapter.series.id}`}>
              <button className="px-4 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-xl">✓ Done</button>
            </Link>
          )}
        </div>
      </div>

      {/* Comments & Rating Drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-80 z-50 bg-white shadow-2xl border-l border-gray-100 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{t("comments")}</h2>
              <button onClick={() => setShowComments(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            {/* Rating */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-2">{t("rating")}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => submitRating(s)} disabled={!user}>
                    <Star size={20} className={s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                  </button>
                ))}
                {ratingData && (
                  <span className="text-xs text-gray-500 ml-2 self-center">
                    {Number(ratingData.average).toFixed(1)} ({ratingData.count})
                  </span>
                )}
              </div>
            </div>

            {/* Comment list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-indigo-600">{c.username}</span>
                    <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700">{c.text}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">{t("noResults")}</div>
              )}
            </div>

            {/* Add comment */}
            {user && (
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t("addComment")}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  />
                  <button onClick={submitComment} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
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
