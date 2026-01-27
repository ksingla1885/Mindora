'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Download,
  Loader2,
  UserPlus,
  Mail,
  Lock,
  RefreshCw,
  Users as UsersIcon,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MoreVertical,
  Bell,
  Trash2,
  Edit,
  Activity,
  User as UserIcon,
  Key,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/cn';

// API functions
async function fetchUsers() {
  const res = await fetch('/api/admin/users');
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Fetch users failed: ${res.status} ${res.statusText}`, errorText);
    throw new Error('Failed to fetch users');
  }
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
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;

  // Fetch users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetchUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users. Please try again.');
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

    const matchesRole = selectedRole === 'all' || user.role?.toLowerCase() === selectedRole.toLowerCase();
    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === 'active' ? user.emailVerified : !user.emailVerified);
    // Use loose equality or string conversion for class comparison to handle number/string differences
    const matchesClass = selectedClass === 'all' || String(user.class || '') === String(selectedClass);

    return matchesSearch && matchesRole && matchesStatus && matchesClass;
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedUsers.length === currentUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map(u => u.id));
    }
  };

  const executeAction = async (userIds, action) => {
    setIsBulkActionLoading(true);
    try {
      const response = await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds,
          action,
        }),
      });

      if (!response.ok) throw new Error('Failed to perform action');

      await loadUsers();
      setSelectedUsers([]); // Clear selection if any
      toast.success(`Successfully performed ${action} on users`);
    } catch (error) {
      console.error('Action error:', error);
      toast.error(`Failed to perform ${action}`);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkAction = (action) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user.');
      return;
    }
    executeAction(selectedUsers, action);
  };

  const handleSingleAction = (userId, action) => {
    executeAction([userId], action);
  };

  const handleResetPassword = (email) => {
    // In a real app, this would call an API to send a reset email
    toast.success(`Password reset link sent to ${email}`);
  };

  // Stats
  const stats = [
    {
      label: 'Total Users',
      value: users.length,
      trend: '+12%',
      trendUp: true,
      icon: UsersIcon,
      color: 'text-primary'
    },
    {
      label: 'Active Users',
      value: users.filter(u => u.emailVerified).length,
      trend: '+5%',
      trendUp: true,
      icon: CheckCircle2,
      color: 'text-emerald-500'
    },
    {
      label: 'New Requests',
      value: users.filter(u => !u.emailVerified).length,
      trend: '+2%',
      trendUp: true,
      icon: AlertCircle,
      color: 'text-amber-500'
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Page Heading */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground mb-1">User Management</h2>
          <p className="text-muted-foreground">Manage user access, roles, classes, and platform status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="lg" onClick={loadUsers} disabled={isLoading} className="hidden sm:flex border-border bg-card">
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button asChild size="lg" className="bg-[#135bec] hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 transition-all border-none">
            <Link href="/admin/users/new">
              <Plus className="mr-2 h-5 w-5" />
              Add New User
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 group shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <div className={cn("p-2 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors", stat.color.replace('text-', 'text-'))}>
                <stat.icon className={cn("size-5", stat.color)} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-foreground">{stat.value.toLocaleString()}</p>
              <span className={cn(
                "mb-1 text-xs font-bold flex items-center px-1.5 py-0.5 rounded-full bg-emerald-500/10",
                stat.trendUp ? "text-emerald-500" : "text-red-500"
              )}>
                <TrendingUp className="size-3 mr-1" />
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between shadow-sm">
        {/* Search & Filters */}
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-0 sm:min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              className="h-11 w-full rounded-xl border border-border bg-muted/50 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Search by name, email, or ID..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-11 flex-1 sm:flex-none rounded-xl border border-border bg-muted/50 px-3 sm:px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[100px] outline-none appearance-none"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-11 flex-1 sm:flex-none rounded-xl border border-border bg-muted/50 px-3 sm:px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[100px] outline-none appearance-none"
            >
              <option value="all">All Classes</option>
              <option value="9">Grade 9</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-11 flex-1 sm:flex-none rounded-xl border border-border bg-muted/50 px-3 sm:px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[100px] outline-none appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedRole('all');
              setSelectedStatus('all');
              setSelectedClass('all');
            }}
            className="whitespace-nowrap px-2 sm:px-3 py-2 text-sm font-bold text-[#135bec] hover:text-blue-600 transition-colors text-center sm:text-left"
          >
            Clear All
          </button>
        </div>

        {/* Divider on Mobile */}
        <div className="h-px w-full bg-border lg:hidden"></div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl border-border bg-muted/50 px-4 py-2 h-11 text-sm font-bold text-foreground hover:bg-muted transition-all"
                disabled={selectedUsers.length === 0 || isBulkActionLoading}
              >
                {isBulkActionLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Shield className="size-4 text-amber-500" />
                    <span>Actions ({selectedUsers.length})</span>
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-xl rounded-xl p-1">
              <DropdownMenuItem onClick={() => handleBulkAction('activate')} className="rounded-lg gap-2 cursor-pointer p-3">
                <Mail className="size-4 text-blue-500" />
                <span>Notify / Welcome</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('deactivate')} className="rounded-lg gap-2 cursor-pointer p-3">
                <Key className="size-4 text-amber-500" />
                <span>Reset Credentials</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => handleBulkAction('delete')}
                className="rounded-lg gap-2 cursor-pointer p-3 text-red-500 focus:text-red-500 focus:bg-red-500/10"
              >
                <Trash2 className="size-4" />
                <span>Delete Selected</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>


        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/30 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-5 w-12">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      onChange={toggleAllSelection}
                      checked={currentUsers.length > 0 && selectedUsers.length === currentUsers.length}
                      className="size-5 rounded border-border bg-muted text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </div>
                </th>
                <th className="px-6 py-5">User</th>
                <th className="px-6 py-5">Class</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5">Joined</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="size-10 animate-spin text-primary opacity-20" />
                      <p className="font-medium text-muted-foreground">Synchronizing user data...</p>
                    </div>
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <UsersIcon className="size-12 text-muted-foreground opacity-20" />
                      <p className="font-bold text-lg text-foreground">No users found</p>
                      <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                      <Button variant="outline" onClick={() => {
                        setSearchQuery('');
                        setSelectedRole('all');
                        setSelectedStatus('all');
                        setSelectedClass('all');
                      }}>
                        Clear all filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="wait">
                  {currentUsers.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="size-5 rounded border-border bg-muted text-primary focus:ring-primary/20 cursor-pointer"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={user.image} alt={user.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground group-hover:text-primary transition-colors">{user.name || 'Anonymous'}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-[11px] font-bold text-foreground border border-border">
                          {user.class ? `Grade ${user.class}` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.role === 'admin' ? (
                            <Shield className="size-4 text-amber-500" />
                          ) : user.role === 'teacher' ? (
                            <Activity className="size-4 text-purple-500" />
                          ) : (
                            <UserIcon className="size-4 text-blue-500" />
                          )}
                          <span className="capitalize font-medium text-foreground">{user.role || 'Student'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-medium">
                        {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'Recently'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-tighter shadow-sm",
                          user.emailVerified
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                        )}>
                          <span className={cn("size-2 rounded-full", user.emailVerified ? "bg-emerald-500" : "bg-red-500 animate-pulse")}></span>
                          {user.emailVerified ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                              <MoreVertical className="size-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 bg-card border-border shadow-2xl rounded-xl p-1">
                            <DropdownMenuItem asChild className="rounded-lg gap-3 cursor-pointer p-3">
                              <Link href={`/admin/users/${user.id}`}>
                                <UserIcon className="size-4 text-primary" />
                                <span className="font-medium">View Profile</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-border" />
                            {user.emailVerified ? (
                              <DropdownMenuItem
                                className="rounded-lg gap-3 cursor-pointer p-3 text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                onClick={() => handleSingleAction(user.id, 'deactivate')}
                              >
                                <Trash2 className="size-4" />
                                <span className="font-medium">Block Access</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="rounded-lg gap-3 cursor-pointer p-3 text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10"
                                onClick={() => handleSingleAction(user.id, 'activate')}
                              >
                                <CheckCircle2 className="size-4" />
                                <span className="font-medium">Unblock Access</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-6 transition-all">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-black text-foreground">{indexOfFirstUser + 1}</span> to <span className="font-black text-foreground">{Math.min(indexOfLastUser, filteredUsers.length)}</span> of <span className="font-black text-foreground">{filteredUsers.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm bg-card border border-border overflow-hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-2 text-muted-foreground hover:bg-muted focus:z-20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft className="size-5" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "relative z-10 inline-flex items-center px-4 py-2 text-sm font-black transition-all",
                      currentPage === i + 1
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-3 py-2 text-muted-foreground hover:bg-muted focus:z-20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronRight className="size-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
