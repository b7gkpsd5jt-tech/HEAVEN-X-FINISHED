import { useEffect, useState } from "react";
import { apiFetch, apiUpload } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";

export default function ManageSeries() {
  const { t } = useLang();
  const [series, setSeries] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "ONGOING" });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSeries = async () => {
    try { const res = await apiFetch<{ data: any[] }>("/series?limit=200"); setSeries(res.data); } catch {}
  };

  useEffect(() => { fetchSeries(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { title: form.title, description: form.description, status: form.status };
      const saved = await apiFetch<any>("/series", { method: "POST", body: JSON.stringify(payload) });
      if (coverFile) {
        const fd = new FormData();
        fd.append("cover", coverFile);
        fd.append("seriesId", saved.id);
        await apiUpload("/upload/cover", fd);
      }
      setShowModal(false);
      fetchSeries();
      alert("Erfolgreich erstellt!");
    } catch (err: any) { alert("Fehler: " + err.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 text-white min-h-screen bg-[#0a0a0a]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manhwa Verwaltung</h1>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700">Neues Manhwa</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {series.map(s => (
          <div key={s.id} className="p-4 bg-[#111] border border-[#222] rounded-xl">{s.title}</div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-[#111] p-6 rounded-xl w-full max-w-2xl border border-gray-800">
            <h2 className="text-xl font-bold mb-6 text-white">Neues Manhwa erstellen</h2>
            
            <div className="flex gap-6">
              {/* Cover-Bereich */}
              <div className="w-1/3">
                <label className="block text-sm text-gray-400 mb-2">Cover Bild</label>
                <div className="w-full aspect-[2/3] bg-black border border-gray-700 rounded-lg flex items-center justify-center overflow-hidden relative">
                  <input type="file" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-gray-500 text-xs">Klicken zum Wählen</span>
                </div>
              </div>

              {/* Text-Bereich */}
              <div className="w-2/3 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Titel</label>
                  <input className="w-full p-2 bg-black border border-gray-700 rounded text-white" onChange={e => setForm({...form, title: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Beschreibung</label>
                  <textarea className="w-full p-2 bg-black border border-gray-700 rounded text-white h-24" onChange={e => setForm({...form, description: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-700 rounded text-white">Abbrechen</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white font-bold" disabled={saving}>
                {saving ? "Wird gespeichert..." : "Speichern"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
