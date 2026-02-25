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
import { useState, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function PaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        todayRevenue: 0,
        successfulCount: 0,
        failedCount: 0,
        pendingCount: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedPayment, setSelectedPayment] = useState(null);

    const fetchPayments = async () => {
        try {
            setIsLoading(true);
            const query = new URLSearchParams({
                status: statusFilter,
                search: searchTerm,
            });
            const response = await fetch(`/api/admin/payments?${query}`);
            const result = await response.json();

            if (result.success) {
                setPayments(result.data);
                setStats(result.stats);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Failed to fetch payments:', error);
            toast.error('Failed to load payments data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [statusFilter]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            fetchPayments();
        }
    };
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
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
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
                                    <span className="text-xl md:text-2xl font-bold text-foreground">₹{stats.totalRevenue.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 transition-transform hover:scale-[1.01] duration-200">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Today</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl md:text-2xl font-bold text-foreground">₹{stats.todayRevenue.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 transition-transform hover:scale-[1.01] duration-200">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Successful</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl md:text-2xl font-bold text-foreground text-emerald-500">{stats.successfulCount}</span>
                                </div>
                            </div>
                            <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 transition-transform hover:scale-[1.01] duration-200">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Failed</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl md:text-2xl font-bold text-foreground text-destructive">{stats.failedCount}</span>
                                </div>
                            </div>
                            <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 transition-transform hover:scale-[1.01] duration-200">
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Pending</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl md:text-2xl font-bold text-foreground text-amber-500">{stats.pendingCount}</span>
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
                                    <select
                                        className="appearance-none flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:bg-accent transition-colors focus:outline-none"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">Status: All</option>
                                        <option value="captured">Successful</option>
                                        <option value="failed">Failed</option>
                                        <option value="created">Pending</option>
                                    </select>
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
                                <button
                                    onClick={fetchPayments}
                                    className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                                    title="Refresh Data"
                                >
                                    <RefreshCcw className={cn("w-5 h-5", isLoading && "animate-spin")} />
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
                        <div className="hidden md:block bg-card border border-border rounded-xl shadow-sm overflow-hidden min-h-[400px]">
                            {payments.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/20">
                                                <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">User</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Test</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Amount</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Status</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {payments.map((payment) => (
                                                <tr
                                                    key={payment.id}
                                                    className={cn(
                                                        "hover:bg-muted/30 cursor-pointer transition-colors",
                                                        selectedPayment?.id === payment.id && "bg-accent/50"
                                                    )}
                                                    onClick={() => setSelectedPayment(payment)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                                {payment.user.name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-foreground">{payment.user.name}</span>
                                                                <span className="text-xs text-muted-foreground">{payment.user.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground font-medium">{payment.test.title}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-foreground">₹{payment.amount}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                            payment.status === 'CAPTURED' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                                payment.status === 'FAILED' ? "bg-destructive/10 text-destructive" :
                                                                    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                        )}>
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                            {format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="p-6 bg-muted/30 rounded-full mb-6">
                                        <DollarSign className="w-16 h-16 text-muted-foreground/30" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">No payments yet</h3>
                                    <p className="text-muted-foreground max-w-md">
                                        {searchTerm ? 'No payments matching your search criteria.' : 'Payment transactions will appear here once students start purchasing tests.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Mobile Card Layout */}
                        <div className="md:hidden space-y-4">
                            {payments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="bg-card border border-border rounded-xl p-4 shadow-sm"
                                    onClick={() => setSelectedPayment(payment)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {payment.user.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground">{payment.user.name}</h4>
                                                <p className="text-xs text-muted-foreground">{format(new Date(payment.createdAt), 'MMM dd, HH:mm')}</p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                            payment.status === 'CAPTURED' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                        )}>
                                            {payment.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg">
                                        <span className="text-sm font-medium truncate max-w-[150px]">{payment.test.title}</span>
                                        <span className="font-bold text-foreground">₹{payment.amount}</span>
                                    </div>
                                </div>
                            ))}
                            {payments.length === 0 && (
                                <div className="text-center py-12 bg-card border border-border rounded-xl">
                                    <p className="text-muted-foreground text-sm italic">No records found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar (Details Panel) */}
            <div className="hidden lg:flex flex-col w-[400px] h-full bg-card border-l border-border shadow-xl overflow-y-auto z-40 shrink-0">
                {selectedPayment ? (
                    <div className="flex flex-col p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-foreground">Payment Details</h3>
                            <button onClick={() => setSelectedPayment(null)} className="p-1 hover:bg-accent rounded-full text-muted-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center text-center mb-8 pb-8 border-b border-border">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl mb-4">
                                {selectedPayment.user.name?.charAt(0) || 'U'}
                            </div>
                            <h4 className="text-xl font-bold text-foreground">{selectedPayment.user.name}</h4>
                            <p className="text-sm text-muted-foreground mb-4">{selectedPayment.user.email}</p>
                            <span className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                                selectedPayment.status === 'CAPTURED' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                    selectedPayment.status === 'FAILED' ? "bg-destructive/10 text-destructive" :
                                        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            )}>
                                {selectedPayment.status}
                            </span>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Transaction Info</label>
                                <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Amount</span>
                                        <span className="text-sm font-bold text-foreground">₹{selectedPayment.amount} {selectedPayment.currency}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Order ID</span>
                                        <span className="text-sm font-mono text-foreground select-all">{selectedPayment.providerOrderId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Payment ID</span>
                                        <span className="text-sm font-mono text-foreground select-all">{selectedPayment.providerPaymentId || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Provider</span>
                                        <span className="text-sm text-foreground">{selectedPayment.provider}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Item Purchased</label>
                                <div className="bg-muted/30 p-4 rounded-xl">
                                    <h5 className="font-bold text-foreground mb-1">{selectedPayment.test.title}</h5>
                                    <p className="text-xs text-muted-foreground italic">Test ID: {selectedPayment.testId}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Timeline</label>
                                <div className="space-y-4 pt-2">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                                            <div className="w-0.5 h-10 bg-border"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Payment Initialized</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(selectedPayment.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={cn("w-2.5 h-2.5 rounded-full", selectedPayment.status === 'CAPTURED' ? "bg-emerald-500" : "bg-muted")}></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Payment {selectedPayment.status === 'CAPTURED' ? 'Captured' : 'Pending/Failed'}</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(selectedPayment.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-bold transition-colors">
                                <Copy className="w-4 h-4" />
                                Copy ID
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
                                <CheckCircle className="w-4 h-4" />
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="p-6 bg-muted/30 rounded-full mb-6 text-muted-foreground/20">
                            <DollarSign className="w-16 h-16" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">No payment selected</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            Select a payment from the list to view detailed information, including order IDs and timelines.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
