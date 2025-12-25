'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    ClipboardList,
    Crown,
    BarChart2,
    Medal,
    Trophy,
    Brain,
    User,
    Settings,
    HelpCircle,
    LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Subjects', href: '/subjects', icon: BookOpen },
    { name: 'Olympiads', href: '/olympiads', icon: Trophy },
    { name: 'Daily Practice (DPP)', href: '/dpp', icon: FileText },
    { name: 'Weekly Tests', href: '/tests', icon: ClipboardList },
    { name: 'Paid Tests', href: '/tests/premium', icon: Crown },
];

const analyticsItems = [
    { name: 'Leaderboard', href: '/leaderboard', icon: BarChart2 },
    { name: 'Certificates', href: '/certificates', icon: Medal },
    { name: 'AI Doubt Solver', href: '/ai-solver', icon: Brain },
];

export function AppSidebar({ className }) {
    const pathname = usePathname();

    return (
        <div className={cn("relative flex flex-col h-full border-r bg-card border-border", className)}>
            <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
                <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">Mindora</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 gap-6 flex flex-col">
                {/* Main Nav */}
                <div className="flex flex-col gap-1">
                    <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[#616f89] mb-2">Menu</p>
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    ))}
                </div>

                {/* Secondary Nav */}
                <div className="flex flex-col gap-1">
                    <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[#616f89] mb-2">Analytics & Support</p>
                    {analyticsItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="border-t border-[#e5e7eb] p-4 dark:border-[#222] flex flex-col gap-1">
                <Link
                    href="/profile"
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                        pathname === '/profile'
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                >
                    <User className="h-5 w-5" />
                    Profile
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[#616f89] hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-900/10 dark:text-gray-400 dark:hover:text-red-400 cursor-pointer"
                    suppressHydrationWarning
                >
                    <LogOut className="h-5 w-5" />
                    Log out
                </button>
            </div>
        </div>
    );
}
