'use client';

import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/lib/auth-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { GlobalRefreshProvider } from "@/components/global-refresh-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light">
      <SessionProvider>
        <AuthProvider>
          <GlobalRefreshProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </GlobalRefreshProvider>
        </AuthProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
