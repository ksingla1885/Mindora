'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    History,
    Settings as SettingsIcon,
    CreditCard,
    UserCog,
    ShieldCheck,
    Bell,
    Bot,
    CircuitBoard
} from 'lucide-react';

export default function SettingsLayout({ children }) {
    const pathname = usePathname();

    const navItems = [
        { name: 'General', href: '/admin/settings/general', icon: SettingsIcon },
        { name: 'Account & Roles', href: '/admin/settings/accounts', icon: UserCog },
        { name: 'Security', href: '/admin/settings/security', icon: ShieldCheck },
        { name: 'Payments', href: '/admin/settings/payment', icon: CreditCard },
        { name: 'Notifications', href: '/admin/settings/notifications', icon: Bell },
        { name: 'AI Configuration', href: '/admin/settings', icon: Bot },
        { name: 'Integrations', href: '/admin/settings/api', icon: CircuitBoard },
        { name: 'Audit & Logs', href: '/admin/settings/logs', icon: History },
    ];

    return (
        <div className="flex h-full w-full overflow-hidden bg-background text-foreground font-display selection:bg-primary selection:text-white">
            <style jsx global>{`
                /* Custom scrollbar for Webkit browsers */
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent; 
                }
                ::-webkit-scrollbar-thumb {
                    background: hsl(var(--muted-foreground) / 0.3);
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--muted-foreground) / 0.5); 
                }
            `}</style>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-muted/10">
                {/* Header */}
                <header className="h-20 bg-background/95 backdrop-blur-md sticky top-0 z-10 border-b border-border flex items-center justify-between px-8 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-foreground text-2xl font-bold tracking-tight">Settings</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                            <span className="block w-2 h-2 rounded-full bg-emerald-500"></span>
                            Last updated: 2 mins ago
                        </p>
                    </div>
                </header>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto w-full">
                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Left Sub-nav */}
                            <nav className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-0">
                                <div className="flex flex-col gap-1">
                                    {navItems.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                                                    isActive
                                                        ? 'bg-card border-l-[3px] border-primary text-foreground font-medium'
                                                        : 'hover:bg-card text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                                                <span className="text-sm font-medium">{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </nav>

                            {/* Active Content Panel */}
                            <div className="flex-1 min-w-0">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
