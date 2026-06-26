import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Settings, X } from "lucide-react";

interface SettingsData {
  siteName?: string; siteEnabled?: boolean; maintenanceMode?: boolean;
  maintenanceMessage?: string; primaryColor?: string; fontFamily?: string;
  announcement?: string;
}

export default function SystemSettings() {
  const { t } = useLang();
  const [settings, setSettings] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    apiFetch<SettingsData>("/settings").then(setSettings).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/settings", { method: "PATCH", body: JSON.stringify(settings) });
      setMessage({ type: "success", text: t("success") });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("error") });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-6 flex justify-center"><div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <Settings size={18} className="text-gray-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t("systemSettings")}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{t("siteName")}</label>
              <input value={settings.siteName || ""} onChange={e => setSettings(s => ({ ...s, siteName: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Primary Color</label>
              <div className="flex gap-3 items-center">
                <input type="color" value={settings.primaryColor || "#6366f1"} onChange={e => setSettings(s => ({ ...s, primaryColor: e.target.value }))} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                <span className="text-sm text-gray-600">{settings.primaryColor || "#6366f1"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{t("maintenance")}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{t("maintenance")}</p>
                <p className="text-xs text-gray-400">Show maintenance page to all users</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings(s => ({ ...s, maintenanceMode: !s.maintenanceMode }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings.maintenanceMode ? "bg-orange-500" : "bg-gray-200"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.maintenanceMode ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            {settings.maintenanceMode && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Maintenance Message</label>
                <textarea
                  value={settings.maintenanceMessage || ""}
                  onChange={e => setSettings(s => ({ ...s, maintenanceMessage: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Site is under maintenance. We'll be back soon!"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Site Active</p>
                <p className="text-xs text-gray-400">Disable to take site offline</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings(s => ({ ...s, siteEnabled: !s.siteEnabled }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings.siteEnabled !== false ? "bg-green-500" : "bg-gray-200"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.siteEnabled !== false ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
            <button type="button" onClick={() => setMessage(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}

        <button type="submit" disabled={saving} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl disabled:opacity-60 transition-all">
          {saving ? t("loading") : t("save")}
        </button>
      </form>
    </div>
  );
}
