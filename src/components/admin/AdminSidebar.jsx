'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileQuestion,
  FileText,
  CreditCard,
  Banknote,
  Trophy,
  BarChart3,
  Bot,
  LogOut,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;
  const name = user?.name || 'Admin User';
  const email = user?.email || 'admin@mindora.com';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Content', href: '/admin/content', icon: BookOpen },
    { name: 'Questions', href: '/admin/questions', icon: FileQuestion },
    { name: 'Tests', href: '/admin/tests', icon: FileText },
    { name: 'Paid Tests', href: '/admin/paid-tests', icon: CreditCard },
    { name: 'Payments', href: '/admin/payments', icon: Banknote },
    { name: 'Leaderboard', href: '/admin/leaderboard', icon: Trophy },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Olympiads', href: '/admin/olympiads', icon: Trophy },
    { name: 'DPP', href: '/admin/dpp', icon: FileText },
    { name: 'AI Logs', href: '/admin/ai-logs', icon: Bot },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-card dark:bg-background-dark border-r border-border flex-col hidden md:flex h-full shrink-0">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 text-foreground mb-8">
          <div className="size-8 text-primary">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Mindora</h2>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-3">Menu</h3>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer",
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mt-auto p-4 space-y-2 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg group">
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary transition-colors">
            {user?.image ? (
              <img src={user.image} alt={name} className="size-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <p className="text-xs font-medium text-foreground truncate">{name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
