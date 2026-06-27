import { motion } from "framer-motion";

export default function WelcomePopup() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full rounded-2xl p-8 text-center"
        style={{ 
          background: "#0f0f0f", 
          border: "1px solid #1a3a55", 
          boxShadow: "0 0 40px rgba(0,136,204,0.18), 0 0 80px rgba(0,100,180,0.10)" 
        }}
      >
        {/* Titel */}
        <h2
          dir="rtl"
          className="mb-6"
          style={{
            fontFamily: "'Reem Kufi', sans-serif",
            fontSize: "1.8rem",
            lineHeight: "1.5",
            color: "#60cfff",
            fontWeight: 700,
            textShadow: "0 0 12px rgba(0,180,255,0.85), 0 0 28px rgba(0,140,220,0.5)",
          }}
        >
          به آرشیو بزرگ «بهشت منهوا» خوش آمدید
        </h2>

        {/* Text */}
        <div
          dir="rtl"
          className="space-y-4"
          style={{
            fontFamily: "'Lalezar', cursive",
            fontSize: "1rem",
            lineHeight: "1.8",
            color: "#cccccc",
          }}
        >
          <p>
            این سایت با عشق، علاقه و صرف زمان فراوان ساخته شده است. لطفاً از سوءاستفاده، کپی‌برداری یا اسکی رفتن از محتوای سایت خودداری کنید و به زحمات تیم ما احترام بگذارید.
          </p>
          <p>
            اگر درخواستی برای اضافه شدن اثری جدید دارید یا با مشکلی در سایت مواجه شدید، حتماً به کانال تلگرام ما بپیوندید و از طریق آن با ما در ارتباط باشید. با کمال میل نظرات، پیشنهادها و گزارش‌های شما را بررسی خواهیم کرد.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}