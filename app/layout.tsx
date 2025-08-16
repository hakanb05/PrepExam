import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

import { Providers } from "./providers";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = {
  title: "USMLE Practice App",
  description: "Interactive USMLE practice application",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          html {
            font-family: ${GeistSans.style.fontFamily};
            --font-sans: ${GeistSans.variable};
            --font-mono: ${GeistMono.variable};
          }
        `}</style>
      </head>
      <body>
        <Providers>
          <AppSidebar />
          <main className="flex-1 flex flex-col">
            <AppHeader />
            <div className="flex-1 p-6">{children}</div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
