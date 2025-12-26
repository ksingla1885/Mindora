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
                  <p className="text-foreground text-2xl font-black">1,240</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="text-emerald-500 w-4 h-4" />
                    <p className="text-emerald-500 text-xs font-bold">+12%</p>
                    <p className="text-muted-foreground text-xs ml-1">vs last mo.</p>
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
                  <p className="text-foreground text-2xl font-black">76%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="text-emerald-500 w-4 h-4" />
                    <p className="text-emerald-500 text-xs font-bold">+2%</p>
                    <p className="text-muted-foreground text-xs ml-1">vs last mo.</p>
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
                  <p className="text-foreground text-2xl font-black">88%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingDown className="text-red-500 w-4 h-4" />
                    <p className="text-red-500 text-xs font-bold">-1%</p>
                    <p className="text-muted-foreground text-xs ml-1">vs last mo.</p>
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
                  <p className="text-foreground text-2xl font-black">65%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="text-emerald-500 w-4 h-4" />
                    <p className="text-emerald-500 text-xs font-bold">+5%</p>
                    <p className="text-muted-foreground text-xs ml-1">vs last mo.</p>
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
                  <p className="text-foreground text-2xl font-black">4.2%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="text-emerald-500 w-4 h-4" />
                    <p className="text-emerald-500 text-xs font-bold">+0.5%</p>
                    <p className="text-muted-foreground text-xs ml-1">vs last mo.</p>
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
                  <p className="text-foreground text-2xl font-black">₹4.5L</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="text-emerald-500 w-4 h-4" />
                    <p className="text-emerald-500 text-xs font-bold">+15%</p>
                    <p className="text-muted-foreground text-xs ml-1">vs last mo.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart: Average Score Over Time */}
              <div className="lg:col-span-2 rounded-xl bg-card border border-border p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-foreground text-lg font-bold">Student Performance Trend</h3>
                    <p className="text-muted-foreground text-sm">Average test scores over the last 6 months</p>
                  </div>
                  <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                {/* CSS Chart Area */}
                <div className="relative h-64 w-full flex items-end justify-between gap-2 px-2 pb-6 border-b border-border/50">
                  {/* Y Axis Labels */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground -ml-8 pr-2 py-6">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                    <div className="w-full border-t border-dashed border-border h-0"></div>
                    <div className="w-full border-t border-dashed border-border h-0"></div>
                    <div className="w-full border-t border-dashed border-border h-0"></div>
                    <div className="w-full border-t border-dashed border-border h-0"></div>
                    <div className="w-full border-t border-dashed border-border h-0"></div>
                  </div>
                  {/* SVG Line Path */}
                  <svg className="absolute inset-0 h-[calc(100%-1.5rem)] w-full overflow-visible z-10" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradient-primary" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2"></stop>
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0"></stop>
                      </linearGradient>
                    </defs>
                    <path d="M0,180 L80,160 L160,190 L240,120 L320,130 L400,90 L480,100 L560,70 L640,60 L720,50" fill="url(#gradient-primary)" stroke="none"></path>
                    <polyline fill="none" points="0,180 80,160 160,190 240,120 320,130 400,90 480,100 560,70 640,60 720,50" stroke="hsl(var(--primary))" strokeWidth="3" vectorEffect="non-scaling-stroke"></polyline>
                    {/* Data Points */}
                    {[
                      { cx: "11%", cy: "75%" },
                      { cx: "22%", cy: "66%" },
                      { cx: "33%", cy: "80%" },
                      { cx: "44%", cy: "50%" },
                      { cx: "55%", cy: "54%" },
                      { cx: "66%", cy: "37%" },
                      { cx: "77%", cy: "41%" },
                      { cx: "88%", cy: "29%" },
                      { cx: "100%", cy: "20%" }
                    ].map((point, index) => (
                      <circle
                        key={index}
                        className="hover:r-6 transition-all cursor-pointer"
                        cx={point.cx}
                        cy={point.cy}
                        fill="hsl(var(--primary))"
                        r="4"
                      />
                    ))}
                  </svg>
                </div>
                {/* X Axis Labels */}
                <div className="flex justify-between w-full text-xs text-muted-foreground pt-3 px-2">
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                  <span>Jan</span>
                  <span>Feb</span>
                </div>
              </div>

              {/* Chart: Question Quality / Heatmap */}
              <div className="rounded-xl bg-card border border-border p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground text-lg font-bold">Accuracy Heatmap</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs text-muted-foreground">Easy</span>
                    <span className="w-2 h-2 rounded-full bg-red-500 ml-2"></span>
                    <span className="text-xs text-muted-foreground">Hard</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-4">Topic-wise question difficulty analysis</p>
                <div className="flex-1 grid grid-cols-4 gap-2">
                  {/* Column 1 */}
                  <div className="flex flex-col gap-2">
                    <div className="h-10 rounded bg-red-500/80 w-full" title="Algebra - 20% Accuracy"></div>
                    <div className="h-10 rounded bg-amber-500/60 w-full" title="Algebra - 50% Accuracy"></div>
                    <div className="h-10 rounded bg-emerald-500/40 w-full" title="Algebra - 70% Accuracy"></div>
                    <div className="h-10 rounded bg-emerald-500/80 w-full" title="Algebra - 90% Accuracy"></div>
                  </div>
                  {/* Column 2 */}
                  <div className="flex flex-col gap-2">
                    <div className="h-10 rounded bg-red-500/40 w-full"></div>
                    <div className="h-10 rounded bg-emerald-500/80 w-full"></div>
                    <div className="h-10 rounded bg-amber-500/50 w-full"></div>
                    <div className="h-10 rounded bg-emerald-500/20 w-full"></div>
                  </div>
                  {/* Column 3 */}
                  <div className="flex flex-col gap-2">
                    <div className="h-10 rounded bg-emerald-500/90 w-full"></div>
                    <div className="h-10 rounded bg-emerald-500/60 w-full"></div>
                    <div className="h-10 rounded bg-red-500/60 w-full"></div>
                    <div className="h-10 rounded bg-amber-500/80 w-full"></div>
                  </div>
                  {/* Column 4 */}
                  <div className="flex flex-col gap-2">
                    <div className="h-10 rounded bg-amber-500/40 w-full"></div>
                    <div className="h-10 rounded bg-emerald-500/80 w-full"></div>
                    <div className="h-10 rounded bg-emerald-500/90 w-full"></div>
                    <div className="h-10 rounded bg-red-500/70 w-full"></div>
                  </div>
                </div>
                <div className="grid grid-cols-4 text-xs text-muted-foreground text-center mt-2">
                  <span>Alg</span>
                  <span>Geo</span>
                  <span>Tri</span>
                  <span>Cal</span>
                </div>
              </div>
            </div>

            {/* Row 3: Insights & Revenue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* AI Insights Panel */}
              <div className="rounded-xl bg-card border border-border p-6 flex flex-col h-full">
                <div className="flex items-center gap-2 text-purple-400 mb-4">
                  <Lightbulb className="w-5 h-5" />
                  <h3 className="text-foreground text-lg font-bold">AI Insights</h3>
                </div>
                <div className="flex flex-col gap-3 h-full">
                  {/* Insight Card 1 */}
                  <div className="p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors cursor-pointer flex gap-3">
                    <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="text-red-500 w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-medium">High Churn Risk</p>
                      <p className="text-muted-foreground text-xs mt-0.5">15 students from Class 10 inactive &gt; 7 days.</p>
                    </div>
                  </div>
                  {/* Insight Card 2 */}
                  <div className="p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors cursor-pointer flex gap-3">
                    <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="text-orange-500 w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-medium">Weak Topic Alert</p>
                      <p className="text-muted-foreground text-xs mt-0.5">Trigonometry avg score dropped by 12%.</p>
                    </div>
                  </div>
                  {/* Insight Card 3 */}
                  <div className="p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors cursor-pointer flex gap-3">
                    <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Lightbulb className="text-blue-500 w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-medium">Content Opportunity</p>
                      <p className="text-muted-foreground text-xs mt-0.5">Add more video solutions for "Calculus" tests.</p>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-wide border-t border-border">View All Insights</button>
              </div>

              {/* Revenue Breakdown */}
              <div className="rounded-xl bg-card border border-border p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-foreground text-lg font-bold">Revenue Sources</h3>
                  <button className="text-xs text-primary font-bold">View Report</button>
                </div>
                <div className="flex items-center justify-center py-4 relative">
                  {/* Donut Chart Simulation */}
                  <div className="w-40 h-40 rounded-full border-[16px] border-muted/20 relative flex items-center justify-center" style={{
                    background: 'conic-gradient(hsl(var(--primary)) 0% 65%, #10b981 65% 85%, hsl(var(--muted)) 85% 100%)',
                    borderRadius: '50%'
                  }}>
                    <div className="w-28 h-28 bg-card rounded-full flex flex-col items-center justify-center z-10">
                      <p className="text-muted-foreground text-xs font-medium">Total</p>
                      <p className="text-foreground text-xl font-bold">₹4.5L</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center">
                    <p className="text-primary text-lg font-bold">65%</p>
                    <p className="text-muted-foreground text-xs">Test Series</p>
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-500 text-lg font-bold">20%</p>
                    <p className="text-muted-foreground text-xs">Crash Course</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-lg font-bold">15%</p>
                    <p className="text-muted-foreground text-xs">Other</p>
                  </div>
                </div>
              </div>

              {/* Content Engagement */}
              <div className="rounded-xl bg-card border border-border p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-foreground text-lg font-bold">Content Engagement</h3>
                </div>
                <div className="flex flex-col gap-6">
                  {/* Item 1 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground font-medium">Video Completion Rate</span>
                      <span className="text-foreground font-bold">72%</span>
                    </div>
                    <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[72%] rounded-full"></div>
                    </div>
                  </div>
                  {/* Item 2 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground font-medium">PDF Download Rate</span>
                      <span className="text-foreground font-bold">45%</span>
                    </div>
                    <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[45%] rounded-full"></div>
                    </div>
                  </div>
                  {/* Item 3 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground font-medium">Test Attempt Rate</span>
                      <span className="text-foreground font-bold">88%</span>
                    </div>
                    <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[88%] rounded-full"></div>
                    </div>
                  </div>
                  {/* Item 4 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground font-medium">Avg Time on Platform</span>
                      <span className="text-foreground font-bold">42m</span>
                    </div>
                    <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 w-[60%] rounded-full"></div>
                    </div>
                  </div>
                </div>
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
