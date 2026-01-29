'use client';

import Link from 'next/link'; // Added Link
import { useState, useEffect, useCallback } from 'react';
import { PaidTestForm } from './_components/paid-test-form';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
    Plus,
    Search,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    MoreVertical,
    Edit,
    Trash2,
    Download,
    Tag,
    Clock,
    CheckCircle,
    IndianRupee,
    Package,
    Zap,
    Calendar,
    Percent,
    X,
    Bell,
    Lock,
    AlertCircle,
    BarChart3,
    Eye,
    Settings as SettingsIcon,
    List, // Added List icon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

export default function PaidTestsManagementPage() {
    const [selectedTest, setSelectedTest] = useState(null);

    // Converted to state
    const [stats, setStats] = useState([
        { label: 'Total Paid Tests', value: '0', trend: 'No tests', trendUp: null, icon: Package, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
        { label: 'Active Paid Tests', value: '0', trend: 'None', trendUp: null, icon: Zap, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
        { label: 'Total Revenue', value: '₹0', trend: 'No sales', trendUp: null, icon: IndianRupee, color: 'text-emerald-500', highlighted: false, bgColor: 'bg-emerald-500/10' },
        { label: 'Revenue (Month)', value: '₹0', trend: 'No data', trendUp: null, icon: Calendar, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
        { label: 'Conversion Rate', value: '0%', trend: 'No data', trendUp: null, icon: Percent, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    ]);

    const { toast } = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [tests, setTests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    // Edit & Delete State
    const [editingTest, setEditingTest] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [testToDelete, setTestToDelete] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = async (testId) => {
        try {
            const res = await fetch(`/api/tests/${testId}`);
            const data = await res.json();
            if (data.success) {
                const t = data.data;
                setEditingTest({
                    ...t,
                    startTime: t.startTime ? new Date(t.startTime) : undefined,
                    endTime: t.endTime ? new Date(t.endTime) : undefined,
                });
                setIsEditModalOpen(true);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load test details.',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async () => {
        if (!testToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/tests/${testToDelete.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast({ title: 'Success', description: 'Test deleted successfully.' });
                setIsDeleteOpen(false);
                fetchTests();
            } else {
                throw new Error(data.error || 'Failed to delete');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete test.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const fetchTests = useCallback(async () => {
        try {
            setIsLoading(true);

            const params = new URLSearchParams();
            params.append('isPaid', 'true');
            if (selectedClass) params.append('class', selectedClass);
            if (selectedSubject) params.append('subject', selectedSubject);

            const res = await fetch(`/api/tests?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                const fetchedTests = data.data;

                // Calculate Stats
                const totalTests = fetchedTests.length;
                const activeTests = fetchedTests.filter(t => t.isPublished && (!t.startTime || new Date(t.startTime) <= new Date())).length;
                const totalRevenue = fetchedTests.reduce((acc, t) => acc + ((t.participantCount || 0) * (t.price || 0)), 0);

                // Update Stats State
                setStats(prevStats => {
                    const newStats = [...prevStats];
                    newStats[0].value = totalTests.toString();
                    newStats[0].trend = `${totalTests} total`;

                    newStats[1].value = activeTests.toString();
                    newStats[1].trend = `${activeTests} live`;

                    newStats[2].value = `₹${totalRevenue.toLocaleString()}`;
                    newStats[2].trend = 'Lifetime';

                    return newStats;
                });

                setTests(fetchedTests.map(t => ({
                    id: t.id,
                    title: t.title,
                    subject: t.subject || 'General',
                    olympiad: t.olympiad?.name || 'N/A',
                    price: t.price ? `₹${t.price}` : 'Free',
                    originalPrice: null,
                    discount: 'No Discount',
                    status: t.isPublished ? (t.startTime && new Date(t.startTime) > new Date() ? 'Scheduled' : 'Live') : 'Draft',
                    purchases: t.participantCount || 0,
                    revenue: `₹${((t.participantCount || 0) * (t.price || 0)).toLocaleString()}`,
                    todayPurchases: 0,
                    startTime: t.startTime ? new Date(t.startTime).toLocaleDateString() : 'N/A',
                    selected: false
                })));
            }
        } catch (error) {
            console.error('Failed to fetch tests', error);
            toast({
                title: 'Error',
                description: 'Failed to load paid tests.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [selectedClass, selectedSubject, toast]);

    useEffect(() => {
        fetchTests();
    }, [fetchTests]);

    const handleRowClick = async (test) => {
        try {
            // First set basic details to show drawer immediately
            setSelectedTest(test);

            // Then fetch detailed analytics
            const res = await fetch(`/api/tests/${test.id}`);
            const data = await res.json();

            if (data.success) {
                // Merge new data with existing basic data
                setSelectedTest(prev => ({
                    ...prev,
                    ...data.data,
                    salesVelocity: data.data.salesVelocity || [], // Expecting array of { date, count }
                    recentBuyers: data.data.recentBuyers || []
                }));
            }
        } catch (error) {
            console.error("Failed to fetch test details", error);
            toast({
                title: 'Error',
                description: 'Could not load detailed analytics.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:px-12 lg:py-8 scroll-smooth pb-24 md:pb-6 no-scrollbar">
                {/* ... existing header ... */}
                {/* Breadcrumbs & Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 md:mb-8">
                    {/* ... (keep existing header content) ... */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <span className="hidden md:inline">Dashboard</span>
                            <ChevronRight className="hidden md:inline size-4 text-emerald-500/50" />
                            <span className="font-bold text-foreground">Paid Tests</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black leading-tight tracking-tight text-foreground">Paid Tests Management</h1>
                        <p className="text-muted-foreground text-sm md:text-base font-normal max-w-2xl hidden sm:block">
                            Manage pricing, discounts, and revenue for all Olympiad tests in one place.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="hidden sm:flex rounded-lg border-border bg-card text-foreground">
                            <Bell className="size-5" />
                        </Button>
                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-black shadow-lg shadow-emerald-500/20 px-6 h-11 transition-all hover:scale-[1.02]">
                                    <Plus className="mr-2 size-5" />
                                    Create Paid Test
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Create New Paid Test</DialogTitle>
                                </DialogHeader>
                                <PaidTestForm onSuccess={() => {
                                    setIsCreateModalOpen(false);
                                    fetchTests();
                                }} />
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Edit Paid Test</DialogTitle>
                                </DialogHeader>
                                {editingTest && (
                                    <PaidTestForm
                                        test={editingTest}
                                        onSuccess={() => {
                                            setIsEditModalOpen(false);
                                            setEditingTest(null);
                                            fetchTests();
                                        }}
                                    />
                                )}
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Test</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                    <p>Are you sure you want to delete <b>{testToDelete?.title}</b>? This action cannot be undone.</p>
                                </div >
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
                                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </div >
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="mb-8 overflow-x-auto md:overflow-visible no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-5 gap-4 min-w-max md:min-w-0">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                    "bg-card rounded-2xl p-6 border border-border shadow-sm w-[260px] md:w-auto flex-shrink-0 transition-all hover:shadow-md cursor-pointer",
                                    stat.highlighted && "ring-2 ring-emerald-500/20 border-emerald-500/30"
                                )}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <p className="text-muted-foreground text-[11px] font-black uppercase tracking-widest">{stat.label}</p>
                                    <div className={cn("p-2 rounded-xl", stat.bgColor)}>
                                        <stat.icon className={cn("size-5", stat.color)} />
                                    </div>
                                </div>
                                <p className="text-3xl font-black tracking-tight text-foreground">{stat.value}</p>
                                <div className="flex items-center gap-1.5 mt-3">
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold",
                                        stat.trendUp ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                                    )}>
                                        {stat.trendUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                                        {stat.trend}
                                    </span>
                                    <span className="text-muted-foreground text-[10px] font-medium tracking-tight">vs last month</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="sticky top-0 z-10 bg-background pt-2 pb-4">
                    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                        <div className="w-full lg:w-auto flex-1">
                            <div className="flex gap-3 w-full items-center">
                                <div className="relative w-full sm:w-80 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-5 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input
                                        placeholder="Search test by name or ID..."
                                        className="w-full pl-11 h-11 bg-muted/50 border-border rounded-xl text-sm font-medium text-foreground focus:bg-background focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none"
                                    />
                                </div>
                                <div className="hidden lg:flex gap-3">
                                    <div className="relative">
                                        <select
                                            value={selectedClass}
                                            onChange={(e) => setSelectedClass(e.target.value)}
                                            className="h-11 px-4 bg-muted/50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground focus:bg-background focus:ring-2 focus:ring-emerald-500/10 outline-none cursor-pointer min-w-[100px] appearance-none"
                                        >
                                            <option value="">Class</option>
                                            <option value="9">Class 9</option>
                                            <option value="10">Class 10</option>
                                            <option value="11">Class 11</option>
                                            <option value="12">Class 12</option>
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            className="h-11 px-4 bg-muted/50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground focus:bg-background focus:ring-2 focus:ring-emerald-500/10 outline-none cursor-pointer min-w-[160px] appearance-none"
                                        >
                                            <option value="">Subject</option>
                                            <option value="Mathematics">Mathematics</option>
                                            <option value="Science">Science</option>
                                            <option value="Physics">Physics</option>
                                            <option value="Chemistry">Chemistry</option>
                                            <option value="Astronomy">Astronomy</option>
                                            <option value="English">English</option>
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <select className="h-11 px-4 bg-muted/50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground focus:bg-background focus:ring-2 focus:ring-emerald-500/10 outline-none cursor-pointer min-w-[160px] appearance-none">
                                            <option value="">Status</option>
                                            <option value="live">Live</option>
                                            <option value="draft">Draft</option>
                                            <option value="scheduled">Scheduled</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full lg:w-auto justify-end mt-2 lg:mt-0 border-t lg:border-t-0 border-border pt-3 lg:pt-0">
                            <Button variant="ghost" className="h-11 px-5 rounded-xl font-bold text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/5 cursor-pointer">
                                <Download className="size-4 mr-2" /> Export
                            </Button>
                            <Button className="h-11 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] px-6 rounded-xl hover:opacity-90 cursor-pointer">
                                <Tag className="size-4 mr-2" /> Bulk Discount
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tests Table */}
                {tests.length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl p-20">
                        {/* ... keep empty state ... */}
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="p-6 bg-muted/30 rounded-full mb-6">
                                <IndianRupee className="size-16 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No paid tests yet</h3>
                            <p className="text-muted-foreground max-w-md mb-6">
                                Start monetizing your olympiad tests. Create your first paid test to begin generating revenue.
                            </p>
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
                            >
                                <Plus className="size-5" />
                                Create First Paid Test
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto min-h-[400px]">
                            <table className="w-full text-left border-collapse min-w-[950px]">
                                <thead className="bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <tr>
                                        <th className="p-5 pl-8 w-12"><input type="checkbox" className="rounded border-border bg-background cursor-pointer" /></th>
                                        <th className="p-5">Test Details</th>
                                        <th className="p-5">Price Config</th>
                                        <th className="p-5 text-center">Status</th>
                                        <th className="p-5">Purchases</th>
                                        <th className="p-5">Revenue</th>
                                        <th className="p-5 text-right pr-8">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {tests.map((test, i) => (
                                        <tr
                                            key={test.id}
                                            onClick={() => handleRowClick(test)}
                                            className={cn(
                                                "group hover:bg-emerald-500/5 transition-all cursor-pointer",
                                                test.selected && "bg-emerald-500/[0.03] border-l-2 border-l-emerald-500"
                                            )}
                                        >
                                            {/* ... keep row content ... */}
                                            <td className="p-5 pl-8" onClick={(e) => e.stopPropagation()}>
                                                <input type="checkbox" checked={test.selected} readOnly className="rounded border-border text-emerald-500 focus:ring-emerald-500 bg-background cursor-pointer" />
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <p className="text-sm font-black text-foreground group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{test.title}</p>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                                                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{test.subject}</span>
                                                        <span className="opacity-30">•</span>
                                                        <span>{test.olympiad}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-base font-black text-foreground">{test.price}</span>
                                                        {test.originalPrice && <span className="text-xs text-muted-foreground line-through font-medium">{test.originalPrice}</span>}
                                                    </div>
                                                    <span className={cn("text-[9px] font-black uppercase tracking-tighter", test.discount.includes('OFF') ? "text-emerald-600" : "text-muted-foreground")}>
                                                        {test.discount}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-center">
                                                {test.status === 'Live' ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                                                        <Zap className="size-3 mr-1.5 animate-pulse fill-current" />
                                                        Live
                                                    </Badge>
                                                ) : test.status === 'Scheduled' ? (
                                                    <div className="flex flex-col items-center">
                                                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                                                            <Clock className="size-3 mr-1.5" />
                                                            Scheduled
                                                        </Badge>
                                                        <div className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">{test.startTime}</div>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 opacity-60">
                                                        Draft
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-foreground tracking-tight">{test.purchases} Units</span>
                                                    {test.status !== 'Draft' && (
                                                        <span className={cn(
                                                            "text-[9px] font-bold mt-0.5 uppercase tracking-tighter",
                                                            test.todayPurchases === 'Pre-book' ? "text-muted-foreground" : "text-emerald-600"
                                                        )}>
                                                            {test.todayPurchases}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 font-black text-base text-foreground tracking-tighter">{test.revenue}</td>
                                            <td className="p-5 pr-8 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={`/admin/tests/${test.id}`} passHref>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/5 transition-all"
                                                            title="Manage Questions"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <List className="size-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/5 transition-all">
                                                        <Eye className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-blue-500 hover:bg-blue-500/5 transition-all"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(test.id);
                                                        }}
                                                    >
                                                        <Edit className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTestToDelete(test);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Showing 0-0 of 0 tests</p>
                            <div className="flex gap-2">
                                <Button variant="outline" className="h-9 px-5 rounded-xl font-bold bg-card border-border hover:bg-muted text-foreground opacity-50">Previous</Button>
                                <Button variant="outline" className="h-9 px-5 rounded-xl font-bold bg-card border-border hover:bg-muted text-foreground">Next</Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Right Drawer - Details Sidebar */}
            <AnimatePresence>
                {selectedTest && (
                    <>
                        {/* ... keep overlay ... */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTest(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 z-50 w-full md:w-[450px] bg-card border-l border-border shadow-2xl flex flex-col h-full overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/10">
                                <div>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">
                                        {selectedTest.status === 'Scheduled' ? 'Scheduled Setup' : 'Full Overview'}
                                    </p>
                                    <h2 className="text-xl font-black text-foreground leading-tight uppercase tracking-tight">{selectedTest.title}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-muted-foreground">{selectedTest.subject}</span>
                                        <span className="size-1 rounded-full bg-border" />
                                        <span className="text-[10px] font-bold text-muted-foreground">{selectedTest.olympiad}</span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted" onClick={() => setSelectedTest(null)}>
                                    <X className="size-6 text-muted-foreground" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                                {/* ... keep buttons ... */}
                                <div className="flex gap-3">
                                    <Button className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-widest text-[11px] shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                                        Publish Changes
                                    </Button>
                                    <Button variant="outline" size="icon" className="size-12 rounded-xl group border-border bg-card text-foreground">
                                        <BarChart3 className="size-5 group-hover:text-emerald-500 transition-colors" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="size-12 rounded-xl group border-border bg-card text-foreground">
                                        <SettingsIcon className="size-5 group-hover:text-emerald-500 transition-colors" />
                                    </Button>
                                </div>

                                {/* Pricing Config Section */}
                                <div className="flex flex-col gap-4 p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03] relative overflow-hidden">
                                    {/* ... keep pricing section ... */}
                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                        <IndianRupee className="size-12 text-emerald-500" />
                                    </div>
                                    <div className="flex justify-between items-center relative z-10">
                                        <h3 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                                            <IndianRupee className="size-4 text-emerald-500" /> Pricing Matrix
                                        </h3>
                                        <Badge className="bg-emerald-500 text-black text-[9px] font-black uppercase px-2 border-none">Auto-Saved</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Base Rate (₹)</span>
                                            <Input defaultValue={String(selectedTest.price || '0').replace('₹', '')} className="h-10 px-4 bg-background font-black text-base border-emerald-500/20 focus:ring-emerald-500/10 rounded-xl text-foreground" />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Discount Mode</span>
                                            <select className="w-full h-10 px-4 bg-background border border-border rounded-xl text-[11px] font-bold uppercase tracking-widest text-foreground outline-none focus:ring-2 focus:ring-emerald-500/10 appearance-none">
                                                <option>No Discount</option>
                                                <option>Percentage %</option>
                                                <option>Flat Amount ₹</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-emerald-500/10 mt-2 relative z-10">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Calculated Price per Unit:</p>
                                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{selectedTest.price}</p>
                                    </div>
                                </div>

                                {/* Performance Chart Dynamic */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Sales Velocity</h3>
                                    <div className="h-36 w-full rounded-2xl bg-muted/30 border border-border relative overflow-hidden flex items-end justify-between px-3 pb-3">
                                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                                            <div className="h-full w-full bg-[radial-gradient(circle_at_center,var(--primary)_1px,transparent_1px)] bg-[size:20px_20px]" />
                                        </div>

                                        {/* Dynamic Bars */}
                                        {selectedTest.salesVelocity && selectedTest.salesVelocity.length > 0 ? (
                                            selectedTest.salesVelocity.map((day, i) => {
                                                const maxVal = Math.max(...selectedTest.salesVelocity.map(d => d.count)) || 1;
                                                const height = Math.max(10, Math.min(100, (day.count / maxVal) * 90)); // Scaled

                                                return (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${height}%` }}
                                                        className="w-[11%] flex flex-col items-center justify-end gap-1 group relative cursor-pointer"
                                                    >
                                                        <div
                                                            className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-lg shadow-sm group-hover:from-emerald-500 group-hover:to-emerald-300 transition-all"
                                                            style={{ height: '100%' }}
                                                        >
                                                            {/* Tooltip */}
                                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-xl z-20 whitespace-nowrap">
                                                                {day.count} Sales
                                                            </div>
                                                        </div>
                                                        <span className="text-[8px] font-bold text-muted-foreground uppercase">{day.date}</span>
                                                    </motion.div>
                                                );
                                            })
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                                No sales data available
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Buyers Section */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Live Feed (Recent)</h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {selectedTest.recentBuyers && selectedTest.recentBuyers.length > 0 ? (
                                            selectedTest.recentBuyers.map((buyer, idx) => (
                                                <BuyerRow key={idx} {...buyer} />
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <div className="p-4 bg-muted/30 rounded-full mb-4">
                                                    <IndianRupee className="size-10 text-muted-foreground/30" />
                                                </div>
                                                <p className="text-xs font-bold text-muted-foreground">No recent purchases</p>
                                                <p className="text-[10px] text-muted-foreground/60 mt-1">Buyer activity will appear here</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-8 flex justify-center opacity-30 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-muted border border-transparent hover:border-emerald-500/20 transition-all">
                                        <Lock className="size-3.5 text-emerald-500" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground">Enterprise Secured Checkout</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function BuyerRow({ initials, name, bg, text, amount, failed = false }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-muted/20 border border-transparent hover:border-border transition-all group">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm group-hover:scale-110 transition-transform", bg, text)}>
                {initials}
            </div>
            <div className="flex-1">
                <p className="text-xs font-black text-foreground uppercase tracking-tight">{name}</p>
                <p className="text-[10px] text-muted-foreground font-bold tracking-tight opacity-70">Success Tracking • Digital ID</p>
            </div>
            <div className="text-right">
                <p className={cn("text-xs font-black", failed ? "text-red-500" : "text-emerald-500")}>
                    {failed && <AlertCircle className="size-3 inline mr-1 mb-0.5" />}
                    {amount}
                </p>
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase">Verified</p>
            </div>
        </div>
    );
}
