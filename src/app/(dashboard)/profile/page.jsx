'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Edit,
    ChevronRight,
    School,
    Star,
    Target,
    Calendar,
    Medal,
    Trophy,
    Zap,
    Calculator,
    Lock,
    FileQuestion,
    BarChart,
    Crosshair,
    User,
    History,
    Book,
    FlaskConical,
    Award,
    Download,
    LogOut,
    Trash2,
    Ghost,
    Shield,
    CreditCard,
    Activity,
    Save,
    X,
    GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/cn';

// --- Tab Configuration ---
const TABS = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'progress', label: 'Progress', icon: Activity },
    { id: 'purchases', label: 'Purchases', icon: CreditCard },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'security', label: 'Security', icon: Shield },
];

export default function ProfilePage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState('account');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        class: '10', // Default
        role: 'Student',
        bio: '',
        school: '',
        subjects: {
            math: false,
            physics: false,
            chemistry: false,
            biology: false
        },
        language: 'English'
    });

    useEffect(() => {
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                name: session.user.name || '',
                email: session.user.email || '',
                class: session.user.class || '10',
                role: session.user.role || 'Student',
            }));
        }
    }, [session]);

    const handleSave = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setLoading(false);
        setIsEditing(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'account':
                return (
                    <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Account Details Form */}
                        <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="border-b border-border px-6 py-4 flex justify-between items-center bg-muted/20">
                                <div>
                                    <h3 className="font-bold text-foreground flex items-center gap-2">
                                        Personal Information
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">Manage your personal details and preferences.</p>
                                </div>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-colors border",
                                        isEditing
                                            ? "bg-muted text-foreground border-border hover:bg-muted/80"
                                            : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
                                        "cursor-pointer"
                                    )}
                                >
                                    {isEditing ? <X className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
                                    {isEditing ? 'Cancel' : 'Edit Details'}
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                        <input
                                            className="w-full rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed text-foreground transition-all"
                                            type="text"
                                            value={formData.name}
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Class / Grade</label>
                                        <div className="relative">
                                            <select
                                                className="w-full rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed text-foreground appearance-none transition-all"
                                                value={formData.class}
                                                disabled={!isEditing}
                                                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                            >
                                                <option value="9">Class 9</option>
                                                <option value="10">Class 10</option>
                                                <option value="11">Class 11</option>
                                                <option value="12">Class 12</option>
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-muted-foreground">School (Optional)</label>
                                        <input
                                            className="w-full rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed text-foreground transition-all"
                                            placeholder="Enter school name"
                                            type="text"
                                            value={formData.school}
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-muted-foreground">Preferred Subjects</label>
                                        <div className="w-full rounded-lg border border-input bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground italic flex items-center justify-between">
                                            <span>No subjects available to select.</span>
                                            <Lock className="w-3 h-3 opacity-50" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Language</label>
                                        <div className="relative">
                                            <select
                                                className="w-full rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed text-foreground appearance-none transition-all"
                                                value={formData.language}
                                                disabled={!isEditing}
                                                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                            >
                                                <option value="English">English</option>
                                                <option value="Hindi">Hindi</option>
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {isEditing && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex justify-end pt-4 border-t border-border"
                                    >
                                        <button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
                                        >
                                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </section>
                    </div>
                );

            case 'progress':
                return (
                    <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Performance Stats */}
                        <section>
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <BarChart className="w-5 h-5 text-primary" />
                                Performance Snapshot
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Tests Attempted', value: '0', icon: FileQuestion, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                    { label: 'Avg Score', value: '--', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                    { label: 'Accuracy', value: '--', icon: Crosshair, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                    { label: 'Global Rank', value: '--', icon: Trophy, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-card p-5 rounded-xl border border-border/60 shadow-sm flex flex-col items-center text-center hover:border-primary/30 transition-colors group cursor-pointer">
                                        <div className={cn("p-2 rounded-full mb-3 transition-transform group-hover:scale-110 duration-300", stat.bg)}>
                                            <stat.icon className={cn("w-5 h-5", stat.color)} />
                                        </div>
                                        <div className="text-3xl font-black text-foreground tracking-tight">{stat.value}</div>
                                        <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Achievements */}
                            <section className="bg-card rounded-xl border border-border shadow-sm p-6 h-full flex flex-col">
                                <h4 className="font-bold text-foreground mb-6 flex items-center gap-2">
                                    <Medal className="text-yellow-500 w-5 h-5" />
                                    Achievements
                                </h4>
                                <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-lg border border-dashed border-border flex-1">
                                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-background mb-3 shadow-sm">
                                        <Trophy className="w-8 h-8 text-muted-foreground/40" />
                                    </div>
                                    <p className="text-sm text-foreground font-medium">No achievements yet</p>
                                    <p className="text-xs text-muted-foreground">Complete tests to earn badges!</p>
                                </div>
                            </section>

                            {/* Activity History */}
                            <section className="bg-card rounded-xl border border-border shadow-sm p-6 h-full flex flex-col">
                                <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
                                    <History className="text-blue-500 w-5 h-5" />
                                    Recent Activity
                                </h3>
                                <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-lg border border-dashed border-border flex-1 min-h-[160px]">
                                    <Ghost className="w-10 h-10 text-muted-foreground/40 mb-3" />
                                    <p className="text-sm font-medium text-foreground">No recent activity</p>
                                    <a href="/dashboard" className="mt-3 text-xs font-bold text-primary hover:underline uppercase tracking-wide">
                                        Start Learning →
                                    </a>
                                </div>
                            </section>
                        </div>
                    </div>
                );

            case 'purchases':
                return (
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden text-center">
                            <div className="p-12 flex flex-col items-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                    <CreditCard className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">No Active Plans</h3>
                                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                    You haven't purchased any premium courses or test series yet.
                                </p>
                                <button className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-transform active:scale-95 shadow-lg shadow-primary/25 cursor-pointer">
                                    Browse Courses
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'certificates':
                return (
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                                <h3 className="font-bold text-foreground flex items-center gap-2">
                                    <Award className="w-5 h-5 text-orange-500" />
                                    Your Certificates
                                </h3>
                                <span className="text-xs bg-background border border-border px-2 py-1 rounded-md font-mono text-muted-foreground">0 Earned</span>
                            </div>
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 border-4 border-background shadow-sm">
                                    <GraduationCap className="w-10 h-10 text-muted-foreground/50" />
                                </div>
                                <h4 className="text-lg font-medium text-foreground mb-2">No certificates found</h4>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                    Complete courses with a passing grade to earn verifyable certificates.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-red-500/20">
                                <h3 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Danger Zone
                                </h3>
                                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">Actions here are irreversible or affect account access.</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-background/50 rounded-lg border border-red-500/10">
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">Sign Out Everywhere</h4>
                                        <p className="text-xs text-muted-foreground mt-1">Log out of all other active sessions.</p>
                                    </div>
                                    <button className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-background border border-border hover:bg-accent text-foreground rounded-lg text-sm font-medium transition-colors cursor-pointer">
                                        <LogOut className="w-4 h-4" /> Sign Out All
                                    </button>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                                    <div>
                                        <h4 className="text-sm font-bold text-red-600 dark:text-red-400">Delete Account</h4>
                                        <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">Permanently remove your account and data.</p>
                                    </div>
                                    <button className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer">
                                        <Trash2 className="w-4 h-4" /> Delete Account
                                    </button>
                                </div>
                            </div>
                            <div className="bg-red-500/10 px-6 py-3 text-[10px] text-center text-red-600/60 dark:text-red-400/60 border-t border-red-500/10">
                                Authorized access only.
                            </div>
                        </div>

                        <div className="mt-8 text-center text-xs text-muted-foreground">
                            <p>Need help? <a href="#" className="underline hover:text-primary">Contact Support</a></p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 font-display min-h-screen pb-20 animate-fade-in">
            {/* Header: Breadcrumbs & Identity */}
            <header className="space-y-6">
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <a className="hover:text-primary transition-colors" href="/dashboard">Dashboard</a>
                    <ChevronRight className="w-4 h-4" />
                    <span className="font-medium text-foreground">Profile</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-6 bg-card/60 backdrop-blur-md border border-border/60 p-6 rounded-2xl shadow-sm">
                    <div className="relative group shrink-0 cursor-pointer">
                        <div
                            className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-background shadow-lg bg-cover bg-center bg-no-repeat bg-muted"
                            style={{ backgroundImage: `url('${session?.user?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuB8zOZvOk8d-60WQklueHeXlYxeKqrL1OLAaxMMCR6LCB5TIZP-4BW3GMhApzFxjGGO4Pr9mrc7q-Z_HDkoDUNSiEgsHrKEEeYXpGuPhwe99eYP4q1uXIiQYo7RG66E7AjyVeOk7MIkFtXCd94MuTvjM_djHNR4WS2Gp-Ke8Szs3TVSbByfqWGcxqNN89NUqhDhltJqmpWU_fUXVvY1zBCO1bEZze-3aDMMdmuF9ll1cSQv8GjjZcw3QNu1L5yojuYFv4UfWnqmqgTj"}')` }}
                        />
                        <div className="absolute -bottom-1 -right-1 bg-green-500 border-4 border-card w-6 h-6 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                    </div>

                    <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{formData.name || 'Student'}</h1>
                            <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-semibold border border-blue-500/20">
                                <School className="w-3 h-3" />
                                Beginner
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm">{formData.email || 'student@example.com'}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground pt-2">
                            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                                <Star className="w-3.5 h-3.5 text-yellow-500" />
                                <span>Class {formData.class}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                <span>Joined Recently</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="sticky top-2 z-30">
                <nav className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-full p-1.5 shadow-lg max-w-fit md:max-w-none mx-auto overflow-x-auto no-scrollbar flex items-center gap-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 outline-none select-none whitespace-nowrap",
                                activeTab === tab.id
                                    ? "text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                "cursor-pointer"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary rounded-full shadow-md"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <tab.icon className={cn("relative z-10 w-4 h-4", activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground")} />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <main>
                {renderContent()}
            </main>
        </div>
    );
}
