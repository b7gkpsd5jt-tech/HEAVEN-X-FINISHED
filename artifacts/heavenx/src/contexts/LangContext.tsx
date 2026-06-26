import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Lang } from "@/i18n";
import { t as translate } from "@/i18n";

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LangContext = createContext<LangState | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("hx_lang") as Lang) || "DE";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("hx_lang", l);
  };

  const t = (key: string) => translate(lang, key);
  const isRTL = lang === "FA";

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang.toLowerCase();
  }, [isRTL, lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
