
import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import PresenceManager from "@/components/presence-manager";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: 'swap',
});

// Metadata must be exported from a Server Component.
export const metadata: Metadata = {
  title: "Wassel AI for Medical Rehab",
  description: "Web application for generating personalized medical rehabilitation plans using AI.",
  keywords: "medical rehabilitation, physical therapy, artificial intelligence, treatment plans",
  authors: [{ name: "Wassel Team" }],
  openGraph: {
    title: "Wassel AI for Medical Rehab",
    description: "Intelligent system for creating customized medical rehabilitation plans",
    type: "website",
    locale: "en_US",
  },
};

// This is the root Server Component.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PresenceManager />
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="border-t py-6 text-center text-sm text-muted-foreground">
              <p>© 2025 Wasl AI for Medical Rehabilitation. All rights reserved to Symbol AI.</p>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
