'use client';

import { MainNav } from "@/components/main-nav";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }) {
    const pathname = usePathname();

    // Don't show MainNav on admin pages as they have their own specific layout
    if (pathname?.startsWith('/admin')) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen flex-col">
            <MainNav />
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
