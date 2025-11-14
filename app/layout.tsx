import "./globals.css";
import type { ReactNode } from "react";
import { ThemeProvider } from "../components/theme-provider";
import { ThemeToggle } from "../components/theme-toggle";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <header className="p-4 flex justify-end">
          <ThemeToggle />
        </header>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}