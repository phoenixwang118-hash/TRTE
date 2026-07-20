/**
 * Marketplace 路由 — AI 设计市场
 *
 * 闭环：Studio 生成图 → POST 上架（图片写盘）→ 落地页/市场拉取展示
 *
 * 接口：
 *   GET    /                    列表（?tag=&q=&sort=&page=&limit=）
 *   GET    /tags                可用标签
 *   GET    /designers           设计师列表
 *   GET    /designers/:id       设计师详情 + 其商品
 *   GET    /:id                 商品详情
 *   POST   /                    上架（需登录，body: title/tag/price/oldPrice/desc/image[dataURL]）
 */
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Marketplace } from '../db.js';
import { requireAuth } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MP_DIR = path.join(__dirname, '..', 'data', 'mp');

if (!fs.existsSync(MP_DIR)) fs.mkdirSync(MP_DIR, { recursive: true });

const router = express.Router();

// 静态图片服务：/api/marketplace/img/<file>
router.use('/img', express.static(MP_DIR, { maxAge: '7d' }));

// 把 dataURL 写盘，返回可访问 URL
function saveImageFromDataUrl(dataUrl, name) {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  // 兼容已是 URL 的情况（不写盘）
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) return dataUrl;
  const m = dataUrl.match(/^data:(image\/(\w+));base64,(.+)$/);
  if (!m) return '';
  const ext = m[2] === 'jpeg' ? 'jpg' : m[2] || 'png';
  const buf = Buffer.from(m[3], 'base64');
  const filename = `${name}.${ext}`;
  fs.writeFileSync(path.join(MP_DIR, filename), buf);
  return `/api/marketplace/img/${filename}`;
}

// 列表
router.get('/', (req, res) => {
  const { tag, q, sort, page, limit } = req.query;
  const result = Marketplace.list({ tag, q, sort, page, limit });
  res.json({ success: true, ...result });
});

// 标签
router.get('/tags', (req, res) => {
  res.json({ success: true, tags: Marketplace.tags() });
});

// 设计师列表
router.get('/designers', (req, res) => {
  res.json({ success: true, designers: Marketplace.listDesigners() });
});

// 设计师详情
router.get('/designers/:id', (req, res) => {
  const id = Number(req.params.id);
  const designer = Marketplace.listDesigners().find(d => d.id === id);
  if (!designer) return res.status(404).json({ success: false, error: '设计师不存在' });
  const products = Marketplace.productsByDesigner(designer.id);
  res.json({ success: true, designer, products });
});

// 商品详情
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = Marketplace.findById(id);
  if (!product) return res.status(404).json({ success: false, error: '商品不存在' });
  res.json({ success: true, product });
});

// 上架
router.post('/', requireAuth, (req, res) => {
  const { title, tag, price, oldPrice, desc, image } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, error: '请填写商品标题' });
  }
  if (!image) {
    return res.status(400).json({ success: false, error: '缺少商品图片' });
  }
  const imageUrl = saveImageFromDataUrl(image, 'p' + Date.now());
  if (!imageUrl) {
    return res.status(400).json({ success: false, error: '图片格式不支持（需 dataURL 或 http URL）' });
  }
  const product = Marketplace.create({
    userId: req.user.id,
    userName: req.user.name,
    title: title.trim(),
    tag, price, oldPrice, desc, imageUrl,
  });
  res.json({ success: true, product, message: '已上架到市场' });
});

export default router;
