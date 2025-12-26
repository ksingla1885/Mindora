'use client';

import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { useSession } from 'next-auth/react';
import { redirect, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { cn } from '@/lib/cn';

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const isSpecialPage = pathname?.includes('/admin/content') ||
    pathname?.includes('/admin/questions') ||
    pathname?.includes('/admin/tests') ||
    pathname?.includes('/admin/paid-tests') ||
    pathname?.includes('/admin/payments') ||
    pathname?.includes('/admin/analytics') ||
    pathname?.includes('/admin/leaderboard') ||
    pathname?.includes('/admin/ai-logs') ||
    pathname?.includes('/admin/settings') ||
    pathname?.includes('/admin/profile');

  useEffect(() => {
    if (status === 'loading') return;

    // Redirect to login if not authenticated
    if (!session) {
      redirect('/auth/signin');
      return;
    }

    // Redirect to dashboard if not admin or teacher
    const userRole = session?.user?.role?.toLowerCase();
    if (userRole !== 'admin' && userRole !== 'teacher') {
      redirect('/dashboard');
      return;
    }

    setIsLoading(false);
  }, [session, status]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <WebSocketProvider>
      <div className="flex h-screen w-full bg-background dark:bg-background-dark text-foreground font-display overflow-hidden">
        <AdminSidebar />
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background dark:bg-background-dark relative">
          {!isSpecialPage && <AdminHeader />}
          {/* Scrollable Page Content */}
          <main className={cn(
            "flex-1 overflow-y-auto scroll-smooth",
            isSpecialPage ? "p-0" : "p-6"
          )}>
            {children}
          </main>
        </div>
      </div>
    </WebSocketProvider>
  );
}
