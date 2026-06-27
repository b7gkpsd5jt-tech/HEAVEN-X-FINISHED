import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import { apiFetch, getImageUrl } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Settings, Moon, Sun, ZoomIn, ZoomOut,
  List, X, Star, RotateCcw, Contrast, ImageOff
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

function PageImage({ src, idx, zoom, filter, onVisible, horizontal }: {
  src: string | null; idx: number; zoom: number; filter: string;
  onVisible?: () => void; horizontal?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return (
    <div
      style={{
        width: horizontal ? "auto" : `${zoom}%`,
        maxWidth: 900,
        margin: "0 auto",
        padding: "40px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        color: "#333",
      }}
    >
      <ImageOff size={28} />
      <span style={{ fontSize: 11 }}>صفحه {idx + 1} در دسترس نیست</span>
    </div>
  );
  return (
    <img
      src={src || ""}
      alt=""
      loading="lazy"
      onLoad={onVisible}
      style={{
        width: horizontal ? `${zoom}%` : `${zoom}%`,
        maxWidth: horizontal ? "100%" : "900px",
        maxHeight: horizontal ? "100%" : undefined,
        filter,
        display: "block",
        margin: horizontal ? undefined : "0 auto",
        objectFit: "contain",
      }}
      onError={() => setFailed(true)}
    />
  );
}

export default function Reader() {
  const { id } = useParams();
  const { t } = useLang();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ReaderSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentHPage, setCurrentHPage] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ratingData, setRatingData] = useState<{ average: number; count: number } | null>(null);
  const [allChapters, setAllChapters] = useState<{ id: string; number: number; title?: string }[]>([]);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setCurrentPage(1);
    setCurrentHPage(0);
    apiFetch<Chapter>(`/chapters/${id}`)
      .then(setChapter).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!chapter) return;
    apiFetch<Comment[]>(`/comments/chapter/${chapter.id}`).then(setComments).catch(() => {});
    apiFetch<{ id: string; number: number; title?: string }[]>(`/chapters/series/${chapter.series.id}`)
      .then(setAllChapters).catch(() => {});
    apiFetch<{ average: number; count: number }>(`/ratings/chapter/${chapter.id}`)
      .then(data => {
        setRatingData({ average: data.average, count: data.count });
      }).catch(() => {});
  }, [chapter]);

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

  const buildFilter = () => {
    const parts: string[] = [];
    if (settings.brightness !== 100) parts.push(`brightness(${settings.brightness / 100})`);
    if (settings.nightMode) parts.push("sepia(0.3) hue-rotate(180deg)");
    if (settings.invertColors) parts.push("invert(1)");
    return parts.join(" ") || "none";
  };

  if (loading) return (
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
                  { icon: <List size={17} />, action: () => setShowChapterList(!showChapterList) },
                  { icon: <Settings size={17} />, action: () => setShowSettings(!showSettings) },
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    className="p-2 rounded-xl transition-colors"
                    style={{ color: DARK.textMuted }}
                  >
                    {btn.icon}
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
      <div className="pt-14">
        {settings.readMode === "vertical" ? (
          <div className="flex flex-col items-center gap-0.5">
            {chapter.pages.map((page, idx) => (
              <PageImage
                key={page.id}
                src={getImageUrl(page.filePath)}
                idx={idx}
                zoom={settings.zoom}
                filter={filterStyle}
                onVisible={() => { if (idx + 1 > currentPage) setCurrentPage(idx + 1); }}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 h-[calc(100vh-120px)] flex flex-col">
            {chapter.pages[currentHPage] && (
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <PageImage
                  src={getImageUrl(chapter.pages[currentHPage].filePath)}
                  idx={currentHPage}
                  zoom={settings.zoom}
                  filter={filterStyle}
                  horizontal
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

        {/* ── Chapter End + Comments ── */}
        <div className="max-w-2xl mx-auto px-4 pb-28 mt-2">
          {/* End divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: DARK.border }} />
            <span className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{ color: DARK.textMuted, background: DARK.panel, border: `1px solid ${DARK.border}` }}>
              {t("chapter")} {chapter.number} — {t("end") || "پایان"}
            </span>
            <div className="flex-1 h-px" style={{ background: DARK.border }} />
          </div>

          {/* Chapter navigation */}
          <div className="flex items-center justify-between gap-3 mb-8">
            {chapter.prevChapter ? (
              <Link href={`/reader/${chapter.prevChapter.id}`}>
                <button className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl transition-all"
                  style={{ background: DARK.hover, color: DARK.text, border: `1px solid ${DARK.border}` }}>
                  <ChevronLeft size={15} /> {t("chapter")} {chapter.prevChapter.number}
                </button>
              </Link>
            ) : <div />}
            {chapter.nextChapter ? (
              <Link href={`/reader/${chapter.nextChapter.id}`}>
                <button className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl transition-all"
                  style={{ background: DARK.accent, color: "#000" }}>
                  {t("chapter")} {chapter.nextChapter.number} <ChevronRight size={15} />
                </button>
              </Link>
            ) : (
              <Link href={`/series/${chapter.series.id}`}>
                <button className="px-4 py-2.5 text-sm font-medium rounded-xl"
                  style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                  ✓ {t("done") || "پایان سری"}
                </button>
              </Link>
            )}
          </div>

          {/* Rating (Display Only) */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: DARK.panel, border: `1px solid ${DARK.border}` }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: DARK.textMuted }}>{t("rating") || "امتیاز"}</p>
            <div className="flex gap-2 items-center">
              {[1, 2, 3, 4, 5].map((s) => {
                const avg = ratingData ? Math.round(ratingData.average) : 0;
                return (
                  <Star key={s} size={26}
                    className={s <= avg ? "fill-yellow-400" : ""}
                    style={{ color: s <= avg ? "#facc15" : "#333" }} />
                );
              })}
              {ratingData && (
                <span className="text-sm ml-2" style={{ color: DARK.textMuted }}>
                  {Number(ratingData.average).toFixed(1)} <span style={{ color: "#555" }}>({ratingData.count})</span>
                </span>
              )}
            </div>
          </div>

          {/* Comments header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ color: DARK.text }}>
              {t("comments") || "کامنت‌ها"}
              {comments.length > 0 && (
                <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(96,207,255,0.1)", color: DARK.accent }}>
                  {comments.length}
                </span>
              )}
            </h3>
          </div>

          {/* Comment list */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="text-center py-10 text-sm" style={{ color: "#444" }}>
                هنوز کامنتی نیست. اولین نفر باش
              </div>
            ) : (
              [...comments].reverse().map((c) => (
                <div key={c.id} className="rounded-xl p-3.5" style={{ background: DARK.panel, border: `1px solid ${DARK.border}` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold" style={{ color: DARK.accent }}>{c.username}</span>
                    <span className="text-[10px]" style={{ color: DARK.textMuted }}>
                      {new Date(c.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: DARK.text }}>{c.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Scrolling page counter (vertical mode only) ── */}
      {settings.readMode === "vertical" && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="px-3 py-1 rounded-full text-xs tabular-nums"
            style={{ background: "rgba(10,10,10,0.85)", color: DARK.textMuted, border: `1px solid ${DARK.border}` }}>
            {currentPage} / {chapter.pages.length}
          </div>
        </div>
      )}
    </div>
  );
}
