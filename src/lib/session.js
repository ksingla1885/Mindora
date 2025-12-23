import { Redis } from 'ioredis';
import { RedisStore as BaseStore, RedisStoreOptions } from 'next-session/lib/store';
import { Session } from 'next-session';

export class RedisStore extends BaseStore {
  private redis: Redis;

  constructor(redisClient: Redis, options?: RedisStoreOptions) {
    super(options);
    this.redis = redisClient;
  }

  async get(sid: string): Promise<Session | null> {
    const data = await this.redis.get(this.prefix + sid);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (err) {
      console.error('Error parsing session data:', err);
      return null;
    }
  }

  async set(sid: string, session: Session) {
    try {
      const json = JSON.stringify(session);
      await this.redis.set(
        this.prefix + sid,
        json,
        'EX',
        this.ttl
      );
    } catch (err) {
      console.error('Error setting session data:', err);
    }
  }

  async destroy(sid: string) {
    try {
      await this.redis.del(this.prefix + sid);
    } catch (err) {
      console.error('Error destroying session:', err);
    }
  }

  async touch(sid: string, session: Session) {
    try {
      await this.redis.expire(this.prefix + sid, this.ttl);
    } catch (err) {
      console.error('Error touching session:', err);
    }
  }
}
