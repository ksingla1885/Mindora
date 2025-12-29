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
                                    <span className="text-xl md:text-2xl font-bold text-foreground">₹0</span>
                                    <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">No data</span>
                                </div>
                            </div>
                            <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 transition-transform hover:scale-[1.01] duration-200">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Today</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl md:text-2xl font-bold text-foreground">₹0</span>
                                    <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">No data</span>
                                </div>
                            </div>
                            <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 transition-transform hover:scale-[1.01] duration-200">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Successful</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl md:text-2xl font-bold text-foreground">0</span>
                                    <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">0%</span>
                                </div>
                            </div>
                            <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 transition-transform hover:scale-[1.01] duration-200">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Failed</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl md:text-2xl font-bold text-foreground">0</span>
                                    <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">0%</span>
                                </div>
                            </div>
                            <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 transition-transform hover:scale-[1.01] duration-200">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Pending</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl md:text-2xl font-bold text-foreground">0</span>
                                    <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">None</span>
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
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="p-6 bg-muted/30 rounded-full mb-6">
                                    <DollarSign className="w-16 h-16 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">No payments yet</h3>
                                <p className="text-muted-foreground max-w-md mb-6">
                                    Payment transactions will appear here once students start purchasing tests.
                                </p>
                            </div>
                        </div>

                        {/* Mobile Card Layout (Hidden on Desktop) */}
                        <div className="md:hidden">
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-card border border-border rounded-xl">
                                <div className="p-4 bg-muted/30 rounded-full mb-4">
                                    <DollarSign className="w-12 h-12 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-2">No payments yet</h3>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    Payment transactions will appear here
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar (Details Panel) */}
            <div className="hidden lg:flex flex-col w-[400px] h-full bg-card border-l border-border shadow-xl overflow-y-auto z-40 shrink-0">
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="p-6 bg-muted/30 rounded-full mb-6">
                        <DollarSign className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">No payment selected</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        Select a payment from the list to view detailed information
                    </p>
                </div>
            </div>
        </div>
    );
}
