import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = { title:"Kendall South Medical Center" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-100 dark:bg-slate-950">
        <ThemeProvider>
          <header className="p-4 bg-white dark:bg-slate-900 flex justify-between">
            <h1>Kendall South Medical Center</h1>
            <ThemeToggle />
          </header>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}