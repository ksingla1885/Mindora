'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, Filter, Grid, List, ChevronDown, ChevronRight, Folder, File, 
  FileText, FileVideo, FileImage, FileArchive, Star, Download, Eye, MoreVertical,
  Grid2X2, List as ListIcon, LayoutGrid, FolderPlus, Upload, X, Tag as TagIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { ContentService } from '@/lib/content-service';

export function ContentBrowser({ 
  initialContent = [], 
  initialCategories = [],
  initialTags = [],
  viewMode: initialViewMode = 'grid',
  onContentSelect,
  onUploadClick,
  onNewFolderClick,
  showBreadcrumbs = true,
  showFilters = true,
  showViewOptions = true,
  showActions = true,
  className = '',
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [categories, setCategories] = useState(initialCategories);
  const [tags, setTags] = useState(initialTags);
  const [activeFilters, setActiveFilters] = useState({
    type: searchParams.get('type') || 'all',
    category: searchParams.get('category') || null,
    tags: searchParams.get('tags') ? searchParams.get('tags').split(',') : [],
  });
  const [breadcrumbs, setBreadcrumbs] = useState([
    { id: 'root', name: 'All Files', path: '/content' },
  ]);

  // Fetch content based on filters
  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const { items } = await ContentService.searchContent({
        query: searchQuery,
        categoryId: activeFilters.category,
        tags: activeFilters.tags,
        type: activeFilters.type === 'all' ? null : activeFilters.type,
      });
      setContent(items);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, activeFilters, toast]);

  // Initial load
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchContent();
  };

  // Handle filter change
  const handleFilterChange = (filter, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filter]: value,
    }));
  };

  // Toggle item selection
  const toggleItemSelection = (itemId) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  // Get file icon based on type
  const getFileIcon = (type, className = 'w-5 h-5') => {
    if (type.startsWith('video/')) return <FileVideo className={className} />;
    if (type.startsWith('image/')) return <FileImage className={className} />;
    if (type === 'application/pdf') return <FileText className={className} />;
    if (type.includes('word') || type.includes('excel') || type.includes('powerpoint')) 
      return <FileText className={className} />;
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) 
      return <FileArchive className={className} />;
    return <File className={className} />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-10 pr-4 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {showViewOptions && (
            <div className="flex items-center border rounded-md p-1 bg-muted/50">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('grid')}
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('list')}
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <span>New</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onUploadClick}>
                <Upload className="mr-2 h-4 w-4" />
                <span>Upload Files</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNewFolderClick}>
                <FolderPlus className="mr-2 h-4 w-4" />
                <span>New Folder</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          </div>
          
          <Button
            variant={activeFilters.type === 'all' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('type', 'all')}
          >
            All
          </Button>
          <Button
            variant={activeFilters.type === 'video' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('type', 'video')}
            className="flex items-center gap-1"
          >
            <FileVideo className="h-4 w-4" />
            <span>Videos</span>
          </Button>
          <Button
            variant={activeFilters.type === 'image' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('type', 'image')}
            className="flex items-center gap-1"
          >
            <FileImage className="h-4 w-4" />
            <span>Images</span>
          </Button>
          <Button
            variant={activeFilters.type === 'document' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('type', 'document')}
            className="flex items-center gap-1"
          >
            <FileText className="h-4 w-4" />
            <span>Documents</span>
          </Button>
          
          {/* Active filters */}
          {activeFilters.tags.length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              {activeFilters.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  <TagIcon className="h-3 w-3" />
                  {tag}
                  <button 
                    onClick={() => handleFilterChange('tags', activeFilters.tags.filter(t => t !== tag))}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content area */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : content.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Folder className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No files found</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {searchQuery 
              ? 'No files match your search.' 
              : 'Upload your first file to get started.'}
          </p>
          <Button onClick={onUploadClick}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {content.map((item) => (
            <div 
              key={item.id}
              className={`group relative rounded-lg border p-3 hover:bg-accent/50 transition-colors cursor-pointer ${
                selectedItems.has(item.id) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onContentSelect?.(item)}
              onDoubleClick={() => item.type === 'folder' && router.push(`/content/folder/${item.id}`)}
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-2 w-full aspect-square bg-muted/20 rounded-md flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    <img 
                      src={item.thumbnailUrl} 
                      alt={item.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : item.type === 'folder' ? (
                    <Folder className="h-12 w-12 text-primary" />
                  ) : (
                    getFileIcon(item.mimeType, 'h-12 w-12 text-primary')
                  )}
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/80 hover:bg-background">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/80 hover:bg-background">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="w-full text-sm font-medium truncate">
                  {item.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.type === 'folder' 
                    ? `${item._count?.children || 0} items` 
                    : formatFileSize(item.size)}
                </div>
                
                {item.tags?.length > 0 && (
                  <div className="mt-1 flex flex-wrap justify-center gap-1">
                    {item.tags.slice(0, 2).map(tag => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                    {item.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItemSelection(item.id);
                  }}
                >
                  {selectedItems.has(item.id) ? (
                    <div className="h-4 w-4 rounded-sm bg-primary flex items-center justify-center">
                      <div className="h-2 w-2 bg-primary-foreground rounded-sm" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-sm border border-border" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="w-10 p-3 text-left">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedItems.size === content.length && content.length > 0}
                        onChange={() => {
                          if (selectedItems.size === content.length) {
                            setSelectedItems(new Set());
                          } else {
                            setSelectedItems(new Set(content.map(item => item.id)));
                          }
                        }}
                      />
                    </div>
                  </th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Size</th>
                  <th className="p-3 text-left">Modified</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {content.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => onContentSelect?.(item)}
                    onDoubleClick={() => item.type === 'folder' && router.push(`/content/folder/${item.id}`)}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {item.type === 'folder' ? (
                          <Folder className="h-5 w-5 text-primary" />
                        ) : (
                          getFileIcon(item.mimeType, 'h-5 w-5 text-muted-foreground')
                        )}
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {item.type === 'folder' ? 'Folder' : item.mimeType}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {item.type === 'folder' ? '--' : formatFileSize(item.size)}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              <span>Download</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Star className="mr-2 h-4 w-4" />
                              <span>Add to Favorites</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
