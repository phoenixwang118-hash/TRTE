/**
 * CoXoF Ai SaaS — 后端服务主入口
 *
 * 功能：
 *   - 用户认证（JWT）+ 多租户工作空间
 *   - 订阅管理（Free / Pro / Enterprise）
 *   - DIY 工作流系统
 *   - 统一 API Key 管理（用户自有 + 平台级）
 *   - 限流（全局 + AI + 按订阅方案）
 *   - 缓存（内存/Redis）
 *   - AI API 代理（6 大引擎）
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './src/config.js';
import { globalLimiter, aiLimiter, batchLimiter } from './src/rateLimit.js';
import { applyGlobalProxy } from './src/proxyAgent.js';
import { optionalAuth } from './src/auth.js';
import { Usage } from './src/db.js';

// 应用全局代理
applyGlobalProxy();

// 路由
import statusRouter from './src/routes/status.js';
import geminiRouter from './src/routes/gemini.js';
import bflRouter from './src/routes/bfl.js';
import photoroomRouter from './src/routes/photoroom.js';
import deepseekRouter from './src/routes/deepseek.js';
import doubaoRouter from './src/routes/doubao.js';
import ideogramRouter from './src/routes/ideogram.js';

// SaaS 路由
import authRouter from './src/routes/auth.js';
import workspaceRouter from './src/routes/workspace.js';
import workflowRouter from './src/routes/workflow.js';
import billingRouter from './src/routes/billing.js';
import marketplaceRouter from './src/routes/marketplace.js';

const app = express();

// ── 信任一级反向代理 ──
app.set('trust proxy', 1);

// ── 基础中间件 ──
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(config.logLevel));

// ── 全局限流 ──
app.use(globalLimiter);

// ── 首页 ──
app.get('/', (req, res) => {
  res.json({
    name: 'CoXoF Ai SaaS API',
    version: '2.0.0',
    description: 'AI 设计 SaaS 平台 — 多租户 + DIY 工作流',
    docs: '/api/health',
    auth: '/api/auth/register',
  });
});

// ── 系统状态 ──
app.use('/api', statusRouter);

// ── SaaS 路由（认证/工作空间/工作流/计费）──
app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspaceRouter);
app.use('/api/workflows', workflowRouter);
app.use('/api/billing', billingRouter);
app.use('/api/marketplace', marketplaceRouter);

// ── AI 接口（统一加 optionalAuth + 用量追踪）──
// 使用 optionalAuth 兼容未登录用户（旧前端透传 Key 模式）
app.use('/api/ai/gemini', optionalAuth, aiLimiter, (req, res, next) => {
  const start = Date.now();
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200 && body?.success && req.user) {
      Usage.log(req.user.id, 'gemini', req.path, 1);
    }
    return originalJson(body);
  };
  next();
}, geminiRouter);

app.use('/api/ai/bfl', optionalAuth, aiLimiter, batchLimiter, (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200 && body?.success && req.user) {
      Usage.log(req.user.id, 'bfl', req.path, 1);
    }
    return originalJson(body);
  };
  next();
}, bflRouter);

app.use('/api/ai/photoroom', optionalAuth, aiLimiter, (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200 && body?.success && req.user) {
      Usage.log(req.user.id, 'photoroom', req.path, 1);
    }
    return originalJson(body);
  };
  next();
}, photoroomRouter);

app.use('/api/ai/deepseek', optionalAuth, aiLimiter, (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200 && body?.success && req.user) {
      Usage.log(req.user.id, 'deepseek', req.path, 1);
    }
    return originalJson(body);
  };
  next();
}, deepseekRouter);

app.use('/api/ai/doubao', optionalAuth, aiLimiter, (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200 && body?.success && req.user) {
      Usage.log(req.user.id, 'doubao', req.path, 1);
    }
    return originalJson(body);
  };
  next();
}, doubaoRouter);

app.use('/api/ai/ideogram', optionalAuth, aiLimiter, (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200 && body?.success && req.user) {
      Usage.log(req.user.id, 'ideogram', req.path, 1);
    }
    return originalJson(body);
  };
  next();
}, ideogramRouter);

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ success: false, error: '接口不存在: ' + req.method + ' ' + req.path });
});

// ── 全局错误处理 ──
app.use((err, req, res, next) => {
  console.error('[Server] unhandled error:', err);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

// ── 启动 ──
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log('┌──────────────────────────────────────────────────┐');
  console.log('│  CoXoF Ai SaaS Platform v2.0                    │');
  console.log('│  端口: ' + PORT + '                                        │');
  console.log('│  环境: ' + config.nodeEnv.padEnd(10) + '                             │');
  console.log('│  认证: JWT (7天有效期)                            │');
  console.log('│  缓存: ' + (config.cache.useRedis ? 'Redis' : '内存') + '                                      │');
  console.log('│  限流: ' + config.rateLimit.perMinute + '/分钟, AI ' + config.rateLimit.aiPerMinute + '/分钟             │');
  console.log('└──────────────────────────────────────────────────┘');
  console.log('\n已配置的 API 提供商:', Object.entries(config.apiKeys).filter(([_, v]) => v).map(([k]) => k).join(', ') || '无（请配置 .env）');
  console.log('SaaS 路由: /api/auth, /api/workspaces, /api/workflows, /api/billing, /api/marketplace\n');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n[Server] 收到 SIGTERM，正在关闭...');
  server.close(() => { process.exit(0); });
});
process.on('SIGINT', () => {
  console.log('\n[Server] 收到 Ctrl+C，正在关闭...');
  server.close(() => { process.exit(0); });
});

export default app;
