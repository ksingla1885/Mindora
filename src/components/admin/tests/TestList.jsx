'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Loader2, MoreVertical, Plus, Search } from 'lucide-react';

export function TestList() {
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Fetch tests with filters and pagination
  const fetchTests = async () => {
    try {
      setIsLoading(true);
      const query = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        status: statusFilter !== 'all' ? statusFilter : '',
        type: typeFilter !== 'all' ? typeFilter : '',
      }).toString();

      const response = await fetch(`/api/tests?${query}`);
      if (!response.ok) throw new Error('Failed to fetch tests');
      
      const data = await response.json();
      setTests(data.tests || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
      }));
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tests. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and when filters/pagination change
  useEffect(() => {
    fetchTests();
  }, [pagination.page, statusFilter, typeFilter, searchQuery]);

  // Handle test deletion
  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete test');

      toast({
        title: 'Success',
        description: 'Test deleted successfully',
      });

      // Refresh the list
      fetchTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete test',
        variant: 'destructive',
      });
    }
  };

  // Handle test status toggle
  const toggleTestStatus = async (testId, currentStatus) => {
    try {
      const response = await fetch(`/api/tests/${testId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error('Failed to update test status');

      toast({
        title: 'Success',
        description: `Test ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });

      // Refresh the list
      fetchTests();
    } catch (error) {
      console.error('Error updating test status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update test status',
        variant: 'destructive',
      });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Get badge variant based on test status
  const getStatusBadgeVariant = (test) => {
    if (!test.isActive) return 'secondary';
    
    const now = new Date();
    const startTime = test.startTime ? new Date(test.startTime) : null;
    const endTime = test.endTime ? new Date(test.endTime) : null;
    
    if (startTime && now < startTime) return 'outline';
    if (endTime && now > endTime) return 'default';
    if (startTime && endTime && now >= startTime && now <= endTime) return 'success';
    
    return 'default';
  };

  // Get status text
  const getStatusText = (test) => {
    if (!test.isActive) return 'Inactive';
    
    const now = new Date();
    const startTime = test.startTime ? new Date(test.startTime) : null;
    const endTime = test.endTime ? new Date(test.endTime) : null;
    
    if (startTime && now < startTime) return 'Scheduled';
    if (endTime && now > endTime) return 'Completed';
    if (startTime && endTime && now >= startTime && now <= endTime) return 'Active';
    
    return 'Draft';
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Tests</h2>
        <Button asChild>
          <Link href="/admin/tests/new">
            <Plus className="mr-2 h-4 w-4" />
            Create New Test
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tests..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="practice">Practice</SelectItem>
              <SelectItem value="timed">Timed</SelectItem>
              <SelectItem value="mock">Mock Exam</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tests Table */}
      <div className="rounded-md border
      ">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading tests...
                  </div>
                </TableCell>
              </TableRow>
            ) : tests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No tests found
                </TableCell>
              </TableRow>
            ) : (
              tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/tests/${test.id}`} className="hover:underline">
                      {test.title}
                    </Link>
                    {test.isPaid && (
                      <Badge variant="outline" className="ml-2">
                        ₹{test.price}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {test.testType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(test)}>
                      {getStatusText(test)}
                    </Badge>
                  </TableCell>
                  <TableCell>{test.questionCount || 0}</TableCell>
                  <TableCell>{test.durationMinutes} min</TableCell>
                  <TableCell>{test.startTime ? formatDate(test.startTime) : 'N/A'}</TableCell>
                  <TableCell>{test.endTime ? formatDate(test.endTime) : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/tests/${test.id}`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleTestStatus(test.id, test.isActive)}
                        >
                          {test.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteTest(test.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">
              {(pagination.page - 1) * pagination.limit + 1}
            </span> to{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-medium">{pagination.total}</span> tests
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.limit >= pagination.total || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
