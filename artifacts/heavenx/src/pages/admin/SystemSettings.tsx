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

  if (loading) return (
    <div className="p-6 flex justify-center">
      <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full" style={{ borderColor: "#fff #fff #fff transparent" }} />
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#1a1a1a" }}>
          <Settings size={18} style={{ color: "#aaa" }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "#f0f0f0" }}>{t("systemSettings")}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* General */}
        <div className="rounded-2xl p-5" style={{ background: "#111", border: "1px solid #222" }}>
          <h2 className="font-semibold mb-4" style={{ color: "#f0f0f0" }}>Allgemein</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#888" }}>{t("siteName")}</label>
              <input
                value={settings.siteName || ""}
                onChange={e => setSettings(s => ({ ...s, siteName: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none"
                style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid #2a2a2a" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#888" }}>Primärfarbe</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={settings.primaryColor || "#ffffff"}
                  onChange={e => setSettings(s => ({ ...s, primaryColor: e.target.value }))}
                  className="w-10 h-10 rounded-lg cursor-pointer"
                  style={{ border: "1px solid #2a2a2a", background: "#1a1a1a" }}
                />
                <span className="text-sm" style={{ color: "#888" }}>{settings.primaryColor || "#ffffff"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="rounded-2xl p-5" style={{ background: "#111", border: "1px solid #222" }}>
          <h2 className="font-semibold mb-4" style={{ color: "#f0f0f0" }}>{t("maintenance")}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "#ccc" }}>{t("maintenance")}</p>
                <p className="text-xs" style={{ color: "#555" }}>Wartungsseite für alle Benutzer anzeigen</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings(s => ({ ...s, maintenanceMode: !s.maintenanceMode }))}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: settings.maintenanceMode ? "#f59e0b" : "#2a2a2a" }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full shadow transition-transform"
                  style={{
                    background: "#fff",
                    transform: settings.maintenanceMode ? "translateX(20px)" : "translateX(2px)",
                  }}
                />
              </button>
            </div>

            {settings.maintenanceMode && (
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#888" }}>Wartungsnachricht</label>
                <textarea
                  value={settings.maintenanceMessage || ""}
                  onChange={e => setSettings(s => ({ ...s, maintenanceMessage: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-xl resize-none focus:outline-none"
                  style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid #2a2a2a" }}
                  placeholder="Die Seite wird gewartet. Wir sind bald zurück!"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "#ccc" }}>Seite aktiv</p>
                <p className="text-xs" style={{ color: "#555" }}>Deaktivieren um die Seite offline zu nehmen</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings(s => ({ ...s, siteEnabled: !s.siteEnabled }))}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: settings.siteEnabled !== false ? "#22c55e" : "#2a2a2a" }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full shadow transition-transform"
                  style={{
                    background: "#fff",
                    transform: settings.siteEnabled !== false ? "translateX(20px)" : "translateX(2px)",
                  }}
                />
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={message.type === "success"
              ? { background: "#0f2a0f", color: "#66cc66", border: "1px solid #1a3a1a" }
              : { background: "#2a0f0f", color: "#ff6b6b", border: "1px solid #3a1515" }}
          >
            {message.text}
            <button type="button" onClick={() => setMessage(null)} className="ml-auto" style={{ color: "inherit" }}>
              <X size={14} />
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-on-white w-full py-3 font-semibold text-sm rounded-xl disabled:opacity-60 transition-all"
          style={{ background: "#ffffff", color: "#000000" }}
        >
          {saving ? t("loading") : t("save")}
        </button>
      </form>
    </div>
  );
}
