'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Filter, Download, Loader2, UserPlus, Mail, Lock, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { columns } from '../_components/users-columns';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';

// API functions
async function fetchUsers() {
  const res = await fetch('/api/admin/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.id?.toLowerCase().includes(searchLower);
      
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' ? user.emailVerified : !user.emailVerified);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select at least one user to perform this action.',
        variant: 'destructive',
      });
      return;
    }

    setIsBulkActionLoading(true);
    try {
      const response = await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          action,
        }),
      });

      if (!response.ok) throw new Error('Failed to perform bulk action');
      
      await loadUsers();
      setSelectedUsers([]);
      
      toast({
        title: 'Success',
        description: `Successfully performed ${action} on ${selectedUsers.length} users`,
      });
    } catch (error) {
      console.error('Bulk action error:', error);
      toast({
        title: 'Error',
        description: `Failed to perform ${action}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  // Format last active time
  const formatLastActive = (lastActive) => {
    if (!lastActive) return 'Never';
    return formatDistanceToNow(new Date(lastActive), { addSuffix: true });
  };

  // Prepare user data for the table
  const tableData = filteredUsers.map(user => ({
    ...user,
    lastActive: formatLastActive(user.lastActive),
    status: user.emailVerified ? (
      <Badge variant="success">Active</Badge>
    ) : (
      <Badge variant="outline">Inactive</Badge>
    ),
    role: (
      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
        {user.role}
      </Badge>
    ),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage all users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadUsers} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/admin/users/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, email, or ID..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Role: {selectedRole === 'all' ? 'All' : selectedRole}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {['all', 'admin', 'teacher', 'student'].map((role) => (
                <DropdownMenuItem 
                  key={role} 
                  onClick={() => setSelectedRole(role)}
                  className={selectedRole === role ? 'bg-accent' : ''}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Status: {selectedStatus === 'all' ? 'All' : selectedStatus}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {['all', 'active', 'inactive'].map((status) => (
                <DropdownMenuItem 
                  key={status} 
                  onClick={() => setSelectedStatus(status)}
                  className={selectedStatus === status ? 'bg-accent' : ''}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={selectedUsers.length === 0 || isBulkActionLoading}
              >
                {isBulkActionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <span>Bulk Actions ({selectedUsers.length})</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                <Mail className="mr-2 h-4 w-4" />
                Send Welcome Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                <Lock className="mr-2 h-4 w-4" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleBulkAction('delete')}
                className="text-destructive"
              >
                Delete Users
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* User Table */}
      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading users...</span>
          </div>
        ) : (
          <DataTable 
            columns={columns}
            data={tableData}
            pageSize={10}
            emptyMessage="No users found matching your criteria."
            onRowSelect={setSelectedUsers}
            selectable
          />
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Active Today</h3>
          <p className="text-2xl font-bold">
            {users.filter(u => u.lastActive && new Date(u.lastActive) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground">New This Week</h3>
          <p className="text-2xl font-bold">
            {users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Admins</h3>
          <p className="text-2xl font-bold">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>
      </div>
    </div>
  );
}
