'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, UserPlus, BookOpen, BarChart2, Mail, MoreVertical } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function InstructorsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data - replace with actual API call
  const instructors = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@example.com',
      avatar: '/avatars/sarah.jpg',
      courses: 8,
      students: 1245,
      rating: 4.8,
      status: 'active',
      expertise: ['Physics', 'Mathematics'],
      joinDate: '2022-05-15',
    },
    {
      id: '2',
      name: 'Prof. Michael Chen',
      email: 'michael.chen@example.com',
      avatar: '/avatars/michael.jpg',
      courses: 12,
      students: 2341,
      rating: 4.9,
      status: 'active',
      expertise: ['Chemistry', 'Biology'],
      joinDate: '2021-11-03',
    },
    {
      id: '3',
      name: 'Dr. Emily Wilson',
      email: 'emily.wilson@example.com',
      avatar: '/avatars/emily.jpg',
      courses: 5,
      students: 876,
      rating: 4.7,
      status: 'on_leave',
      expertise: ['Computer Science', 'Programming'],
      joinDate: '2023-02-20',
    },
  ];

  const filteredInstructors = instructors.filter(instructor => 
    instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instructor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instructor.expertise.some(subject => 
      subject.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: 'Active', variant: 'success' },
      on_leave: { label: 'On Leave', variant: 'warning' },
      inactive: { label: 'Inactive', variant: 'destructive' },
    };
    
    const { label, variant } = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleSendMessage = (instructor) => {
    // TODO: Implement send message functionality
    console.log('Send message to:', instructor.email);
  };

  const handleViewCourses = (instructorId) => {
    router.push(`/admin/courses?instructor=${instructorId}`);
  };

  const handleViewAnalytics = (instructorId) => {
    router.push(`/admin/analytics/instructors/${instructorId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Instructor Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor your team of instructors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search instructors..."
              className="pl-8 w-full md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link href="/admin/instructors/invite">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Instructor
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Instructors</CardTitle>
              <CardDescription>
                {filteredInstructors.length} instructor{filteredInstructors.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Expertise</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstructors.length > 0 ? (
                  filteredInstructors.map((instructor) => (
                    <TableRow key={instructor.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={instructor.avatar} alt={instructor.name} />
                            <AvatarFallback>
                              {instructor.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{instructor.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {instructor.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {instructor.expertise.map((subject, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{instructor.courses}</TableCell>
                      <TableCell>{instructor.students.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 text-yellow-400 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-medium">{instructor.rating}</span>
                          <span className="text-muted-foreground text-sm ml-1">/5.0</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(instructor.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCourses(instructor.id)}>
                              <BookOpen className="mr-2 h-4 w-4" />
                              <span>View Courses</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewAnalytics(instructor.id)}>
                              <BarChart2 className="mr-2 h-4 w-4" />
                              <span>View Analytics</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendMessage(instructor)}>
                              <Mail className="mr-2 h-4 w-4" />
                              <span>Send Message</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No instructors found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
