/**
 * 限流中间件
 *
 * 分两级限流：
 *   1. 全局限流 — 所有接口共享，默认 60 次/分钟
 *   2. AI 接口限流 — 仅 /api/ai/* 生效，默认 20 次/分钟
 *
 * 安全说明：限流 key 只使用 req.ip，绝不能读取客户端可控的请求头
 * （否则攻击者每次请求换一个 header 值即可绕过所有限流）。
 * 使用内存存储（适合单机部署），生产环境可切换 Redis。
 */
import rateLimit from 'express-rate-limit';
import config from './config.js';

// 全局限流
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: config.rateLimit.perMinute,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  // 只按 IP 限流（IP 不可被客户端伪造；需配合 app.set('trust proxy')）
  keyGenerator: (req) => req.ip,
});

// AI 接口限流（更严格）
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.rateLimit.aiPerMinute,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AI 生成请求过于频繁，每分钟最多 ' + config.rateLimit.aiPerMinute + ' 次',
    code: 'AI_RATE_LIMIT_EXCEEDED',
  },
  keyGenerator: (req) => 'ai:' + req.ip,
});

// 批量任务限流（每10分钟最多30次批量操作）
export const batchLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: '批量操作过于频繁，每10分钟最多30次',
    code: 'BATCH_RATE_LIMIT_EXCEEDED',
  },
  keyGenerator: (req) => 'batch:' + req.ip,
});
