import { useState, useEffect } from "react";
import { apiFetch, apiUpload } from "@/lib/api";
import { Trash2, Package } from "lucide-react";

export default function ManageChapters() {
  const [selectedSeries, setSelectedSeries] = useState("");
  const [allSeries, setAllSeries] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [multiZipEntries, setMultiZipEntries] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { apiFetch<{ data: any[] }>("/series?limit=100").then(r => setAllSeries(r.data)); }, []);

  const loadChapters = async () => {
    if (!selectedSeries) return;
    const chs = await apiFetch<any[]>(`/chapters/series/${selectedSeries}`);
    setChapters(chs.sort((a, b) => b.number - a.number));
  };

  useEffect(() => { loadChapters(); }, [selectedSeries]);

  const handleMultiZipUpload = async () => {
    setUploading(true);
    for (let entry of multiZipEntries) {
      const fd = new FormData();
      fd.append("file", entry.file);
      fd.append("seriesId", selectedSeries);
      fd.append("chapterNumber", entry.chapterNumber);
      await apiUpload("/upload/zip", fd);
    }
    setUploading(false);
    loadChapters();
    alert("Upload abgeschlossen!");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Wirklich löschen?")) return;
    await apiFetch(`/chapters/${id}`, { method: "DELETE" });
    loadChapters();
  };

  return (
    // ... (Dein JSX-Code hier, achte darauf, dass der "Jetzt hochladen" Button handleMultiZipUpload aufruft)
  );
}
