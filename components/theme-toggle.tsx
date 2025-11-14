"use client";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  if(!mounted) return null;
  const isDark = theme==="dark";
  return <button onClick={()=>setTheme(isDark?"light":"dark")}>{isDark?"🌙 Dark":"🔆 Light"}</button>;
}