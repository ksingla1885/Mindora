import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import ChatWidget from "@/components/ai/ChatWidget";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
import NextTopLoader from "nextjs-toploader";
import { auth } from "@/auth";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
    });

export const viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: dark)', color: 'black' },
    ],
};

export const metadata = {
    title: {
        default: "Mindora - Master Your Olympiads",
        template: "%s | Mindora",
    },
    description: "AI-powered preparation platform for NSO, IMO, and competitive exams.",
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
                <NextTopLoader
                    color="hsl(var(--primary))"
                    initialPosition={0.08}
                    crawlSpeed={200}
                    height={3}
                    crawl={true}
                    showSpinner={false}
                    easing="ease"
                    speed={200}
                    shadow="0 0 10px hsl(var(--primary)), 0 0 5px hsl(var(--primary))"
                />
                <Providers session={session}>
                    <SmoothScroll>
                        {children}
                        <ChatWidget />
                    </SmoothScroll>
                </Providers>
            </body>
        </html>
    );
}
