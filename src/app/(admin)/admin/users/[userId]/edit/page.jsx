'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserForm } from '../../_components/user-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function EditUserPage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`/api/admin/users/${params.userId}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch user');
                }

                // Adapt API data to Form expectation
                const userData = data.data;
                const adaptedUser = {
                    ...userData,
                    status: userData.emailVerified ? 'active' : 'inactive'
                };

                setUser(adaptedUser);
            } catch (error) {
                console.error('Error fetching user:', error);
                toast.error('Failed to load user data');
            } finally {
                setIsLoading(false);
            }
        };

        if (params.userId) {
            fetchUser();
        }
    }, [params.userId]);

    const handleSuccess = () => {
        router.push('/admin/users');
        router.refresh();
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
                        Update details for {user.name}
                    </p>
                </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
                <UserForm user={user} onSuccess={handleSuccess} />
            </div>
        </div>
    );
}
