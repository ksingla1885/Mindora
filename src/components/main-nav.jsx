'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { ThemeToggle } from './theme-toggle';
import { UserNav } from '@/components/user-nav';

export function MainNav() {
  const pathname = usePathname();

  const items = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Practice', href: '/dpp' },
    { name: 'Tests', href: '/tests' },
    { name: 'Leaderboard', href: '/leaderboard' }
  ];

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="font-bold text-xl mr-8">
          Mindora
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'transition-colors hover:text-primary',
                pathname === item.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </div>
  );
}
