'use client';

import {
    Search,
    Download,
    Bell,
    MoreVertical,
    Smartphone,
    CreditCard,
    Landmark,
    Calendar,
    Filter,
    DollarSign,
    RefreshCcw,
    Copy,
    X,
    CheckCircle,
    ChevronDown,
    Menu
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';

export default function PaymentsPage() {
    return (
        <div className="flex h-full w-full overflow-hidden bg-background text-foreground font-display">
            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            height: 6px;
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background-color: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: hsl(var(--muted-foreground) / 0.3);
            border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: hsl(var(--muted-foreground) / 0.5);
        }
        details > summary {
            list-style: none;
        }
        details > summary::-webkit-details-marker {
            display: none;
        }
        details[open] summary .chevron {
            transform: rotate(180deg);
        }
      `}</style>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-muted/10 relative">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-card border-b border-border shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden p-2 -ml-2 text-muted-foreground hover:bg-accent hover:text-foreground rounded-md">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-foreground">Payments</h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end max-w-2xl">
                        <div className="relative w-full max-w-md hidden md:block">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2 border border-input rounded-lg leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-shadow"
                                placeholder="Search User, Test, or Payment ID"
                                type="text"
                            />
                        </div>
                        <button className="md:hidden p-2 text-muted-foreground hover:bg-accent hover:text-foreground rounded-md">
                            <Search className="w-6 h-6" />
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm font-medium hover:bg-accent transition-colors shadow-sm">
                            <Download className="w-5 h-5" />
                            <span className="hidden sm:inline">Export CSV</span>
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-foreground relative">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-card"></span>
                        </button>
                    </div>
                </header>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8 relative">
                    <div className="mx-auto max-w-[1400px]">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
                            <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 transition-transform hover:scale-[1.01] duration-200">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total Revenue</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl md:text-2xl font-bold text-foreground">₹12.45L</span>
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">+12%</span>
                                </div>
                            </div>
                            <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 transition-transform hover:scale-[1.01] duration-200">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Today</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl md:text-2xl font-bold text-foreground">₹12,500</span>
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">+5%</span>
                                </div>
                            </div>
                            <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 transition-transform hover:scale-[1.01] duration-200">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Successful</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl md:text-2xl font-bold text-foreground">1,240</span>
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">98%</span>
                                </div>
                            </div>
                            <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 transition-transform hover:scale-[1.01] duration-200">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Failed</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl md:text-2xl font-bold text-foreground">18</span>
                                    <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">-2%</span>
                                </div>
                            </div>
                            <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 transition-transform hover:scale-[1.01] duration-200">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Pending</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl md:text-2xl font-bold text-foreground">45</span>
                                    <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="hidden lg:flex flex-row gap-4 mb-6 justify-between items-center">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative group">
                                    <button className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:bg-accent transition-colors">
                                        <Calendar className="w-[18px] h-[18px] text-muted-foreground" />
                                        <span>Last 30 Days</span>
                                        <ChevronDown className="w-[18px] h-[18px] text-muted-foreground" />
                                    </button>
                                </div>
                                <div className="relative">
                                    <button className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:bg-accent transition-colors">
                                        <Filter className="w-[18px] h-[18px] text-muted-foreground" />
                                        <span>Status: All</span>
                                        <ChevronDown className="w-[18px] h-[18px] text-muted-foreground" />
                                    </button>
                                </div>
                                <div className="relative">
                                    <button className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:bg-accent transition-colors">
                                        <CreditCard className="w-[18px] h-[18px] text-muted-foreground" />
                                        <span>Method</span>
                                        <ChevronDown className="w-[18px] h-[18px] text-muted-foreground" />
                                    </button>
                                </div>
                                <div className="relative">
                                    <button className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:bg-accent transition-colors">
                                        <DollarSign className="w-[18px] h-[18px] text-muted-foreground" />
                                        <span>Amount Range</span>
                                        <ChevronDown className="w-[18px] h-[18px] text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-colors" title="Refresh Data">
                                    <RefreshCcw className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Filter */}
                        <details className="lg:hidden mb-6 bg-card border border-border rounded-lg overflow-hidden group shadow-sm">
                            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors select-none">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <Filter className="w-5 h-5 text-muted-foreground" />
                                    Filter Options
                                </div>
                                <ChevronDown className="w-5 h-5 text-muted-foreground chevron transition-transform duration-200" />
                            </summary>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border">
                                <button className="flex justify-between items-center px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground hover:bg-accent">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-[18px] h-[18px] text-muted-foreground" />
                                        <span>Last 30 Days</span>
                                    </div>
                                    <ChevronDown className="w-[18px] h-[18px] text-muted-foreground" />
                                </button>
                                <button className="flex justify-between items-center px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground hover:bg-accent">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-[18px] h-[18px] text-muted-foreground" />
                                        <span>Status</span>
                                    </div>
                                    <ChevronDown className="w-[18px] h-[18px] text-muted-foreground" />
                                </button>
                                <button className="flex justify-between items-center px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground hover:bg-accent">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-[18px] h-[18px] text-muted-foreground" />
                                        <span>Method</span>
                                    </div>
                                    <ChevronDown className="w-[18px] h-[18px] text-muted-foreground" />
                                </button>
                                <button className="flex justify-between items-center px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground hover:bg-accent">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-[18px] h-[18px] text-muted-foreground" />
                                        <span>Amount</span>
                                    </div>
                                    <ChevronDown className="w-[18px] h-[18px] text-muted-foreground" />
                                </button>
                            </div>
                        </details>

                        {/* Table */}
                        <div className="hidden md:flex bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-col">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                                            <th className="px-6 py-4 whitespace-nowrap w-16 sticky top-0 z-10 bg-muted/50">
                                                <input className="rounded border-input text-primary focus:ring-primary h-4 w-4 bg-background" type="checkbox" />
                                            </th>
                                            <th className="px-6 py-4 whitespace-nowrap sticky top-0 z-10 bg-muted/50">Payment ID</th>
                                            <th className="px-6 py-4 whitespace-nowrap sticky top-0 z-10 bg-muted/50">User</th>
                                            <th className="px-6 py-4 whitespace-nowrap sticky top-0 z-10 bg-muted/50">Test Details</th>
                                            <th className="px-6 py-4 whitespace-nowrap text-right sticky top-0 z-10 bg-muted/50">Amount</th>
                                            <th className="px-6 py-4 whitespace-nowrap sticky top-0 z-10 bg-muted/50">Method</th>
                                            <th className="px-6 py-4 whitespace-nowrap sticky top-0 z-10 bg-muted/50">Status</th>
                                            <th className="px-6 py-4 whitespace-nowrap sticky top-0 z-10 bg-muted/50">Date & Time</th>
                                            <th className="px-6 py-4 whitespace-nowrap text-right sticky top-0 z-10 bg-muted/50">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {/* Row 1 */}
                                        <tr className="hover:bg-muted/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <input className="rounded border-input text-primary focus:ring-primary h-4 w-4 bg-background" type="checkbox" />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-foreground font-mono">pay_...8d2a</span>
                                                    <button className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold">AP</div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-foreground">Aarav Patel</span>
                                                        <span className="text-xs text-muted-foreground">aarav@example.com</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-foreground">Math Olympiad L2</span>
                                                    <span className="text-xs text-muted-foreground">Standard Pack</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="text-sm font-semibold text-foreground">₹499.00</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">UPI</span>
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">Razorpay</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                    Success
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                Oct 24, 2023 <span className="text-xs ml-1 opacity-70">10:42 AM</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Row 2 */}
                                        <tr className="hover:bg-muted/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <input className="rounded border-input text-primary focus:ring-primary h-4 w-4 bg-background" type="checkbox" />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-foreground font-mono">pay_...9x1z</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">RK</div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-foreground">Rohan Kumar</span>
                                                        <span className="text-xs text-muted-foreground">rohan.k@gmail.com</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-foreground">Science Olympiad</span>
                                                    <span className="text-xs text-muted-foreground">Advanced Pack</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="text-sm font-semibold text-foreground">₹799.00</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">Card</span>
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">Razorpay</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-800/50">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                                    Failed
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                Oct 24, 2023 <span className="text-xs ml-1 opacity-70">09:15 AM</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Row 3 */}
                                        <tr className="hover:bg-muted/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <input className="rounded border-input text-primary focus:ring-primary h-4 w-4 bg-background" type="checkbox" />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-foreground font-mono">pay_...4b2m</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center text-xs font-bold">SJ</div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-foreground">Sneha Jha</span>
                                                        <span className="text-xs text-muted-foreground">sneha.j@yahoo.com</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-foreground">English Olympiad</span>
                                                    <span className="text-xs text-muted-foreground">Mock Series</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="text-sm font-semibold text-foreground">₹299.00</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Landmark className="w-5 h-5 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">NetBanking</span>
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">Razorpay</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                                    Pending
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                Oct 23, 2023 <span className="text-xs ml-1 opacity-70">11:59 PM</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card Layout (Hidden on Desktop) */}
                        <div className="md:hidden space-y-4">
                            <details className="group bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                                <summary className="block cursor-pointer p-4 hover:bg-muted/50 transition-colors relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm">AP</div>
                                            <div>
                                                <div className="text-sm font-medium text-foreground">Aarav Patel</div>
                                                <div className="text-xs text-muted-foreground font-mono">pay_...8d2a</div>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                                            Success
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">Amount</p>
                                            <p className="text-lg font-bold text-foreground">₹499.00</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span className="text-xs">More details</span>
                                            <ChevronDown className="w-[18px] h-[18px] chevron transition-transform duration-300" />
                                        </div>
                                    </div>
                                </summary>
                                <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/20">
                                    <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Test Name</p>
                                            <p className="font-medium text-foreground truncate">Math Olympiad L2</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Date</p>
                                            <p className="font-medium text-foreground">Oct 24, 2023</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Method</p>
                                            <div className="flex items-center gap-1.5">
                                                <Smartphone className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-foreground">UPI</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Gateway</p>
                                            <span className="text-blue-600 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/30">Razorpay</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-2 pt-3 border-t border-border">
                                        <button className="flex-1 py-2 text-xs font-medium text-foreground bg-card border border-border rounded hover:bg-accent">View Invoice</button>
                                        <button className="flex-1 py-2 text-xs font-medium text-white bg-primary rounded hover:bg-blue-700 shadow-sm shadow-blue-500/20">Details</button>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar (Details Panel) */}
            <div className="hidden lg:flex flex-col w-[400px] h-full bg-card border-l border-border shadow-xl overflow-y-auto z-40 shrink-0">
                <div className="p-6 border-b border-border flex justify-between items-start sticky top-0 bg-card z-10">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Payment Details</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono text-muted-foreground">ID: pay_827d218d2a</span>
                            <Copy className="w-[14px] h-[14px] text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
                        </div>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 flex flex-col gap-6">
                    <div className="p-4 bg-muted/40 rounded-lg flex flex-col items-center justify-center border border-border">
                        <span className="text-sm text-muted-foreground">Total Amount</span>
                        <span className="text-3xl font-bold text-foreground mt-1">₹499.00</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                            <CheckCircle className="w-[14px] h-[14px]" />
                            Paid
                        </span>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Customer</h3>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">AP</div>
                            <div>
                                <p className="text-sm font-medium text-foreground">Aarav Patel</p>
                                <p className="text-xs text-muted-foreground">aarav@example.com</p>
                                <p className="text-xs text-muted-foreground">+91 98765 43210</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Transaction Info</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Order ID</span>
                                <span className="font-mono text-foreground">order_N238d9</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Method</span>
                                <span className="text-foreground">UPI (Google Pay)</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Date</span>
                                <span className="text-foreground">Oct 24, 2023, 10:42 AM</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Fees (Razorpay)</span>
                                <span className="text-foreground">₹9.50</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-border">
                                <span className="font-medium text-foreground">Net Amount</span>
                                <span className="font-medium text-foreground">₹489.50</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-4">Timeline</h3>
                        <div className="relative pl-4 border-l border-border space-y-6">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-muted-foreground/30 ring-4 ring-card"></div>
                                <p className="text-sm text-foreground font-medium">Payment Created</p>
                                <p className="text-xs text-muted-foreground">10:40 AM</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-muted-foreground/30 ring-4 ring-card"></div>
                                <p className="text-sm text-foreground font-medium">Payment Authorized</p>
                                <p className="text-xs text-muted-foreground">10:41 AM</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-card"></div>
                                <p className="text-sm text-foreground font-medium">Captured & Access Granted</p>
                                <p className="text-xs text-muted-foreground">10:42 AM</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto pt-6 flex gap-3">
                        <button className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors">Refund</button>
                        <button className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-colors">Invoice</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
