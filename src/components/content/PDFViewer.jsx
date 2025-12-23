'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Highlighter, 
  MessageSquare, 
  Type, 
  X, 
  Save, 
  Bookmark as BookmarkIcon,
  BookOpen,
  Search,
  RotateCw,
  FileText,
  PenTool
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Annotation types
const ANNOTATION_TYPES = {
  HIGHLIGHT: 'highlight',
  NOTE: 'note',
  BOOKMARK: 'bookmark',
};

// Default colors for highlights
const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#FFEB3B', textColor: '#000' },
  { name: 'Green', value: '#8BC34A', textColor: '#000' },
  { name: 'Pink', value: '#FF80AB', textColor: '#000' },
  { name: 'Blue', value: '#64B5F6', textColor: '#000' },
  { name: 'Purple', value: '#B388FF', textColor: '#000' },
];

const PDFViewer = ({ url, className = '', onAnnotationsChange }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [annotations, setAnnotations] = useState([]);
  const [activeAnnotation, setActiveAnnotation] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  
  const pdfContainerRef = useRef(null);
  const textLayerContainerRef = useRef(null);

  // Load saved annotations and bookmarks from localStorage
  useEffect(() => {
    if (url) {
      const savedAnnotations = localStorage.getItem(`pdf-annotations-${url}`);
      if (savedAnnotations) {
        setAnnotations(JSON.parse(savedAnnotations));
      }
      
      const savedBookmarks = localStorage.getItem(`pdf-bookmarks-${url}`);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
      
      const savedNotes = localStorage.getItem(`pdf-notes-${url}`);
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    }
  }, [url]);
  
  // Save annotations when they change
  useEffect(() => {
    if (isDirty && url) {
      localStorage.setItem(`pdf-annotations-${url}`, JSON.stringify(annotations));
      localStorage.setItem(`pdf-bookmarks-${url}`, JSON.stringify(bookmarks));
      localStorage.setItem(`pdf-notes-${url}`, JSON.stringify(notes));
      if (onAnnotationsChange) {
        onAnnotationsChange({ annotations, bookmarks, notes });
      }
      setIsDirty(false);
    }
  }, [annotations, bookmarks, notes, isDirty, url, onAnnotationsChange]);
  
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setIsLoading(false);
    // Re-apply any highlights after load
    setTimeout(() => {
      applyHighlights();
    }, 500);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again or download the file.');
    setIsLoading(false);
  }, []);
  
  // Apply highlights to the PDF
  const applyHighlights = (pageNum = null) => {
    if (!textLayerContainerRef.current) return;
    
    const textLayer = textLayerContainerRef.current.querySelector('.react-pdf__Page__textContent');
    if (!textLayer) return;
    
    // Clear existing highlights
    const existingHighlights = textLayerContainerRef.current.querySelectorAll('.pdf-highlight');
    existingHighlights.forEach(el => el.remove());
    
    // Apply new highlights
    const pageHighlights = pageNum 
      ? annotations.filter(a => a.pageNumber === pageNum) 
      : annotations;
      
    pageHighlights.forEach(annotation => {
      if (annotation.type === ANNOTATION_TYPES.HIGHLIGHT) {
        const textNodes = [];
        const walker = document.createTreeWalker(
          textLayer,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.nodeValue.includes(annotation.text)) {
            textNodes.push(node);
          }
        }
        
        textNodes.forEach(textNode => {
          const range = document.createRange();
          const text = textNode.nodeValue;
          const startIndex = text.indexOf(annotation.text);
          
          if (startIndex >= 0) {
            range.setStart(textNode, startIndex);
            range.setEnd(textNode, startIndex + annotation.text.length);
            
            const highlight = document.createElement('span');
            highlight.className = 'pdf-highlight';
            highlight.style.backgroundColor = annotation.color || HIGHLIGHT_COLORS[0].value;
            highlight.style.padding = '0 2px';
            highlight.style.borderRadius = '2px';
            highlight.style.cursor = 'pointer';
            highlight.title = annotation.note ? `Note: ${annotation.note}` : '';
            highlight.onclick = (e) => {
              e.stopPropagation();
              setActiveAnnotation(annotation);
              if (annotation.note) {
                setNoteContent(annotation.note);
              }
            };
            
            try {
              range.surroundContents(highlight);
            } catch (e) {
              console.warn('Could not highlight text:', e);
            }
          }
        });
      }
    });
  };

  // Navigation
  const goToPrevPage = () => {
    setPageNumber((prevPage) => Math.max(prevPage - 1, 1));
    setActiveAnnotation(null);
  };

  const goToNextPage = () => {
    setPageNumber((prevPage) => Math.min(prevPage + 1, numPages || 1));
    setActiveAnnotation(null);
  };
  
  const goToPage = (pageNum) => {
    setPageNumber(Math.min(Math.max(1, pageNum), numPages || 1));
    setActiveAnnotation(null);
  };

  // Zoom and rotation
  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 2));
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));
  };
  
  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };
  
  const resetView = () => {
    setScale(1.0);
    setRotation(0);
  };

  // Handle text selection for annotations
  const handleTextSelection = useCallback(() => {
    if (activeTool !== ANNOTATION_TYPES.HIGHLIGHT && activeTool !== ANNOTATION_TYPES.NOTE) return;
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    
    const selectedText = selection.toString().trim();
    if (!selectedText) return;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = pdfContainerRef.current.getBoundingClientRect();
    
    // Calculate position relative to PDF container
    const x = rect.left - containerRect.left;
    const y = rect.top - containerRect.top;
    
    if (activeTool === ANNOTATION_TYPES.HIGHLIGHT) {
      const newHighlight = {
        id: `highlight-${Date.now()}`,
        type: ANNOTATION_TYPES.HIGHLIGHT,
        text: selectedText,
        pageNumber: pageNumber,
        color: selectedColor.value,
        textColor: selectedColor.textColor,
        position: { x, y, width: rect.width, height: rect.height },
        createdAt: new Date().toISOString()
      };
      
      setAnnotations(prev => [...prev, newHighlight]);
      setIsDirty(true);
      
      // Clear selection
      selection.removeAllRanges();
      setActiveTool(null);
      
      // Apply the highlight
      setTimeout(applyHighlights, 100);
    } else if (activeTool === ANNOTATION_TYPES.NOTE) {
      setActiveAnnotation({
        id: `note-${Date.now()}`,
        type: ANNOTATION_TYPES.NOTE,
        text: selectedText,
        pageNumber,
        position: { x, y },
        isNew: true,
        createdAt: new Date().toISOString()
      });
      
      // Clear selection
      selection.removeAllRanges();
    }
  }, [activeTool, pageNumber, selectedColor]);

  // Add a new note
  const handleAddNote = () => {
    if (!activeAnnotation || !noteContent.trim()) return;
    
    const newNote = {
      ...activeAnnotation,
      note: noteContent.trim(),
      updatedAt: new Date().toISOString()
    };
    
    setAnnotations(prev => [...prev, newNote]);
    setNotes(prev => [...prev, newNote]);
    setIsDirty(true);
    setActiveAnnotation(null);
    setNoteContent('');
    
    // Re-apply highlights to show the new note
    setTimeout(() => {
      applyHighlights();
    }, 100);
  };

  // Toggle bookmark for current page
  const toggleBookmark = () => {
    const existingIndex = bookmarks.findIndex(b => b.pageNumber === pageNumber);
    
    if (existingIndex >= 0) {
      // Remove bookmark
      const newBookmarks = [...bookmarks];
      newBookmarks.splice(existingIndex, 1);
      setBookmarks(newBookmarks);
    } else {
      // Add bookmark
      const newBookmark = {
        id: `bookmark-${Date.now()}`,
        type: ANNOTATION_TYPES.BOOKMARK,
        pageNumber: pageNumber,
        createdAt: new Date().toISOString(),
        label: `Page ${pageNumber}`
      };
      setBookmarks(prev => [...prev, newBookmark]);
    }
    
    setIsDirty(true);
  };

  // Delete an annotation
  const deleteAnnotation = (id) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    setIsDirty(true);
    setActiveAnnotation(null);
  };

  // Delete a note
  const deleteNote = (id) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    setNotes(prev => prev.filter(n => n.id !== id));
    setIsDirty(true);
    setActiveAnnotation(null);
  };

  // Toolbar button component
  const ToolbarButton = ({ 
    active = false, 
    onClick, 
    icon: Icon, 
    tooltip, 
    disabled = false,
    variant = 'ghost',
    className = ''
  }) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            className={cn(
              'h-8 w-8',
              active && 'bg-gray-200',
              className
            )}
            onClick={onClick}
            disabled={disabled}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-col h-full ${className}`} ref={pdfContainerRef}>
        {/* Top Toolbar */}
        <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
          <div className="flex items-center space-x-2">
            {/* Navigation */}
            <ToolbarButton 
              onClick={goToPrevPage}
              disabled={pageNumber <= 1 || isLoading}
              icon={ChevronLeft}
              tooltip="Previous page"
            />
            
            <div className="flex items-center text-sm text-gray-600">
              <input
                type="number"
                value={pageNumber}
                min={1}
                max={numPages || 1}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-12 h-8 text-center border rounded mx-1"
                disabled={isLoading}
              />
              <span className="mx-1">/ {numPages || '--'}</span>
            </div>
            
            <ToolbarButton 
              onClick={goToNextPage}
              disabled={!numPages || pageNumber >= numPages || isLoading}
              icon={ChevronRight}
              tooltip="Next page"
            />
            
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            
            {/* Zoom */}
            <ToolbarButton 
              onClick={zoomOut}
              disabled={scale <= 0.5}
              icon={ZoomOut}
              tooltip="Zoom out"
            />
            
            <span className="text-sm text-gray-600 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <ToolbarButton 
              onClick={zoomIn}
              disabled={scale >= 2}
              icon={ZoomIn}
              tooltip="Zoom in"
            />
            
            <ToolbarButton 
              onClick={rotate}
              icon={RotateCw}
              tooltip="Rotate"
            />
            
            <ToolbarButton 
              onClick={resetView}
              icon={FileText}
              tooltip="Reset view"
            />
            
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            
            {/* Annotation Tools */}
            <ToolbarButton 
              active={activeTool === ANNOTATION_TYPES.HIGHLIGHT}
              onClick={() => setActiveTool(activeTool === ANNOTATION_TYPES.HIGHLIGHT ? null : ANNOTATION_TYPES.HIGHLIGHT)}
              icon={Highlighter}
              tooltip="Highlight text"
            />
            
            <ToolbarButton 
              active={activeTool === ANNOTATION_TYPES.NOTE}
              onClick={() => setActiveTool(activeTool === ANNOTATION_TYPES.NOTE ? null : ANNOTATION_TYPES.NOTE)}
              icon={MessageSquare}
              tooltip="Add note"
            />
            
            <ToolbarButton 
              active={bookmarks.some(b => b.pageNumber === pageNumber)}
              onClick={toggleBookmark}
              icon={BookmarkIcon}
              tooltip={bookmarks.some(b => b.pageNumber === pageNumber) ? 'Remove bookmark' : 'Add bookmark'}
            />
            
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            
            {/* Highlight Colors */}
            {activeTool === ANNOTATION_TYPES.HIGHLIGHT && (
              <div className="flex items-center space-x-1">
                {HIGHLIGHT_COLORS.map(color => (
                  <Tooltip key={color.name}>
                    <TooltipTrigger asChild>
                      <button
                        className={`w-6 h-6 rounded-full border ${selectedColor.value === color.value ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setSelectedColor(color)}
                        title={color.name}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{color.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Sidebar Toggles */}
            <ToolbarButton 
              active={showBookmarks}
              onClick={() => setShowBookmarks(!showBookmarks)}
              icon={BookOpen}
              tooltip="Bookmarks"
              variant={showBookmarks ? 'default' : 'ghost'}
            />
            
            <ToolbarButton 
              active={showNotes}
              onClick={() => setShowNotes(!showNotes)}
              icon={Type}
              tooltip="Notes"
              variant={showNotes ? 'default' : 'ghost'}
            />
            
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            
            {/* Download */}
            <ToolbarButton 
              onClick={() => window.open(url, '_blank')}
              icon={Download}
              tooltip="Download PDF"
            />
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Bookmarks */}
          {showBookmarks && (
            <div className="w-64 bg-white border-r flex flex-col">
              <div className="p-3 border-b">
                <h3 className="font-medium flex items-center">
                  <BookmarkIcon className="h-4 w-4 mr-2" />
                  Bookmarks
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {bookmarks.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-4">
                    No bookmarks yet. Click the bookmark icon to add one.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {bookmarks.map(bookmark => (
                      <div 
                        key={bookmark.id}
                        className={`flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer ${bookmark.pageNumber === pageNumber ? 'bg-blue-50' : ''}`}
                        onClick={() => goToPage(bookmark.pageNumber)}
                      >
                        <div className="flex-1 truncate">
                          <div className="text-sm font-medium">{bookmark.title}</div>
                          <div className="text-xs text-gray-500">Page {bookmark.pageNumber}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookmarks(prev => prev.filter(b => b.id !== bookmark.id));
                            setIsDirty(true);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* PDF Viewer */}
          <div 
            className={`flex-1 overflow-auto p-4 flex justify-center ${activeTool ? 'cursor-text' : ''}`}
            onMouseUp={handleTextSelection}
            ref={textLayerContainerRef}
          >
            <div className="bg-white shadow-md" style={{ transform: `rotate(${rotation}deg)` }}>
              <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                }
              >
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale}
                  className="border"
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={
                    <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  }
                />
              </Document>
              
              {/* Note Popover */}
              {activeAnnotation && activeAnnotation.type === ANNOTATION_TYPES.NOTE && (
                <div 
                  className="absolute bg-white border rounded shadow-lg z-10 w-64"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="p-3 border-b">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Add Note</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setActiveAnnotation(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="mb-2 text-sm text-gray-600 p-2 bg-gray-50 rounded">
                      "{activeAnnotation.text}"
                    </div>
                    <Textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Add your note here..."
                      className="mb-2"
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveAnnotation(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddNote}
                        disabled={!noteContent.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar - Notes */}
          {showNotes && (
            <div className="w-80 bg-white border-l flex flex-col">
              <div className="p-3 border-b">
                <h3 className="font-medium flex items-center">
                  <Type className="h-4 w-4 mr-2" />
                  Notes & Highlights
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="notes" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="highlights">Highlights</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="notes" className="flex-1 overflow-y-auto p-0 m-0">
                    {notes.length === 0 ? (
                      <div className="text-center text-sm text-gray-500 py-8">
                        No notes yet. Highlight text and select 'Add Note' to create one.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notes
                          .filter(note => note.pageNumber === pageNumber)
                          .map(note => (
                            <div key={note.id} className="p-3 hover:bg-gray-50 group">
                              <div className="flex justify-between items-start">
                                <div className="text-sm text-gray-500 mb-1">
                                  Page {note.pageNumber}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  onClick={() => deleteNote(note.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-sm font-medium mb-1">
                                "{note.text}"
                              </div>
                              <div className="text-sm text-gray-700">
                                {note.note}
                              </div>
                              <div className="mt-2 text-xs text-gray-400">
                                {new Date(note.updatedAt || note.createdAt).toLocaleString()}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="highlights" className="flex-1 overflow-y-auto p-0 m-0">
                    {annotations.length === 0 ? (
                      <div className="text-center text-sm text-gray-500 py-8">
                        No highlights yet. Select text and choose a color to highlight.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {annotations
                          .filter(ann => ann.pageNumber === pageNumber && ann.type === ANNOTATION_TYPES.HIGHLIGHT)
                          .map(ann => (
                            <div 
                              key={ann.id} 
                              className="p-3 hover:bg-gray-50 group cursor-pointer"
                              onClick={() => {
                                // Scroll to highlight
                                const highlight = document.querySelector(`[data-highlight-id="${ann.id}"]`);
                                if (highlight) {
                                  highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  // Flash the highlight
                                  highlight.classList.add('animate-pulse');
                                  setTimeout(() => highlight.classList.remove('animate-pulse'), 2000);
                                }
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div 
                                  className="inline-block px-1 rounded text-sm"
                                  style={{
                                    backgroundColor: ann.color,
                                    color: ann.textColor || '#000',
                                  }}
                                >
                                  {ann.text}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteAnnotation(ann.id);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              {ann.note && (
                                <div className="mt-1 text-sm text-gray-700">
                                  {ann.note}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
        
        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t text-sm text-gray-500">
          <div>
            {isLoading ? 'Loading...' : `Page ${pageNumber} of ${numPages || '--'}`}
          </div>
          <div>
            {scale > 0 && `${Math.round(scale * 100)}%`}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PDFViewer;