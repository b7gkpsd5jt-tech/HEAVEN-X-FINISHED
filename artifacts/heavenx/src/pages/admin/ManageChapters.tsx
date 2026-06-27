import { useState, useEffect } from "react";
import { apiFetch, apiUpload } from "@/lib/api";

export default function ManageChapters() {
  const [selectedSeries, setSelectedSeries] = useState("");
  const [allSeries, setAllSeries] = useState<any[]>([]);
  const [multiZipEntries, setMultiZipEntries] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { apiFetch<{ data: any[] }>("/series?limit=100").then(r => setAllSeries(r.data)); }, []);

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
    alert("Upload fertig!");
  };

  return (
    <div className="p-6 text-white">
      <select className="w-full p-2 bg-black border rounded mb-4" onChange={(e) => setSelectedSeries(e.target.value)}>
        <option value="">Serie wählen</option>
        {allSeries.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
      </select>
      <input type="file" multiple onChange={(e) => {
        const files = Array.from(e.target.files || []);
        setMultiZipEntries(files.map((file, i) => ({ file, chapterNumber: i + 1 })));
      }} />
      <button onClick={handleMultiZipUpload} className="block mt-4 bg-blue-600 px-4 py-2 rounded" disabled={uploading}>
        {uploading ? "Lädt..." : "Jetzt hochladen"}
      </button>
    </div>
  );
}
