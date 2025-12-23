'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useContentVersionUpdates, VERSIONING_EVENTS } from '@/lib/websocket/versioning';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Clock, User, GitCommit, GitCompare, RotateCcw, Eye, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { versioningService } from '@/services/content/versioning.service';
import { toast } from 'sonner';

export function VersionHistory({ contentId, currentVersion, onVersionSelect, onRestore }) {
  const router = useRouter();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [compareVersions, setCompareVersions] = useState({
    from: null,
    to: null
  });
  const [showDiff, setShowDiff] = useState(false);
  const [diffData, setDiffData] = useState(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoring, setRestoring] = useState(false);
  
  // New state for enhanced features
  const [editingComment, setEditingComment] = useState({});
  const [commentText, setCommentText] = useState('');
  const [selectedVersions, setSelectedVersions] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [presenceData, setPresenceData] = useState({});
  const [editLocks, setEditLocks] = useState({});
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [currentCommentVersion, setCurrentCommentVersion] = useState(null);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await versioningService.getVersions(contentId);
      setVersions(data);
      
      // Update current version if it's not set or if the latest version is different
      if (data.length > 0 && (!currentVersion || data[0].versionNumber !== currentVersion)) {
        setCurrentVersion(data[0].versionNumber);
      }
    } catch (err) {
      console.error('Error loading versions:', err);
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  // Load versions on mount and when contentId changes
  useEffect(() => {
    if (contentId) {
      loadVersions();
    }
  }, [contentId]);

  // Handle real-time updates
  useContentVersionUpdates(contentId, (event) => {
    console.log('Version update event:', event);
    
    switch (event.type) {
      case VERSIONING_EVENTS.VERSION_CREATED:
      case VERSIONING_EVENTS.VERSION_RESTORED:
        loadVersions();
        toast.success(
          event.type === VERSIONING_EVENTS.VERSION_CREATED 
            ? 'New version created' 
            : 'Version restored'
        );
        break;
        
      case VERSIONING_EVENTS.CONTENT_UPDATED:
        setVersions(prev => 
          prev.map(v => 
            v.versionNumber === event.data.versionNumber 
              ? { ...v, ...event.data } 
              : v
          )
        );
        break;
        
      case VERSIONING_EVENTS.VERSION_DELETED:
        setVersions(prev => 
          prev.filter(v => v.versionNumber !== event.data.versionNumber)
        );
        // Remove from selected versions if it was selected
        setSelectedVersions(prev => {
          const newSet = new Set(prev);
          newSet.delete(event.data.versionNumber);
          return newSet;
        });
        toast.info(`Version ${event.data.versionNumber} deleted`);
        break;
        
      case 'PRESENCE_UPDATE':
        setPresenceData(prev => ({
          ...prev,
          [event.data.userId]: {
            ...event.data,
            lastSeen: new Date().toISOString()
          }
        }));
        break;
        
      case 'EDIT_LOCK_ACQUIRED':
        setEditLocks(prev => ({
          ...prev,
          [event.data.versionId]: event.data.userId
        }));
        break;
        
      case 'EDIT_LOCK_RELEASED':
        setEditLocks(prev => {
          const newLocks = { ...prev };
          delete newLocks[event.data.versionId];
          return newLocks;
        });
        break;
        
      case 'COMMENT_ADDED':
        setVersions(prev => 
          prev.map(v => 
            v.id === event.data.versionId 
              ? { 
                  ...v, 
                  comments: [...(v.comments || []), event.data.comment] 
                
                } 
              : v
          )
        );
        break;
        
      default:
        console.warn('Unknown versioning event:', event);
    }
  });

  const handleViewVersion = (version) => {
    setSelectedVersion(version);
    if (onVersionSelect) {
      onVersionSelect(version);
    }
  };

  const handleCompareToggle = (version) => {
    if (isVersionLocked(version.id)) {
      toast.warning('This version is currently being edited by another user');
      return;
    }
    
    if (!compareVersions.from) {
      setCompareVersions({ from: version, to: null });
    } else if (!compareVersions.to && compareVersions.from.versionNumber !== version.versionNumber) {
      setCompareVersions(prev => ({ ...prev, to: version }));
    } else {
      setCompareVersions({ from: version, to: null });
    }
  };
  
  // Check if a version is locked by another user
  const isVersionLocked = (versionId) => {
    const lockOwner = editLocks[versionId];
    return lockOwner && lockOwner !== session?.user?.id;
  };
  
  // Handle version selection for bulk operations
  const toggleVersionSelection = (versionId) => {
    setSelectedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };
  
  // Handle adding a comment to a version
  const handleAddComment = async (versionId) => {
    if (!commentText.trim()) return;
    
    try {
      // In a real implementation, this would call your API
      const newComment = {
        id: `comment-${Date.now()}`,
        text: commentText,
        author: {
          id: session.user.id,
          name: session.user.name,
          image: session.user.image
        },
        createdAt: new Date().toISOString()
      };
      
      // Update UI optimistically
      setVersions(prev => 
        prev.map(v => 
          v.id === versionId 
            ? { 
                ...v, 
                comments: [...(v.comments || []), newComment] 
              } 
            : v
        )
      );
      
      // Clear the comment input
      setCommentText('');
      setShowCommentDialog(false);
      
      // Notify other clients
      webSocketService.publish(`content:${contentId}:versions`, {
        type: 'COMMENT_ADDED',
        data: {
          versionId,
          comment: newComment
        }
      });
      
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };
  
  // Handle bulk delete of versions
  const handleBulkDelete = async () => {
    if (selectedVersions.size === 0) return;
    
    try {
      // In a real implementation, this would call your API
      const versionIds = Array.from(selectedVersions);
      
      // Update UI optimistically
      setVersions(prev => 
        prev.filter(v => !versionIds.includes(v.id))
      );
      
      // Clear selection
      setSelectedVersions(new Set());
      setShowBulkActions(false);
      
      // Notify other clients
      versionIds.forEach(versionId => {
        webSocketService.publish(`content:${contentId}:versions`, {
          type: VERSIONING_EVENTS.VERSION_DELETED,
          data: { versionId }
        });
      });
      
      toast.success(`${versionIds.length} versions deleted`);
    } catch (error) {
      console.error('Error deleting versions:', error);
      toast.error('Failed to delete versions');
    }
  };
  
  // Handle bulk restore of versions
  const handleBulkRestore = async () => {
    if (selectedVersions.size === 0) return;
    
    try {
      // In a real implementation, this would call your API
      const versionIds = Array.from(selectedVersions);
      
      // Update UI optimistically
      const versionsToRestore = versions.filter(v => versionIds.includes(v.id));
      
      // Clear selection
      setSelectedVersions(new Set());
      setShowBulkActions(false);
      
      // Restore the latest selected version
      const latestVersion = versionsToRestore.reduce((latest, current) => 
        new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current
      );
      
      if (onRestore) {
        await onRestore(latestVersion.versionNumber);
      }
      
      toast.success(`Restored to version ${latestVersion.versionNumber}`);
    } catch (error) {
      console.error('Error restoring versions:', error);
      toast.error('Failed to restore versions');
    }
  };
  
  // Get user presence status
  const getUserPresence = (userId) => {
    const user = presenceData[userId];
    if (!user) return 'offline';
    
    const lastSeen = new Date(user.lastSeen);
    const now = new Date();
    const diffInMinutes = (now - lastSeen) / (1000 * 60);
    
    if (diffInMinutes < 1) return 'online';
    if (diffInMinutes < 5) return 'away';
    return 'offline';
  };
  
  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };
  
  // Memoize the version row to prevent unnecessary re-renders
  const VersionRow = useCallback(({ version, isSelected, onSelect, onCompare, onView, onRestore, onComment }) => {
    const isLocked = isVersionLocked(version.id);
    const lockOwner = editLocks[version.id];
    const presenceStatus = lockOwner ? getUserPresence(lockOwner) : null;
    
    return (
      <TableRow className={isSelected ? 'bg-muted/50' : ''}>
        <TableCell className="w-12">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={() => onSelect(version.id)}
            disabled={isLocked}
          />
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-muted-foreground" />
            <span>v{version.versionNumber}</span>
            {version.versionNumber === currentVersion && (
              <Badge variant="default">Current</Badge>
            )}
            {isLocked && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="relative">
                    <Lock className="h-4 w-4 text-yellow-500" />
                    {presenceStatus === 'online' && (
                      <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full"></span>
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {`Being edited by ${lockOwner === session?.user?.id ? 'you' : 'another user'}`}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatRelativeTime(version.createdAt)}
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            {version.message || 'No description'}
            {version.comments?.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {version.comments.length} {version.comments.length === 1 ? 'comment' : 'comments'}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={version.createdBy?.image} />
              <AvatarFallback>
                {version.createdBy?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">
              {version.createdBy?.name || 'Unknown'}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView(version)}
              disabled={isLocked}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onComment(version)}
              disabled={isLocked}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            
            {version.versionNumber !== currentVersion && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRestore(version)}
                disabled={isLocked}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant={compareVersions.from?.id === version.id || compareVersions.to?.id === version.id 
                ? 'default' 
                : 'ghost'}
              size="icon"
              onClick={() => onCompare(version)}
              disabled={isLocked}
            >
              <GitCompare className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }, [compareVersions, currentVersion, editLocks, session?.user?.id]);

  const handleViewDiff = async () => {
    if (!compareVersions.from || !compareVersions.to) return;
    
    try {
      const diff = await versioningService.compareVersions(
        contentId,
        compareVersions.from.versionNumber,
        compareVersions.to.versionNumber
      );
      setDiffData(diff);
      setShowDiff(true);
    } catch (err) {
      console.error('Error comparing versions:', err);
      toast.error('Failed to compare versions');
    }
  };

  const handleRestore = async () => {
    if (!selectedVersion) return;
    
    try {
      setRestoring(true);
      await onRestore(selectedVersion.versionNumber);
      toast.success(`Restored to version ${selectedVersion.versionNumber}`);
      setShowRestoreDialog(false);
      router.refresh();
    } catch (err) {
      console.error('Error restoring version:', err);
      toast.error('Failed to restore version');
    } finally {
      setRestoring(false);
    }
  };

  const isCurrentVersion = (version) => {
    return currentVersion === version.versionNumber;
  };

  const getVersionBadge = (version) => {
    if (isCurrentVersion(version)) {
      return <Badge variant="default">Current</Badge>;
    }
    if (version.versionNumber === 1) {
      return <Badge variant="secondary">Initial</Badge>;
    }
    return null;
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Version History</h3>
          {compareVersions.from && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCompareVersions({ from: null, to: null })}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Clear Selection
            </Button>
          )}
          {showBulkActions && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm text-muted-foreground">
                {selectedVersions.size} selected
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBulkRestore}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore Selected
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {compareVersions.from && compareVersions.to && (
            <Button 
              onClick={handleViewDiff}
              size="sm"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              View Changes
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => loadVersions()}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedVersions.size > 0 && selectedVersions.size === versions.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const allVersionIds = versions.map(v => v.id);
                      setSelectedVersions(new Set(allVersionIds));
                      setShowBulkActions(true);
                    } else {
                      setSelectedVersions(new Set());
                      setShowBulkActions(false);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Changes</TableHead>
              <TableHead>Author</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-36" /></TableCell>
                </TableRow>
              ))
            ) : versions.length > 0 ? (
              versions.map((version) => (
                <VersionRow
                  key={version.id}
                  version={version}
                  isSelected={selectedVersions.has(version.id)}
                  onSelect={toggleVersionSelection}
                  onCompare={handleCompareToggle}
                  onView={handleViewVersion}
                  onRestore={(v) => {
                    setSelectedVersion(v);
                    setShowRestoreDialog(true);
                  }}
                  onComment={(v) => {
                    setCurrentCommentVersion(v);
                    setShowCommentDialog(true);
                  }}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No version history available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Version Details Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={(open) => !open && setSelectedVersion(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Version {selectedVersion?.versionNumber} Details
            </DialogTitle>
            <DialogDescription>
              {selectedVersion?.message || 'No description provided'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Created</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedVersion && formatDistanceToNow(new Date(selectedVersion.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Author</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedVersion?.createdBy?.name || 'Unknown'}
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-1">Changes</h4>
              <div className="space-y-2">
                {selectedVersion?.diff?.title && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <h5 className="text-sm font-medium mb-1">Title</h5>
                    <p className="text-sm">{selectedVersion.title}</p>
                  </div>
                )}
                
                {selectedVersion?.diff?.content && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <h5 className="text-sm font-medium mb-1">Content</h5>
                    <div 
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
                    />
                  </div>
                )}
                
                {selectedVersion?.diff?.status && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <h5 className="text-sm font-medium mb-1">Status</h5>
                    <Badge>{selectedVersion.status}</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            {!isCurrentVersion(selectedVersion) && (
              <Button 
                onClick={() => {
                  setShowRestoreDialog(true);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore this version
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedVersion(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diff Viewer Dialog */}
      <Dialog open={showDiff} onOpenChange={setShowDiff}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Comparing Versions</DialogTitle>
            <DialogDescription>
              Changes between v{compareVersions.from?.versionNumber} and v{compareVersions.to?.versionNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto space-y-6">
            {diffData?.title && (
              <div>
                <h4 className="text-sm font-medium mb-2">Title</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">From v{compareVersions.from?.versionNumber}</div>
                    <p>{diffData.title.from}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">To v{compareVersions.to?.versionNumber}</div>
                    <p>{diffData.title.to}</p>
                  </div>
                </div>
              </div>
            )}
            
            {diffData?.content && (
              <div>
                <h4 className="text-sm font-medium mb-2">Content</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-md">
                    <div className="text-xs text-muted-foreground mb-2">From v{compareVersions.from?.versionNumber}</div>
                    <div 
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: compareVersions.from.content }}
                    />
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md">
                    <div className="text-xs text-muted-foreground mb-2">To v{compareVersions.to?.versionNumber}</div>
                    <div 
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: compareVersions.to.content }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {diffData?.status && (
              <div>
                <h4 className="text-sm font-medium mb-2">Status</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">From:</span>
                    <Badge>{diffData.status.from}</Badge>
                  </div>
                  <div className="text-muted-foreground">→</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">To:</span>
                    <Badge>{diffData.status.to}</Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiff(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current content with version {selectedVersion?.versionNumber}. 
              A new version will be created to preserve the current state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestore}
              disabled={restoring}
            >
              {restoring ? 'Restoring...' : 'Restore Version'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
