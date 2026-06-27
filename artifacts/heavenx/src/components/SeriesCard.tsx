import { Link } from "wouter";
import { Eye, BookOpen } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { getImageUrl } from "@/lib/api";
import SafeImage from "@/components/SafeImage";

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
  const coverUrl = getImageUrl(series.cover);

  const statusStyles: Record<string, React.CSSProperties> = {
    ONGOING:   { background: "rgba(34,197,94,0.18)",  color: "#22c55e",  border: "1px solid rgba(34,197,94,0.35)" },
    COMPLETED: { background: "rgba(234,179,8,0.18)",  color: "#eab308",  border: "1px solid rgba(234,179,8,0.35)" },
    HIATUS:    { background: "rgba(251,146,60,0.18)", color: "#fb923c",  border: "1px solid rgba(251,146,60,0.35)" },
    DROPPED:   { background: "rgba(239,68,68,0.18)",  color: "#ef4444",  border: "1px solid rgba(239,68,68,0.35)" },
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
        <div
          className="relative overflow-hidden rounded-xl aspect-[3/4] transition-all duration-300 group-hover:-translate-y-1"
          style={{
            background: "#111",
            boxShadow: "0 0 18px rgba(0,180,255,0.35), 0 0 40px rgba(0,120,220,0.18)",
          }}
        >
          <SafeImage
            src={coverUrl}
            alt={series.title}
            variant="cover"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Status badge */}
          {series.status && (
            <div className="absolute top-2 right-2">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={statusStyles[series.status] || { background: "rgba(100,100,100,0.2)", color: "#aaa", border: "1px solid rgba(100,100,100,0.3)" }}
              >
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
