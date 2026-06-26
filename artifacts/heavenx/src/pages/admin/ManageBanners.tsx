import { useEffect, useState, useRef } from "react";
import { apiFetch, apiUpload, getImageUrl } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Upload, Image, X, Trash2 } from "lucide-react";

interface Settings {
  bannerUrl?: string;
  bannerOverlayText?: string;
  siteName?: string;
  announcement?: string;
}

export default function ManageBanners() {
  const { t } = useLang();
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [overlayText, setOverlayText] = useState("");
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    apiFetch<Settings>("/settings").then(s => {
      setSettings(s);
      setOverlayText(s.bannerOverlayText || "");
      setAnnouncement(s.announcement || "");
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("banner", file);
      const result = await apiUpload<{ url: string }>("/upload/banner", fd);
      setSettings(s => ({ ...s, bannerUrl: result.url }));
      setMessage({ type: "success", text: "Banner hochgeladen!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("error") });
    } finally { setSaving(false); }
  };

  const handleBannerDelete = async () => {
    if (!confirm("Banner wirklich löschen?")) return;
    setSaving(true);
    try {
      await apiFetch("/upload/banner", { method: "DELETE" });
      setSettings(s => ({ ...s, bannerUrl: undefined }));
      setMessage({ type: "success", text: "Banner gelöscht." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("error") });
    } finally { setSaving(false); }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await apiFetch("/settings", {
        method: "PATCH",
        body: JSON.stringify({ bannerOverlayText: overlayText, announcement }),
      });
      setMessage({ type: "success", text: t("success") });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("error") });
    } finally { setSaving(false); }
  };

  const bannerUrl = getImageUrl(settings.bannerUrl);

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full" style={{ borderColor: "#fff #fff #fff transparent" }} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#1a1a1a" }}>
          <Image size={18} style={{ color: "#aaa" }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "#f0f0f0" }}>{t("banners")}</h1>
      </div>

      <div className="space-y-5">
        {/* Banner preview — responsive, background-size: cover */}
        <div className="rounded-2xl border p-5" style={{ background: "#111", borderColor: "#222" }}>
          <h2 className="font-semibold mb-3" style={{ color: "#f0f0f0" }}>Hero Banner</h2>

          {/* Responsive preview container */}
          <div
            className="relative w-full rounded-xl overflow-hidden mb-4"
            style={{
              height: "clamp(120px, 25vw, 260px)",
              background: bannerUrl
                ? `url(${bannerUrl}) center/cover no-repeat`
                : "linear-gradient(135deg, #1a1a1a, #111)",
            }}
          >
            {/* Dark overlay */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))" }}
            />

            {!bannerUrl && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ color: "#333" }}>
                <Image size={40} />
              </div>
            )}

            {overlayText && (
              <div
                className="absolute bottom-4 left-4 font-bold text-white drop-shadow-lg"
                style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.25rem)" }}
              >
                {overlayText}
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-60 transition-all"
              style={{ background: "#ffffff", color: "#000" }}
            >
              <Upload size={15} /> {saving ? t("loading") : "Banner hochladen"}
            </button>
            {bannerUrl && (
              <button
                onClick={handleBannerDelete}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-60 transition-all"
                style={{ background: "#2a1010", color: "#ff6b6b", border: "1px solid #3a1515" }}
              >
                <Trash2 size={15} /> Banner löschen
              </button>
            )}
          </div>
        </div>

        {/* Text settings */}
        <div className="rounded-2xl border p-5" style={{ background: "#111", borderColor: "#222" }}>
          <h2 className="font-semibold mb-3" style={{ color: "#f0f0f0" }}>Banner Overlay-Text</h2>
          <input
            value={overlayText}
            onChange={e => setOverlayText(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl mb-4 focus:outline-none"
            style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid #2a2a2a" }}
            placeholder="بهشت منهوا — بهترین مانهواها به زبان فارسی"
          />
          <h2 className="font-semibold mb-2 mt-4" style={{ color: "#f0f0f0" }}>Ankündigung (Homepage)</h2>
          <input
            value={announcement}
            onChange={e => setAnnouncement(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl mb-4 focus:outline-none"
            style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid #2a2a2a" }}
            placeholder="Wichtige Ankündigung auf der Startseite"
          />
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-60 transition-all"
            style={{ background: "#ffffff", color: "#000" }}
          >
            {saving ? t("loading") : t("save")}
          </button>
        </div>

        {message && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={message.type === "success"
              ? { background: "#0f2a0f", color: "#66cc66", border: "1px solid #1a3a1a" }
              : { background: "#2a0f0f", color: "#ff6b6b", border: "1px solid #3a1515" }}
          >
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto" style={{ color: "inherit" }}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
