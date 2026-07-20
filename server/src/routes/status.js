/**
 * 系统状态路由
 * 提供健康检查、缓存状态、Key 配置状态查询
 *
 * 修复：/api/cache/clear 添加管理员密钥鉴权（防止匿名清空缓存）
 */
import { Router } from 'express';
import { listConfiguredProviders } from '../keyManager.js';
import { cacheStore } from '../cache.js';

const router = Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    version: '2.0.0',
    platform: 'CoXoF Ai SaaS',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
  });
});

// 已配置的 API 提供商列表（不返回 Key）
router.get('/providers', (req, res) => {
  res.json({
    success: true,
    providers: listConfiguredProviders(req),
  });
});

// 缓存状态
router.get('/cache/stats', (req, res) => {
  res.json({
    success: true,
    size: cacheStore.size(),
  });
});

// 清空缓存（需管理员密钥鉴权）
router.post('/cache/clear', (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  // 如果配置了 ADMIN_SECRET，则必须提供匹配的密钥
  if (adminSecret) {
    const { secret } = req.body || {};
    if (secret !== adminSecret) {
      return res.status(403).json({ success: false, error: '需要管理员密钥' });
    }
  }
  cacheStore.clear();
  res.json({ success: true, message: '缓存已清空' });
});

export default router;
