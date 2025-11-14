"use client";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="px-3 py-1.5 bg-white dark:bg-slate-800 border rounded shadow"
    >
      {isDark ? "🌙 Dark" : "🔆 Light"}
    </button>
  );
}