'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Filter, Video, Upload, MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function VideosPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data - replace with actual API call
  const videos = [
    {
      id: '1',
      title: 'Introduction to Physics',
      description: 'Basic concepts of physics for beginners',
      duration: '12:34',
      size: '245 MB',
      status: 'processed',
      uploadedAt: '2023-10-15',
      course: 'JEE Main Physics',
      thumbnail: '/placeholder.svg',
    },
    {
      id: '2',
      title: 'Calculus Fundamentals',
      description: 'Understanding derivatives and integrals',
      duration: '18:45',
      size: '356 MB',
      status: 'processing',
      uploadedAt: '2023-10-10',
      course: 'JEE Advanced Mathematics',
      thumbnail: '/placeholder.svg',
    },
    {
      id: '3',
      title: 'Organic Chemistry Basics',
      description: 'Introduction to organic compounds',
      duration: '22:10',
      size: '412 MB',
      status: 'error',
      uploadedAt: '2023-10-05',
      course: 'NEET Chemistry',
      thumbnail: '/placeholder.svg',
    },
  ];

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusMap = {
      processing: { label: 'Processing', variant: 'warning' },
      processed: { label: 'Ready', variant: 'success' },
      error: { label: 'Error', variant: 'destructive' },
    };
    
    const { label, variant } = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleDelete = async (videoId) => {
    // TODO: Implement delete functionality
    console.log('Delete video:', videoId);
    // await fetch(`/api/videos/${videoId}`, { method: 'DELETE' });
    // refreshVideos();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Video Library</h1>
          <p className="text-muted-foreground">
            Manage and organize all your video content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search videos..."
              className="pl-8 w-full md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button asChild>
            <Link href="/admin/content/videos/upload">
              <Plus className="mr-2 h-4 w-4" />
              Upload Video
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Videos</CardTitle>
              <CardDescription>
                {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="h-8">
                <Upload className="mr-2 h-3.5 w-3.5" />
                <span>Export</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.length > 0 ? (
                  filteredVideos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/placeholder.svg';
                              }}
                            />
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                              {video.duration}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium line-clamp-1">{video.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {video.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{video.course}</TableCell>
                      <TableCell>{video.duration}</TableCell>
                      <TableCell>{video.size}</TableCell>
                      <TableCell>{new Date(video.uploadedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(video.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/content/videos/${video.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/content/videos/${video.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(video.id)}
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
                      No videos found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing <strong>1-{filteredVideos.length}</strong> of <strong>{filteredVideos.length}</strong> videos
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
