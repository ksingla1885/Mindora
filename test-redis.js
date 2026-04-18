require('dotenv').config();
const { Redis: UpstashRedis } = require('@upstash/redis');
const Redis = require('ioredis');

async function testRedis() {
  console.log('--- Redis Connection Test ---');
  
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const redisUrl = process.env.REDIS_URL;
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT;
  const password = process.env.REDIS_PASSWORD;

  // 1. Test Upstash REST
  if (restUrl && restToken) {
    console.log('\n[Upstash REST] Testing connection...');
    try {
      const upstash = new UpstashRedis({
        url: restUrl,
        token: restToken,
      });
      const start = Date.now();
      await upstash.set('test:connection', 'ok', { ex: 60 });
      const result = await upstash.get('test:connection');
      console.log(`✅ REST Success! (Response: ${result}, Time: ${Date.now() - start}ms)`);
    } catch (err) {
      console.error('❌ REST Failed:', err.message);
    }
  } else {
    console.log('\n[Upstash REST] Skipped (UPSTASH_REDIS_REST_URL or TOKEN missing)');
  }

  // 2. Test ioredis (TCP)
  if (redisUrl || (host && port)) {
    console.log('\n[ioredis TCP] Testing connection...');
    let client;
    try {
      const options = {
        retryStrategy: () => null, // Don't retry for this test
        maxRetriesPerRequest: 0,
        connectTimeout: 5000,
      };

      if (redisUrl) {
        console.log(`Connecting via URL: ${redisUrl.split('@')[1] || redisUrl}`);
        if (redisUrl.startsWith('rediss://')) {
          options.tls = { rejectUnauthorized: false };
        }
        client = new Redis(redisUrl, options);
      } else {
        console.log(`Connecting via Host: ${host}:${port}`);
        if (process.env.REDIS_TLS === 'true') {
          options.tls = { rejectUnauthorized: false };
        }
        client = new Redis({
          host,
          port: parseInt(port),
          password,
          ...options
        });
      }

      const start = Date.now();
      await client.set('test:tcp', 'ok', 'EX', 60);
      const result = await client.get('test:tcp');
      console.log(`✅ TCP Success! (Response: ${result}, Time: ${Date.now() - start}ms)`);
      await client.quit();
    } catch (err) {
      console.error('❌ TCP Failed:', err.message);
      if (client) client.disconnect();
    }
  } else {
    console.log('\n[ioredis TCP] Skipped (REDIS_URL or REDIS_HOST missing)');
  }

  console.log('\n--- Test Complete ---');
}

testRedis().catch(err => {
  console.error('Test Script Error:', err);
  process.exit(1);
});
