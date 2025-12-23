'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Folder, File, FileText, FileVideo, FileImage, FileArchive, 
  Star, Download, Eye, MoreVertical, Grid2X2, List as ListIcon,
  Search, Filter, ChevronDown, ChevronRight, FolderPlus, Upload, X, Tag as TagIcon,
  ArrowLeft, ArrowRight, FolderOpen, FolderPlus as FolderPlusIcon, FolderTree, Home, RefreshCw, Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import ContentOrganizationService from '@/services/content/contentOrganization.service';

const ContentExplorer = ({ 
  initialFolderId = null,
  onFileSelect,
  onFolderSelect,
  onNavigate,
  className = '',
  readOnly = false,
  showBreadcrumbs = true,
  showSearch = true,
  showViewOptions = true,
  showToolbar = true,
  defaultView = 'grid',
  allowedFileTypes = ['all'],
  maxFileSize = 50 * 1024 * 1024, // 50MB
  uploadEndpoint = '/api/upload',
  onUploadComplete,
  onError
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // State
  const [currentFolder, setCurrentFolder] = useState({
    id: initialFolderId,
    name: 'My Files',
    path: []
  });
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState(defaultView);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([
    { id: null, name: 'My Files', path: [] }
  ]);
  
  // Fetch folder contents
  const fetchFolderContents = useCallback(async (folderId = null) => {
    try {
      setIsLoading(true);
      
      // Get folder contents
      const { items: folderItems } = await ContentOrganizationService.getContentByFolder(
        folderId,
        { limit: 100 },
        'current-user-id' // Replace with actual user ID from auth
      );
      
      // Separate folders and files
      const folderList = [];
      const fileList = [];
      
      folderItems.forEach(item => {
        if (item.type === 'FOLDER') {
          folderList.push(item);
        } else {
          fileList.push(item);
        }
      });
      
      setFolders(folderList);
      setFiles(fileList);
      
      // Update breadcrumbs if this is a navigation action
      if (folderId !== currentFolder.id) {
        updateBreadcrumbs(folderId);
      }
      
    } catch (error) {
      console.error('Error fetching folder contents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load folder contents. Please try again.',
        variant: 'destructive',
      });
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentFolder.id, onError, toast]);
  
  // Update breadcrumbs when navigating
  const updateBreadcrumbs = useCallback(async (folderId) => {
    if (!folderId) {
      setBreadcrumbs([{ id: null, name: 'My Files', path: [] }]);
      return;
    }
    
    try {
      const breadcrumbData = await ContentOrganizationService.getBreadcrumbs(folderId, false);
      setBreadcrumbs([
        { id: null, name: 'My Files', path: [] },
        ...breadcrumbData.map(item => ({
          id: item.id,
          name: item.name,
          path: item.path || []
        }))
      ]);
    } catch (error) {
      console.error('Error fetching breadcrumbs:', error);
    }
  }, []);
  
  // Initial load
  useEffect(() => {
    fetchFolderContents(initialFolderId);
  }, [fetchFolderContents, initialFolderId]);
  
  // Handle folder click
  const handleFolderClick = (folder) => {
    if (onFolderSelect) {
      onFolderSelect(folder);
    } else {
      // Navigate to the folder
      setCurrentFolder({
        id: folder.id,
        name: folder.name,
        path: [...currentFolder.path, { id: currentFolder.id, name: currentFolder.name }]
      });
      fetchFolderContents(folder.id);
    }
  };
  
  // Handle file click
  const handleFileClick = (file) => {
    if (onFileSelect) {
      onFileSelect(file);
    } else {
      // Default behavior: open file in new tab
      window.open(file.url, '_blank');
    }
  };
  
  // Handle breadcrumb click
  const handleBreadcrumbClick = (index) => {
    const newPath = [...breadcrumbs];
    const targetCrumb = newPath[index];
    
    setBreadcrumbs(newPath.slice(0, index + 1));
    
    if (targetCrumb.id === null) {
      // Root folder
      setCurrentFolder({
        id: null,
        name: 'My Files',
        path: []
      });
      fetchFolderContents(null);
    } else {
      // Navigate to the selected folder
      setCurrentFolder({
        id: targetCrumb.id,
        name: targetCrumb.name,
        path: targetCrumb.path
      });
      fetchFolderContents(targetCrumb.id);
    }
  };
  
  // Create a new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a folder name',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const newFolder = await ContentOrganizationService.createFolder(
        newFolderName.trim(),
        {
          parentId: currentFolder.id,
          description: `Folder created on ${new Date().toLocaleDateString()}`
        },
        'current-user-id' // Replace with actual user ID from auth
      );
      
      toast({
        title: 'Success',
        description: `Folder "${newFolder.name}" created successfully`,
      });
      
      // Refresh the current view
      await fetchFolderContents(currentFolder.id);
      setNewFolderName('');
      setIsCreatingFolder(false);
      
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create folder. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    // Validate files
    for (const file of files) {
      if (file.size > maxFileSize) {
        toast({
          title: 'Error',
          description: `File "${file.name}" exceeds the maximum size of ${formatFileSize(maxFileSize)}`,
          variant: 'destructive',
        });
        return;
      }
      
      if (allowedFileTypes[0] !== 'all' && !allowedFileTypes.includes(file.type)) {
        toast({
          title: 'Error',
          description: `File type "${file.type}" is not allowed.`,
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Prepare for upload
    setUploadedFiles(files);
    setShowUploadDialog(true);
  };
  
  // Confirm and start upload
  const confirmUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      if (currentFolder.id) {
        formData.append('folderId', currentFolder.id);
      }
      
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Success',
        description: `${uploadedFiles.length} file(s) uploaded successfully`,
      });
      
      // Refresh the current view
      await fetchFolderContents(currentFolder.id);
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(result);
      }
      
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload files. Please try again.',
        variant: 'destructive',
      });
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsUploading(false);
      setShowUploadDialog(false);
      setUploadedFiles([]);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Get file icon based on type
  const getFileIcon = (file) => {
    if (!file.mimeType) return <File className="w-5 h-5 text-gray-500" />;
    
    if (file.mimeType.startsWith('image/')) {
      return <FileImage className="w-5 h-5 text-blue-500" />;
    } else if (file.mimeType.startsWith('video/')) {
      return <FileVideo className="w-5 h-5 text-purple-500" />;
    } else if (file.mimeType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (
      file.mimeType.includes('spreadsheet') || 
      file.mimeType.includes('excel')
    ) {
      return <FileText className="w-5 h-5 text-green-600" />;
    } else if (
      file.mimeType.includes('word') || 
      file.mimeType.includes('document')
    ) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    } else if (file.mimeType.includes('zip') || file.mimeType.includes('compressed')) {
      return <FileArchive className="w-5 h-5 text-yellow-500" />;
    } else {
      return <File className="w-5 h-5 text-gray-500" />;
    }
  };
  
  // Toggle item selection
  const toggleItemSelection = (itemId, event) => {
    event.stopPropagation();
    
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };
  
  // Check if an item is selected
  const isSelected = (itemId) => selectedItems.has(itemId);
  
  // Clear selection
  const clearSelection = () => {
    setSelectedItems(new Set());
  };
  
  // Handle click outside to clear selection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectedItems.size > 0 && !event.target.closest('.content-item')) {
        clearSelection();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedItems]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Close dialogs with Escape
      if (event.key === 'Escape') {
        if (isCreatingFolder) {
          setIsCreatingFolder(false);
          setNewFolderName('');
        } else if (showUploadDialog) {
          setShowUploadDialog(false);
          setUploadedFiles([]);
        } else if (selectedItems.size > 0) {
          clearSelection();
        }
      }
      
      // Select all with Ctrl+A
      if (event.ctrlKey && event.key === 'a') {
        event.preventDefault();
        const allItemIds = [
          ...folders.map(f => f.id),
          ...files.map(f => f.id)
        ];
        setSelectedItems(new Set(allItemIds));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreatingFolder, showUploadDialog, selectedItems, folders, files]);
  
  // Render loading skeleton
  if (isLoading && folders.length === 0 && files.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 w-full sm:w-auto">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search files and folders..."
                  className="pl-9 w-full sm:w-64 lg:w-96"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {!readOnly && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setIsCreatingFolder(true)}
                  disabled={isLoading}
                >
                  <FolderPlusIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">New Folder</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload</span>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </Button>
              </>
            )}
            
            {showViewOptions && (
              <div className="flex items-center space-x-1 border rounded-md p-0.5">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid2X2 className="h-4 w-4" />
                  <span className="sr-only">Grid view</span>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode('list')}
                >
                  <ListIcon className="h-4 w-4" />
                  <span className="sr-only">List view</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <div className="flex items-center text-sm text-muted-foreground overflow-x-auto py-2 -mx-2 px-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />}
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={cn(
                  'px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground',
                  index === breadcrumbs.length - 1 ? 'font-medium text-foreground' : ''
                )}
              >
                {index === 0 ? <Home className="h-4 w-4 inline-block mr-1" /> : null}
                {crumb.name}
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Content */}
      <div className="space-y-4">
        {/* Empty state */}
        {!isLoading && folders.length === 0 && files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No files or folders</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {!readOnly ? 'Upload files or create a new folder to get started' : 'This folder is empty'}
            </p>
            {!readOnly && (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setIsCreatingFolder(true)}
                >
                  <FolderPlusIcon className="h-4 w-4" />
                  New Folder
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload Files
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileUpload}
                  />
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Folders */}
        {folders.length > 0 && (
          <div className={cn(
            'space-y-2',
            viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : ''
          )}>
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={cn(
                  'content-item group relative p-4 rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent/50 cursor-pointer',
                  isSelected(folder.id) ? 'ring-2 ring-primary/50 bg-accent/50' : '',
                  viewMode === 'list' ? 'flex items-center space-x-4' : 'flex flex-col items-center text-center'
                )}
                onClick={() => handleFolderClick(folder)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleItemSelection(folder.id, e);
                }}
              >
                <div 
                  className={cn(
                    'flex-shrink-0 flex items-center justify-center rounded-lg bg-primary/10 p-3 mb-2',
                    viewMode === 'list' ? 'mb-0' : 'w-16 h-16'
                  )}
                >
                  <Folder className={cn(
                    'text-primary',
                    viewMode === 'list' ? 'h-8 w-8' : 'h-10 w-10'
                  )} />
                </div>
                
                <div className={cn('flex-1 min-w-0', viewMode === 'list' ? 'text-left' : 'text-center')}>
                  <p className="text-sm font-medium truncate">{folder.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {folder.itemCount || 0} items • {new Date(folder.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                  <button
                    className="p-1 rounded-full hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItemSelection(folder.id, e);
                    }}
                  >
                    <span className="sr-only">Select</span>
                    <div className={cn(
                      'w-4 h-4 rounded-sm border-2',
                      isSelected(folder.id) 
                        ? 'bg-primary border-primary' 
                        : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                    )}>
                      {isSelected(folder.id) && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Files */}
        {files.length > 0 && (
          <div className={cn(
            'space-y-2',
            viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'space-y-2'
          )}>
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  'content-item group relative p-4 rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent/50 cursor-pointer',
                  isSelected(file.id) ? 'ring-2 ring-primary/50 bg-accent/50' : '',
                  viewMode === 'list' ? 'flex items-center space-x-4' : 'flex flex-col items-center text-center'
                )}
                onClick={() => handleFileClick(file)}
                onDoubleClick={() => handleFileClick(file)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleItemSelection(file.id, e);
                }}
              >
                <div 
                  className={cn(
                    'flex-shrink-0 flex items-center justify-center rounded-lg bg-primary/10 p-3 mb-2',
                    viewMode === 'list' ? 'mb-0' : 'w-16 h-16'
                  )}
                >
                  {getFileIcon(file)}
                </div>
                
                <div className={cn('flex-1 min-w-0', viewMode === 'list' ? 'text-left' : 'text-center')}>
                  <p className="text-sm font-medium truncate">{file.name || 'Untitled'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size || 0)} • {new Date(file.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                  <button
                    className="p-1 rounded-full hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItemSelection(file.id, e);
                    }}
                  >
                    <span className="sr-only">Select</span>
                    <div className={cn(
                      'w-4 h-4 rounded-sm border-2',
                      isSelected(file.id) 
                        ? 'bg-primary border-primary' 
                        : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                    )}>
                      {isSelected(file.id) && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Create Folder Dialog */}
      <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder in {currentFolder?.name || 'My Files'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateFolder();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingFolder(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              {uploadedFiles.length} file(s) ready to upload to {currentFolder?.name || 'My Files'}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="space-y-4 py-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-4 p-2 rounded-lg border">
                  <div className="flex-shrink-0 p-2 bg-accent/20 rounded-md">
                    {file.type.startsWith('image/') ? (
                      <FileImage className="h-8 w-8 text-blue-500" />
                    ) : (
                      <File className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const newFiles = [...uploadedFiles];
                      newFiles.splice(index, 1);
                      setUploadedFiles(newFiles);
                    }}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2.5 w-full bg-accent rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowUploadDialog(false);
                setUploadedFiles([]);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmUpload}
              disabled={uploadedFiles.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Upload ${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentExplorer;
