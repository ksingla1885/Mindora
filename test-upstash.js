const { Redis } = require('@upstash/redis');
require('dotenv').config();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function testConnection() {
  try {
    console.log('Connecting to Upstash Redis REST...');
    const ping = await redis.ping();
    console.log('✅ Connection Successful! PING Response:', ping);
    
    // Test set/get
    await redis.set('test_key', 'Hello Mindora Upstash!');
    const val = await redis.get('test_key');
    console.log('✅ Remote test set/get successful! Value:', val);
    
    // Cleanup
    await redis.del('test_key');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Upstash Redis Connection Failed!');
    console.error('Error Details:', err.message);
    process.exit(1);
  }
}

testConnection();
