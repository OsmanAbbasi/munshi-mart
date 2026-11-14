"use client";
import { useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
export const THEME_KEY = "munshi-theme";

/**
 * Inline script for <head>. Applies the stored or system theme before first
 * paint so there is no flash of the wrong background. Kept tiny and
 * dependency-free because it runs blocking.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;

// Notify React when <html data-theme> changes, whoever changed it.
const subscribeToTheme = (onChange: () => void) => {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
};

const SunIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20.5 14.5A8.6 8.6 0 0 1 9.5 3.5a8.8 8.8 0 1 0 11 11Z" />
  </svg>
);

const readTheme = (): Theme =>
  typeof document !== "undefined" &&
  document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";

export default function ThemeToggle() {
  // The blocking head script has already set data-theme, so the real value is
  // readable during the first client render. useSyncExternalStore keeps the
  // server render ("light") and the client in step without a setState effect.
  // The observer above reports our own writes too, so no local copy is needed.
  const theme = useSyncExternalStore(
    subscribeToTheme,
    readTheme,
    () => "light" as Theme,
  );

  // Follow the OS only while the visitor has made no explicit choice.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(THEME_KEY)) return;
      } catch {
        return;
      }
      document.documentElement.setAttribute(
        "data-theme",
        event.matches ? "dark" : "light",
      );
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode or blocked storage: the choice applies to this page only.
    }
  };

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
