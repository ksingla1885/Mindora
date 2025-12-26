"use client";

import React from 'react';
import {
    ArrowUp,
    ArrowDown,
    Minus,
    Zap,
    GraduationCap,
    Calendar,
    Users,
    ChevronDown,
    Trophy,
    ChevronRight,
} from 'lucide-react';

export default function LeaderboardPage() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col overflow-x-hidden pb-32">
            {/* Main Content */}
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header & Personal Stats */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Leaderboard</h1>
                        <p className="text-muted-foreground text-lg">See how you stack up against your peers. Consistency is key!</p>
                    </div>
                    <div className="flex gap-4 w-full lg:w-auto">
                        <div className="bg-card p-4 rounded-xl shadow-sm border border-border flex-1 min-w-[160px]">
                            <p className="text-sm text-muted-foreground font-medium mb-1">Your Rank</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-foreground">#42</span>
                                <span className="text-xs font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <ArrowUp className="w-3.5 h-3.5" /> 2
                                </span>
                            </div>
                        </div>
                        <div className="bg-card p-4 rounded-xl shadow-sm border border-border flex-1 min-w-[160px]">
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-sm text-muted-foreground font-medium">To Next Rank</p>
                                <Zap className="w-[18px] h-[18px] text-primary fill-current" />
                            </div>
                            <span className="text-2xl font-bold text-foreground">120 pts</span>
                            <div className="w-full bg-secondary rounded-full h-1.5 mt-2 overflow-hidden">
                                <div className="bg-primary h-1.5 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Filters */}
                <div className="sticky top-[4rem] z-40 py-4 bg-background/95 backdrop-blur-sm -mx-4 px-4 sm:px-0 sm:mx-0 mb-8 border-b border-transparent transition-all" id="filter-bar">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative group">
                            <button className="flex items-center gap-2 bg-card hover:bg-secondary border border-border rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm text-foreground">
                                <GraduationCap className="w-5 h-5 text-muted-foreground" />
                                Subject: <span className="text-foreground">All Subjects</span>
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="relative group">
                            <button className="flex items-center gap-2 bg-card hover:bg-secondary border border-border rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm text-foreground">
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                Time: <span className="text-foreground">Weekly</span>
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="relative group">
                            <button className="flex items-center gap-2 bg-card hover:bg-secondary border border-border rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm text-foreground">
                                <Users className="w-5 h-5 text-muted-foreground" />
                                Class: <span className="text-foreground">Class 10</span>
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="hidden sm:inline">Next update in:</span>
                            <span className="font-mono bg-secondary px-2 py-1 rounded text-foreground">04:23:12</span>
                        </div>
                    </div>
                </div>

                {/* Top Performers (Podium) */}
                <div className="flex justify-center items-end gap-4 sm:gap-8 mb-12 min-h-[300px]">
                    {/* Rank 2 */}
                    <div className="flex flex-col items-center w-1/3 max-w-[240px] animate-[slide-up_0.5s_ease-out_100ms_both]">
                        <div className="relative mb-4">
                            <div className="size-20 sm:size-24 rounded-full border-4 border-gray-300 p-1 bg-card">
                                <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAvbcYQ42FFsuPccGlR2mKWzEg_QHyot81_cWZGdMvPskx1KRqc3OoKHK3UubMtQTj3_-da7gxKWk420yxrdfqu9fktJ4e9Vje-PnhEZjgy7OVMjZ6eOvIwBQ5vjV1I7KafQNHWgFRnB9CbQq_IYVKbjmatH67gkqGXO6tTGgm5N4UV6YFP7zfU_bmdLSD48cDkusMn7UADP6BzaySXBBMFtzZyZjFny0lZ2EJYVf2bqtVrM9xiQvewJfiE4sN6YnmMdcSNQvXBlHb4')" }}></div>
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm border-2 border-white">
                                2
                            </div>
                        </div>
                        <div className="bg-card w-full p-4 sm:p-6 rounded-2xl shadow-sm border-t-4 border-gray-300 text-center relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gray-50 to-transparent opacity-50"></div>
                            <div className="relative z-10">
                                <h3 className="font-bold text-foreground text-lg truncate">Sarah Jones</h3>
                                <p className="text-primary font-bold text-xl mt-1">2,300 pts</p>
                                <div className="flex justify-center mt-3 gap-1">
                                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Math Wiz</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rank 1 */}
                    <div className="flex flex-col items-center w-1/3 max-w-[240px] z-10 animate-[slide-up_0.5s_ease-out]">
                        <div className="relative mb-6">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400">
                                <Trophy className="w-10 h-10 fill-current drop-shadow-md" />
                            </div>
                            <div className="size-24 sm:size-32 rounded-full border-4 border-primary p-1 bg-card shadow-[0_0_15px_rgba(43,108,238,0.3)]">
                                <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAlJ2Xf5P8kjxV8r7EE66UtQw0eKE-BcevBqS9T8_9cGxKEFRYfp_RWk0QcIBHeKQfSdfHgqjdquBuXQ_-IVF2qHQgL41ElxAvKTNXB6hAM5bdh7mOkc1iYi0lFUvipCA04O8l_VgNjd5kaGk386PP1LzSTVm7BxApg9Eyej_PrM3zwR-3FbpDH5OmlJ2_wVFlHCCk6aEd74ahwgWUDX7SMrYxA2lm1unpLVThyA_efJTuqUy52a7WDj52jG-iEBi4JeKITaHUAyKkO')" }}></div>
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-bold px-3 py-0.5 rounded-full shadow-md border-2 border-white">
                                1
                            </div>
                        </div>
                        <div className="bg-card w-full p-6 sm:p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/10 to-transparent opacity-60"></div>
                            <div className="relative z-10">
                                <h3 className="font-bold text-foreground text-xl truncate">Alex Chen</h3>
                                <p className="text-primary font-bold text-2xl mt-1">2,450 pts</p>
                                <div className="flex justify-center mt-3 gap-1">
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Top Scorer</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rank 3 */}
                    <div className="flex flex-col items-center w-1/3 max-w-[240px] animate-[slide-up_0.5s_ease-out_200ms_both]">
                        <div className="relative mb-4">
                            <div className="size-20 sm:size-24 rounded-full border-4 border-orange-300 p-1 bg-card">
                                <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBLIK111KMnRddgD0AMkMpB2L0ntyDCDNVjFyg0WjGTqJXqC4_FKv_OIGkyuJxfmEvGv6P6mzmutVxCy1DHxa5rzi3NFVLOEkmHmOtV9wf3IQdDusG1BIZignsYsbKBmhhzLKztf1cXLYSzHkxOfzob95W3748_H2CGzCaencZhus-gor2AyWbx2f_63AY2n3TUB4Qbpnp9nfuf2Orh3bCnGnsi8IQphxv0THgDGZdJ43cYp3YgivXOc0si2kWVeM6WjF7_cn5RtGdW')" }}></div>
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-300 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm border-2 border-white">
                                3
                            </div>
                        </div>
                        <div className="bg-card w-full p-4 sm:p-6 rounded-2xl shadow-sm border-t-4 border-orange-300 text-center relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-50 to-transparent opacity-50"></div>
                            <div className="relative z-10">
                                <h3 className="font-bold text-foreground text-lg truncate">Mike Ross</h3>
                                <p className="text-primary font-bold text-xl mt-1">2,150 pts</p>
                                <div className="flex justify-center mt-3 gap-1">
                                    <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Rising Star</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leaderboard List */}
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <div className="col-span-1 text-center">Rank</div>
                        <div className="col-span-4 sm:col-span-3">Student</div>
                        <div className="col-span-2 hidden sm:block">Class</div>
                        <div className="col-span-2 sm:col-span-2 text-right">Points</div>
                        <div className="col-span-3 sm:col-span-2 text-center">Accuracy</div>
                        <div className="col-span-2 hidden sm:block text-center">Tests</div>
                    </div>

                    {/* List Items */}
                    <div className="divide-y divide-border">
                        {/* Row 4 */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-secondary/30 transition-colors group cursor-pointer">
                            <div className="col-span-1 flex justify-center items-center gap-1 font-bold text-muted-foreground">
                                4
                                <Minus className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
                                <div className="size-8 rounded-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDcthJ6G633qN4LpdCSUugRzxipNBT9UHB4xdZ9noQEXGguFSEIX1p1r55PW-dAUbcaFIlztibyOm4KzkrIuMmktkKnM0BzqheQfOkG8YLOsprrXAKXFl7pl8U2pAp9RIJrbFnxC5eJM9Eso9q5dwibizMjaYJXFuCd6Zpr_OfFhVEkg-Io2D0rZqqnc4hgPwdwSOYFVZm8lYb_cFFRW-8KineXF5q6C0BZf9QjhfkhJHz7SpEfPN6EO_59BKGEBI31AqNHTCo3PJ4C')" }}></div>
                                <span className="font-medium text-foreground truncate">Emily Parker</span>
                            </div>
                            <div className="col-span-2 hidden sm:block text-sm text-muted-foreground">Class 10</div>
                            <div className="col-span-2 sm:col-span-2 text-right font-bold text-foreground">2,050</div>
                            <div className="col-span-3 sm:col-span-2 flex items-center justify-center gap-2">
                                <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{ width: '92%' }}></div>
                                </div>
                                <span className="text-xs font-semibold">92%</span>
                            </div>
                            <div className="col-span-2 hidden sm:block text-center text-sm text-muted-foreground">24</div>
                        </div>

                        {/* Row 5 */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-secondary/30 transition-colors group cursor-pointer">
                            <div className="col-span-1 flex justify-center items-center gap-1 font-bold text-muted-foreground">
                                5
                                <ArrowUp className="w-4 h-4 text-green-500" />
                            </div>
                            <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
                                <div className="size-8 rounded-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB7TXoDuNhDBOZweIyKFbIHNQJ3-oWBQVFm-q_LCP1Z9BhdfDI7NiXqFamKgqugbfjPX9exr6JDqLDoJsLZUeavMW-UqWUQBiPBAYurhXzCYo_TfoBfLx5f-vwknDNiT4lRxATQqYRdwxJHPY_AUoJgKqao9Emc2EE-VNecedg1TgKMaNfrOjVluMhOT4sf5Scj7BIlfiNIIoj17Fz-RVDPNcrnkRw4IWe0_QtbYN-AJ1eOfNtuc146zFLk1AocLzuyZvzHYNp0Fxos')" }}></div>
                                <span className="font-medium text-foreground truncate">Daniel Kim</span>
                            </div>
                            <div className="col-span-2 hidden sm:block text-sm text-muted-foreground">Class 10</div>
                            <div className="col-span-2 sm:col-span-2 text-right font-bold text-foreground">1,980</div>
                            <div className="col-span-3 sm:col-span-2 flex items-center justify-center gap-2">
                                <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="bg-yellow-400 h-full rounded-full" style={{ width: '85%' }}></div>
                                </div>
                                <span className="text-xs font-semibold">85%</span>
                            </div>
                            <div className="col-span-2 hidden sm:block text-center text-sm text-muted-foreground">20</div>
                        </div>

                        {/* Row 6 */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-secondary/30 transition-colors group cursor-pointer">
                            <div className="col-span-1 flex justify-center items-center gap-1 font-bold text-muted-foreground">
                                6
                                <ArrowDown className="w-4 h-4 text-red-400" />
                            </div>
                            <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
                                <div className="size-8 rounded-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD5qbOezzuzrQJR54NiVqkmLB0diNzjoF3PyNpAEhCkgKY5Rk2MLI8sJFGhq-vKXQev4WPCEZEhmGXnCv2gAYtSQrgeMXTd6_oZ-WLsQi6p9RyrJtG5WybZy5dLmTVkR5F9lOEz8mPUrMteA1FyQKlSZ6ilvGWVjxT9ZyR6RUJseQPgcTgRm5r-ifT1xhJMk4m_fiQ25-A98FmxryqYPfbEOpc35IWNu78TlEGwZhTNNgKKiCvItyoTMZTB0yp_QZjfvRBpSLYwpGNt')" }}></div>
                                <span className="font-medium text-foreground truncate">Marcus Johnson</span>
                            </div>
                            <div className="col-span-2 hidden sm:block text-sm text-muted-foreground">Class 10</div>
                            <div className="col-span-2 sm:col-span-2 text-right font-bold text-foreground">1,950</div>
                            <div className="col-span-3 sm:col-span-2 flex items-center justify-center gap-2">
                                <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{ width: '88%' }}></div>
                                </div>
                                <span className="text-xs font-semibold">88%</span>
                            </div>
                            <div className="col-span-2 hidden sm:block text-center text-sm text-muted-foreground">22</div>
                        </div>

                        {/* Row 7 */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-secondary/30 transition-colors group cursor-pointer">
                            <div className="col-span-1 flex justify-center items-center gap-1 font-bold text-muted-foreground">
                                7
                                <ArrowUp className="w-4 h-4 text-green-500" />
                            </div>
                            <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
                                <div className="size-8 rounded-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB1aQFplGpUT5r1iufA-AweSBSEOIJpfvPFg9y9onUqegSB2ctCEcfsLUqiLrvuhMTN6POIpAw-Lh7UsRu9Dcs4tIpg9NwzNvN5ualEhrtPVK7eTNUPS5uMrkfxManlcIACh10OeJPTdoWuQphRS2SNEQcq2FPjj4OLyl_WELlTUwkYgv4B28HHjB9ch9sb3aUFBAiiFR9a8_JOyY72yrtCRMfxKSQfJ_HwA10PkYTv889AY41BKYrx73OGx-b7_IZQOJCTd8mQsOPc')" }}></div>
                                <span className="font-medium text-foreground truncate">Sophia Lee</span>
                            </div>
                            <div className="col-span-2 hidden sm:block text-sm text-muted-foreground">Class 10</div>
                            <div className="col-span-2 sm:col-span-2 text-right font-bold text-foreground">1,920</div>
                            <div className="col-span-3 sm:col-span-2 flex items-center justify-center gap-2">
                                <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{ width: '90%' }}></div>
                                </div>
                                <span className="text-xs font-semibold">90%</span>
                            </div>
                            <div className="col-span-2 hidden sm:block text-center text-sm text-muted-foreground">21</div>
                        </div>

                        {/* Skeleton Rows */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center opacity-50">
                            <div className="col-span-1 flex justify-center"><div className="h-4 w-4 bg-secondary rounded"></div></div>
                            <div className="col-span-4 sm:col-span-3 flex gap-3 items-center"><div className="h-8 w-8 bg-secondary rounded-full"></div><div className="h-4 w-24 bg-secondary rounded"></div></div>
                            <div className="col-span-2 hidden sm:block"><div className="h-4 w-12 bg-secondary rounded"></div></div>
                            <div className="col-span-2 sm:col-span-2 flex justify-end"><div className="h-4 w-10 bg-secondary rounded"></div></div>
                            <div className="col-span-3 sm:col-span-2 flex justify-center"><div class="h-2 w-16 bg-secondary rounded"></div></div>
                            <div className="col-span-2 hidden sm:block flex justify-center"><div className="h-4 w-6 bg-secondary rounded"></div></div>
                        </div>
                    </div>
                </div>

                {/* Load More */}
                <div className="p-4 text-center border-t border-border bg-secondary/30">
                    <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Show more students</button>
                </div>
            </main>

            {/* Sticky User Row (Pinned Footer) */}
            <div className="sticky bottom-6 w-full z-40 px-4 mt-auto">
                <div className="bg-card rounded-xl shadow-2xl border-2 border-primary/30 relative overflow-hidden flex items-center animate-[slide-up_0.5s_ease-out]">
                    {/* Highlight Background */}
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                    <div className="w-full grid grid-cols-12 gap-4 px-6 py-4 items-center">
                        <div className="col-span-1 flex justify-center items-center gap-1 font-bold text-foreground">
                            42
                            <ArrowUp className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
                            <div className="size-10 rounded-full bg-cover bg-center border-2 border-white shadow-sm" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAwW3wk31EC0ywxUyb-5SsJUmRbzO5pHzx9IZWcP4pt0v8ZjsWPZYGO6Ku1Om0OKxOE9dQa0fsoaShbKY9TDER98Q0JywZJMkNw1JNOANZ7HSoAfQ7lHq4DrIxvhpmduAVCHvtn_6t40-dMy-neFGbK3AB2c_ICBCw9YdLH3-tcXM-2IxSXhsvu4ICPaLKH5QracYNN6rZYRzglEP_KAEKbzBCgxjPHFqY-pnga9vhpiUCPviMq90V2-5hHtxMA3uYkOWelFrumJY15')" }}></div>
                            <div className="flex flex-col">
                                <span className="font-bold text-foreground text-sm truncate">Jamie L. (You)</span>
                                <span className="text-xs text-muted-foreground sm:hidden">1,830 pts</span>
                            </div>
                        </div>
                        <div className="col-span-2 hidden sm:block text-sm text-muted-foreground">Class 10</div>
                        <div className="col-span-2 sm:col-span-2 text-right font-bold text-foreground hidden sm:block">1,830</div>
                        <div className="col-span-3 sm:col-span-2 flex flex-col items-center justify-center gap-1">
                            <div className="flex items-center gap-2 w-full justify-center">
                                <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{ width: '78%' }}></div>
                                </div>
                                <span className="text-xs font-semibold">78%</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">Accuracy</span>
                        </div>
                        <div className="col-span-2 hidden sm:flex justify-center items-center">
                            <button className="bg-foreground text-secondary hover:bg-black/80 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors">
                                View Details
                            </button>
                        </div>
                        {/* Mobile View Details Button equivalent (small arrow) */}
                        <div className="col-span-4 sm:hidden flex justify-end">
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
