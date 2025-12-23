'use client';

import { AppSidebar } from "@/components/app-sidebar";
import { MainNav } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Bell, Menu, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    // Don't show layout on admin pages if they have their own
    if (pathname?.startsWith('/admin')) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-foreground font-display">
            {/* Desktop Sidebar */}
            <AppSidebar className="hidden lg:flex" />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Header */}
                <header className="flex h-16 items-center justify-between border-b border-[#e5e7eb] bg-white px-6 lg:px-8 dark:bg-[#111318] dark:border-[#222]">
                    {/* Mobile Menu Button - Visible on small screens */}
                    <div className="lg:hidden flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="text-[#616f89]">
                            <Menu className="h-6 w-6" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center rounded-lg bg-primary/10 p-1.5">
                                <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-[#111318] dark:text-white">Mindora</span>
                        </div>
                    </div>

                    {/* Search Bar - Hidden on mobile, visible on lg */}
                    <div className="hidden max-w-md flex-1 items-center rounded-lg bg-[#f0f2f4] px-3 py-2 lg:flex dark:bg-[#1f2937] ml-4">
                        <Search className="h-5 w-5 text-[#616f89]" />
                        <input
                            className="ml-2 w-full bg-transparent text-sm text-[#111318] placeholder-[#616f89] focus:outline-none dark:text-white"
                            placeholder="Search for tests, topics, or notes..."
                            type="text"
                            suppressHydrationWarning
                        />
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4 ml-auto">
                        <ThemeToggle />
                        <button className="relative rounded-full bg-[#f0f2f4] p-2 text-[#616f89] hover:text-primary transition-colors dark:bg-[#1f2937] dark:text-white" suppressHydrationWarning>
                            <Bell className="h-5 w-5" />
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-4 border-l border-[#e5e7eb] dark:border-[#333]">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-[#111318] dark:text-white">
                                    {session?.user?.name || "Student"}
                                </p>
                                <p className="text-xs text-[#616f89]">Class 10</p>
                            </div>
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-[#e5e7eb]">
                                <img
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                    src={session?.user?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuC0YT5nhftwsOfovnhrb11Wqm_bKO9g85B0QGT2j4TFdfYADrM5HAInhgDCbcx6mvHc0qqwQuo9gzMK_4kC12EDCK_V6MN0TlvmuVp7Pr0CwVs0PX2Bm6RAgx6kjVfJueqQa9JM1sCeWPYXr-y3ssDYe1LP1LUorNYmUtGRm1zpz4yHw6tmrACnFx2_GKCdBpHB9specw94pk8yxs_LY1bg2686Ndyi1M_nJELAkdFwzt2Gp9LhOVUxRZqO1RPtcLVV4pCB4i5HbEuo"}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-0 scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    );
}
