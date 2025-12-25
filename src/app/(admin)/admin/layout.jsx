'use client';

import AdminSidebar from '@/components/admin/AdminSidebar';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="flex h-screen bg-background overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:ml-64">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </WebSocketProvider>
  );
}
