'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserForm } from '../../_components/user-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch the user data here
    const fetchUser = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock user data - replace with actual API call
        const mockUser = {
          id: params.userId,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'student',
          status: 'active',
          joined: '2023-01-15',
          lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          avatar: '/avatars/01.png'
        };
        
        setUser(mockUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [params.userId]);

  const handleSuccess = () => {
    router.push('/admin/users');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">User not found</h2>
        <p className="text-muted-foreground mt-2">The requested user could not be found.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/users">Back to Users</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="h-8 w-8">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit User</h1>
          <p className="text-muted-foreground">
            Update user details and permissions
          </p>
        </div>
      </div>
      
      <div className="rounded-lg border bg-card p-6">
        <UserForm user={user} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
