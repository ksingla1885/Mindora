'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  FileText,
  LayoutGrid,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Filter,
  Download,
  Calendar,
  BarChart3,
  Settings as SettingsIcon,
  HelpCircle,
  PlayCircle,
  TrendingUp,
  Library,
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
  CalendarClock,
  History,
  CreditCard,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import Link from 'next/link';

import { TestForm } from './_components/test-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function TestsManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTests = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/tests');
      const data = await res.json();
      if (data.success) {
        setTests(data.data.map(t => ({
          id: t.id,
          name: t.title,
          olympiad: t.olympiad?.name || 'N/A',
          duration: `${t.durationMinutes} mins`,
          type: t.isPaid ? 'PAID' : 'FREE',
          subject: t.subject || 'General',
          class: t.categories?.[0] || 'N/A',
          date: t.startTime ? new Date(t.startTime).toLocaleDateString() : 'N/A',
          time: t.startTime ? new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          price: t.price ? `₹${t.price}` : 'Free',
          status: t.isPublished ? (new Date(t.endTime) < new Date() ? 'Completed' : (new Date(t.startTime) <= new Date() ? 'LIVE' : 'Scheduled')) : 'Draft',
          participants: t._count?.attempts || 0,
          participantsTrend: null
        })));
      }
    } catch (error) {
      console.error('Failed to fetch tests', error);
      toast({
        title: 'Error',
        description: 'Failed to load tests.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const stats = [
    { label: 'Total Tests', value: tests.length.toString(), trend: 'Updated just now', trendUp: null, icon: Library, color: 'text-primary' },
    { label: 'Active Now', value: tests.filter(t => t.status === 'LIVE').length.toString(), trend: 'Currently live', trendUp: null, icon: PlayCircle, color: 'text-emerald-500', isLive: true },
    { label: 'Upcoming', value: tests.filter(t => t.status === 'Scheduled').length.toString(), trend: 'Next 7 days', trendUp: null, icon: CalendarClock, color: 'text-amber-500' },
    { label: 'Completed', value: tests.filter(t => t.status === 'Completed').length.toString(), trend: 'Past tests', trendUp: null, icon: CheckCircle2, color: 'text-purple-500' }
  ];

  return (
    <div className="flex h-full bg-background dark:bg-background-dark text-foreground">
      {/* Page Specific Sidebar */}
      <aside className="w-64 border-r border-border bg-card dark:bg-surface-dark flex flex-col pt-4 hidden lg:flex shrink-0">
        <div className="px-6 py-4 flex flex-col gap-1">
          <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2 ml-2">Tests Management</h3>
          <NavButton icon={LayoutGrid} label="Dashboard" active />
          <NavButton icon={FileText} label="All Tests" />
          <NavButton icon={MonitorPlay} label="Live Tests" />
          <NavButton icon={CalendarClock} label="Scheduled" />
          <NavButton icon={CreditCard} label="Paid Tests" />
          <NavButton icon={History} label="Archives" />
        </div>

        <div className="mt-8 px-6">
          <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-4 ml-2">Quick Actions</h3>
          <div className="flex flex-col gap-3">
            <Button className="w-full justify-start gap-2 bg-primary hover:bg-blue-600 font-bold h-11">
              <Plus className="size-4" /> Create New Test
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 border-border h-11 font-bold">
              <Download className="size-4" /> Export Reports
            </Button>
          </div>
        </div>

        <div className="mt-auto p-6">
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
            <p className="text-xs font-bold text-primary mb-1">Olympiad Season</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">System load is currently high due to active mock rounds.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <header className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border bg-card/30 backdrop-blur-sm shrink-0">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground">Tests Management</h1>
            <p className="text-muted-foreground">Manage, schedule, and monitor olympiad tests across the platform.</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-4 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search tests..."
                className="h-11 pl-11 rounded-xl bg-card border-border focus:ring-4 ring-primary/10 font-medium"
              />
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-blue-700 text-white font-bold h-11 px-6 shadow-lg shadow-primary/20 shrink-0">
                  <Plus className="size-5 mr-2" /> Create Test
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Test</DialogTitle>
                </DialogHeader>
                <TestForm onSuccess={() => {
                  setIsCreateModalOpen(false);
                  fetchTests();
                }} />
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth no-scrollbar">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card p-6 rounded-2xl border border-border shadow-sm group hover:border-primary/50 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("p-2 rounded-xl bg-opacity-10", stat.color.replace('text-', 'bg-'))}>
                    <stat.icon className={cn("size-6", stat.color)} />
                  </div>
                  {stat.trend && (
                    <Badge variant="secondary" className={cn(
                      "font-bold text-[10px] px-2 py-0.5",
                      stat.isLive ? "bg-emerald-500/10 text-emerald-500 animate-pulse border-emerald-500/20" : "bg-primary/5 text-primary border-none"
                    )}>
                      {stat.isLive && <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5" />}
                      {stat.trend}
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-black mt-1 text-foreground">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Table Toolbar */}
          <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <select className="h-10 rounded-xl border-none bg-muted/50 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 cursor-pointer outline-none transition-all">
                <option>All Types</option>
                <option>Paid</option>
                <option>Free</option>
              </select>
              <select className="h-10 rounded-xl border-none bg-muted/50 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 cursor-pointer outline-none transition-all">
                <option>Subject</option>
                <option>Math</option>
                <option>Science</option>
              </select>
              <select className="h-10 rounded-xl border-none bg-muted/50 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 cursor-pointer outline-none transition-all">
                <option>Status</option>
                <option>Live</option>
                <option>Scheduled</option>
                <option>Draft</option>
              </select>
              <div className="h-8 w-px bg-border mx-1 hidden lg:block" />
              <Button variant="outline" className="h-10 rounded-xl border-border font-bold gap-2 bg-card">
                <Calendar className="size-4" /> Date Range
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="h-10 rounded-xl font-bold gap-2 text-muted-foreground hover:text-foreground">
                <Download className="size-4" /> Export
              </Button>
              <Button variant="ghost" disabled className="h-10 rounded-xl font-bold gap-2 text-muted-foreground opacity-50">
                <Layers className="size-4" /> Bulk Actions
              </Button>
            </div>
          </div>

          {/* Test Table */}
          {tests.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-20">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-6 bg-muted/30 rounded-full mb-6">
                  <FileText className="size-16 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No tests created yet</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Start creating olympiad tests for your students. Click "Create Test" to get started.
                </p>
                <Button className="gap-2 bg-primary hover:bg-blue-600 text-white font-bold shadow-lg shadow-primary/20">
                  <Plus className="size-5" />
                  Create Your First Test
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="p-5 w-10"><input type="checkbox" className="rounded border-border" /></th>
                      <th className="p-5">Test Details</th>
                      <th className="p-5">Meta & Subject</th>
                      <th className="p-5">Schedule</th>
                      <th className="p-5">Price</th>
                      <th className="p-5 text-center">Status</th>
                      <th className="p-5 text-right">Participants</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tests.map((test, i) => (
                      <motion.tr
                        key={test.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/tests/${test.id}`)}
                      >
                        <td className="p-5"><input type="checkbox" className="rounded border-border" /></td>
                        <td className="p-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground group-hover:text-primary transition-colors">{test.name}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{test.olympiad} • {test.duration}</span>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <Badge className={cn(
                              "text-[10px] font-black border-none px-2",
                              test.type === 'PAID' ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"
                            )}>{test.type}</Badge>
                            <span className="text-xs font-bold text-foreground/80">{test.subject}</span>
                            <span className="text-xs text-muted-foreground font-medium">• {test.class}</span>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground/90">{test.date}</span>
                            {test.time && <span className="text-[10px] text-muted-foreground font-medium">{test.time}</span>}
                          </div>
                        </td>
                        <td className="p-5 font-black text-sm">{test.price}</td>
                        <td className="p-5 text-center">
                          <Badge className={cn(
                            "font-black text-[10px] border-none px-3 py-1",
                            test.status === 'LIVE' ? "bg-emerald-500/10 text-emerald-500 animate-pulse border border-emerald-500/20" :
                              test.status === 'Scheduled' ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" :
                                "bg-muted text-muted-foreground border border-border"
                          )}>
                            {test.status === 'LIVE' && <span className="size-1.5 rounded-full bg-emerald-500 mr-2" />}
                            {test.status}
                          </Badge>
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-foreground">{test.participants}</span>
                            {test.participantsTrend && <span className={cn("text-[9px] font-bold", test.status === 'LIVE' ? "text-emerald-500" : "text-muted-foreground")}>{test.participantsTrend}</span>}
                          </div>
                        </td>
                        <td className="p-5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="size-5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-1 rounded-2xl">
                              <DropdownMenuItem className="gap-2 rounded-xl scale-95 hover:scale-100 transition-transform cursor-pointer">
                                <BarChart3 className="size-4 text-primary" /> <span>Analytics</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 rounded-xl scale-95 hover:scale-100 transition-transform cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/admin/tests/${test.id}`);
                                }}
                              >
                                <Edit className="size-4 text-emerald-500" /> <span>Manage Questions</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 rounded-xl scale-95 hover:scale-100 transition-transform cursor-pointer text-red-500 focus:text-red-500">
                                <Trash2 className="size-4" /> <span>Suspend Test</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-5 border-t border-border flex items-center justify-between bg-muted/10">
                <p className="text-xs text-muted-foreground font-bold">Showing <span className="text-foreground">0 to 0</span> of 0 results</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="rounded-xl font-bold h-9">Previous</Button>
                  <Button size="sm" className="rounded-xl font-black bg-primary size-9 p-0">1</Button>
                  <Button variant="ghost" size="sm" className="rounded-xl font-bold size-9 p-0">2</Button>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold h-9">Next</Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div >
    </div >
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
