/**
 * 分享链接路由
 * 提供分享链接的创建 / 按商品列表 / 公开访问 / 密码校验能力
 */
import { Router } from 'express';
import { ShareLink, CreatorProduct, getPodProduct } from '../db.js';

const router = Router();

// 创建分享链接
router.post('/', (req, res) => {
  const { productId, password, expiresInDays, maxSales } = req.body || {};
  const link = ShareLink.create({
    productId,
    password,
    expiresInDays,
    maxSales,
  });
  res.json({ success: true, link });
});

// 列出某商品的所有分享链接
router.get('/by-product/:productId', (req, res) => {
  const productId = Number(req.params.productId);
  const links = ShareLink.findByProductId(productId);
  res.json({ success: true, links });
});

// PUBLIC 公开接口：按 slug 查找链接 + 关联商品
router.get('/:slug', (req, res) => {
  const slug = req.params.slug;
  const link = ShareLink.findBySlug(slug);
  if (!link) {
    return res.status(404).json({ success: false, error: '链接不存在' });
  }
  if (!link.active) {
    return res.status(403).json({ success: false, error: '链接已停用' });
  }
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return res.status(403).json({ success: false, error: '链接已过期' });
  }
  if (link.maxSales > 0 && link.salesCount >= link.maxSales) {
    return res.status(403).json({ success: false, error: '已达销售上限' });
  }
  const product = CreatorProduct.findById(link.productId);
  const pod = product ? getPodProduct(product.podProductId) : null;
  res.json({ success: true, link, product, pod });
});

// 密码校验
router.post('/:slug/verify', (req, res) => {
  const slug = req.params.slug;
  const { password } = req.body || {};
  const link = ShareLink.findBySlug(slug);
  if (!link) {
    return res.status(404).json({ success: false, error: '链接不存在' });
  }
  const verified = link.password === password;
  res.json({ success: true, verified });
});

export default router;
