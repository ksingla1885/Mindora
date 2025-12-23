'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, AlertCircle, CheckCircle2, Server, Clock, Cpu, HardDrive, Database, Network, Activity, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

// Mock data - replace with real API calls
const mockSystemMetrics = {
  cpu: {
    usage: 45.2,
    cores: 8,
    load: [2.1, 1.8, 1.5],
  },
  memory: {
    total: 16, // GB
    used: 9.8,
    free: 6.2,
    usage: 61.2,
  },
  disk: {
    total: 500, // GB
    used: 320,
    free: 180,
    usage: 64,
  },
  network: {
    in: 12.5, // MB/s
    out: 8.3, // MB/s
    connections: 142,
  },
  uptime: 86400 * 3 + 3600 * 5 + 60 * 30, // seconds
  services: [
    { name: 'Web Server', status: 'up', responseTime: 45 },
    { name: 'Database', status: 'up', responseTime: 12 },
    { name: 'Cache', status: 'degraded', responseTime: 8 },
    { name: 'Background Jobs', status: 'up', responseTime: 2 },
    { name: 'Search', status: 'down', responseTime: 0 },
  ],
  recentErrors: [
    { 
      id: 1, 
      message: 'Database connection timeout', 
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      level: 'error',
      source: 'api-server',
    },
    { 
      id: 2, 
      message: 'High CPU usage detected', 
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      level: 'warning',
      source: 'monitoring',
    },
    { 
      id: 3, 
      message: 'Failed to process background job', 
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      level: 'error',
      source: 'worker-1',
    },
  ],
  performance: {
    requests: {
      total: 12453,
      success: 11830,
      error: 623,
      successRate: 95.0,
      responseTime: {
        avg: 125,
        p95: 230,
        p99: 450,
      },
    },
    database: {
      queries: 124530,
      slowQueries: 1245,
      queryTime: 45.2,
    },
    cache: {
      hitRate: 89.5,
      size: 1.2, // GB
      items: 12450,
    },
  },
};

const StatusBadge = ({ status }) => {
  const variants = {
    up: { label: 'Operational', color: 'bg-green-100 text-green-800' },
    down: { label: 'Outage', color: 'bg-red-100 text-red-800' },
    degraded: { label: 'Degraded', color: 'bg-yellow-100 text-yellow-800' },
    maintenance: { label: 'Maintenance', color: 'bg-blue-100 text-blue-800' },
  };

  const { label, color } = variants[status] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status === 'up' ? (
        <CheckCircle2 className="h-3 w-3 mr-1" />
      ) : (
        <AlertCircle className="h-3 w-3 mr-1" />
      )}
      {label}
    </span>
  );
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '0m';
};

export default function SystemHealthPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState(mockSystemMetrics);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchMetrics();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Initial data load
  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setIsRefreshing(true);
      // In a real app, fetch from your API
      // const response = await fetch(`/api/admin/system/metrics?range=${timeRange}`);
      // const data = await response.json();
      // setMetrics(data);
      
      // For now, use mock data with some randomization to simulate changes
      setMetrics(prev => ({
        ...prev,
        cpu: {
          ...prev.cpu,
          usage: Math.min(100, Math.max(0, prev.cpu.usage + (Math.random() * 10 - 5))),
          load: prev.cpu.load.map(load => 
            Math.min(prev.cpu.cores, Math.max(0, load + (Math.random() * 0.5 - 0.25))).toFixed(2)
          ),
        },
        memory: {
          ...prev.memory,
          used: Math.min(prev.memory.total * 0.9, Math.max(prev.memory.total * 0.3, prev.memory.used + (Math.random() * 0.5 - 0.25))),
          free: prev.memory.total - Math.min(prev.memory.total * 0.9, Math.max(prev.memory.total * 0.3, prev.memory.used + (Math.random() * 0.5 - 0.25))),
          usage: (Math.min(prev.memory.total * 0.9, Math.max(prev.memory.total * 0.3, prev.memory.used + (Math.random() * 0.5 - 0.25))) / prev.memory.total) * 100,
        },
        network: {
          ...prev.network,
          in: Math.max(0, prev.network.in + (Math.random() * 2 - 1)).toFixed(2),
          out: Math.max(0, prev.network.out + (Math.random() * 1 - 0.5)).toFixed(2),
          connections: Math.max(0, prev.network.connections + (Math.random() * 10 - 5)),
        },
        uptime: prev.uptime + 30, // Add 30 seconds to uptime
        recentErrors: [
          ...(Math.random() > 0.7 ? [{
            id: Date.now(),
            message: 'Temporary network latency detected',
            timestamp: new Date().toISOString(),
            level: Math.random() > 0.5 ? 'warning' : 'error',
            source: ['api-server', 'worker-1', 'monitoring'][Math.floor(Math.random() * 3)],
          }] : []),
          ...prev.recentErrors.slice(0, 4),
        ],
      }));
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch system metrics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMetrics();
  };

  const getStatusColor = (value, warning = 80, critical = 95) => {
    if (value >= critical) return 'bg-red-500';
    if (value >= warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Health</h1>
          <p className="text-muted-foreground">
            Monitor your system's performance and status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-sm">
            <span>Time Range:</span>
            <select
              className="rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              disabled={isRefreshing}
            >
              <option value="1h">Last hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center space-x-2 text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span className="ml-2">Auto-refresh</span>
            </label>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <StatusBadge status="up" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Uptime: {formatUptime(metrics.uptime)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.cpu.usage.toFixed(1)}%</div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Load: {metrics.cpu.load[0].toFixed(2)}, {metrics.cpu.load[1].toFixed(2)}, {metrics.cpu.load[2].toFixed(2)}</span>
                    <span>{metrics.cpu.cores} cores</span>
                  </div>
                  <Progress 
                    value={metrics.cpu.usage} 
                    className="h-2"
                    indicatorClassName={getStatusColor(metrics.cpu.usage, 70, 90)}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.memory.usage.toFixed(1)}%</div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{formatBytes(metrics.memory.used * 1024 * 1024 * 1024)} / {metrics.memory.total} GB</span>
                    <span>{metrics.memory.free.toFixed(1)} GB free</span>
                  </div>
                  <Progress 
                    value={metrics.memory.usage} 
                    className="h-2"
                    indicatorClassName={getStatusColor(metrics.memory.usage, 80, 90)}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.disk.usage.toFixed(1)}%</div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{metrics.disk.used} GB / {metrics.disk.total} GB</span>
                    <span>{metrics.disk.free} GB free</span>
                  </div>
                  <Progress 
                    value={metrics.disk.usage} 
                    className="h-2"
                    indicatorClassName={getStatusColor(metrics.disk.usage, 80, 90)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Network</CardTitle>
                <CardDescription>Network activity and connections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Inbound</span>
                      <span className="font-medium">{metrics.network.in} MB/s</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (metrics.network.in / 50) * 100)} 
                      className="h-2 mt-1"
                      indicatorClassName="bg-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Outbound</span>
                      <span className="font-medium">{metrics.network.out} MB/s</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (metrics.network.out / 50) * 100)} 
                      className="h-2 mt-1"
                      indicatorClassName="bg-purple-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Connections</span>
                      <span className="font-medium">{metrics.network.connections}</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (metrics.network.connections / 200) * 100)} 
                      className="h-2 mt-1"
                      indicatorClassName="bg-green-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Errors</CardTitle>
                    <CardDescription>Most recent system errors and warnings</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {metrics.recentErrors.length > 0 ? (
                  <div className="space-y-4">
                    {metrics.recentErrors.map((error) => (
                      <div key={error.id} className="flex items-start">
                        <div className={`p-1 rounded-full mr-3 ${
                          error.level === 'error' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          <AlertCircle className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">{error.message}</h4>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(error.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {error.source}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No recent errors
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Metrics</CardTitle>
                <CardDescription>API and web request statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium">{metrics.performance.requests.successRate.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={metrics.performance.requests.successRate} 
                      className="h-2"
                      indicatorClassName={getStatusColor(100 - metrics.performance.requests.successRate, 5, 10)}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{metrics.performance.requests.success.toLocaleString()} successful</span>
                      <span>{metrics.performance.requests.error.toLocaleString()} errors</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {metrics.performance.requests.responseTime.avg}ms
                      </div>
                      <div className="text-xs text-muted-foreground">Avg. Response</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {metrics.performance.requests.responseTime.p95}ms
                      </div>
                      <div className="text-xs text-muted-foreground">p95</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {metrics.performance.requests.responseTime.p99}ms
                      </div>
                      <div className="text-xs text-muted-foreground">p99</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database</CardTitle>
                <CardDescription>Query performance and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Query Volume</span>
                      <span className="font-medium">
                        {metrics.performance.database.queries.toLocaleString()}/min
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, metrics.performance.database.queries / 5000 * 100)} 
                      className="h-2"
                      indicatorClassName={getStatusColor(metrics.performance.database.queries / 5000 * 100, 60, 80)}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Total queries</span>
                      <span>{metrics.performance.database.queries.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Slow Queries</div>
                      <div className="text-xl font-bold">
                        {metrics.performance.database.slowQueries.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({((metrics.performance.database.slowQueries / metrics.performance.database.queries) * 100).toFixed(2)}% of total)
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Avg. Query Time</div>
                      <div className="text-xl font-bold">
                        {metrics.performance.database.queryTime.toFixed(2)}ms
                      </div>
                      <div className="text-xs text-muted-foreground">
                        per query
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cache Performance</CardTitle>
              <CardDescription>Cache hit rates and efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {metrics.performance.cache.hitRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">Hit Rate</div>
                  <div className="mt-2">
                    <Progress 
                      value={metrics.performance.cache.hitRate} 
                      className="h-2"
                      indicatorClassName={getStatusColor(100 - metrics.performance.cache.hitRate, 20, 40)}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {metrics.performance.cache.items.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Cached Items</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {metrics.performance.cache.size} GB
                  </div>
                  <div className="text-sm text-muted-foreground">Cache Size</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Error Logs</CardTitle>
                  <CardDescription>Recent errors and exceptions in the system</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                    defaultValue="all"
                  >
                    <option value="all">All Errors</option>
                    <option value="error">Errors Only</option>
                    <option value="warning">Warnings</option>
                    <option value="info">Info</option>
                  </select>
                  <Button variant="outline" size="sm">
                    Export Logs
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <div className="bg-muted/50 p-2 border-b flex items-center text-sm text-muted-foreground">
                  <div className="w-24">Time</div>
                  <div className="w-20">Level</div>
                  <div className="flex-1">Message</div>
                  <div className="w-32">Source</div>
                  <div className="w-20">Actions</div>
                </div>
                {metrics.recentErrors.length > 0 ? (
                  <div className="divide-y">
                    {metrics.recentErrors.map((error) => (
                      <div key={error.id} className="flex items-center p-2 hover:bg-muted/50 text-sm">
                        <div className="w-24 text-xs text-muted-foreground">
                          {format(new Date(error.timestamp), 'MMM d, HH:mm')}
                        </div>
                        <div className="w-20">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            error.level === 'error' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {error.level.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 font-mono text-sm truncate">
                          {error.message}
                        </div>
                        <div className="w-32 text-sm text-muted-foreground">
                          {error.source}
                        </div>
                        <div className="w-20 flex justify-end">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search">
                              <circle cx="11" cy="11" r="8"/>
                              <path d="m21 21-4.3-4.3"/>
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No errors found in the selected time range.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Services</CardTitle>
              <CardDescription>Status of all system services and dependencies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.services.map((service) => (
                  <div key={service.name} className="flex items-center p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          service.status === 'up' ? 'bg-green-500' : 
                          service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <h3 className="font-medium">{service.name}</h3>
                        <StatusBadge status={service.status} />
                      </div>
                      {service.status === 'up' && service.responseTime && (
                        <div className="ml-5 mt-1 text-sm text-muted-foreground">
                          Response time: {service.responseTime}ms
                        </div>
                      )}
                      {service.status === 'degraded' && (
                        <div className="ml-5 mt-1 text-sm text-yellow-600">
                          Performance degraded - {service.responseTime}ms response time
                        </div>
                      )}
                      {service.status === 'down' && (
                        <div className="ml-5 mt-1 text-sm text-red-600">
                          Service unavailable
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Restart
                      </Button>
                      <Button variant="outline" size="sm">
                        Logs
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
              <CardDescription>Status of external services and integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Payment Gateway', status: 'up', lastChecked: '2 minutes ago' },
                  { name: 'Email Service', status: 'up', lastChecked: '1 minute ago' },
                  { name: 'Storage Service', status: 'degraded', lastChecked: '5 minutes ago' },
                  { name: 'Analytics', status: 'up', lastChecked: '3 minutes ago' },
                ].map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        service.status === 'up' ? 'bg-green-500' : 
                        service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">Last checked: {service.lastChecked}</p>
                      </div>
                    </div>
                    <StatusBadge status={service.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Settings</CardTitle>
              <CardDescription>Configure system monitoring and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Alert Thresholds</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">CPU Usage</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue="80"
                        min="1"
                        max="100"
                      />
                      <span className="text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Memory Usage</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue="85"
                        min="1"
                        max="100"
                      />
                      <span className="text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Disk Usage</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue="90"
                        min="1"
                        max="100"
                      />
                      <span className="text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Response Time</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue="500"
                        min="1"
                      />
                      <span className="text-sm">ms</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-medium">Alert Notifications</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="email-alerts"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      defaultChecked
                    />
                    <label htmlFor="email-alerts" className="text-sm font-medium">
                      Email Alerts
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="slack-alerts"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      defaultChecked
                    />
                    <label htmlFor="slack-alerts" className="text-sm font-medium">
                      Slack Notifications
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sms-alerts"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="sms-alerts" className="text-sm font-medium">
                      SMS Alerts
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-medium">Maintenance Mode</h3>
                <div className="rounded-md border p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Maintenance Mode</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Enable maintenance mode to take the system offline for updates or maintenance.</p>
                      </div>
                      <div className="mt-4">
                        <button
                          type="button"
                          className="inline-flex items-center rounded-md bg-yellow-100 px-3 py-2 text-sm font-semibold text-yellow-800 shadow-sm hover:bg-yellow-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
                        >
                          Enable Maintenance Mode
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="button">Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
