'use client';

import {
  Calendar,
  Download,
  Users,
  FileText,
  ClipboardList,
  Target,
  BarChart2,
  Settings,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  CreditCard,
  ChevronDown,
  Info
} from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground font-display selection:bg-primary selection:text-white">
      <style jsx global>{`
        /* Custom Scrollbar for Dashboard */
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background-color: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: hsl(var(--muted-foreground) / 0.3);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-muted/10 relative">
        {/* Header Sticky */}
        <header className="w-full z-20 bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 shrink-0">
          <div className="max-w-[1600px] mx-auto px-6 py-5">
            <div className="flex flex-col gap-4">
              {/* Top Row: Title & Actions */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-foreground">Analytics</h2>
                  <p className="text-muted-foreground text-sm mt-1">Overview of student performance, content impact, and revenue trends.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="hidden md:flex items-center justify-center gap-2 rounded-lg h-10 px-4 border border-border bg-card text-muted-foreground text-sm font-medium hover:text-foreground hover:border-foreground/50 transition-colors">
                    <Calendar className="w-5 h-5" />
                    <span>Schedule Report</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-foreground text-background border border-foreground text-sm font-bold hover:bg-foreground/90 transition-colors">
                    <Download className="w-5 h-5" />
                    <span>Export Reports</span>
                  </button>
                </div>
              </div>
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <button className="group flex h-9 items-center gap-x-2 rounded-lg bg-card border border-border px-3 hover:border-primary/50 transition-colors">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Date</span>
                  <span className="text-foreground text-sm font-medium">This Month</span>
                  <ChevronDown className="text-muted-foreground w-[18px] h-[18px]" />
                </button>
                <button className="group flex h-9 items-center gap-x-2 rounded-lg bg-card border border-border px-3 hover:border-primary/50 transition-colors">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Class</span>
                  <span className="text-foreground text-sm font-medium">All Classes</span>
                  <ChevronDown className="text-muted-foreground w-[18px] h-[18px]" />
                </button>
                <button className="group flex h-9 items-center gap-x-2 rounded-lg bg-card border border-border px-3 hover:border-primary/50 transition-colors">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Subject</span>
                  <span className="text-foreground text-sm font-medium">Mathematics</span>
                  <ChevronDown className="text-muted-foreground w-[18px] h-[18px]" />
                </button>
                <button className="group flex h-9 items-center gap-x-2 rounded-lg bg-card border border-border px-3 hover:border-primary/50 transition-colors">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Olympiad</span>
                  <span className="text-foreground text-sm font-medium">All</span>
                  <ChevronDown className="text-muted-foreground w-[18px] h-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-6 pb-10">
            {/* KPI STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* KPI 1 */}
              <div className="flex flex-col justify-between rounded-xl p-5 bg-card border border-border hover:border-foreground/20 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between">
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Active Students</p>
                  <Users className="text-muted-foreground w-5 h-5" />
                </div>
                <div className="mt-3">
                  <p className="text-foreground text-2xl font-black">0</p>
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-muted-foreground text-xs">No data</p>
                  </div>
                </div>
              </div>
              {/* KPI 2 */}
              <div className="flex flex-col justify-between rounded-xl p-5 bg-card border border-border hover:border-foreground/20 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between">
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Avg Test Score</p>
                  <Target className="text-muted-foreground w-5 h-5" />
                </div>
                <div className="mt-3">
                  <p className="text-foreground text-2xl font-black">0%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-muted-foreground text-xs">No data</p>
                  </div>
                </div>
              </div>
              {/* KPI 3 */}
              <div className="flex flex-col justify-between rounded-xl p-5 bg-card border border-border hover:border-foreground/20 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between">
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Completion Rate</p>
                  <CheckCircle className="text-muted-foreground w-5 h-5" />
                </div>
                <div className="mt-3">
                  <p className="text-foreground text-2xl font-black">0%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-muted-foreground text-xs">No data</p>
                  </div>
                </div>
              </div>
              {/* KPI 4 */}
              <div className="flex flex-col justify-between rounded-xl p-5 bg-card border border-border hover:border-foreground/20 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between">
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">DPP Participation</p>
                  <FileText className="text-muted-foreground w-5 h-5" />
                </div>
                <div className="mt-3">
                  <p className="text-foreground text-2xl font-black">0%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-muted-foreground text-xs">No data</p>
                  </div>
                </div>
              </div>
              {/* KPI 5 */}
              <div className="flex flex-col justify-between rounded-xl p-5 bg-card border border-border hover:border-foreground/20 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between">
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Paid Conversion</p>
                  <CreditCard className="text-muted-foreground w-5 h-5" />
                </div>
                <div className="mt-3">
                  <p className="text-foreground text-2xl font-black">0%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-muted-foreground text-xs">No data</p>
                  </div>
                </div>
              </div>
              {/* KPI 6 */}
              <div className="flex flex-col justify-between rounded-xl p-5 bg-card border border-border hover:border-foreground/20 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between">
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                  <span className="text-muted-foreground text-[20px] font-sans">₹</span>
                </div>
                <div className="mt-3">
                  <p className="text-foreground text-2xl font-black">₹0</p>
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-muted-foreground text-xs">No data</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Empty State for Charts and Analytics */}
            <div className="mt-8 bg-card border border-border rounded-xl p-20">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-6 bg-muted/30 rounded-full mb-6">
                  <BarChart2 className="w-16 h-16 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No analytics data yet</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Analytics charts, insights, and performance metrics will appear here once students start taking tests and engaging with content.
                </p>
              </div>
            </div>

            {/* Footer / Quick Links */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
              <p className="text-muted-foreground text-sm">© 2023 Mindora Education. All rights reserved.</p>
              <div className="flex gap-4">
                <a className="text-sm text-muted-foreground hover:text-foreground transition-colors" href="#">Help Center</a>
                <a className="text-sm text-muted-foreground hover:text-foreground transition-colors" href="#">Privacy Policy</a>
                <a className="text-sm text-muted-foreground hover:text-foreground transition-colors" href="#">Contact Support</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
