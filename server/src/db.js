/**
 * SaaS 数据层 — 基于 JSON 文件的轻量数据库
 *
 * 设计原则：
 *   1. 零外部依赖（纯 Node.js fs + crypto）
 *   2. 原子写入（写入临时文件后 rename，防止数据损坏）
 *   3. 内存缓存 + 延迟写入（高频读取直接走内存，写入异步落盘）
 *   4. 生产环境可平滑迁移到 PostgreSQL/MongoDB
 *
 * 数据表：
 *   - users: 用户账号
 *   - workspaces: 工作空间（多租户隔离）
 *   - api_keys: 用户自有 API Key
 *   - usage_logs: 用量记录
 *   - workflows: DIY 工作流定义
 *   - workflow_runs: 工作流执行记录
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// 内存数据
let db = {
  users: [],
  workspaces: [],
  api_keys: [],
  usage_logs: [],
  workflows: [],
  workflow_runs: [],
  products: [],
  designers: [],
  // ── COXOF AI DIY V3 新增表 ──
  designs: [],                 // 设计稿（用户 AI 生成图）
  design_versions: [],         // 设计稿版本
  carts: [],                   // 购物车
  cart_items: [],              // 购物车条目
  orders: [],                  // 订单
  order_items: [],             // 订单条目
  addresses: [],               // 收货地址
  payments: [],                // 支付记录
  creator_products: [],        // 设计者商品
  share_links: [],             // 分享链接
  creator_orders: [],          // 设计者侧订单视图
  earning_transactions: [],    // 佣金流水
  _meta: {
    nextUserId: 1, nextWorkspaceId: 1, nextUsageId: 1, nextWorkflowId: 1, nextRunId: 1,
    nextProductId: 1, nextDesignerId: 1,
    nextDesignId: 1, nextCartId: 1, nextCartItemId: 1, nextOrderId: 1, nextOrderItemId: 1,
    nextAddressId: 1, nextPaymentId: 1, nextCreatorProductId: 1, nextShareLinkId: 1, nextEarningId: 1,
  },
};

let writeTimer = null;

// 初始化：从文件加载数据
function load() {
  try {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      db = { ...db, ...parsed };
      // 深合并 _meta：确保新增的计数器键有默认值（旧库可能缺 nextProductId 等）
      db._meta = {
        nextUserId: 1, nextWorkspaceId: 1, nextUsageId: 1, nextWorkflowId: 1, nextRunId: 1,
        nextProductId: 1, nextDesignerId: 1,
        nextDesignId: 1, nextCartId: 1, nextCartItemId: 1, nextOrderId: 1, nextOrderItemId: 1,
        nextAddressId: 1, nextPaymentId: 1, nextCreatorProductId: 1, nextShareLinkId: 1, nextEarningId: 1,
        ...(parsed._meta || {}),
      };
      console.log('[DB] 数据已加载:', db.users.length, '用户,', db.workflows.length, '工作流,', db.products.length, '商品');
    } else {
      save();
      console.log('[DB] 初始化新数据库');
    }
  } catch (e) {
    console.error('[DB] 加载失败:', e.message);
    save();
  }
}

// 原子保存：先写临时文件，再 rename
function save() {
  try {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    const tmpFile = DB_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (e) {
    console.error('[DB] 保存失败:', e.message);
  }
}

// 延迟保存（合并短时间内多次写入）
function scheduleSave() {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    save();
  }, 500);
}

load();

// ── 工具函数 ──
function genId(prefix = '') {
  return prefix + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verify = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === verify;
}

function genToken(userId) {
  const payload = { uid: userId, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  const secret = process.env.JWT_SECRET || 'coxof-ai-saas-secret-2026';
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return data + '.' + sig;
}

function verifyToken(token) {
  try {
    const [data, sig] = token.split('.');
    const secret = process.env.JWT_SECRET || 'coxof-ai-saas-secret-2026';
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── 订阅方案定义 ──
export const PLANS = {
  free: {
    name: '免费版',
    price: 0,
    dailyLimit: 20,
    workspaces: 1,
    engines: ['gemini', 'bfl'],
    workflowEnabled: false,
    features: ['基础文生图', '基础图生图', '社区支持'],
  },
  pro: {
    name: '专业版',
    price: 99,
    dailyLimit: 200,
    workspaces: 5,
    engines: ['gemini', 'bfl', 'photoroom', 'deepseek', 'doubao', 'ideogram'],
    workflowEnabled: true,
    features: ['全部 AI 引擎', '虚拟试穿', '抠图/场景', 'DIY 工作流', '批量处理', '优先支持'],
  },
  enterprise: {
    name: '企业版',
    price: 499,
    dailyLimit: -1, // 无限
    workspaces: -1,
    engines: ['gemini', 'bfl', 'photoroom', 'deepseek', 'doubao', 'ideogram'],
    workflowEnabled: true,
    features: ['专业版全部功能', '无限生成', '自定义工作流', 'API 接入', '品牌定制', '专属客服'],
  },
};

// ── 用户操作 ──
export const User = {
  create(email, password, name) {
    if (db.users.find(u => u.email === email)) {
      return { error: '该邮箱已注册' };
    }
    const user = {
      id: db._meta.nextUserId++,
      email,
      name: name || email.split('@')[0],
      password: hashPassword(password),
      plan: 'free',
      workspaceIds: [],
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);

    // 自动创建默认工作空间
    const ws = Workspace.create(user.id, '我的工作空间');
    user.workspaceIds.push(ws.id);

    scheduleSave();
    return { user: this.toSafe(user) };
  },

  findByEmail(email) {
    return db.users.find(u => u.email === email) || null;
  },

  findById(id) {
    return db.users.find(u => u.id === id) || null;
  },

  verify(email, password) {
    const user = this.findByEmail(email);
    if (!user) return { error: '用户不存在' };
    if (!verifyPassword(password, user.password)) return { error: '密码错误' };
    return { user };
  },

  updatePlan(userId, plan) {
    const user = this.findById(userId);
    if (!user) return { error: '用户不存在' };
    if (!PLANS[plan]) return { error: '无效的订阅方案' };
    user.plan = plan;
    scheduleSave();
    return { user: this.toSafe(user) };
  },

  toSafe(user) {
    if (!user) return null;
    const { password, ...safe } = user;
    return safe;
  },
};

// ── 工作空间操作 ──
export const Workspace = {
  create(userId, name) {
    const ws = {
      id: db._meta.nextWorkspaceId++,
      userId,
      name,
      createdAt: new Date().toISOString(),
    };
    db.workspaces.push(ws);
    scheduleSave();
    return ws;
  },

  findByUserId(userId) {
    return db.workspaces.filter(w => w.userId === userId);
  },

  findById(id) {
    return db.workspaces.find(w => w.id === id) || null;
  },
};

// ── API Key 管理 ──
export const ApiKey = {
  set(userId, provider, key) {
    const existing = db.api_keys.find(k => k.userId === userId && k.provider === provider);
    if (existing) {
      existing.key = key;
      existing.updatedAt = new Date().toISOString();
    } else {
      db.api_keys.push({
        id: genId('key_'),
        userId,
        provider,
        key,
        createdAt: new Date().toISOString(),
      });
    }
    scheduleSave();
    return { success: true };
  },

  get(userId, provider) {
    const record = db.api_keys.find(k => k.userId === userId && k.provider === provider);
    return record?.key || '';
  },

  list(userId) {
    return db.api_keys
      .filter(k => k.userId === userId)
      .map(k => ({ provider: k.provider, hasKey: !!k.key, updatedAt: k.updatedAt }));
  },

  remove(userId, provider) {
    const idx = db.api_keys.findIndex(k => k.userId === userId && k.provider === provider);
    if (idx >= 0) {
      db.api_keys.splice(idx, 1);
      scheduleSave();
    }
    return { success: true };
  },
};

// ── 用量追踪 ──
export const Usage = {
  log(userId, provider, endpoint, credits = 1) {
    const entry = {
      id: db._meta.nextUsageId++,
      userId,
      provider,
      endpoint,
      credits,
      createdAt: new Date().toISOString(),
    };
    db.usage_logs.push(entry);
    scheduleSave();
    return entry;
  },

  getTodayCount(userId) {
    const today = new Date().toISOString().slice(0, 10);
    return db.usage_logs.filter(u => u.userId === userId && u.createdAt.startsWith(today)).length;
  },

  getStats(userId) {
    const userLogs = db.usage_logs.filter(u => u.userId === userId);
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = userLogs.filter(u => u.createdAt.startsWith(today)).length;
    const totalCount = userLogs.length;

    // 按引擎统计
    const byProvider = {};
    for (const log of userLogs) {
      byProvider[log.provider] = (byProvider[log.provider] || 0) + 1;
    }

    // 最近7天趋势
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      last7Days.push({
        date: dayStr,
        count: userLogs.filter(u => u.createdAt.startsWith(dayStr)).length,
      });
    }

    return { todayCount, totalCount, byProvider, last7Days };
  },
};

// ── 工作流（DIY 系统） ──
export const Workflow = {
  create(userId, name, steps, config = {}) {
    const wf = {
      id: db._meta.nextWorkflowId++,
      userId,
      name,
      steps, // [{ engine, endpoint, params, inputMapping }]
      config,
      isTemplate: false,
      createdAt: new Date().toISOString(),
    };
    db.workflows.push(wf);
    scheduleSave();
    return wf;
  },

  findByUserId(userId) {
    return db.workflows.filter(w => w.userId === userId && !w.isTemplate);
  },

  findTemplates() {
    return db.workflows.filter(w => w.isTemplate);
  },

  findById(id) {
    return db.workflows.find(w => w.id === id) || null;
  },

  update(id, updates) {
    const wf = this.findById(id);
    if (!wf) return { error: '工作流不存在' };
    Object.assign(wf, updates);
    scheduleSave();
    return { workflow: wf };
  },

  remove(id) {
    const idx = db.workflows.findIndex(w => w.id === id);
    if (idx >= 0) {
      db.workflows.splice(idx, 1);
      scheduleSave();
    }
    return { success: true };
  },

  // 创建运行记录
  createRun(workflowId, userId) {
    const run = {
      id: db._meta.nextRunId++,
      workflowId,
      userId,
      status: 'pending',
      results: [],
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    db.workflow_runs.push(run);
    scheduleSave();
    return run;
  },

  updateRun(runId, updates) {
    const run = db.workflow_runs.find(r => r.id === runId);
    if (run) {
      Object.assign(run, updates);
      scheduleSave();
    }
    return run;
  },
};

// ── Token 工具导出 ──
export { genToken, verifyToken, genId };

// ── Marketplace（AI 设计市场）──
export const Marketplace = {
  // 列表（支持 tag 筛选 / 关键词 / 排序 / 分页）
  list({ tag, q, sort = 'hot', page = 1, limit = 24 } = {}) {
    let items = [...db.products];
    if (tag && tag !== '全部') items = items.filter(p => p.tag === tag);
    if (q) {
      const kw = q.toLowerCase();
      items = items.filter(p =>
        (p.title || '').toLowerCase().includes(kw) ||
        (p.desc || '').toLowerCase().includes(kw) ||
        (p.tag || '').toLowerCase().includes(kw)
      );
    }
    switch (sort) {
      case 'new': items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'price_asc': items.sort((a, b) => a.price - b.price); break;
      case 'price_desc': items.sort((a, b) => b.price - a.price); break;
      default: items.sort((a, b) => (b.sales || 0) - (a.sales || 0)); break; // hot
    }
    const total = items.length;
    const start = (page - 1) * limit;
    return { items: items.slice(start, start + limit), total, page: Number(page), limit: Number(limit) };
  },

  findById(id) {
    return db.products.find(p => p.id === id) || null;
  },

  // 上架（自动维护设计师档案）
  create({ userId, userName, title, tag, price, oldPrice, desc, imageUrl }) {
    // 确保设计师档案存在
    let designer = db.designers.find(d => d.userId === userId);
    if (!designer) {
      designer = {
        id: db._meta.nextDesignerId++,
        userId,
        shopName: (userName || 'AI Studio') + ' Studio',
        bio: 'CoXoF Ai 创作者',
        createdAt: new Date().toISOString(),
      };
      db.designers.push(designer);
    }
    const product = {
      id: db._meta.nextProductId++,
      title,
      tag: tag || '潮流',
      price: Number(price) || 16,
      oldPrice: Number(oldPrice) || 24,
      desc: desc || '',
      imageUrl: imageUrl || '',
      authorId: userId,
      authorName: userName || 'AI Studio',
      designerId: designer.id,
      sales: 0,
      createdAt: new Date().toISOString(),
      saleEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    db.products.push(product);
    scheduleSave();
    return product;
  },

  // 设计师列表（含商品数，按 designerId 统计）
  listDesigners() {
    return db.designers.map(d => ({
      ...d,
      productCount: db.products.filter(p => p.designerId === d.id).length,
    }));
  },

  findDesignerByUserId(userId) {
    return db.designers.find(d => d.userId === userId) || null;
  },

  productsByAuthor(userId) {
    return db.products.filter(p => p.authorId === userId);
  },

  productsByDesigner(designerId) {
    return db.products.filter(p => p.designerId === designerId);
  },

  // 所有可用标签
  tags() {
    return [...new Set(db.products.map(p => p.tag))].filter(Boolean);
  },
};

// 初始化预设模板
function initTemplates() {
  if (db.workflows.some(w => w.isTemplate)) return;

  const templates = [
    {
      id: db._meta.nextWorkflowId++,
      userId: 0,
      name: '电商商品图全流程',
      isTemplate: true,
      steps: [
        { engine: 'photoroom', endpoint: 'bg-remove', label: '智能抠图' },
        { engine: 'photoroom', endpoint: 'scene', label: '场景生成', params: { prompt: 'modern studio, soft shadow' } },
        { engine: 'ideogram', endpoint: 'upscale', label: '高清放大' },
      ],
      config: { description: '商品图 → 抠图 → 场景替换 → 高清放大' },
      createdAt: new Date().toISOString(),
    },
    {
      id: db._meta.nextWorkflowId++,
      userId: 0,
      name: '虚拟试穿工作流',
      isTemplate: true,
      steps: [
        { engine: 'photoroom', endpoint: 'bg-remove', label: '商品抠图' },
        { engine: 'bfl', endpoint: 'vto', label: '虚拟试穿' },
        { engine: 'ideogram', endpoint: 'upscale', label: '超清放大' },
      ],
      config: { description: '服装商品 → 抠图 → 模特试穿 → 高清放大' },
      createdAt: new Date().toISOString(),
    },
    {
      id: db._meta.nextWorkflowId++,
      userId: 0,
      name: '海报设计工作流',
      isTemplate: true,
      steps: [
        { engine: 'gemini', endpoint: 'generate', label: 'AI 生成主图' },
        { engine: 'ideogram', endpoint: 'remix', label: '设计重构', params: { styleType: 'DESIGN' } },
        { engine: 'ideogram', endpoint: 'upscale', label: '高清输出' },
      ],
      config: { description: '文案 → AI 生成 → 设计重构 → 高清输出' },
      createdAt: new Date().toISOString(),
    },
  ];

  db.workflows.push(...templates);
  scheduleSave();
  console.log('[DB] 预设', templates.length, '个工作流模板');
}

initTemplates();

// 初始化预设市场商品
function initMarketplace() {
  if (db.products.length > 0) return;
  const seedDesigners = [
    { id: db._meta.nextDesignerId++, userId: 0, shopName: 'AI Studio · Kira', bio: '赛博朋克与未来主义设计师', createdAt: new Date().toISOString() },
    { id: db._meta.nextDesignerId++, userId: 0, shopName: 'AI Studio · Neo', bio: '复古与怀旧美学创作者', createdAt: new Date().toISOString() },
  ];
  db.designers.push(...seedDesigners);
  const now = Date.now();
  const seed = [
    { title: 'Neon City Dreams', tag: '科幻', price: 16, oldPrice: 24, authorName: 'AI Studio · Kira', designerId: seedDesigners[0].id, sales: 128 },
    { title: 'Retro Wave 80s', tag: '复古', price: 16, oldPrice: 24, authorName: 'AI Studio · Neo', designerId: seedDesigners[1].id, sales: 96 },
    { title: 'Cyber Koi', tag: '动漫', price: 16, oldPrice: 24, authorName: 'AI Studio · Kira', designerId: seedDesigners[0].id, sales: 211 },
    { title: 'Lo-Fi Beats', tag: '音乐', price: 16, oldPrice: 24, authorName: 'AI Studio · Neo', designerId: seedDesigners[1].id, sales: 74 },
    { title: 'Street Glitch', tag: '潮流', price: 16, oldPrice: 24, authorName: 'AI Studio · Kira', designerId: seedDesigners[0].id, sales: 153 },
    { title: 'Minimal Mono', tag: '极简', price: 16, oldPrice: 24, authorName: 'AI Studio · Neo', designerId: seedDesigners[1].id, sales: 42 },
    { title: 'Sport Pulse', tag: '运动', price: 16, oldPrice: 24, authorName: 'AI Studio · Kira', designerId: seedDesigners[0].id, sales: 88 },
    { title: 'Cat Nebula', tag: '宠物', price: 16, oldPrice: 24, authorName: 'AI Studio · Neo', designerId: seedDesigners[1].id, sales: 167 },
  ];
  seed.forEach((s, i) => {
    db.products.push({
      id: db._meta.nextProductId++,
      ...s,
      authorId: 0,
      imageUrl: '',
      desc: '由 CoXoF Ai 引擎生成的可商用设计，限时优惠进行中。',
      createdAt: new Date(now - i * 3600 * 1000).toISOString(),
      saleEndsAt: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    });
  });
  scheduleSave();
  console.log('[DB] 预设', seed.length, '个市场商品');
}

initMarketplace();

/* ════════════════════════════════════════════════════════════
 * COXOF AI DIY V3 — 数据访问层
 * 第二阶段：设计稿 / 购物车 / 订单 / 设计者商品 / 分享链接 / 佣金
 * ════════════════════════════════════════════════════════════ */

// ── POD 商品目录（6 个静态 POD 产品，与前端 podStore 对齐）──
export const POD_CATALOG = [
  {
    id: 'pod_tshirt',
    name: 'T 恤',
    category: 'apparel',
    baseCost: 8,    // 衣服成本
    printingCost: 4, // 印花成本
    packagingCost: 1.5,
    colors: ['White', 'Black', 'Navy', 'Heather Gray'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    material: '100% 棉',
    printing: 'DTG',
    mockupWidth: 1200,
    mockupHeight: 1200,
  },
  {
    id: 'pod_hoodie',
    name: '连帽卫衣',
    category: 'apparel',
    baseCost: 18,
    printingCost: 5,
    packagingCost: 2,
    colors: ['Black', 'Navy', 'Maroon', 'Forest'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    material: '80% 棉 / 20% 聚酯',
    printing: 'DTG',
    mockupWidth: 1200,
    mockupHeight: 1200,
  },
  {
    id: 'pod_tote',
    name: '帆布袋',
    category: 'accessory',
    baseCost: 4,
    printingCost: 2,
    packagingCost: 0.5,
    colors: ['Natural', 'Black', 'Navy'],
    sizes: ['Standard'],
    material: '12 oz 帆布',
    printing: '丝网印刷',
    mockupWidth: 1200,
    mockupHeight: 1200,
  },
  {
    id: 'pod_phonecase',
    name: '手机壳',
    category: 'accessory',
    baseCost: 3,
    printingCost: 1.5,
    packagingCost: 0.5,
    colors: ['Matte Black', 'Clear', 'White'],
    sizes: ['iPhone 15', 'iPhone 15 Pro', 'iPhone 14', 'Samsung S24'],
    material: 'TPU + PC',
    printing: 'UV 打印',
    mockupWidth: 1200,
    mockupHeight: 1200,
  },
  {
    id: 'pod_poster',
    name: '海报',
    category: 'home',
    baseCost: 3,
    printingCost: 2,
    packagingCost: 1,
    colors: ['Matte', 'Glossy'],
    sizes: ['A4', 'A3', 'A2', '11x14 in', '24x36 in'],
    material: '相纸 230g',
    printing: '激光打印',
    mockupWidth: 1200,
    mockupHeight: 1200,
  },
  {
    id: 'pod_mug',
    name: '马克杯',
    category: 'home',
    baseCost: 4,
    printingCost: 2.5,
    packagingCost: 1.5,
    colors: ['White'],
    sizes: ['11 oz', '15 oz'],
    material: '陶瓷',
    printing: '热升华',
    mockupWidth: 1200,
    mockupHeight: 1200,
  },
];

// 平台费率（占小计百分比）
const PLATFORM_FEE_RATE = 0.10; // 10%
// 支付费率（占小计百分比）
const PAYMENT_FEE_RATE = 0.029; // 2.9%

export function getPodProduct(id) {
  return POD_CATALOG.find(p => p.id === id) || null;
}

// 计算 POD 成本（不含设计者佣金）
export function calculatePodCost(productId, quantity = 1) {
  const pod = getPodProduct(productId);
  if (!pod) return { total: 0, base: 0, printing: 0, packaging: 0, platform: 0, payment: 0 };
  const unitCost = pod.baseCost + pod.printingCost + pod.packagingCost;
  const subtotal = unitCost * quantity;
  const platform = +(subtotal * PLATFORM_FEE_RATE).toFixed(2);
  const payment = +(subtotal * PAYMENT_FEE_RATE).toFixed(2);
  return {
    base: +(pod.baseCost * quantity).toFixed(2),
    printing: +(pod.printingCost * quantity).toFixed(2),
    packaging: +(pod.packagingCost * quantity).toFixed(2),
    platform,
    payment,
    total: +(subtotal + platform + payment).toFixed(2),
  };
}

// ── Design 设计稿 ──
export const Design = {
  create({ userId, title, imageUrl, prompt, engine, source = 'manual' }) {
    const d = {
      id: db._meta.nextDesignId++,
      userId,
      title: title || '未命名设计',
      imageUrl,
      prompt,
      engine,
      source,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.designs.push(d);
    // 版本记录
    db.design_versions.push({
      id: genId('dv_'),
      designId: d.id,
      version: 1,
      imageUrl,
      prompt,
      createdAt: d.createdAt,
    });
    scheduleSave();
    return d;
  },
  findByUserId(userId) {
    return db.designs.filter(d => d.userId === userId).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },
  findById(id) {
    return db.designs.find(d => d.id === id) || null;
  },
  update(id, updates) {
    const d = this.findById(id);
    if (!d) return { error: '设计稿不存在' };
    Object.assign(d, updates, { updatedAt: new Date().toISOString() });
    if (updates.imageUrl) {
      d.version += 1;
      db.design_versions.push({
        id: genId('dv_'),
        designId: d.id,
        version: d.version,
        imageUrl: updates.imageUrl,
        prompt: updates.prompt || d.prompt,
        createdAt: d.updatedAt,
      });
    }
    scheduleSave();
    return { design: d };
  },
};

// ── Cart 购物车 ──
export const Cart = {
  getOrCreate(userId) {
    let cart = db.carts.find(c => c.userId === userId);
    if (!cart) {
      cart = {
        id: db._meta.nextCartId++,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.carts.push(cart);
      scheduleSave();
    }
    return cart;
  },
  listItems(userId) {
    const cart = this.getOrCreate(userId);
    return db.cart_items.filter(it => it.cartId === cart.id);
  },
  addItem(userId, item) {
    const cart = this.getOrCreate(userId);
    // 同款合并（creatorProductId + podProductId + color + size）
    const existing = db.cart_items.find(it =>
      it.cartId === cart.id &&
      it.creatorProductId === (item.creatorProductId || null) &&
      it.podProductId === item.podProductId &&
      (it.color || '') === (item.color || '') &&
      (it.size || '') === (item.size || '')
    );
    if (existing) {
      existing.quantity += item.quantity || 1;
      existing.updatedAt = new Date().toISOString();
    } else {
      const newItem = {
        id: db._meta.nextCartItemId++,
        cartId: cart.id,
        userId,
        creatorProductId: item.creatorProductId || null,
        podProductId: item.podProductId,
        designImage: item.designImage || '',
        mockup: item.mockup || '',
        title: item.title || '自定义商品',
        color: item.color || '',
        size: item.size || '',
        quantity: item.quantity || 1,
        unitPrice: Number(item.unitPrice) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.cart_items.push(newItem);
    }
    cart.updatedAt = new Date().toISOString();
    scheduleSave();
    return this.listItems(userId);
  },
  updateItem(userId, itemId, { quantity }) {
    const item = db.cart_items.find(it => it.id === itemId && it.userId === userId);
    if (!item) return { error: '条目不存在' };
    if (quantity <= 0) {
      db.cart_items = db.cart_items.filter(it => it.id !== itemId);
    } else {
      item.quantity = quantity;
      item.updatedAt = new Date().toISOString();
    }
    scheduleSave();
    return { item };
  },
  removeItem(userId, itemId) {
    db.cart_items = db.cart_items.filter(it => !(it.id === itemId && it.userId === userId));
    scheduleSave();
    return { success: true };
  },
  clear(userId) {
    const cart = this.getOrCreate(userId);
    db.cart_items = db.cart_items.filter(it => it.cartId !== cart.id);
    cart.updatedAt = new Date().toISOString();
    scheduleSave();
    return { success: true };
  },
};

// ── Address 收货地址 ──
export const Address = {
  create(userId, addr) {
    const a = {
      id: db._meta.nextAddressId++,
      userId,
      name: addr.name,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state || '',
      zip: addr.zip,
      country: addr.country || 'US',
      createdAt: new Date().toISOString(),
    };
    db.addresses.push(a);
    scheduleSave();
    return a;
  },
  findByUserId(userId) {
    return db.addresses.filter(a => a.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
};

// ── Payment 支付记录（Phase 2 mock，Phase 3 → Stripe）──
export const Payment = {
  create({ orderId, method = 'mock', amount }) {
    const p = {
      id: db._meta.nextPaymentId++,
      orderId,
      method,
      amount,
      status: 'pending',
      provider: 'mock',
      providerPaymentId: 'mock_' + genId(),
      createdAt: new Date().toISOString(),
    };
    db.payments.push(p);
    scheduleSave();
    return p;
  },
  updateStatus(id, status) {
    const p = db.payments.find(x => x.id === id);
    if (!p) return { error: '支付记录不存在' };
    p.status = status;
    p.updatedAt = new Date().toISOString();
    scheduleSave();
    return { payment: p };
  },
  findById(id) { return db.payments.find(p => p.id === id) || null; },
  findByOrderId(orderId) { return db.payments.find(p => p.orderId === orderId) || null; },
};

// ── Order 订单 ──
export const Order = {
  create({ userId, items, address, subtotal, shipping, tax, total }) {
    const order = {
      id: db._meta.nextOrderId++,
      userId,
      number: 'ORD-' + Date.now().toString(36).toUpperCase(),
      status: 'pending',         // pending | paid | shipped | delivered | cancelled
      paymentStatus: 'pending',  // pending | paid | refunded
      subtotal: +subtotal.toFixed(2),
      shipping: +shipping.toFixed(2),
      tax: +tax.toFixed(2),
      total: +total.toFixed(2),
      addressId: address?.id || null,
      address,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.orders.push(order);
    // 创建订单条目
    for (const it of items) {
      db.order_items.push({
        id: db._meta.nextOrderItemId++,
        orderId: order.id,
        userId,
        creatorProductId: it.creatorProductId || null,
        podProductId: it.podProductId,
        designImage: it.designImage || '',
        mockup: it.mockup || '',
        title: it.title,
        color: it.color || '',
        size: it.size || '',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: +(it.unitPrice * it.quantity).toFixed(2),
      });
    }
    scheduleSave();
    return order;
  },
  findById(id) {
    const order = db.orders.find(o => o.id === id);
    if (!order) return null;
    return { ...order, items: db.order_items.filter(it => it.orderId === id) };
  },
  findByUserId(userId) {
    return db.orders.filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  updateStatus(id, status) {
    const o = db.orders.find(x => x.id === id);
    if (!o) return { error: '订单不存在' };
    o.status = status;
    o.updatedAt = new Date().toISOString();
    scheduleSave();
    return { order: o };
  },
  updatePaymentStatus(id, paymentStatus) {
    const o = db.orders.find(x => x.id === id);
    if (!o) return { error: '订单不存在' };
    o.paymentStatus = paymentStatus;
    o.updatedAt = new Date().toISOString();
    scheduleSave();
    return { order: o };
  },
  listAll() {
    return db.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
};

// ── CreatorProduct 设计者商品 ──
export const CreatorProduct = {
  create({ userId, designId, podProductId, title, description, mockup, designImage, price, oldPrice }) {
    const pod = getPodProduct(podProductId);
    if (!pod) return { error: '无效的 POD 产品' };
    // 最低价校验：不得低于 POD 成本 + 5 美元
    const minPrice = pod.baseCost + pod.printingCost + pod.packagingCost + 5;
    if (Number(price) < minPrice) {
      return { error: `价格不得低于 $${minPrice.toFixed(2)}` };
    }
    const cp = {
      id: db._meta.nextCreatorProductId++,
      userId,
      designId: designId || null,
      podProductId,
      title,
      description: description || '',
      mockup: mockup || '',
      designImage: designImage || '',
      price: Number(price),
      oldPrice: Number(oldPrice) || 0,
      status: 'active',    // active | paused
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.creator_products.push(cp);
    scheduleSave();
    return cp;
  },
  findById(id) { return db.creator_products.find(p => p.id === id) || null; },
  findByUserId(userId) {
    return db.creator_products.filter(p => p.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  update(id, updates) {
    const p = this.findById(id);
    if (!p) return { error: '商品不存在' };
    Object.assign(p, updates, { updatedAt: new Date().toISOString() });
    scheduleSave();
    return { product: p };
  },
  activate(id) { return this.update(id, { status: 'active' }); },
  pause(id) { return this.update(id, { status: 'paused' }); },
};

// ── ShareLink 分享链接 ──
function genSlug() {
  return genId('p').slice(0, 12).toLowerCase();
}

export const ShareLink = {
  create({ productId, password, expiresInDays, maxSales }) {
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 3600 * 1000).toISOString()
      : null;
    const link = {
      id: db._meta.nextShareLinkId++,
      productId,
      slug: genSlug(),
      password: password || '',
      expiresAt,
      maxSales: maxSales || 0,    // 0 = 不限
      salesCount: 0,
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.share_links.push(link);
    scheduleSave();
    return link;
  },
  findBySlug(slug) { return db.share_links.find(l => l.slug === slug) || null; },
  findByProductId(productId) {
    return db.share_links.filter(l => l.productId === productId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  incrementSales(slug) {
    const l = this.findBySlug(slug);
    if (!l) return { error: '链接不存在' };
    l.salesCount += 1;
    scheduleSave();
    return { link: l };
  },
};

// ── Earning 佣金流水 ──
// 状态机：pending → locked → available → paid
//        pending/locked → reversed（退款冲正）
export const Earning = {
  create({ orderId, creatorUserId, grossAmount, costUnit, breakdown }) {
    const net = +(grossAmount - costUnit).toFixed(2);
    const e = {
      id: db._meta.nextEarningId++,
      orderId,
      creatorUserId,
      grossAmount: +grossAmount.toFixed(2),
      costUnit: +costUnit.toFixed(2),
      breakdown: breakdown || {},
      netAmount: net,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.earning_transactions.push(e);
    scheduleSave();
    return e;
  },
  findByCreator(userId) {
    return db.earning_transactions.filter(e => e.creatorUserId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  getSummary(userId) {
    const list = this.findByCreator(userId);
    const sum = (status) => list.filter(e => e.status === status).reduce((s, e) => s + e.netAmount, 0);
    return {
      pending: +sum('pending').toFixed(2),
      locked: +sum('locked').toFixed(2),
      available: +sum('available').toFixed(2),
      paid: +sum('paid').toFixed(2),
      total: +list.reduce((s, e) => s + e.netAmount, 0).toFixed(2),
      count: list.length,
    };
  },
  transition(id, toStatus) {
    const e = db.earning_transactions.find(x => x.id === id);
    if (!e) return { error: '佣金记录不存在' };
    // 简单状态机校验
    const allowed = {
      pending: ['locked', 'reversed'],
      locked: ['available', 'reversed'],
      available: ['paid'],
    };
    if (!allowed[e.status]?.includes(toStatus)) {
      return { error: `不允许从 ${e.status} 转为 ${toStatus}` };
    }
    e.status = toStatus;
    e.updatedAt = new Date().toISOString();
    scheduleSave();
    return { earning: e };
  },
  listAll() {
    return db.earning_transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
};

