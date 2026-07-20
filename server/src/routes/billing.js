/**
 * 订阅与用量路由 — 计费、用量统计、方案管理
 */
import express from 'express';
import { Usage, PLANS, User } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();

// 获取所有订阅方案
router.get('/plans', (req, res) => {
  res.json({ success: true, plans: PLANS });
});

// 获取当前用户用量
router.get('/usage', requireAuth, (req, res) => {
  const stats = Usage.getStats(req.user.id);
  const plan = PLANS[req.user.plan];
  res.json({
    success: true,
    usage: stats,
    plan,
    remaining: plan.dailyLimit === -1 ? null : Math.max(0, plan.dailyLimit - stats.todayCount),
  });
});

// 获取用量趋势（最近30天）
router.get('/usage/trend', requireAuth, (req, res) => {
  const stats = Usage.getStats(req.user.id);
  res.json({ success: true, trend: stats.last7Days, byProvider: stats.byProvider });
});

// 升级/切换订阅方案
router.post('/subscribe', requireAuth, (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) {
    return res.status(400).json({ success: false, error: '无效的方案' });
  }
  const result = User.updatePlan(req.user.id, plan);
  if (result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json({
    success: true,
    user: result.user,
    plan: PLANS[plan],
    message: `订阅已更新为 ${PLANS[plan].name}`,
  });
});

// 管理员：获取平台总览（简化版，生产环境应加管理员权限校验）
router.get('/admin/overview', requireAuth, (req, res) => {
  if (req.user.id !== 1) {
    return res.status(403).json({ success: false, error: '需要管理员权限' });
  }
  const stats = Usage.getStats(req.user.id);
  res.json({
    success: true,
    platform: {
      totalUsers: 1, // 简化
      activeToday: 1,
      totalGenerations: stats.totalCount,
    },
  });
});

export default router;
