'use client';

import { useState } from 'react';
import {
    Cloud,
    Plus,
    Search,
    Bell,
    Upload as CloudUpload,
    Film,
    FileText,
    LayoutGrid,
    MoreVertical,
    Edit,
    Trash2,
    PlayCircle,
    Eye,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Video,
    File as FileIcon,
    HardDrive,
    BarChart3,
    Settings as SettingsIcon,
    X,
    History,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/cn';

export default function ContentManagementPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeUploads, setActiveUploads] = useState([]);

    const stats = [
        { label: 'Storage', value: '0 GB', trend: 'No data', trendUp: null, icon: HardDrive },
        { label: 'Total Items', value: '0', trend: 'No files', trendUp: null, icon: CheckCircle2 }
    ];

    const contentItems = [];

    const [editingId, setEditingId] = useState(null);

    return (
        <div className="flex h-full bg-background dark:bg-background-dark text-foreground">
            {/* Page Specific Sidebar - "Convert navbar to sidebar" requirement */}
            <aside className="w-64 border-r border-border bg-card dark:bg-surface-dark flex flex-col pt-4 hidden lg:flex shrink-0">
                <div className="px-6 py-4 flex flex-col gap-1">
                    <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2 ml-2">Content Navigation</h3>
                    <NavButton icon={LayoutGrid} label="Dashboard" />
                    <NavButton icon={FileIcon} label="Content" active />
                    <NavButton icon={BarChart3} label="Analytics" />
                    <NavButton icon={SettingsIcon} label="Settings" />
                </div>

                <div className="mt-8 px-6">
                    <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-4 ml-2">Upload Media</h3>
                    <div className="flex flex-col gap-4">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 py-8 text-center cursor-pointer hover:border-primary/50 transition-colors group"
                        >
                            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <CloudUpload className="size-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground">Click or Drag</p>
                                <p className="text-[10px] text-muted-foreground mt-1">MP4, MOV, PDF (500MB)</p>
                            </div>
                        </motion.div>

                        {/* Active Uploads */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-foreground">Active Uploads</h4>
                                <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px] border-none px-2 py-0">0</Badge>
                            </div>
                            {activeUploads.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <CloudUpload className="size-8 text-muted-foreground/30 mb-2" />
                                    <p className="text-[10px] text-muted-foreground">No active uploads</p>
                                </div>
                            )}
                            {activeUploads.map(upload => (
                                <div key={upload.id} className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-[11px] font-bold truncate max-w-[120px]">{upload.name}</p>
                                        <p className="text-[10px] font-mono text-muted-foreground">{upload.progress}%</p>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${upload.progress}%` }}
                                            className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(19,127,236,0.5)]"
                                        />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground">{upload.current} / {upload.size} • {upload.time} remaining</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Stats in Sidebar */}
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

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
                <header className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border bg-card/30 backdrop-blur-sm">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-foreground">Content Management</h1>
                        <p className="text-muted-foreground">Manage your video and PDF library, upload new files, and organize by subject.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="gap-2 border-border bg-card">
                            <RefreshCw className="size-4" />
                            Sync S3
                        </Button>
                        <Button className="gap-2 bg-primary hover:bg-blue-600 text-white font-bold shadow-lg shadow-primary/20">
                            <Plus className="size-5" />
                            New Content
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                    {/* Library Controls */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
                        <div className="flex flex-1 gap-3 overflow-x-auto pb-1 no-scrollbar">
                            <select className="h-10 rounded-xl border-none bg-muted/50 px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer outline-none">
                                <option>All Types</option>
                                <option>Video</option>
                                <option>PDF Document</option>
                            </select>
                            <select className="h-10 rounded-xl border-none bg-muted/50 px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer outline-none">
                                <option>All Subjects</option>
                                <option>Mathematics</option>
                                <option>Physics</option>
                                <option>Chemistry</option>
                                <option>Literature</option>
                            </select>
                            <select className="h-10 rounded-xl border-none bg-muted/50 px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer outline-none">
                                <option>Difficulty</option>
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-4">
                            <span className="text-xs font-bold text-muted-foreground uppercase">Sort:</span>
                            <button className="flex items-center gap-1 text-sm font-bold text-primary group">
                                Date Added
                                <ChevronRight className="size-4 rotate-90 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Content Grid */}
                    {contentItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="p-6 bg-muted/30 rounded-full mb-6">
                                <FileText className="size-16 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No content yet</h3>
                            <p className="text-muted-foreground max-w-md mb-6">
                                Start building your library by uploading videos and PDFs. Click "New Content" to get started.
                            </p>
                            <Button className="gap-2 bg-primary hover:bg-blue-600 text-white font-bold shadow-lg shadow-primary/20">
                                <Plus className="size-5" />
                                Add Your First Content
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                            {contentItems.map((item, i) => (
                                <ContentCard key={item.id} item={item} index={i} isEditing={editingId === item.id} onEdit={() => setEditingId(item.id)} onCancel={() => setEditingId(null)} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex justify-center mt-12 mb-8">
                        <div className="flex gap-1 p-1.5 bg-card border border-border rounded-2xl shadow-sm">
                            <Button size="icon" variant="ghost" className="rounded-xl"><ChevronLeft className="size-5" /></Button>
                            <Button size="icon" variant="ghost" className="rounded-xl bg-primary text-white font-bold hover:bg-primary/90">1</Button>
                            <Button size="icon" variant="ghost" className="rounded-xl font-bold">2</Button>
                            <Button size="icon" variant="ghost" className="rounded-xl font-bold">3</Button>
                            <Button size="icon" variant="ghost" className="rounded-xl"><ChevronRight className="size-5" /></Button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function NavButton({ icon: Icon, label, active = false }) {
    return (
        <button className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
            active
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}>
            <Icon className="size-5" />
            {label}
        </button>
    );
}

function ContentCard({ item, index, isEditing, onEdit, onCancel }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "group flex flex-col bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 relative",
                isEditing ? "ring-2 ring-primary shadow-2xl scale-[1.02] z-10" : "hover:shadow-xl hover:border-primary/30"
            )}
        >
            {isEditing && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl z-20 shadow-lg">
                    EDITING MODE
                </div>
            )}

            {/* Thumbnail Area */}
            <div className="relative aspect-video bg-muted overflow-hidden">
                {item.thumbnail ? (
                    <img
                        src={item.thumbnail}
                        alt={item.title}
                        className={cn("w-full h-full object-cover transition-transform duration-700 group-hover:scale-110", isEditing && "opacity-30")}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/50">
                        <FileText className={cn("size-12 text-primary/30 group-hover:scale-110 transition-transform duration-500", isEditing && "opacity-20")} />
                    </div>
                )}

                {/* Type Badges */}
                <div className="absolute top-3 left-3 flex gap-2 z-10">
                    <Badge className={cn(
                        "text-[10px] font-black tracking-tighter uppercase px-2 py-0.5 border-none shadow-sm",
                        item.type === 'YouTube' ? "bg-red-600 text-white" :
                            item.type === 'S3' ? "bg-orange-500 text-white" :
                                "bg-blue-500 text-white"
                    )}>
                        {item.type === 'YouTube' ? <PlayCircle className="size-3 mr-1" /> : item.type === 'S3' ? <Cloud className="size-3 mr-1" /> : <FileText className="size-3 mr-1" />}
                        {item.type}
                    </Badge>
                </div>

                {item.duration && (
                    <div className="absolute bottom-3 right-3 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-mono rounded-lg">
                        {item.duration}
                    </div>
                )}

                {/* Hover Actions */}
                {!isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            className="size-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl"
                        >
                            {item.type === 'PDF' ? <Eye className="size-6" /> : <PlayCircle className="size-7" />}
                        </motion.button>
                    </div>
                )}
            </div>

            {/* Body Area */}
            <div className="p-5 flex flex-col flex-1 gap-4">
                {isEditing ? (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Title</label>
                            <Input defaultValue={item.title} className="bg-muted/50 border-none font-bold text-sm h-9" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Subject</label>
                                <select className="w-full bg-muted/50 border-none rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-1 ring-primary/50">
                                    <option>{item.subject}</option>
                                    <option>Physics</option>
                                    <option>Literature</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Class</label>
                                <select className="w-full bg-muted/50 border-none rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-1 ring-primary/50">
                                    <option>{item.class}</option>
                                    <option>Class 11</option>
                                    <option>Class 12</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button size="sm" className="flex-1 bg-primary font-bold">Save Changes</Button>
                            <Button size="sm" variant="outline" onClick={onCancel} className="flex-1 font-bold border-border">Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <>
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
                                    <DropdownMenuItem onClick={onEdit} className="gap-2 rounded-lg cursor-pointer">
                                        <Edit className="size-4 text-emerald-500" />
                                        <span>Quick Edit</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer">
                                        <History className="size-4 text-blue-500" />
                                        <span>View Logs</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10">
                                        <Trash2 className="size-4" />
                                        <span>Delete Item</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border-none">{item.subject}</Badge>
                            <Badge variant="secondary" className="bg-muted text-foreground text-[10px] font-bold border-none">{item.class}</Badge>
                            <Badge variant="secondary" className={cn(
                                "text-[10px] font-bold border-none",
                                item.difficulty === 'Easy' ? "bg-emerald-500/10 text-emerald-600" :
                                    item.difficulty === 'Hard' ? "bg-red-500/10 text-red-600" :
                                        "bg-amber-500/10 text-amber-600"
                            )}>{item.difficulty}</Badge>
                        </div>

                        <div className="mt-auto pt-4 border-t border-border flex justify-between items-center bg-muted/20 -mx-5 -mb-5 p-4">
                            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                <History className="size-3" />
                                Added {item.addedAt}
                            </span>
                            <div className="flex gap-1">
                                <button onClick={onEdit} className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all">
                                    <Edit className="size-4" />
                                </button>
                                <button className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all">
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}
