import { useEffect, useState } from "react";
import { apiFetch, apiUpload } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Plus, Trash2, X } from "lucide-react";

export default function ManageSeries() {
  const { t } = useLang();
  const [series, setSeries] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "ONGOING" });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSeries = async () => {
    try {
      const res = await apiFetch<{ data: any[] }>("/series?limit=200");
      setSeries(res.data);
    } catch {}
  };

  useEffect(() => { fetchSeries(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { title: form.title, description: form.description, status: form.status };
      const saved = await apiFetch<any>("/series", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (coverFile) {
        const fd = new FormData();
        fd.append("cover", coverFile);
        fd.append("seriesId", saved.id);
        await apiUpload("/upload/cover", fd);
      }
      setShowModal(false);
      fetchSeries();
      alert("Erfolgreich!");
    } catch (err: any) {
      alert("Fehler: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Manhwa Verwaltung</h1>
      <button onClick={() => setShowModal(true)} className="bg-blue-600 px-4 py-2 rounded mb-4">Neues Manhwa</button>
      
      {series.map(s => (
        <div key={s.id} className="p-4 border-b border-gray-800 flex justify-between">
          <span>{s.title}</span>
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-[#111] p-6 rounded-xl w-full max-w-md">
            <input className="w-full p-2 bg-black border rounded mb-2" placeholder="Titel" onChange={e => setForm({...form, title: e.target.value})} />
            <input type="file" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="mb-4" />
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 px-4 py-2 rounded" disabled={saving}>Speichern</button>
              <button type="button" onClick={() => setShowModal(false)} className="bg-gray-600 px-4 py-2 rounded">Abbrechen</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
