'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider as HighContrastProvider } from "@/contexts/ThemeContext";
import { Toaster } from "react-hot-toast";

function ThemeWrapper({ children }) {
    return (
        <HighContrastProvider>
            {children}
        </HighContrastProvider>
    );
}

export function Providers({ children, session }) {
    return (
        <SessionProvider session={session}>
            <AuthProvider>
                <NextThemesProvider
                    attribute="class"
                    defaultTheme="dark"
                    forcedTheme="dark"
                    enableSystem={false}
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
