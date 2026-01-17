'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Upload as CloudUpload,
    FileText,
    MoreVertical,
    Trash2,
    PlayCircle,
    RefreshCw,
    CheckCircle2,
    Youtube,
    Loader2,
    CalendarDays
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/cn';
import { toast } from 'react-hot-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Mapping of Classes to allowed Subjects
const CLASS_SUBJECT_MAPPING = {
    "Class 9": ["Mathematics", "Science"],
    "Class 10": ["Mathematics", "Science"],
    "Class 11": ["Physics", "Chemistry", "Mathematics", "Astronomy"],
    "Class 12": ["Physics", "Chemistry", "Mathematics", "Astronomy"]
};

export default function ContentManagementPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeUploads, setActiveUploads] = useState([]);

    // Data State
    const [contentItems, setContentItems] = useState([]);
    const [topics, setTopics] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filter Logic for Add Modal
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newContent, setNewContent] = useState({
        title: '',
        description: '',
        topicId: '',
        topicName: '',
        type: 'video', // 'video' or 'pdf'
        source: 'upload', // 'upload' or 'youtube'
        url: '',
        file: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Derived State - Get subjects for selected class
    const filteredSubjects = selectedClass ? CLASS_SUBJECT_MAPPING[selectedClass] || [] : [];

    // Stats
    const stats = [
        {
            label: 'Total Items',
            value: contentItems?.length || 0,
            trend: 'Items in library',
            trendUp: true,
            icon: CheckCircle2
        },
        {
            label: 'Video Lessons',
            value: contentItems?.filter(c => c.type?.toLowerCase().includes('video') || c.type === 'YouTube').length || 0,
            trend: 'Active videos',
            trendUp: true,
            icon: PlayCircle
        }
    ];

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [contentRes, subjectsRes] = await Promise.all([
                fetch('/api/content'),
                fetch('/api/subjects')
            ]);

            const contentData = await contentRes.json();
            const subjectsData = await subjectsRes.json();

            if (contentData.success) setContentItems(contentData.data);
            if (subjectsData.success) setSubjects(subjectsData.data);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load content library.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setNewContent({ ...newContent, file: e.target.files[0] });
        }
    };

    const handleClassChange = (val) => {
        setSelectedClass(val);
        setSelectedSubject(''); // Reset subject when class changes
        setTopics([]); // Clear topics
        setNewContent({ ...newContent, topicId: '', topicName: '' }); // Reset topic
    };

    const handleSubjectChange = async (val) => {
        setSelectedSubject(val);
        setNewContent({ ...newContent, topicId: '', topicName: '' }); // Reset topic when subject changes

        // Fetch topics for this subject
        if (val) {
            try {
                // Try finding exact match or Class-specific match
                let subjectObj = subjects.find(s => s.name === val);
                if (!subjectObj && selectedClass) {
                    subjectObj = subjects.find(s => s.name === `${val} (${selectedClass})`);
                }

                if (subjectObj) {
                    const response = await fetch(`/api/topics?subjectId=${subjectObj.id}`);
                    const data = await response.json();
                    if (data.success) {
                        setTopics(data.data);
                    }
                } else {
                    console.warn(`Subject not found for: ${val} in class ${selectedClass}`);
                    setTopics([]);
                    toast.error(`Subject '${val}' not found in database for ${selectedClass}.`);
                }
            } catch (error) {
                console.error('Error fetching topics:', error);
                toast.error('Failed to load topics');
            }
        } else {
            setTopics([]);
        }
    };

    const handleSubmit = async () => {
        // Debug Toast to confirm button click
        console.log("Submit clicked");

        if (!newContent.title) {
            toast.error("Title is required.");
            return;
        }
        if (!selectedClass) {
            toast.error("Class is required.");
            return;
        }
        if (!selectedSubject) {
            toast.error("Subject is required.");
            return;
        }

        // Resolve Topic ID from Name
        let finalTopicId = newContent.topicId;
        const topicName = newContent.topicName?.trim();

        if (!finalTopicId && topicName) {
            // Try finding in current topics list (Exact Match)
            let topicObj = topics.find(t => t.name.toLowerCase() === topicName.toLowerCase());

            if (topicObj) {
                finalTopicId = topicObj.id;
            } else {
                // 3. Auto-Create Topic
                try {
                    // Find Subject ID
                    let subjectObj = subjects.find(s => s.name.toLowerCase() === selectedSubject.trim().toLowerCase());

                    if (!subjectObj) {
                        // Debugging and Fallback: fetch subjects if not found in state
                        console.log("Subject missing in state, attempting fetch for:", selectedSubject);
                        const subRes = await fetch('/api/subjects');
                        const subData = await subRes.json();
                        if (subData.success) {
                            setSubjects(subData.data); // Update state for future use
                            subjectObj = subData.data.find(s => s.name.toLowerCase() === selectedSubject.trim().toLowerCase());
                        }
                    }

                    if (!subjectObj) {
                        toast.error(`Subject '${selectedSubject}' not found in database. Cannot create topic.`);
                        setIsSubmitting(false);
                        return;
                    }

                    const createRes = await fetch('/api/topics', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: topicName, subjectId: subjectObj.id })
                    });

                    if (createRes.ok) {
                        const newTopicData = await createRes.json();
                        finalTopicId = newTopicData.data.id;
                        toast.success(`Created new topic: ${topicName}`);
                    } else {
                        const err = await createRes.json();
                        throw new Error(err.error || "Failed to create topic");
                    }
                } catch (e) {
                    console.error(e);
                    toast.error("Failed to create new topic automatically.");
                    setIsSubmitting(false);
                    return;
                }
            }
        }

        if (!finalTopicId) {
            toast.error("Please enter a topic name.");
            setIsSubmitting(false);
            return;
        }

        if (newContent.source === 'upload' && !newContent.file) {
            toast.error("Please select a file to upload.");
            return;
        }

        if (newContent.source === 'youtube' && !newContent.url) {
            toast.error("Please enter a valid URL.");
            return;
        }

        setIsSubmitting(true);

        try {
            if (newContent.source === 'upload') {
                // Handle File Upload
                const formData = new FormData();
                formData.append('file', newContent.file);
                formData.append('title', newContent.title);
                formData.append('description', newContent.description);
                formData.append('topicId', finalTopicId);
                formData.append('contentType', newContent.type === 'video' ? 'video/mp4' : 'application/pdf');
                formData.append('isFree', 'true');
                formData.append('class', selectedClass);

                // Fake progress for UI
                const uploadId = Date.now();
                setActiveUploads(prev => [...prev, {
                    id: uploadId,
                    name: newContent.file.name,
                    progress: 0,
                    size: (newContent.file.size / (1024 * 1024)).toFixed(2) + ' MB',
                    current: '0 MB',
                    time: 'Calculating...'
                }]);

                const interval = setInterval(() => {
                    setActiveUploads(prev => prev.map(u =>
                        u.id === uploadId ? { ...u, progress: Math.min(u.progress + 10, 90) } : u
                    ));
                }, 500);

                const response = await fetch('/api/content/upload', {
                    method: 'POST',
                    body: formData,
                });

                clearInterval(interval);
                setActiveUploads(prev => prev.filter(u => u.id !== uploadId));

                if (!response.ok) {
                    let errorMessage = 'Upload failed';
                    try {
                        const error = await response.json();
                        errorMessage = error.details || error.error || 'Upload failed';
                        console.error("Upload API Error (JSON):", error);
                    } catch (e) {
                        const text = await response.text();
                        console.error("Upload API Error (Text):", text);
                        errorMessage = `Server Error: ${response.status} ${response.statusText}`;
                    }
                    throw new Error(errorMessage);
                }

                toast.success("File uploaded successfully.");

            } else {
                // Handle Link Submission (YouTube/External)
                const metadata = { class: selectedClass };

                const response = await fetch('/api/content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: newContent.title,
                        description: newContent.description,
                        topicId: finalTopicId,
                        type: 'YouTube',
                        url: newContent.url,
                        provider: 'youtube',
                        metadata
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Submission failed');
                }

                toast.success("Content added successfully.");
            }

            // Reset and Refresh
            setIsAddModalOpen(false);
            setNewContent({
                title: '',
                description: '',
                topicName: '',
                topicId: '',
                type: 'video',
                source: 'upload',
                url: '',
                file: null
            });
            setSelectedClass('');
            setSelectedSubject('');
            fetchData();

        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to add content.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this content?")) return;

        try {
            const response = await fetch(`/api/content/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success("Content removed.");
                setContentItems(prev => prev.filter(i => i.id !== id));
            } else {
                throw new Error("Delete failed");
            }
        } catch (e) {
            toast.error("Could not delete content.");
        }
    };

    return (
        <div className="flex h-full bg-background dark:bg-background-dark text-foreground">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card dark:bg-surface-dark flex flex-col pt-4 hidden lg:flex shrink-0">
                <div className="px-6">
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full h-12 mb-6 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 rounded-xl"
                    >
                        <Plus className="size-5 mr-2" />
                        New Content
                    </Button>

                    <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-4 ml-2">Upload Status</h3>

                    {/* Active Uploads */}
                    <div className="space-y-4">
                        {activeUploads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                                <CloudUpload className="size-8 text-muted-foreground/30 mb-2" />
                                <p className="text-[10px] text-muted-foreground">No active uploads</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeUploads.map(upload => (
                                    <div key={upload.id} className="bg-muted/30 p-3 rounded-xl border border-border">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[11px] font-bold truncate max-w-[120px]">{upload.name}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground">{upload.progress}%</p>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-1">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${upload.progress}%` }}
                                                className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(19,127,236,0.5)]"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-auto p-6 space-y-4">
                    <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-2">Quick Stats</h3>
                    <div className="grid gap-3">
                        {stats.map(stat => (
                            <div key={stat.label} className="bg-muted/30 p-3 rounded-xl border border-border">
                                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">{stat.label}</p>
                                <div className="flex items-end justify-between">
                                    <p className="text-sm font-black">{stat.value}</p>
                                    {stat.trend && (
                                        <span className={cn("text-[9px] font-bold", stat.trendUp ? "text-emerald-500" : "text-muted-foreground")}>
                                            {stat.trend}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
                <header className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border bg-card/30 backdrop-blur-sm">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-foreground">Content Library</h1>
                        <p className="text-muted-foreground">Manage educational videos and reading materials.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefresh}
                            className={cn("border-border bg-card", isRefreshing && "animate-spin")}
                        >
                            <RefreshCw className="size-4" />
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="size-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* Filters (Simplified for now) */}
                            <div className="mb-8 flex gap-4 overflow-x-auto pb-2">
                                <Input
                                    placeholder="Search content..."
                                    className="max-w-xs bg-muted/50 border-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Content Grid */}
                            {contentItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="p-6 bg-muted/30 rounded-full mb-6">
                                        <FileText className="size-16 text-muted-foreground/30" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">No content yet</h3>
                                    <p className="text-muted-foreground max-w-md mb-6">
                                        Start building your library by uploading videos and PDFs.
                                    </p>
                                    <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 bg-primary">
                                        <Plus className="size-5" />
                                        Add Your First Content
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                                    {contentItems
                                        .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((item, i) => (
                                            <ContentCard
                                                key={item.id}
                                                item={item}
                                                index={i}
                                                onDelete={() => handleDelete(item.id)}
                                            />
                                        ))}
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Add Content Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[600px] border-border bg-card">
                    <DialogHeader>
                        <DialogTitle>Add New Content</DialogTitle>
                        <DialogDescription>
                            Upload a file or add a link to an external resource.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Title */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">Title</Label>
                            <Input
                                id="title"
                                value={newContent.title}
                                onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                                className="col-span-3 bg-muted/50"
                            />
                        </div>

                        {/* Class Dropdown - New */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="class" className="text-right">Class</Label>
                            <Select
                                value={selectedClass}
                                onValueChange={handleClassChange}
                            >
                                <SelectTrigger className="col-span-3 bg-muted/50 cursor-pointer">
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Class 9">Class 9</SelectItem>
                                    <SelectItem value="Class 10">Class 10</SelectItem>
                                    <SelectItem value="Class 11">Class 11</SelectItem>
                                    <SelectItem value="Class 12">Class 12</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Subject Dropdown - Filtered */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="subject" className="text-right">Subject</Label>
                            <Select
                                value={selectedSubject}
                                onValueChange={handleSubjectChange}
                                disabled={!selectedClass}
                            >
                                <SelectTrigger className="col-span-3 bg-muted/50 cursor-pointer">
                                    <SelectValue placeholder={selectedClass ? "Select Subject" : "Select Class first"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredSubjects.length > 0 ? (
                                        filteredSubjects.map(subjectName => (
                                            <SelectItem key={subjectName} value={subjectName}>
                                                {subjectName}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-xs text-center text-muted-foreground">
                                            {selectedClass ? "No subjects found for class" : "Select Class first"}
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Topic Selection - Dropdown */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="topic" className="text-right">Topic</Label>
                            <Select
                                value={newContent.topicId}
                                onValueChange={(val) => {
                                    const selectedTopic = topics.find(t => String(t.id) === val);
                                    setNewContent({
                                        ...newContent,
                                        topicId: val,
                                        topicName: selectedTopic ? selectedTopic.name : ''
                                    });
                                }}
                                disabled={!selectedSubject || topics.length === 0}
                            >
                                <SelectTrigger className="col-span-3 bg-muted/50 cursor-pointer">
                                    <SelectValue placeholder={
                                        !selectedSubject ? "Select Subject first" :
                                            topics.length === 0 ? "No topics available" :
                                                "Select Topic"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    {topics.map(topic => (
                                        <SelectItem key={topic.id} value={String(topic.id)}>
                                            {topic.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Type</Label>
                            <Select
                                value={newContent.type}
                                onValueChange={(val) => setNewContent({ ...newContent, type: val })}
                            >
                                <SelectTrigger className="col-span-3 bg-muted/50 cursor-pointer">
                                    <SelectValue placeholder="Content Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="pdf">PDF Document</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Tabs defaultValue="upload" className="w-full" onValueChange={(val) => setNewContent({ ...newContent, source: val })}>
                            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                                <TabsTrigger value="upload">Upload File</TabsTrigger>
                                <TabsTrigger value="youtube">External Link</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upload" className="space-y-4 pt-4 border rounded-lg p-4 mt-2 border-dashed border-border">
                                <div className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                                    <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                        <CloudUpload className="size-8 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Click to select file</span>
                                        {newContent.file && <span className="text-xs font-bold text-primary">{newContent.file.name}</span>}
                                    </Label>
                                    <Input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        accept={newContent.type === 'video' ? "video/*" : "application/pdf"}
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </TabsContent>
                            <TabsContent value="youtube" className="pt-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="url">Resource URL</Label>
                                    <Input
                                        id="url"
                                        placeholder={newContent.type === 'video' ? "https://youtube.com/..." : "https://example.com/file.pdf"}
                                        value={newContent.url}
                                        onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                                        className="bg-muted/50"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right pt-2">Description</Label>
                            <Textarea
                                id="description"
                                value={newContent.description}
                                onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                                className="col-span-3 bg-muted/50 min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="cursor-pointer">Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="cursor-pointer">
                            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {newContent.source === 'upload' ? 'Upload Content' : 'Add Link'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ContentCard({ item, index, onDelete }) {
    const isVideo = item.type?.toLowerCase().includes('video') || item.type === 'YouTube';
    const isYoutube = item.type === 'YouTube';
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : null;
    const itemClass = item.metadata?.class;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
        >
            {/* Thumbnail Area */}
            <div className="relative aspect-video bg-muted overflow-hidden">
                {item.thumbnailUrl ? (
                    <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/50">
                        {isVideo ? (
                            isYoutube ? <Youtube className="size-12 text-red-600/50" /> : <PlayCircle className="size-12 text-primary/30" />
                        ) : (
                            <FileText className="size-12 text-primary/30" />
                        )}
                    </div>
                )}

                {/* Type Badges */}
                <div className="absolute top-3 left-3 flex gap-2 z-10">
                    <Badge className={cn(
                        "text-[10px] font-black tracking-tighter uppercase px-2 py-0.5 border-none shadow-sm",
                        isYoutube ? "bg-red-600 text-white" :
                            item.provider === 's3' ? "bg-blue-500 text-white" :
                                "bg-emerald-500 text-white"
                    )}>
                        {isYoutube ? 'YouTube' : isVideo ? 'Video' : 'PDF'}
                    </Badge>
                </div>
            </div>

            {/* Body Area */}
            <div className="p-5 flex flex-col flex-1 gap-4">
                <div className="flex justify-between items-start gap-3">
                    <h3 className="font-bold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
                        {item.title}
                    </h3>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
                                <MoreVertical className="size-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl">
                            <DropdownMenuItem onClick={onDelete} className="gap-2 rounded-lg cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10">
                                <Trash2 className="size-4" />
                                <span>Delete Item</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-2">
                    {itemClass && (
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border-none">
                            {itemClass}
                        </Badge>
                    )}
                    {item.topic?.subject?.name && (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border-none">
                            {item.topic.subject.name}
                        </Badge>
                    )}
                    {item.topic?.name && (
                        <Badge variant="secondary" className="bg-muted text-foreground text-[10px] font-bold border-none">
                            {item.topic.name}
                        </Badge>
                    )}
                </div>

                {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                )}

                {/* Date */}
                <div className="mt-auto pt-3 border-t border-border flex items-center gap-2 text-[10px] text-muted-foreground">
                    {date && (
                        <>
                            <CalendarDays className="size-3" />
                            <span>Added {date}</span>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
