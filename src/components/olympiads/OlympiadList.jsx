'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Calendar,
    Users,
    ChevronRight,
    Search,
    Filter,
    CheckCircle2,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToast } from '@/components/ui/use-toast';

export default function OlympiadList() {
    const [olympiads, setOlympiads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');
    const [registeringId, setRegisteringId] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchOlympiads();
    }, []);

    const fetchOlympiads = async () => {
        try {
            const res = await fetch('/api/olympiads');
            const data = await res.json();
            if (data.success) {
                setOlympiads(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch olympiads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (olympiadId) => {
        setRegisteringId(olympiadId);
        try {
            const res = await fetch('/api/olympiads/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ olympiadId }),
            });
            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Registration Successful",
                    description: data.message,
                    variant: "default",
                });
                // Update local state
                setOlympiads(prev => prev.map(o =>
                    o.id === olympiadId ? { ...o, isRegistered: true, participantCount: (o.participantCount || 0) + 1 } : o
                ));
            } else {
                toast({
                    title: "Registration Failed",
                    description: data.error || "Something went wrong",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to connect to server",
                variant: "destructive",
            });
        } finally {
            setRegisteringId(null);
        }
    };

    const filteredOlympiads = olympiads.filter(o => {
        const matchesSearch = o.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'All' || o.description?.toLowerCase().includes(filter.toLowerCase());
        return matchesSearch && matchesFilter;
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Loading competitions...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        className="w-full pl-10 pr-4 py-2 bg-card border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto no-scrollbar">
                    {['All', 'Science', 'Math', 'Language', 'Tech'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                filter === f
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-card border text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {filteredOlympiads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOlympiads.map((olympiad) => (
                        <motion.div
                            key={olympiad.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -5 }}
                            className="group relative bg-card border rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden"
                        >
                            {/* Background Glow */}
                            <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                            <div className="mb-4 flex items-center justify-between">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                    <Trophy className="h-6 w-6" />
                                </div>
                                {olympiad.isRegistered && (
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1 rounded-full dark:bg-green-900/20 dark:text-green-400">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Enrolled
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">{olympiad.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10">
                                {olympiad.description || "Challenge yourself against the brightest minds in this prestigious competition."}
                            </p>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-sm text-foreground/80">
                                    <Calendar className="h-4 w-4 text-primary/60" />
                                    <span>{new Date(olympiad.startDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-foreground/80">
                                    <Users className="h-4 w-4 text-primary/60" />
                                    <span>{olympiad.participantCount || 0} Registered</span>
                                </div>
                            </div>

                            <button
                                disabled={olympiad.isRegistered || registeringId === olympiad.id}
                                onClick={() => handleRegister(olympiad.id)}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm",
                                    olympiad.isRegistered
                                        ? "bg-muted text-muted-foreground cursor-default"
                                        : "bg-primary text-white hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
                                )}
                            >
                                {registeringId === olympiad.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : olympiad.isRegistered ? (
                                    "Registered"
                                ) : (
                                    <>
                                        Enroll Now
                                        <ChevronRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border border-dashed">
                    <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-1">No Olympiads Found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
                </div>
            )}
        </div>
    );
}
