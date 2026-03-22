const Redis = require('ioredis');
require('dotenv').config();

const options = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  keyPrefix: process.env.REDIS_PREFIX || 'mindora:',
  retryStrategy: (times) => {
    if (times > 3) return null; // Stop after 3 attempts
    return Math.min(times * 200, 3000);
  },
};

console.log(`Connecting to Redis at ${options.host}:${options.port}...`);

const redis = new Redis(options);

async function testConnection() {
  try {
    const ping = await redis.ping();
    console.log('✅ Connection Successful! PING Response:', ping);
    
    // Test set/get
    await redis.set('test_key', 'Hello Mindora Redis!');
    const val = await redis.get('test_key');
    console.log('✅ Local test set/get successful! Value:', val);
    
    // Quick cleanup
    await redis.del('test_key');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Redis Connection Failed!');
    console.error('Error Details:', err.message);
    
    if (err.message.includes('ECONNREFUSED')) {
      console.log('\nHint: Is Redis running? Use one of these commands to start it locally:');
      console.log('  Docker: docker run -d --name mindora-redis -p 6379:6379 redis');
      console.log('  WSL: sudo service redis-server start');
    }
    
    process.exit(1);
  }
}

testConnection();
