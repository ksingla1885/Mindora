import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import ChatWidget from "@/components/ai/ChatWidget";
import { auth } from "@/auth";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

export const metadata = {
    title: {
        default: "Mindora - Master Your Olympiads",
        template: "%s | Mindora",
    },
    description: "AI-powered preparation platform for NSO, IMO, and competitive exams.",
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: 'white' },
        { media: '(prefers-color-scheme: dark)', color: 'black' },
    ],
};

export default async function RootLayout({ children }) {
    const session = await auth();

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            </head>
            <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
                <Providers session={session}>
                    {children}
                    <ChatWidget />
                </Providers>
            </body>
        </html>
    );
}
