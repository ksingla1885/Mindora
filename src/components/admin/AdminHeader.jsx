'use client';

import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/user-nav';

export default function AdminHeader() {
    return (
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background dark:bg-background-dark shrink-0">
            {/* Mobile Menu Button (Hidden on Desktop) */}
            <button className="md:hidden text-muted-foreground mr-4">
                <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 max-w-lg">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                        <Search className="h-5 w-5" />
                    </div>
                    <input
                        className="block w-full p-2.5 pl-10 text-sm text-foreground bg-secondary/50 dark:bg-surface-dark border border-border rounded-lg focus:ring-primary focus:border-primary placeholder-muted-foreground transition-colors"
                        placeholder="Search for users, tests, or content..."
                        type="text"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 ml-6">
                <UserNav profileHref="/admin/profile" settingsHref="/admin/settings" />
            </div>
        </header>
    );
}
