/**
 * 缓存系统
 *
 * 双模式：
 *   1. 内存缓存（默认）— 适合开发/单机部署，进程重启后失效
 *   2. Redis 缓存（USE_REDIS=true）— 适合生产/多实例部署
 *
 * 缓存策略：
 *   - 以 URL + 请求体 hash 作为 key
 *   - GET 请求默认缓存，POST 请求需显式启用
 *   - AI 生成结果默认缓存1小时，避免重复调用消耗
 */
import config from './config.js';
import crypto from 'crypto';

// ── 内存缓存实现 ──
class MemoryCache {
  constructor() {
    this.store = new Map();
    // 每5分钟清理过期项
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, ttl = config.cache.ttl) {
    this.store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
  }

  async del(key) {
    this.store.delete(key);
  }

  async clear() {
    this.store.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) this.store.delete(key);
    }
  }

  size() {
    return this.store.size;
  }
}

// ── Redis 缓存实现 ──
class RedisCache {
  constructor() {
    this.client = null;
    this.initPromise = null;
  }

  async init() {
    if (this.client) return this.client;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const Redis = (await import('ioredis')).default;
      this.client = new Redis(config.cache.redisUrl, {
        retryStrategy: (times) => Math.min(times * 500, 2000),
        maxRetriesPerRequest: 1,
      });
      this.client.on('error', (err) => {
        console.error('[Cache] Redis error:', err.message);
      });
      this.client.on('connect', () => {
        console.log('[Cache] Redis connected');
      });
      return this.client;
    })();
    return this.initPromise;
  }

  async get(key) {
    try {
      await this.init();
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('[Cache] Redis get failed, fallback to null:', e.message);
      return null;
    }
  }

  async set(key, value, ttl = config.cache.ttl) {
    try {
      await this.init();
      await this.client.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (e) {
      console.warn('[Cache] Redis set failed:', e.message);
    }
  }

  async del(key) {
    try {
      await this.init();
      await this.client.del(key);
    } catch (e) {
      console.warn('[Cache] Redis del failed:', e.message);
    }
  }

  async clear() {
    try {
      await this.init();
      await this.client.flushdb();
    } catch (e) {
      console.warn('[Cache] Redis clear failed:', e.message);
    }
  }
}

// ── 统一缓存接口 ──
const cache = config.cache.useRedis ? new RedisCache() : new MemoryCache();
console.log(`[Cache] 使用 ${config.cache.useRedis ? 'Redis' : '内存'} 缓存，TTL=${config.cache.ttl}s`);

/**
 * 生成缓存 key
 */
export function makeCacheKey(req, extra = '') {
  const parts = [
    req.method,
    req.originalUrl,
    extra,
  ];
  // POST 请求包含 body
  if (req.method === 'POST' && req.body) {
    parts.push(JSON.stringify(req.body));
  }
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

/**
 * 缓存中间件
 * @param {object} options - { ttl: 自定义过期秒数, key: 自定义key生成函数 }
 */
export function cacheMiddleware(options = {}) {
  const ttl = options.ttl || config.cache.ttl;
  return async (req, res, next) => {
    // 只缓存 GET 请求（除非显式启用 POST 缓存）
    if (req.method !== 'GET' && !options.allowPost) return next();

    const key = options.key ? options.key(req) : makeCacheKey(req);
    try {
      const cached = await cache.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', key.slice(0, 8));
        return res.json(cached);
      }
      // 拦截 res.json 缓存结果
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && body) {
          cache.set(key, body, ttl).catch(e => console.warn('[Cache] set failed:', e.message));
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };
      next();
    } catch (e) {
      console.warn('[Cache] middleware error:', e.message);
      next();
    }
  };
}

/**
 * 手动操作缓存的工具函数
 */
export const cacheStore = {
  get: (key) => cache.get(key),
  set: (key, value, ttl) => cache.set(key, value, ttl),
  del: (key) => cache.del(key),
  clear: () => cache.clear(),
  size: () => cache.size?.() || -1,
};

export default cacheStore;
