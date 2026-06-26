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
}

export default function WelcomePopup() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("hx_popup_dismissed");
    if (dismissed) return;

    const defaultPopup = {
      id: "default",
      title: "به بهشت منهوا خوش آمدید 🌸",
      content:
        "سلام عزیزان! به HEAVENx خوش آمدید.\nاینجا بهترین مانهواها به زبان فارسی در دسترس شماست.\n\nبرای دسترسی به محتوا، لطفاً وارد شوید یا با ادمین تماس بگیرید.\n\nکانال تلگرام ما را دنبال کنید:",
      buttonText: "کانال تلگرام",
      buttonUrl: "https://t.me/heavenxmanh",
      closeText: "بستن",
    };

    apiFetch<Popup[]>("/popups")
      .then((popups) => {
        const p = popups.length > 0 ? popups[0] : defaultPopup;
        setPopup(p);
        setOpen(true);
      })
      .catch(() => {
        setPopup(defaultPopup);
        setOpen(true);
      });
  }, []);

  function dismiss() {
    setOpen(false);
    sessionStorage.setItem("hx_popup_dismissed", "1");
  }

  return (
    <AnimatePresence>
      {open && popup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            dir="rtl"
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.25)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            {/* Gradient orbs */}
            <div
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }}
            />
            <div
              className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)" }}
            />

            <div className="relative z-10 p-7">
              <button
                onClick={dismiss}
                className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>

              <h2 className="text-2xl font-bold text-white text-center mb-3 leading-snug">
                {popup.title}
              </h2>

              <div className="w-16 h-0.5 bg-gradient-to-r from-violet-400 to-indigo-400 mx-auto mb-4 rounded-full" />

              <p className="text-white/85 text-sm leading-7 text-center whitespace-pre-line">
                {popup.content}
              </p>

              <div className="mt-6 flex flex-col gap-3">
                {popup.buttonUrl && popup.buttonText && (
                  <a
                    href={popup.buttonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl text-center font-semibold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
                    }}
                  >
                    {popup.buttonText}
                  </a>
                )}
                <button
                  onClick={dismiss}
                  className="w-full py-3 rounded-xl text-center font-medium text-white/70 text-sm bg-white/10 hover:bg-white/15 transition-all border border-white/10"
                >
                  {popup.closeText || "بستن"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
