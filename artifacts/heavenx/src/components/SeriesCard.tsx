import { Link } from "wouter";
import { Eye, BookOpen } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { API_BASE } from "@/lib/api";

interface Series {
  id: string;
  title: string;
  cover?: string;
  status?: string;
  views?: number;
  genres?: { genre: { name: string } }[];
  _count?: { chapters: number };
  latestChapter?: { number: number; title?: string } | null;
}

interface Props {
  series: Series;
}

export default function SeriesCard({ series }: Props) {
  const { t } = useLang();
  const coverUrl = series.cover
    ? series.cover.startsWith("/uploads")
      ? `${API_BASE.replace("/api", "")}${series.cover}`
      : series.cover
    : null;

  const statusColors: Record<string, string> = {
    ONGOING: "bg-green-100 text-green-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    HIATUS: "bg-yellow-100 text-yellow-700",
    DROPPED: "bg-red-100 text-red-700",
  };
  const statusLabel: Record<string, string> = {
    ONGOING: t("ongoing"),
    COMPLETED: t("completed"),
    HIATUS: t("hiatus"),
    DROPPED: t("dropped"),
  };

  return (
    <Link href={`/series/${series.id}`}>
      <div className="group cursor-pointer">
        <div className="relative overflow-hidden rounded-xl bg-gray-100 aspect-[3/4] shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={series.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-violet-100">
              <BookOpen size={36} className="text-indigo-300" />
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Status badge */}
          {series.status && (
            <div className="absolute top-2 right-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[series.status] || "bg-gray-100 text-gray-700"}`}>
                {statusLabel[series.status] || series.status}
              </span>
            </div>
          )}

          {/* Latest chapter */}
          {series.latestChapter && (
            <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-[10px] font-medium">
                Ch.{series.latestChapter.number}
              </span>
            </div>
          )}
        </div>

        <div className="mt-2 space-y-1">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
            {series.title}
          </h3>

          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            {series._count && (
              <span className="flex items-center gap-1">
                <BookOpen size={11} />
                {series._count.chapters} {t("chapters")}
              </span>
            )}
            {series.views !== undefined && (
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {series.views >= 1000 ? `${(series.views / 1000).toFixed(1)}k` : series.views}
              </span>
            )}
          </div>

          {series.genres && series.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {series.genres.slice(0, 2).map((g) => (
                <span key={g.genre.name} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  {g.genre.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
