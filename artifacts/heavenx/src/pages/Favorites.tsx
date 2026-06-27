import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import SeriesCard from "@/components/SeriesCard";
import { Heart } from "lucide-react";

interface Series { id: string; title: string; cover?: string; status?: string; views?: number; genres?: any[]; _count?: { chapters: number } }

export default function Favorites() {
  const { t } = useLang();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Series[]>("/users/favorites")
      .then(setSeries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <Heart size={18} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("favorites")}</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-xl bg-gray-200 aspect-[3/4]" />
                <div className="mt-2 h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Heart size={48} className="mx-auto mb-4 opacity-20" />
            <p>{t("noResults")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {series.map(s => <SeriesCard key={s.id} series={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
