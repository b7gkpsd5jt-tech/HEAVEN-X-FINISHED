import { useEffect, useState, useCallback } from "react";
import { useSearch } from "wouter";
import { apiFetch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import SeriesCard from "@/components/SeriesCard";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion } from "framer-motion";

interface Series {
  id: string;
  title: string;
  cover?: string;
  status?: string;
  views?: number;
  genres?: { genre: { name: string } }[];
  _count?: { chapters: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const SORT_OPTIONS = ["newest", "popular", "views", "alphabetical"] as const;
const STATUS_OPTIONS = ["", "ONGOING", "COMPLETED", "HIATUS", "DROPPED"] as const;

export default function Library() {
  const { t } = useLang();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);

  const [series, setSeries] = useState<Series[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get("search") || "");
  const [sort, setSort] = useState<string>(params.get("sort") || "newest");
  const [status, setStatus] = useState<string>(params.get("status") || "");
  const [page, setPage] = useState(1);

  const fetchSeries = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ sort, page: String(page), limit: "24" });
      if (search) query.set("search", search);
      if (status) query.set("status", status);
      const result = await apiFetch<{ data: Series[]; pagination: Pagination }>(`/series?${query}`);
      setSeries(result.data);
      setPagination(result.pagination);
    } catch {
      setSeries([]);
    } finally {
      setLoading(false);
    }
  }, [search, sort, status, page]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSeries();
  };

  const statusLabel: Record<string, string> = {
    "": t("allSeries"),
    ONGOING: t("ongoing"),
    COMPLETED: t("completed"),
    HIATUS: t("hiatus"),
    DROPPED: t("dropped"),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t("allSeries")}</h1>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("search")}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              {search && (
                <button type="button" onClick={() => { setSearch(""); setPage(1); }} className="px-3 py-2 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                {t("search")}
              </button>
            </form>

            <div className="flex flex-wrap gap-2 items-center">
              <SlidersHorizontal size={14} className="text-gray-500" />
              {/* Sort */}
              <div className="flex flex-wrap gap-1">
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSort(s); setPage(1); }}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${sort === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {s === "newest" ? t("latest") : s === "popular" ? t("trending") : s === "views" ? t("views") : "A-Z"}
                  </button>
                ))}
              </div>

              <div className="w-px h-4 bg-gray-200 mx-1" />

              {/* Status */}
              <div className="flex flex-wrap gap-1">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatus(s); setPage(1); }}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${status === s ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results count */}
        {pagination && !loading && (
          <p className="text-sm text-gray-500 mb-4">
            {pagination.total} {t("allSeries").toLowerCase()}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-xl bg-gray-200 aspect-[3/4]" />
                <div className="mt-2 h-3 bg-gray-200 rounded w-3/4" />
                <div className="mt-1 h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {series.map((s) => <SeriesCard key={s.id} series={s} />)}
            {series.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-400">
                <Search size={40} className="mx-auto mb-3 opacity-30" />
                {t("noResults")}
              </div>
            )}
          </motion.div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              ←
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 text-sm rounded-lg ${p === page ? "bg-indigo-600 text-white" : "border border-gray-200 hover:bg-gray-50"}`}
                >
                  {p}
                </button>
              );
            })}
            <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
