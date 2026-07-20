/**
 * 认证中间件 — JWT 验证 + 用户注入
 *
 * 两种模式：
 *   1. requireAuth — 必须登录才能访问（AI 接口、工作流等）
 *   2. optionalAuth — 登录可选（公开接口，登录后享受更高限额）
 *
 * Token 格式：Authorization: Bearer <token>
 */
import { verifyToken, User, PLANS, Usage } from './db.js';

// 从请求中提取并验证 token
function extractUser(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) return null;
  return User.findById(payload.uid);
}

// 必须登录
export function requireAuth(req, res, next) {
  const user = extractUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: '请先登录', code: 'UNAUTHORIZED' });
  }
  req.user = user;
  req.plan = PLANS[user.plan] || PLANS.free;
  next();
}

// 可选登录（兼容旧前端无认证直接调用）
export function optionalAuth(req, res, next) {
  const user = extractUser(req);
  if (user) {
    req.user = user;
    req.plan = PLANS[user.plan] || PLANS.free;
  } else {
    req.user = null;
    req.plan = PLANS.free;
  }
  next();
}

// 检查订阅方案是否有权使用某引擎
export function checkEngineAccess(engine) {
  return (req, res, next) => {
    const allowedEngines = req.plan?.engines || ['gemini', 'bfl'];
    if (!allowedEngines.includes(engine)) {
      return res.status(403).json({
        success: false,
        error: `当前订阅方案不支持 ${engine} 引擎，请升级到专业版`,
        code: 'PLAN_LIMITATION',
      });
    }
    next();
  };
}

// 检查每日用量限制
export function checkUsageLimit(req, res, next) {
  if (!req.user) return next(); // 未登录用户走 IP 限流
  const todayCount = Usage.getTodayCount(req.user.id);
  const dailyLimit = req.plan.dailyLimit;
  if (dailyLimit > 0 && todayCount >= dailyLimit) {
    return res.status(429).json({
      success: false,
      error: `今日已使用 ${todayCount} 次，达到 ${req.plan.name} 限额 (${dailyLimit}/天)`,
      code: 'DAILY_LIMIT_EXCEEDED',
      upgradeUrl: '/pricing',
    });
  }
  next();
}

// 检查工作流功能权限
export function requireWorkflowAccess(req, res, next) {
  if (!req.plan?.workflowEnabled) {
    return res.status(403).json({
      success: false,
      error: 'DIY 工作流是专业版功能，请升级订阅',
      code: 'PLAN_LIMITATION',
      upgradeUrl: '/pricing',
    });
  }
  next();
}
