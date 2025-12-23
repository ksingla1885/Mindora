'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider as HighContrastProvider } from "@/contexts/ThemeContext";
import { Toaster } from "react-hot-toast";
import { ThemeToggle } from "@/components/theme-toggle";

function ThemeWrapper({ children }) {
    return (
        <HighContrastProvider>
            <div className="relative">
                <div className="fixed bottom-4 right-4 z-50">
                    <ThemeToggle />
                </div>
                {children}
            </div>
        </HighContrastProvider>
    );
}

export function Providers({ children }) {
    return (
        <SessionProvider>
            <AuthProvider>
                <NextThemesProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <ThemeWrapper>
                        {children}
                        <Toaster position="top-center" />
                    </ThemeWrapper>
                </NextThemesProvider>
            </AuthProvider>
        </SessionProvider>
    );
}
