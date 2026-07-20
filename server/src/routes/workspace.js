/**
 * 工作空间路由 — 多租户隔离
 *
 * 每个用户可以创建多个工作空间（数量受订阅方案限制），
 * 工作空间用于组织项目和生成历史。
 */
import express from 'express';
import { Workspace, Usage, PLANS } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();

// 列出当前用户的工作空间
router.get('/', requireAuth, (req, res) => {
  const workspaces = Workspace.findByUserId(req.user.id);
  const limit = PLANS[req.user.plan].workspaces;
  res.json({
    success: true,
    workspaces,
    limit: limit === -1 ? null : limit,
    canCreate: limit === -1 || workspaces.length < limit,
  });
});

// 创建工作空间
router.post('/', requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: '工作空间名称必填' });
  }
  const existing = Workspace.findByUserId(req.user.id);
  const limit = PLANS[req.user.plan].workspaces;
  if (limit !== -1 && existing.length >= limit) {
    return res.status(403).json({
      success: false,
      error: `${PLANS[req.user.plan].name}最多 ${limit} 个工作空间，请升级订阅`,
      code: 'WORKSPACE_LIMIT',
    });
  }
  const ws = Workspace.create(req.user.id, name);
  res.json({ success: true, workspace: ws });
});

// 获取工作空间详情
router.get('/:id', requireAuth, (req, res) => {
  const ws = Workspace.findById(parseInt(req.params.id));
  if (!ws || ws.userId !== req.user.id) {
    return res.status(404).json({ success: false, error: '工作空间不存在' });
  }
  const usageStats = Usage.getStats(req.user.id);
  res.json({ success: true, workspace: ws, usage: usageStats });
});

// 获取用量统计
router.get('/:id/usage', requireAuth, (req, res) => {
  const ws = Workspace.findById(parseInt(req.params.id));
  if (!ws || ws.userId !== req.user.id) {
    return res.status(404).json({ success: false, error: '工作空间不存在' });
  }
  const stats = Usage.getStats(req.user.id);
  res.json({ success: true, usage: stats, plan: PLANS[req.user.plan] });
});

export default router;
