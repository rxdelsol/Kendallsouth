import "./globals.css";
import type { ReactNode } from "react";
import Image from "next/image";
import { ThemeProvider } from "../components/theme-provider";
import { ThemeToggle } from "../components/theme-toggle";

export const metadata = {
  title: "Kendall South Medical Center — Provider Credential Tracker",
  description: "Insurance expiration summary dashboard"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            {/* Top Nav */}
            <header className="bg-white/90 backdrop-blur border-b border-slate-200 dark:bg-slate-900/90 dark:border-slate-800">
              <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 relative">
                    <Image
                      src="/logo.png"
                      alt="Kendall South Medical Center"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold">
                      Kendall South Medical Center
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Provider Credential Tracker
                    </p>
                  </div>
                </div>

                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <button className="hover:text-slate-900 dark:hover:text-white">
                    Dashboard
                  </button>
                  <button className="hover:text-slate-900 dark:hover:text-white">
                    Doctors
                  </button>
                  <button className="hover:text-slate-900 dark:hover:text-white">
                    Insurances
                  </button>
                </nav>

                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <button className="rounded-md bg-sky-600 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow hover:bg-sky-700 transition">
                    Download Database
                  </button>
                  <button className="rounded-md bg-emerald-500 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow hover:bg-emerald-600 transition">
                    Upload Database
                  </button>
                </div>
              </div>
            </header>

            {/* Content */}
            <main className="flex-1">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
