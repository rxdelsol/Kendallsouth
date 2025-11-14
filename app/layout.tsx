import "./globals.css";
import type { ReactNode } from "react";
import Image from "next/image";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Kendall South Medical Center — Provider Credential Tracker",
  description: "Insurance expiration summary dashboard"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            {/* Header azul cielo */}
            <header className="bg-[#dff3ff] border-b border-sky-300 shadow-sm">
              <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 relative rounded-full border border-sky-300 bg-white/70 overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="Kendall South Medical Center"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-slate-900">
                      Kendall South Medical Center
                    </h1>
                    <p className="text-xs text-slate-700">
                      Provider Credential Tracker
                    </p>
                  </div>
                </div>

                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
                  <button className="hover:underline">Dashboard</button>
                  <button className="hover:underline">Doctors</button>
                  <button className="hover:underline">Insurances</button>
                </nav>

                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <button className="rounded-md bg-white/80 px-4 py-2 text-xs md:text-sm font-semibold text-slate-800 border border-sky-300 shadow-sm hover:bg-white">
                    Download Database
                  </button>
                  <button className="rounded-md bg-white/80 px-4 py-2 text-xs md:text-sm font-semibold text-slate-800 border border-sky-300 shadow-sm hover:bg-white">
                    Upload Database
                  </button>
                </div>
              </div>
            </header>

            {/* Contenido */}
            <main className="flex-1 bg-[#dff3ff] dark:bg-slate-950">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
