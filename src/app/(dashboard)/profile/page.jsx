'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
    Ghost
} from 'lucide-react';
import { cn } from '@/lib/cn';

export default function ProfilePage() {
    const { data: session } = useSession();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        class: '10', // Default, but should ideally come from DB
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

    return (
        <div className="max-w-[1440px] w-full mx-auto p-4 md:p-8 animate-fade-in font-display">
            {/* Breadcrumbs & Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <a className="hover:text-primary transition-colors" href="/dashboard">Dashboard</a>
                    <ChevronRight className="w-4 h-4" />
                    <span className="font-medium text-slate-900 dark:text-white">Profile</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">My Profile</h1>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm shadow-blue-500/20"
                    >
                        <Edit className="w-[18px] h-[18px]" />
                        {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Profile Card (Sticky) */}
                <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-6">
                    {/* Profile Overview Card */}
                    <div className="bg-white dark:bg-[#1a2332] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                                <div
                                    className="size-20 rounded-full border-4 border-white dark:border-[#1a2332] bg-slate-200 bg-cover bg-center shadow-md bg-no-repeat"
                                    style={{ backgroundImage: `url('${session?.user?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuB8zOZvOk8d-60WQklueHeXlYxeKqrL1OLAaxMMCR6LCB5TIZP-4BW3GMhApzFxjGGO4Pr9mrc7q-Z_HDkoDUNSiEgsHrKEEeYXpGuPhwe99eYP4q1uXIiQYo7RG66E7AjyVeOk7MIkFtXCd94MuTvjM_djHNR4WS2Gp-Ke8Szs3TVSbByfqWGcxqNN89NUqhDhltJqmpWU_fUXVvY1zBCO1bEZze-3aDMMdmuF9ll1cSQv8GjjZcw3QNu1L5yojuYFv4UfWnqmqgTj"}')` }}
                                ></div>
                            </div>
                        </div>
                        <div className="pt-12 pb-6 px-6 text-center">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{formData.name || 'Student'}</h3>
                            <p className="text-slate-500 text-sm mb-3">{formData.email || 'student@example.com'}</p>
                            <div className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-indigo-100 dark:border-indigo-800">
                                <School className="w-[14px] h-[14px]" />
                                Beginner Level
                            </div>
                            <div className="space-y-3 text-left mt-2">
                                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 flex items-center gap-2"><Star className="w-[18px] h-[18px]" /> Class</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-200">{formData.class}th Grade</span>
                                </div>
                                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 flex items-center gap-2"><Target className="w-[18px] h-[18px]" /> Targets</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-200">Not Set</span>
                                </div>
                                <div className="flex items-center justify-between text-sm py-2">
                                    <span className="text-slate-500 flex items-center gap-2"><Calendar className="w-[18px] h-[18px]" /> Joined</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-200">Just Now</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Badges / Achievements Snapshot */}
                    <div className="bg-white dark:bg-[#1a2332] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Medal className="text-slate-400 w-[20px] h-[20px]" />
                            Achievements
                        </h4>
                        <div className="text-center py-6">
                            <div className="inline-flex items-center justify-center p-3 rounded-full bg-slate-50 dark:bg-slate-800 mb-2">
                                <Trophy className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">No achievements yet. Keep learning!</p>
                        </div>
                    </div>
                </div>

                {/* Middle Column: Main Content */}
                <div className="lg:col-span-6 space-y-8">
                    {/* Performance Stats */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Performance Snapshot</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-[#1a2332] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
                                <div className="text-slate-400 mb-1"><FileQuestion className="w-6 h-6" /></div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">0</div>
                                <div className="text-xs font-medium text-slate-500">Tests Attempted</div>
                            </div>
                            <div className="bg-white dark:bg-[#1a2332] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
                                <div className="text-slate-400 mb-1"><BarChart className="w-6 h-6" /></div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">--</div>
                                <div className="text-xs font-medium text-slate-500">Avg Score</div>
                            </div>
                            <div className="bg-white dark:bg-[#1a2332] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
                                <div className="text-slate-400 mb-1"><Crosshair className="w-6 h-6" /></div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">--</div>
                                <div className="text-xs font-medium text-slate-500">Accuracy</div>
                            </div>
                            <div className="bg-white dark:bg-[#1a2332] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
                                <div className="text-slate-400 mb-1"><Trophy className="w-6 h-6" /></div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">--</div>
                                <div className="text-xs font-medium text-slate-500">Global Rank</div>
                            </div>
                        </div>
                    </section>

                    {/* Account Details Form */}
                    <section className="bg-white dark:bg-[#1a2332] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <User className="text-primary w-5 h-5" />
                                Account Details
                            </h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                                    <input
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary px-3 py-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        type="text"
                                        value={formData.name}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Class / Grade</label>
                                    <select
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary px-3 py-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        value={formData.class}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                    >
                                        <option value="9">Class 9</option>
                                        <option value="10">Class 10</option>
                                        <option value="11">Class 11</option>
                                        <option value="12">Class 12</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">School (Optional)</label>
                                    <input
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary px-3 py-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        placeholder="Enter school name"
                                        type="text"
                                        value={formData.school}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Preferred Subjects</label>
                                    <div className="text-sm text-slate-400 italic">
                                        No subjects available to select.
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Language</label>
                                    <select
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary px-3 py-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        value={formData.language}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                    >
                                        <option value="English">English</option>
                                        <option value="Hindi">Hindi</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button className="text-sm text-primary font-medium hover:underline">Change Password?</button>
                            </div>
                        </div>
                        {isEditing && (
                            <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Activity History */}
                    <section className="bg-white dark:bg-[#1a2332] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <History className="text-slate-400 w-5 h-5" />
                            Recent Activity
                        </h3>
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Ghost className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">No recent activity</p>
                            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                                Your recent tests and practice sessions will appear here.
                            </p>
                            <a href="/dashboard" className="mt-4 text-sm font-medium text-primary hover:underline">
                                Start Learning →
                            </a>
                        </div>
                    </section>
                </div>

                {/* Right Column: Sidebar */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Purchases / Access */}
                    <div className="bg-white dark:bg-[#1a2332] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">My Purchases</h3>
                        </div>
                        <div className="p-8 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">No active plans.</p>
                            <button className="mt-3 text-xs font-semibold text-primary hover:text-primary-hover border border-primary/20 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                                Browse Courses
                            </button>
                        </div>
                    </div>

                    {/* Certificates */}
                    <div className="bg-white dark:bg-[#1a2332] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">Certificates</h3>
                            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">0</span>
                        </div>
                        <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                            <Award className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">Complete courses to earn certificates.</p>
                        </div>
                    </div>

                    {/* Security & Danger Zone */}
                    <div className="bg-white dark:bg-[#1a2332] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 space-y-3">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide mb-3">Security</h3>
                            <button className="w-full flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <LogOut className="w-[18px] h-[18px]" />
                                Logout All Devices
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                <Trash2 className="w-[18px] h-[18px]" />
                                Delete Account
                            </button>
                            <p className="text-[10px] text-slate-400 text-center pt-2">
                                Only viewable by you. <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
