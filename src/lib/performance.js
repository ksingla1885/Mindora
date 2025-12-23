import { metrics } from '@opentelemetry/api';

class PerformanceMonitor {
  constructor() {
    this.meter = metrics.getMeter('dpp-performance');;
    this.metrics = {};
    this.initializeMetrics();
  }

  initializeMetrics() {
    // Request duration histogram
    this.metrics.requestDuration = this.meter.createHistogram('http_request_duration_seconds', {
      description: 'Duration of HTTP requests in seconds',
      unit: 's',
      valueType: 1, // DOUBLE
    });

    // Database query counter
    this.metrics.dbQueries = this.meter.createCounter('db_queries_total', {
      description: 'Total number of database queries',
    });

    // Cache hit/miss counters
    this.metrics.cacheHits = this.meter.createCounter('cache_hits_total', {
      description: 'Total number of cache hits',
    });

    this.metrics.cacheMisses = this.meter.createCounter('cache_misses_total', {
      description: 'Total number of cache misses',
    });

    // Error counter
    this.metrics.errors = this.meter.createCounter('errors_total', {
      description: 'Total number of errors',
    });
  }

  startRequestTimer() {
    const start = process.hrtime();
    return () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      const duration = seconds + nanoseconds / 1e9;
      this.metrics.requestDuration.record(duration);
      return duration;
    };
  }

  recordDbQuery() {
    this.metrics.dbQueries.add(1);
  }

  recordCacheHit() {
    this.metrics.cacheHits.add(1);
  }

  recordCacheMiss() {
    this.metrics.cacheMisses.add(1);
  }

  recordError(error) {
    this.metrics.errors.add(1, { error: error?.message || 'unknown' });
  }

  // Performance monitoring middleware for Express/Next.js
  getMiddleware() {
    return (req, res, next) => {
      const endTimer = this.startRequestTimer();
      
      res.on('finish', () => {
        const duration = endTimer();
        const { method, originalUrl, statusCode } = req;
        
        console.log(`${method} ${originalUrl} ${statusCode} - ${duration.toFixed(3)}s`);
        
        // Record metrics
        this.metrics.requestDuration.record(duration, {
          method,
          route: originalUrl.split('?')[0],
          status_code: statusCode,
        });
      });
      
      next();
    };
  }
}

// Create a singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export common metrics
export const { 
  startRequestTimer, 
  recordDbQuery, 
  recordCacheHit, 
  recordCacheMiss, 
  recordError 
} = performanceMonitor;

// Export the middleware
export const performanceMiddleware = performanceMonitor.getMiddleware();
