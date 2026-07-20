/**
 * 认证路由 — 注册 / 登录 / 个人信息 / API Key 管理
 */
import express from 'express';
import { User, ApiKey, genToken, PLANS } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();

// ── 注册 ──
router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: '邮箱和密码必填' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: '密码至少 6 位' });
  }
  const result = User.create(email, password, name);
  if (result.error) {
    return res.status(409).json({ success: false, error: result.error });
  }
  const token = genToken(result.user.id);
  res.json({
    success: true,
    token,
    user: result.user,
    plan: PLANS[result.user.plan],
  });
});

// ── 登录 ──
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: '邮箱和密码必填' });
  }
  const result = User.verify(email, password);
  if (result.error) {
    return res.status(401).json({ success: false, error: result.error });
  }
  const token = genToken(result.user.id);
  res.json({
    success: true,
    token,
    user: User.toSafe(result.user),
    plan: PLANS[result.user.plan],
  });
});

// ── 获取当前用户信息 ──
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: User.toSafe(req.user),
    plan: PLANS[req.user.plan],
  });
});

// ── 更新个人信息 ──
router.put('/me', requireAuth, (req, res) => {
  const { name } = req.body;
  if (name) {
    req.user.name = name;
  }
  res.json({ success: true, user: User.toSafe(req.user) });
});

// ── 获取/设置 API Key ──
router.get('/keys', requireAuth, (req, res) => {
  res.json({ success: true, keys: ApiKey.list(req.user.id) });
});

router.post('/keys', requireAuth, (req, res) => {
  const { provider, key } = req.body;
  if (!provider || !key) {
    return res.status(400).json({ success: false, error: 'provider 和 key 必填' });
  }
  ApiKey.set(req.user.id, provider, key);
  res.json({ success: true, message: `${provider} API Key 已保存` });
});

router.delete('/keys/:provider', requireAuth, (req, res) => {
  ApiKey.remove(req.user.id, req.params.provider);
  res.json({ success: true, message: `${req.params.provider} API Key 已删除` });
});

// ── 获取订阅方案列表 ──
router.get('/plans', (req, res) => {
  res.json({ success: true, plans: PLANS });
});

// ── 升级订阅 ──
router.post('/subscribe', requireAuth, (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) {
    return res.status(400).json({ success: false, error: '无效的订阅方案' });
  }
  const result = User.updatePlan(req.user.id, plan);
  if (result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json({
    success: true,
    user: result.user,
    plan: PLANS[plan],
    message: `已升级到 ${PLANS[plan].name}`,
  });
});

export default router;
