import { useEffect, useState, useRef } from "react";
import { apiFetch, apiUpload, API_BASE } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Upload, Image, X } from "lucide-react";

interface Settings { bannerUrl?: string; bannerOverlayText?: string; siteName?: string; announcement?: string; maintenanceMode?: boolean; maintenanceMessage?: string }

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
      setMessage({ type: "success", text: "Banner uploaded!" });
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

  const bannerUrl = settings.bannerUrl
    ? settings.bannerUrl.startsWith("/uploads")
      ? `${API_BASE.replace("/api", "")}${settings.bannerUrl}`
      : settings.bannerUrl
    : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center">
          <Image size={18} className="text-pink-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t("banners")}</h1>
      </div>

      <div className="space-y-5">
        {/* Current banner preview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Hero Banner</h2>
          <div className="relative rounded-xl overflow-hidden aspect-[21/6] bg-gradient-to-br from-indigo-900 to-violet-900 mb-4">
            {bannerUrl ? (
              <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-70" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/30">
                <Image size={40} />
              </div>
            )}
            {overlayText && (
              <div className="absolute bottom-4 left-4 text-white font-bold text-lg drop-shadow-lg">{overlayText}</div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          <button onClick={() => fileRef.current?.click()} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60">
            <Upload size={15} /> {saving ? t("loading") : "Upload Banner Image"}
          </button>
        </div>

        {/* Overlay text */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Banner Overlay Text</h2>
          <input
            value={overlayText}
            onChange={e => setOverlayText(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-3"
            placeholder="بهشت منهوا — بهترین مانهواها به زبان فارسی"
          />
          <h2 className="font-semibold text-gray-900 mb-2 mt-4">Site Announcement</h2>
          <input
            value={announcement}
            onChange={e => setAnnouncement(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-3"
            placeholder="Important announcement shown on home page"
          />
          <button onClick={saveSettings} disabled={saving} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60">
            {saving ? t("loading") : t("save")}
          </button>
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
