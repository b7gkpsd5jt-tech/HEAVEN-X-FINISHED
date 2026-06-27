import { useState, ImgHTMLAttributes } from "react";
import { BookOpen, ImageOff } from "lucide-react";

type Variant = "cover" | "banner" | "page" | "logo" | "thumb";

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined;
  variant?: Variant;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}

const PLACEHOLDER: Record<Variant, React.ReactNode> = {
  cover: (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0a1622,#111)" }}>
      <BookOpen size={32} style={{ color: "#60cfff", opacity: 0.6 }} />
    </div>
  ),
  thumb: (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#111" }}>
      <BookOpen size={18} style={{ color: "#444" }} />
    </div>
  ),
  banner: (
    <div className="w-full h-full" style={{ background: "linear-gradient(135deg,#050d14,#0a1220)" }} />
  ),
  page: (
    <div className="w-full flex items-center justify-center py-16" style={{ background: "#0a0a0a" }}>
      <div className="flex flex-col items-center gap-2" style={{ color: "#333" }}>
        <ImageOff size={28} />
        <span style={{ fontSize: 11 }}>page not available</span>
      </div>
    </div>
  ),
  logo: (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#0a1622" }}>
      <span style={{ fontSize: 18, fontWeight: 900, color: "#60cfff" }}>H</span>
    </div>
  ),
};

export default function SafeImage({
  src,
  variant = "cover",
  alt = "",
  containerClassName,
  containerStyle,
  className,
  style,
  ...rest
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    if (containerClassName || containerStyle) {
      return (
        <div className={containerClassName} style={containerStyle}>
          {PLACEHOLDER[variant]}
        </div>
      );
    }
    return <>{PLACEHOLDER[variant]}</>;
  }

  const img = (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
      {...rest}
    />
  );

  if (containerClassName || containerStyle) {
    return (
      <div className={containerClassName} style={containerStyle}>
        {img}
      </div>
    );
  }
  return img;
}
