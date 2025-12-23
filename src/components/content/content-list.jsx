'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Video, Image, Search, Download, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function ContentList({ initialContent = [], topics = [] }) {
  const { toast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [filteredContent, setFilteredContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    topic: '',
    classLevel: '',
    contentType: '',
  });

  // Apply filters when content or filters change
  useEffect(() => {
    let result = [...content];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.topic) {
      result = result.filter((item) => item.topicId === filters.topic);
    }

    if (filters.classLevel) {
      result = result.filter((item) => item.classLevel === filters.classLevel);
    }

    if (filters.contentType) {
      result = result.filter((item) => {
        const type = item.contentType.split('/')[0];
        return type === filters.contentType;
      });
    }

    setFilteredContent(result);
  }, [content, filters]);

  const handleDelete = async (contentId) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      setContent(content.filter((item) => item.id !== contentId));
      
      toast({
        title: 'Success',
        description: 'Content deleted successfully',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete content',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getContentIcon = (contentType) => {
    const type = contentType?.split('/')[0];
    switch (type) {
      case 'application':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'video':
        return <Video className="h-4 w-4 text-red-500" />;
      case 'image':
        return <Image className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Content Library</CardTitle>
        <div className="flex items-center space-x-2
        ">
          <Button size="sm" variant="outline" disabled={isLoading}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search content..."
                className="pl-8"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            
            <Select
              value={filters.topic}
              onValueChange={(value) =>
                setFilters({ ...filters, topic: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Topics</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.classLevel}
              onValueChange={(value) =>
                setFilters({ ...filters, classLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Classes</SelectItem>
                {[9, 10, 11, 12].map((grade) => (
                  <SelectItem key={grade} value={grade.toString()}>
                    Class {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.contentType}
              onValueChange={(value) =>
                setFilters({ ...filters, contentType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="application">Documents</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="image">Images</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContent.length > 0 ? (
                filteredContent.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{getContentIcon(item.contentType)}</TableCell>
                    <TableCell className="font-medium">
                      <div className="line-clamp-1">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {topics.find((t) => t.id === item.topicId)?.name || 'N/A'}
                    </TableCell>
                    <TableCell>Class {item.classLevel}</TableCell>
                    <TableCell>{formatFileSize(item.fileSize || 0)}</TableCell>
                    <TableCell>
                      <Badge variant={item.isPremium ? 'default' : 'outline'}>
                        {item.isPremium ? 'Premium' : 'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(item.url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No content found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
