import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Popup {
  id: string;
  title: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  closeText?: string;
  displayDurationHours?: number | null;
}

const DEFAULT_POPUP: Popup = {
  id: "default",
  title: "به بهشت منهوا خوش آمدید",
  content: `تمام آثار داخل سایت قرار می‌گیرند. این سایت عمومی نیست و فقط کاربران مجاز می‌توانند وارد شوند.\n\nدسترسی به سایت فقط از طریق نام کاربری و رمز عبور شخصی امکان‌پذیر است و هر فرد حساب مخصوص به خود را دارد.\n\nبرای دسترسی به سایت هیچ‌گونه پرداختی نیاز نیست. این محدودیت فقط به دلایل امنیتی و جلوگیری از سوءاستفاده و انتشار غیرمجاز اعمال شده است در صورت نیاز به دریافت دسترسی یا اطلاعات بیشتر، لطفاً عضو کانال تلگرامی ما شوید`,
  buttonText: "کانال تلگرام",
  buttonUrl: "https://t.me/heavenxmanh",
  closeText: "متوجه شدم",
  displayDurationHours: null,
};

function shouldShow(popup: Popup): boolean {
  const key = `hx_popup_${popup.id}`;
  const raw = localStorage.getItem(key);
  if (!raw) return true;

  // If no duration set → show only once (permanent suppression)
  if (!popup.displayDurationHours) return false;

  const dismissedAt = parseInt(raw, 10);
  if (isNaN(dismissedAt)) return true;

  const hoursSince = (Date.now() - dismissedAt) / 3600000;
  return hoursSince >= popup.displayDurationHours;
}

function markDismissed(popup: Popup) {
  const key = `hx_popup_${popup.id}`;
  localStorage.setItem(key, String(Date.now()));
}

export default function WelcomePopup() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    apiFetch<Popup[]>("/popups")
      .then((popups) => {
        const p = popups.length > 0 ? { ...popups[0] } : { ...DEFAULT_POPUP };
        if (!p.closeText) p.closeText = "متوجه شدم";
        if (shouldShow(p)) {
          setPopup(p);
          setOpen(true);
        }
      })
      .catch(() => {
        if (shouldShow(DEFAULT_POPUP)) {
          setPopup(DEFAULT_POPUP);
          setOpen(true);
        }
      });
  }, []);

  function dismiss() {
    setOpen(false);
    if (popup) markDismissed(popup);
  }

  return (
    <AnimatePresence>
      {open && popup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)" }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            dir="rtl"
            className="relative w-full max-w-md rounded-3xl overflow-hidden"
            style={{
              background: "rgba(10,15,25,0.92)",
              backdropFilter: "blur(30px)",
              border: "1px solid rgba(0,180,255,0.18)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(0,136,204,0.08), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            {/* Glow orbs */}
            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(circle, #60cfff 0%, transparent 70%)" }} />
            <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full opacity-10 pointer-events-none"
              style={{ background: "radial-gradient(circle, #0088cc 0%, transparent 70%)" }} />

            <div className="relative z-10 p-8">
              {/* Close X */}
              <button onClick={dismiss}
                className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                style={{ color: "rgba(255,255,255,0.45)" }}>
                <X size={16} />
              </button>

              {/* Title */}
              <h2 className="text-center mb-3 leading-snug"
                style={{
                  fontFamily: "'Reem Kufi', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(1.25rem, 5vw, 1.6rem)",
                  color: "#60cfff",
                  textShadow: "0 0 12px rgba(0,180,255,0.85), 0 0 28px rgba(0,140,220,0.5)",
                }}>
                {popup.title}
              </h2>

              {/* Divider */}
              <div className="mx-auto mb-5 rounded-full"
                style={{ width: "64px", height: "2px", background: "linear-gradient(90deg, transparent, #60cfff, transparent)", boxShadow: "0 0 8px rgba(0,180,255,0.6)" }} />

              {/* Body */}
              <p className="text-center whitespace-pre-line leading-8"
                style={{
                  fontFamily: "'Lalezar', cursive",
                  fontSize: "clamp(0.82rem, 2.5vw, 0.95rem)",
                  color: "#ffffff",
                  lineHeight: "2",
                }}>
                {popup.content}
              </p>

              <div className="mt-7 flex flex-col gap-3">
                {popup.buttonUrl && popup.buttonText && (
                  <a href={popup.buttonUrl} target="_blank" rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl text-center font-semibold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      fontFamily: "'Lalezar', cursive",
                      fontSize: "1rem",
                      background: "linear-gradient(135deg, #0088cc 0%, #229ED9 100%)",
                      boxShadow: "0 4px 20px rgba(0,136,204,0.45)",
                    }}>
                    {popup.buttonText}
                  </a>
                )}
                <button onClick={dismiss}
                  className="w-full py-3.5 rounded-2xl text-center text-white transition-all border"
                  style={{
                    fontFamily: "'Lalezar', cursive",
                    fontSize: "1rem",
                    background: "rgba(255,255,255,0.07)",
                    borderColor: "rgba(255,255,255,0.12)",
                  }}>
                  {popup.closeText || "متوجه شدم"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
