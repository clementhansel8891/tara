import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  changeLanguage,
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  LANGUAGE_FLAGS,
  type SupportedLanguage,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * LanguageSelector — dropdown for switching between English and Indonesian.
 * Persists choice to localStorage automatically.
 */
export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLang = i18n.language as SupportedLanguage;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (lang: SupportedLanguage) => {
    changeLanguage(lang);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors"
        title={LANGUAGE_LABELS[currentLang]}
      >
        <Globe className="h-4 w-4" />
        <span>{LANGUAGE_FLAGS[currentLang]} {LANGUAGE_LABELS[currentLang]}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-48 rounded-md border border-border bg-card shadow-lg py-1 z-50 animate-fade-in">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleSelect(lang)}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors",
                currentLang === lang
                  ? "bg-accent font-semibold text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
            >
              <span>{LANGUAGE_FLAGS[lang]}</span>
              <span>{LANGUAGE_LABELS[lang]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
