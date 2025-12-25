'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, FileText, File, Download, MoreVertical, Trash2, Pencil, FileIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResourcesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data - replace with actual API call
  const resources = [
    {
      id: '1',
      title: 'JEE Main Physics Formula Sheet',
      type: 'pdf',
      size: '2.4 MB',
      uploadedAt: '2023-10-15',
      course: 'JEE Main Physics',
      downloads: 124,
    },
    {
      id: '2',
      title: 'Calculus Practice Problems',
      type: 'docx',
      size: '1.2 MB',
      uploadedAt: '2023-10-10',
      course: 'JEE Advanced Mathematics',
      downloads: 89,
    },
    {
      id: '3',
      title: 'Organic Chemistry Reactions',
      type: 'pdf',
      size: '3.1 MB',
      uploadedAt: '2023-10-05',
      course: 'NEET Chemistry',
      downloads: 156,
    },
    {
      id: '4',
      title: 'Electromagnetism Notes',
      type: 'pdf',
      size: '1.8 MB',
      uploadedAt: '2023-10-03',
      course: 'JEE Main Physics',
      downloads: 67,
    },
    {
      id: '5',
      title: 'Integration Techniques',
      type: 'pdf',
      size: '2.1 MB',
      uploadedAt: '2023-09-28',
      course: 'JEE Advanced Mathematics',
      downloads: 112,
    },
  ];

  const filteredResources = resources.filter(resource => 
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xlsx':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'pptx':
        return <FileText className="h-5 w-5 text-orange-500" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleDelete = async (resourceId) => {
    // TODO: Implement delete functionality
    console.log('Delete resource:', resourceId);
    // await fetch(`/api/resources/${resourceId}`, { method: 'DELETE' });
    // refreshResources();
  };

  const handleDownload = (resource) => {
    // TODO: Implement download functionality
    console.log('Download resource:', resource);
    // window.open(resource.downloadUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Study Resources</h1>
          <p className="text-muted-foreground">
            Manage and organize all your study materials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search resources..."
              className="pl-8 w-full md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link href="/admin/content/resources/upload">
              <Plus className="mr-2 h-4 w-4" />
              Upload Resource
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Resources</CardTitle>
              <CardDescription>
                {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Button variant="outline" size="sm" className="h-9">
                <FileIcon className="mr-2 h-4 w-4" />
                All Types
              </Button>
              <Button variant="outline" size="sm" className="h-9">
                All Courses
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.length > 0 ? (
                  filteredResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getFileIcon(resource.type)}
                          </div>
                          <div>
                            <div className="font-medium">{resource.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {resource.type.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{resource.course}</TableCell>
                      <TableCell className="uppercase">{resource.type}</TableCell>
                      <TableCell>{resource.size}</TableCell>
                      <TableCell>{new Date(resource.uploadedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{resource.downloads}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(resource)}>
                              <Download className="mr-2 h-4 w-4" />
                              <span>Download</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/content/resources/${resource.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(resource.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No resources found.
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
