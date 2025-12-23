'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, MoreHorizontal, Edit, Trash2, Mail, Lock, User, Shield, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export const columns = [
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="font-medium">{user.name || 'Unnamed User'}</p>
              {user.role === 'admin' && (
                <Shield className="h-3.5 w-3.5 text-amber-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">ID: {user.id?.substring(0, 8)}...</p>
          </div>
        </div>
      );
    },
    enableSorting: true,
    sortingFn: (a, b) => (a.original.name || '').localeCompare(b.original.name || ''),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <Badge 
          variant={user.role === 'admin' ? 'destructive' : 'secondary'}
          className="capitalize"
        >
          {user.role || 'student'}
        </Badge>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const user = row.original;
      const isActive = user.emailVerified;
      
      return (
        <div className="flex items-center gap-2">
          {isActive ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-amber-500" />
          )}
          <span>{isActive ? 'Active' : 'Inactive'}</span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'lastActive',
    header: 'Last Active',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="text-sm text-muted-foreground">
          {user.lastActive || 'Never'}
        </div>
      );
    },
    enableSorting: true,
    sortingFn: (a, b) => {
      const dateA = a.original.lastActive ? new Date(a.original.lastActive).getTime() : 0;
      const dateB = b.original.lastActive ? new Date(b.original.lastActive).getTime() : 0;
      return dateA - dateB;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="text-sm text-muted-foreground">
          {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original;
      
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/admin/users/${user.id}`} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/users/${user.id}/edit`} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/users/${user.id}?tab=activity`} className="cursor-pointer">
                  <Activity className="mr-2 h-4 w-4" />
                  View Activity
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!user.emailVerified && (
                <DropdownMenuItem>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Invite
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Lock className="mr-2 h-4 w-4" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
