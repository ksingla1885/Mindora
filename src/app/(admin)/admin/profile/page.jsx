'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
    Clock,
    Edit,
    AlertTriangle,
    Camera,
    Mail,
    BadgeCheck,
    Lock,
    LogOut,
    Smartphone,
    Shield,
    Check,
    Download,
    LogIn,
    PlusCircle,
    Settings,
    ChevronDown,
    Monitor
} from 'lucide-react';

export default function AdminProfilePage() {
    const { data: session, status } = useSession();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch complete user data from database
    useEffect(() => {
        const fetchUserData = async () => {
            if (session?.user?.email) {
                try {
                    const response = await fetch(`/api/user/profile?email=${encodeURIComponent(session.user.email)}`);
                    if (response.ok) {
                        const data = await response.json();
                        setUserData(data);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                } finally {
                    setLoading(false);
                }
            } else if (status !== 'loading') {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [session, status]);

    // Use fetched data or fall back to session data
    const adminName = userData?.name || session?.user?.name || 'Admin User';
    const adminEmail = userData?.email || session?.user?.email || 'admin@mindora.com';
    const adminRole = userData?.role || session?.user?.role || 'ADMIN';
    const adminImage = userData?.image || session?.user?.image || null;

    // Format role for display
    const displayRole = adminRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin';

    // Get initials for avatar fallback
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const initials = getInitials(adminName);

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-background">
                <div className="text-muted-foreground">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full overflow-hidden bg-background text-foreground font-display selection:bg-primary selection:text-white">
            <style jsx global>{`
        /* Custom scrollbar for better aesthetics */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground) / 0.3);
            border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-y-auto relative bg-muted/10 w-full">
                <div className="max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
                    {/* Header Section */}
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-foreground tracking-tight text-[32px] font-bold leading-tight">Profile</h1>
                            <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
                                <Clock className="w-[18px] h-[18px]" />
                                <p>Account created: {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</p>
                            </div>
                        </div>
                        <button className="flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary hover:bg-primary/90 transition-colors text-primary-foreground text-sm font-bold leading-normal tracking-[0.015em] shadow-sm">
                            <Edit className="w-[18px] h-[18px] mr-2" />
                            <span>Edit Profile</span>
                        </button>
                    </header>

                    {/* Warning Banner */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded-lg p-4 flex items-start md:items-center gap-4">
                        <div className="bg-orange-100 dark:bg-orange-800/40 text-orange-600 dark:text-orange-400 rounded-full p-2 shrink-0">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                                <h3 className="text-orange-900 dark:text-orange-200 font-medium text-sm">Incomplete Security Setup</h3>
                                <p className="text-orange-700 dark:text-orange-300 text-sm mt-0.5">Two-factor authentication is recommended for Super Admin accounts.</p>
                            </div>
                            <button className="text-orange-700 dark:text-orange-300 text-sm font-bold hover:underline whitespace-nowrap">Enable Now →</button>
                        </div>
                    </div>

                    {/* Profile Header Card */}
                    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                        <div className="relative h-32 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20"></div>
                        <div className="px-6 pb-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-12">
                                <div className="relative">
                                    {adminImage ? (
                                        <div className="bg-center bg-no-repeat bg-cover rounded-full w-32 h-32 border-4 border-card shadow-md bg-muted" style={{ backgroundImage: `url("${adminImage}")` }}></div>
                                    ) : (
                                        <div className="rounded-full w-32 h-32 border-4 border-card shadow-md bg-primary/10 flex items-center justify-center">
                                            <span className="text-4xl font-bold text-primary">{initials}</span>
                                        </div>
                                    )}
                                    <button className="absolute bottom-2 right-2 bg-card text-muted-foreground hover:text-foreground rounded-full p-1.5 shadow-sm border border-border hover:bg-muted transition-colors">
                                        <Camera className="w-[18px] h-[18px] block" />
                                    </button>
                                </div>
                                <div className="flex-1 mb-2">
                                    <div className="flex flex-wrap items-center gap-3 mb-1">
                                        <h2 className="text-foreground text-2xl font-bold">{adminName}</h2>
                                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary text-xs font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800">{displayRole}</span>
                                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground text-base">
                                        <Mail className="w-[18px] h-[18px]" />
                                        <span>{adminEmail}</span>
                                        <BadgeCheck className="w-[18px] h-[18px] text-primary" title="Verified" />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3 w-full md:w-auto mt-4 md:mt-0">
                                    <button className="flex-1 md:flex-none h-10 px-4 bg-muted hover:bg-muted/80 rounded-lg text-foreground text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                        <Lock className="w-5 h-5" />
                                        Change Password
                                    </button>
                                    <button className="flex-1 md:flex-none h-10 px-4 bg-card border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                        <LogOut className="w-5 h-5" />
                                        Logout All
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Personal Information */}
                        <div className="xl:col-span-2 bg-card rounded-xl shadow-sm border border-border flex flex-col h-full">
                            <div className="p-6 border-b border-border">
                                <h3 className="text-foreground text-lg font-bold">Personal Information</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-foreground text-sm font-medium">Full Name</label>
                                    <input className="h-10 px-4 rounded-lg border border-input bg-background text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" type="text" defaultValue={adminName} />
                                </div>
                                <div className="flex flex-col gap-2 opacity-70">
                                    <label className="text-foreground text-sm font-medium flex items-center gap-1">
                                        Email Address <Lock className="w-[14px] h-[14px]" />
                                    </label>
                                    <input className="h-10 px-4 rounded-lg border border-input bg-muted text-muted-foreground text-sm cursor-not-allowed" disabled type="email" defaultValue={adminEmail} />
                                </div>
                                <div className="flex flex-col gap-2 opacity-70">
                                    <label className="text-foreground text-sm font-medium flex items-center gap-1">
                                        Role <Lock className="w-[14px] h-[14px]" />
                                    </label>
                                    <input className="h-10 px-4 rounded-lg border border-input bg-muted text-muted-foreground text-sm cursor-not-allowed" disabled type="text" defaultValue={displayRole} />
                                </div>
                                <div className="flex flex-col gap-2 opacity-70">
                                    <label className="text-foreground text-sm font-medium flex items-center gap-1">
                                        User ID <Lock className="w-[14px] h-[14px]" />
                                    </label>
                                    <input className="h-10 px-4 rounded-lg border border-input bg-muted text-muted-foreground text-sm cursor-not-allowed font-mono text-xs" disabled type="text" defaultValue={userData?.id || 'N/A'} />
                                </div>
                            </div>
                        </div>

                        {/* Notification Preferences */}
                        <div className="xl:col-span-1 bg-card rounded-xl shadow-sm border border-border flex flex-col h-full">
                            <div className="p-6 border-b border-border">
                                <h3 className="text-foreground text-lg font-bold">Notification Preferences</h3>
                            </div>
                            <div className="p-6 flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-foreground text-sm font-bold">Email Notifications</p>
                                        <p className="text-muted-foreground text-xs">Receive daily summaries</p>
                                    </div>
                                    {/* Toggle On */}
                                    <button className="w-11 h-6 bg-primary rounded-full relative cursor-pointer transition-colors">
                                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm transition-transform"></div>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-foreground text-sm font-bold">In-app Alerts</p>
                                        <p className="text-muted-foreground text-xs">Dashboard popups</p>
                                    </div>
                                    {/* Toggle Off */}
                                    <button className="w-11 h-6 bg-muted rounded-full relative cursor-pointer transition-colors hover:bg-muted/80">
                                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm transition-transform"></div>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between opacity-60">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-foreground text-sm font-bold flex items-center gap-1">
                                            Security Alerts <Lock className="w-[14px] h-[14px]" />
                                        </p>
                                        <p className="text-muted-foreground text-xs">Critical updates (Required)</p>
                                    </div>
                                    <button className="w-11 h-6 bg-primary/50 rounded-full relative cursor-not-allowed" disabled>
                                        <div className="w-4 h-4 bg-white/90 rounded-full absolute top-1 right-1 shadow-sm"></div>
                                    </button>
                                </div>
                                <div className="h-px bg-border my-2"></div>
                                <a className="text-primary text-sm font-bold hover:underline" href="#">Manage all notifications</a>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Security Settings */}
                        <div className="xl:col-span-2 bg-card rounded-xl shadow-sm border border-border flex flex-col">
                            <div className="p-6 border-b border-border flex justify-between items-center">
                                <h3 className="text-foreground text-lg font-bold">Security Settings</h3>
                                <span className="text-xs font-medium px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Good Standing</span>
                            </div>
                            <div className="p-6 flex flex-col gap-6">
                                {/* Password & 2FA Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                                        <div className="flex items-center justify-between mb-2">
                                            <Lock className="text-muted-foreground w-6 h-6" />
                                            <span className="text-xs text-muted-foreground">Last: 30 days ago</span>
                                        </div>
                                        <p className="text-sm font-bold mb-1 text-foreground">Password</p>
                                        <p className="text-xs text-muted-foreground mb-3">Strong password set</p>
                                        <button className="text-xs font-bold text-primary border border-primary/20 bg-card px-3 py-1.5 rounded hover:bg-primary/5 transition-colors">Update</button>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                                        <div className="flex items-center justify-between mb-2">
                                            <Smartphone className="text-orange-500 w-6 h-6" />
                                            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                                        </div>
                                        <p className="text-sm font-bold mb-1 text-foreground">2-Step Verification</p>
                                        <p className="text-xs text-muted-foreground mb-3">Currently disabled</p>
                                        <div className="flex items-center gap-2">
                                            <button className="w-9 h-5 bg-muted-foreground/30 rounded-full relative cursor-pointer hover:bg-muted-foreground/40 transition-colors">
                                                <div className="w-3 h-3 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
                                            </button>
                                            <span className="text-xs font-bold text-muted-foreground">Off</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Active Sessions */}
                                <div className="flex flex-col gap-4">
                                    <h4 className="text-sm font-bold text-foreground">Active Sessions</h4>
                                    {/* Empty State */}
                                    <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-border bg-muted/30">
                                        <Monitor className="w-12 h-12 text-muted-foreground/30 mb-3" />
                                        <p className="text-sm font-medium text-muted-foreground">No active sessions tracked</p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">Session tracking not yet implemented</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Audit & Visibility */}
                        <div className="xl:col-span-1 bg-card rounded-xl shadow-sm border border-border flex flex-col h-full">
                            <div className="p-6 border-b border-border">
                                <h3 className="text-foreground text-lg font-bold">Access & Audit</h3>
                            </div>
                            <div className="p-6 flex flex-col gap-4">
                                <div className="p-4 bg-muted/50 rounded-lg border border-border mb-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Current Access Level</p>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Shield className="text-primary w-6 h-6" />
                                        <span className="text-lg font-bold text-foreground">{displayRole}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">Full access to all settings, user management, content creation, and financial logs.</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm font-bold text-foreground mb-1">Permissions Summary</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Check className="text-emerald-500 w-[18px] h-[18px]" />
                                        Manage Users & Roles
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Check className="text-emerald-500 w-[18px] h-[18px]" />
                                        Edit Billing Configuration
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Check className="text-emerald-500 w-[18px] h-[18px]" />
                                        Create & Publish Tests
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Check className="text-emerald-500 w-[18px] h-[18px]" />
                                        View Detailed Analytics
                                    </div>
                                </div>
                                <a className="mt-auto text-center text-sm font-bold text-primary hover:text-primary/80 py-2" href="#">View detailed policy</a>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="bg-card rounded-xl shadow-sm border border-border flex flex-col">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h3 className="text-foreground text-lg font-bold">Admin Activity Log</h3>
                        </div>
                        {/* Empty State */}
                        <div className="flex flex-col items-center justify-center p-12">
                            <div className="p-6 bg-muted/30 rounded-full mb-4">
                                <LogIn className="w-12 h-12 text-muted-foreground/30" />
                            </div>
                            <h4 className="text-lg font-bold text-foreground mb-2">No activity logs yet</h4>
                            <p className="text-muted-foreground text-center max-w-md">
                                Activity logging is not yet implemented. Once enabled, you'll see login history, profile changes, and administrative actions here.
                            </p>
                        </div>
                    </div>
                    <div className="h-8"></div> {/* Bottom Spacer */}
                </div>
            </main>
        </div>
    );
}
