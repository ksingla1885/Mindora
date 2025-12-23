import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import os from 'os';
import fs from 'fs/promises';

// In-memory storage for demo purposes
// In a real app, you'd use a database or monitoring service
let metricsData = {
  timestamp: Date.now(),
  cpu: {
    usage: 0,
    cores: os.cpus().length,
    load: os.loadavg(),
  },
  memory: {
    total: Math.floor(os.totalmem() / (1024 * 1024 * 1024)), // GB
    free: Math.floor(os.freemem() / (1024 * 1024 * 1024)),   // GB
  },
  disk: {
    total: 500, // GB - This would come from actual disk stats in production
    free: 320,  // GB
  },
  network: {
    interfaces: os.networkInterfaces(),
  },
  uptime: os.uptime(),
  services: [
    { name: 'Web Server', status: 'up', responseTime: 45 },
    { name: 'Database', status: 'up', responseTime: 12 },
    { name: 'Cache', status: 'degraded', responseTime: 8 },
    { name: 'Background Jobs', status: 'up', responseTime: 2 },
    { name: 'Search', status: 'down', responseTime: 0 },
  ],
};

// Update metrics every 5 seconds
setInterval(updateMetrics, 5000);

async function updateMetrics() {
  try {
    const cpuUsage = await getCpuUsage();
    const diskUsage = await getDiskUsage();
    
    metricsData = {
      ...metricsData,
      timestamp: Date.now(),
      cpu: {
        ...metricsData.cpu,
        usage: cpuUsage,
        load: os.loadavg(),
      },
      memory: {
        ...metricsData.memory,
        free: Math.floor(os.freemem() / (1024 * 1024 * 1024)),
      },
      disk: {
        ...metricsData.disk,
        ...diskUsage,
      },
      uptime: os.uptime(),
    };
  } catch (error) {
    console.error('Error updating metrics:', error);
  }
}

async function getCpuUsage() {
  const stats1 = await getCpuAverage();
  await new Promise(resolve => setTimeout(resolve, 1000));
  const stats2 = await getCpuAverage();
  
  const idleDiff = stats2.idle - stats1.idle;
  const totalDiff = stats2.total - stats1.total;
  
  return Math.min(100, Math.max(0, 100 - (idleDiff / totalDiff) * 100));
}

function getCpuAverage() {
  return new Promise((resolve) => {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach((cpu) => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    resolve({ idle: totalIdle / cpus.length, total: totalTick / cpus.length });
  });
}

async function getDiskUsage() {
  try {
    // In a real app, you'd use a proper disk usage library
    // This is a simplified version for demo purposes
    const stats = await fs.stat('/');
    const total = 500 * 1024 * 1024 * 1024; // 500GB total
    const free = 320 * 1024 * 1024 * 1024;  // 320GB free
    const used = total - free;
    
    return {
      total: Math.floor(total / (1024 * 1024 * 1024)),
      free: Math.floor(free / (1024 * 1024 * 1024)),
      used: Math.floor(used / (1024 * 1024 * 1024)),
      usage: Math.floor((used / total) * 100),
    };
  } catch (error) {
    console.error('Error getting disk usage:', error);
    return {
      total: 500,
      free: 320,
      used: 180,
      usage: 36,
    };
  }
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  // Check if user is admin
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('range') || '24h';
  
  // In a real app, you'd filter metrics based on the time range
  // For this demo, we'll just return the current metrics
  
  return NextResponse.json({
    success: true,
    data: {
      ...metricsData,
      // Add some random variation for demo purposes
      cpu: {
        ...metricsData.cpu,
        usage: Math.min(100, Math.max(0, metricsData.cpu.usage + (Math.random() * 10 - 5))),
      },
      memory: {
        ...metricsData.memory,
        used: metricsData.memory.total - metricsData.memory.free,
        usage: ((metricsData.memory.total - metricsData.memory.free) / metricsData.memory.total) * 100,
      },
      disk: {
        ...metricsData.disk,
        used: metricsData.disk.total - metricsData.disk.free,
        usage: ((metricsData.disk.total - metricsData.disk.free) / metricsData.disk.total) * 100,
      },
      network: {
        ...metricsData.network,
        // Add some random network stats for demo
        in: (Math.random() * 20).toFixed(2),
        out: (Math.random() * 15).toFixed(2),
        connections: Math.floor(Math.random() * 200) + 50,
      },
      // Add some recent errors for demo
      recentErrors: [
        ...(Math.random() > 0.7 ? [{
          id: Date.now(),
          message: 'Temporary network latency detected',
          timestamp: new Date().toISOString(),
          level: Math.random() > 0.5 ? 'warning' : 'error',
          source: ['api-server', 'worker-1', 'monitoring'][Math.floor(Math.random() * 3)],
        }] : []),
        ...(metricsData.recentErrors || []).slice(0, 4),
      ],
      // Add performance metrics
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
    },
    timestamp: new Date().toISOString(),
  });
}

// In a real app, you'd also have endpoints for:
// - Getting historical metrics
// - Getting detailed service status
// - Managing alerts and notifications
// - Managing maintenance windows
// - And more...
