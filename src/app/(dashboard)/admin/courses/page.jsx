'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Download, Pencil, Trash2, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data - replace with API calls
const courses = [
  {
    id: '1',
    title: 'JEE Main Physics Complete Course',
    slug: 'jee-main-physics',
    category: 'JEE Main',
    level: 'Advanced',
    status: 'published',
    students: 1245,
    price: 4999,
    createdAt: '2023-10-15',
  },
  {
    id: '2',
    title: 'NEET Biology Crash Course',
    slug: 'neet-biology-crash',
    category: 'NEET',
    level: 'Intermediate',
    status: 'draft',
    students: 0,
    price: 2999,
    createdAt: '2023-11-01',
  },
  // Add more mock courses as needed
];

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        course.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || course.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">
            Manage your platform's courses and learning materials
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Category: {selectedCategory === 'all' ? 'All' : selectedCategory}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {['all', 'JEE Main', 'NEET', 'JEE Advanced', 'Foundation'].map((category) => (
                <DropdownMenuItem 
                  key={category} 
                  onClick={() => setSelectedCategory(category === 'all' ? 'all' : category)}
                  className={selectedCategory === category ? 'bg-accent' : ''}
                >
                  {category}
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
              {['all', 'published', 'draft', 'archived'].map((status) => (
                <DropdownMenuItem 
                  key={status} 
                  onClick={() => setSelectedStatus(status === 'all' ? 'all' : status)}
                  className={selectedStatus === status ? 'bg-accent' : ''}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/courses/${course.id}`} className="hover:underline">
                      {course.title}
                    </Link>
                  </TableCell>
                  <TableCell>{course.category}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{course.level}</Badge>
                  </TableCell>
                  <TableCell>{course.students.toLocaleString()}</TableCell>
                  <TableCell>₹{course.price.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={course.status === 'published' ? 'default' : 'secondary'}
                      className={course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : ''}
                    >
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(course.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/courses/${course.slug}`} target="_blank">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/courses/${course.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No courses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
