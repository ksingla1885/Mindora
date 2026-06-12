const dotenv = require('dotenv');
dotenv.config();

const { Redis: UpstashRedis } = require('@upstash/redis');
const IoRedis = require('ioredis');

async function testUpstashRest() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.log('\n❌ Upstash REST client details not fully configured in .env (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).');
    return;
  }

  console.log(`\nTesting Upstash REST client...`);
  console.log(`URL: ${url}`);
  try {
    const client = new UpstashRedis({ url, token });
    const pingRes = await client.ping();
    console.log(`🟢 Connection Successful! Ping response:`, pingRes);
    
    // Test write/read
    await client.set('mindora:test_key', 'REST_OK', { ex: 60 });
    const val = await client.get('mindora:test_key');
    console.log(`🟢 Write/Read Successful! Get 'mindora:test_key' => "${val}"`);
  } catch (error) {
    console.error(`❌ Upstash REST connection failed:`, error.message);
  }
}

async function testIoRedis() {
  const redisUrl = process.env.REDIS_URL;
  let redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT || 6379;
  const redisPassword = process.env.REDIS_PASSWORD;
  const redisTls = process.env.REDIS_TLS === 'true';

  if (!redisUrl && !redisHost) {
    console.log('\n❌ ioredis config details not fully configured in .env (REDIS_URL or REDIS_HOST).');
    return;
  }

  console.log(`\nTesting ioredis client...`);
  let client;

  if (redisUrl) {
    console.log(`Using REDIS_URL: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`); // hide password
    const options = {
      retryStrategy: () => null, // don't retry infinitely on failure
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    };
    if (redisUrl.startsWith('rediss://')) {
      options.tls = { rejectUnauthorized: false };
    }
    client = new IoRedis(redisUrl, options);
  } else {
    // If user has https:// in host, let's warn them
    if (redisHost.startsWith('http://') || redisHost.startsWith('https://')) {
      console.warn(`⚠️  WARNING: REDIS_HOST contains 'http://' or 'https://'. For TCP Redis connections, it should be the raw domain/IP only (e.g. vast-louse-139864.upstash.io).`);
    }
    console.log(`Using discrete host: ${redisHost}:${redisPort} (TLS: ${redisTls})`);
    const options = {
      host: redisHost,
      port: parseInt(redisPort, 10),
      password: redisPassword || undefined,
      retryStrategy: () => null,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    };
    if (redisTls) {
      options.tls = { rejectUnauthorized: false };
    }
    client = new IoRedis(options);
  }

  try {
    await client.connect(); // since we might have lazyConnect or need to catch connect error
  } catch (err) {
    // Already handled/handled by event listener
  }

  try {
    const pingRes = await client.ping();
    console.log(`🟢 Connection Successful! Ping response:`, pingRes);
    
    // Test write/read
    await client.set('mindora:test_key_tcp', 'TCP_OK', 'EX', 60);
    const val = await client.get('mindora:test_key_tcp');
    console.log(`🟢 Write/Read Successful! Get 'mindora:test_key_tcp' => "${val}"`);
  } catch (error) {
    console.error(`❌ ioredis connection failed:`, error.message);
  } finally {
    try {
      await client.quit();
    } catch (e) {}
  }
}

async function run() {
  console.log('--- STARTING REDIS CONNECTION DIAGNOSTICS ---');
  await testUpstashRest();
  await testIoRedis();
  console.log('\n--- DIAGNOSTICS COMPLETE ---');
}

run();
