"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-1 rounded-md border border-sky-300 bg-[#dff3ff] px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm hover:bg-[#c9e9ff] dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
    >
      <span className="text-lg">{isDark ? "🌙" : "🔆"}</span>
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
