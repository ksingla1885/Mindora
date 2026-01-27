'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Calendar, BookOpen, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function UserProfilePage() {
  const params = useParams();
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
        setUser(data.data);
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.userId) {
      fetchUser();
    }
  }, [params.userId]);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="h-8 w-8">
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Profile</h1>
            <p className="text-muted-foreground">
              View user details and activity
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/admin/users/${params.userId}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <Card className="md:col-span-1 border-border shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                  {user.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl font-bold">{user.name}</CardTitle>
            <CardDescription className="text-sm">{user.email}</CardDescription>
            <div className="flex justify-center gap-2 mt-4">
              <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize px-3 py-1">
                {user.role}
              </Badge>
              <div className={`px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${user.emailVerified ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${user.emailVerified ? "bg-emerald-500" : "bg-red-500"}`}></div>
                {user.emailVerified ? 'Active' : 'Inactive'}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 opacity-70" /> Joined
                </span>
                <span className="font-medium">{user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 opacity-70" /> Class
                </span>
                <span className="font-medium">{user.class ? `Grade ${user.class}` : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 opacity-70" /> Last Updated
                </span>
                <span className="font-medium">{user.updatedAt ? format(new Date(user.updatedAt), 'MMM d, yyyy') : 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Column */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border p-4 bg-muted/30">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Test Attempts</div>
                  <div className="text-3xl font-black mt-2 text-primary">{user._count?.testAttempts || 0}</div>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/30">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Purchased Items</div>
                  <div className="text-3xl font-black mt-2 text-emerald-500">{user._count?.payments || 0}</div>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/30">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Content Access</div>
                  <div className="text-3xl font-black mt-2 text-blue-500">{user._count?.contentItems || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">User ID</label>
                  <div className="p-2.5 bg-muted/50 rounded-lg text-xs font-mono text-foreground border border-border select-all">{user.id}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Role Access</label>
                  <div className="p-2.5 bg-muted/50 rounded-lg text-sm text-foreground border border-border capitalize">{user.role}</div>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Verification Status</label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm border border-border">
                    {user.emailVerified ? (
                      <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> <span className="font-medium">Email Verified</span></>
                    ) : (
                      <><AlertCircle className="h-4 w-4 text-amber-500" /> <span className="font-medium">Email Not Verified</span></>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
