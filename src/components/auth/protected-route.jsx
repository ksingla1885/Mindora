'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    } else if (status === 'authenticated' && requiredRole && session.user.role !== requiredRole) {
      router.push('/unauthorized');
    }
  }, [status, session, router, requiredRole]);

  if (status === 'loading' || (status === 'authenticated' && requiredRole && session.user.role !== requiredRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status === 'authenticated') {
    return children;
  }

  return null;
}
