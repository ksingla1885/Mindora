'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, User, Mail, Lock, Calendar, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

// Form schema for user details
const userFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().optional(),
  role: z.enum(['admin', 'teacher', 'student', 'content_creator']),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean(),
  metadata: z.record(z.any()).optional(),
});

export function UserDetail({ user: initialUser }) {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  
  // Initialize form with user data
  const form = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: initialUser?.name || '',
      email: initialUser?.email || '',
      phone: initialUser?.phone || '',
      role: initialUser?.role || 'student',
      isActive: initialUser?.isActive ?? true,
      emailVerified: initialUser?.emailVerified ?? false,
      metadata: initialUser?.metadata || {},
    },
  });

  // Fetch user data if not provided
  useEffect(() => {
    if (!initialUser) {
      const fetchUser = async () => {
        try {
          const response = await fetch(`/api/admin/users/${params.userId}`);
          if (!response.ok) throw new Error('Failed to fetch user');
          const userData = await response.json();
          setUser(userData);
          form.reset({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            role: userData.role,
            isActive: userData.isActive,
            emailVerified: userData.emailVerified,
            metadata: userData.metadata || {},
          });
        } catch (error) {
          console.error('Error fetching user:', error);
          toast.error('Failed to load user data');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUser();
    }
  }, [params.userId, initialUser, form]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/users/${params.userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      
      const updatedUser = await response.json();
      setUser(updatedUser);
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!window.confirm('Are you sure you want to reset this user\'s password? They will receive an email with instructions.')) {
      return;
    }
    
    try {
      setIsResettingPassword(true);
      const response = await fetch(`/api/admin/users/${params.userId}/reset-password`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }
      
      toast.success('Password reset email sent successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Handle email verification
  const handleSendVerification = async () => {
    try {
      setIsSendingVerification(true);
      const response = await fetch(`/api/admin/users/${params.userId}/verify-email`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send verification email');
      }
      
      toast.success('Verification email sent successfully');
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast.error(error.message || 'Failed to send verification email');
    } finally {
      setIsSendingVerification(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">User not found</h3>
        <p className="text-sm text-muted-foreground">The requested user could not be found.</p>
        <Button className="mt-4" onClick={() => router.push('/admin/users')}>
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground">
            Manage user account and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/users')}>
            Back to Users
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* User Info Card */}
            <Card className="lg:col-span-1">
              <CardHeader className="items-center text-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    <Badge variant={user.isActive ? 'success' : 'destructive'} className="px-2 py-1">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.role}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{user.email}</span>
                    {user.emailVerified ? (
                      <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="ml-2 h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  {user.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  {user.lastLogin && (
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Last login: {format(new Date(user.lastLogin), 'MMM d, yyyy HH:mm')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4" />
                  )}
                  Reset Password
                </Button>
                {!user.emailVerified && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleSendVerification}
                    disabled={isSendingVerification}
                  >
                    {isSendingVerification ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    Send Verification Email
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Edit Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>
                  Update user details and account settings
                </CardDescription>
              </CardHeader>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Full name"
                        {...form.register('name')}
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email"
                        {...form.register('email')}
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Phone number"
                        {...form.register('phone')}
                      />
                      {form.formState.errors.phone && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        onValueChange={(value) => form.setValue('role', value)}
                        value={form.watch('role')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="content_creator">Content Creator</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="isActive"
                        checked={form.watch('isActive')}
                        onCheckedChange={(checked) => form.setValue('isActive', checked)}
                      />
                      <Label htmlFor="isActive">Account Active</Label>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="emailVerified"
                        checked={form.watch('emailVerified')}
                        onCheckedChange={(checked) => form.setValue('emailVerified', checked)}
                      />
                      <Label htmlFor="emailVerified">Email Verified</Label>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>
                Recent actions and events for this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Activity items would be mapped here */}
                <div className="flex items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Account created
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                
                {user.lastLogin && (
                  <div className="flex items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Last login
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(user.lastLogin), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Add more activity items as needed */}
                <div className="text-center text-sm text-muted-foreground">
                  More activity will appear here as the user interacts with the platform
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Permissions</CardTitle>
              <CardDescription>
                Manage what this user can access and modify
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Content Management</h4>
                      <p className="text-sm text-muted-foreground">
                        Create, edit, and delete content
                      </p>
                    </div>
                    <Switch 
                      checked={form.watch('role') === 'admin' || form.watch('role') === 'content_creator'}
                      onCheckedChange={(checked) => 
                        form.setValue('role', checked ? 'content_creator' : 'student')
                      }
                      disabled={form.watch('role') === 'admin'}
                    />
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">User Management</h4>
                      <p className="text-sm text-muted-foreground">
                        Create, edit, and delete users
                      </p>
                    </div>
                    <Switch 
                      checked={form.watch('role') === 'admin'}
                      onCheckedChange={(checked) => 
                        form.setValue('role', checked ? 'admin' : 'student')
                      }
                    />
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Test Management</h4>
                      <p className="text-sm text-muted-foreground">
                        Create and manage tests
                      </p>
                    </div>
                    <Switch 
                      checked={['admin', 'teacher'].includes(form.watch('role'))}
                      onCheckedChange={(checked) => 
                        form.setValue('role', checked ? 'teacher' : 'student')
                      }
                      disabled={form.watch('role') === 'admin'}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
