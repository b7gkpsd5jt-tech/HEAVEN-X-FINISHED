import { useEffect, useState, useRef } from "react";
import { apiFetch, apiUpload, getImageUrl } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Plus, Edit, Trash2, X, Image } from "lucide-react";

// (Hier kommen deine Interfaces und D/inputCls Konstanten aus deinem Original-Code hin)

export default function ManageSeries() {
  const { t } = useLang();
  const [series, setSeries] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ title: "", altTitle: "", description: "", author: "", artist: "", status: "ONGOING", genres: "" });
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
    if (!form.title) { alert("Titel ist erforderlich!"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        altTitle: form.altTitle,
        description: form.description,
        author: form.author,
        artist: form.artist,
        status: form.status,
        genres: form.genres.split(",").map(g => g.trim()).filter(Boolean),
      };

      const saved = await apiFetch<any>(editing ? `/series/${editing.id}` : "/series", {
        method: editing ? "PATCH" : "POST",
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
      alert("Erfolgreich gespeichert!");
    } catch (err: any) {
      alert("Fehler: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ... (Der Rest deines JSX-Codes bleibt gleich, achte nur darauf, dass handleSubmit aufgerufen wird)
  return (/* Dein JSX hier */);
}
