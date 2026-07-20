/**
 * 设计者商品路由
 * 提供当前用户商品的列表 / 详情 / 创建 / 更新 / 激活 / 暂停能力
 */
import { Router } from 'express';
import { CreatorProduct, getPodProduct } from '../db.js';

const router = Router();

// 列出当前用户的商品（附加 POD 信息）
router.get('/', (req, res) => {
  const userId = req.user?.id || 1;
  const products = CreatorProduct.findByUserId(userId).map(p => ({
    ...p,
    pod: getPodProduct(p.podProductId),
  }));
  res.json({ success: true, products });
});

// 按 ID 查找商品（附加 POD 信息）
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = CreatorProduct.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, error: '商品不存在' });
  }
  res.json({
    success: true,
    product,
    pod: getPodProduct(product.podProductId),
  });
});

// 创建商品
router.post('/', (req, res) => {
  const userId = req.user?.id || 1;
  const {
    designId,
    podProductId,
    title,
    description,
    mockup,
    designImage,
    price,
    oldPrice,
  } = req.body || {};
  const result = CreatorProduct.create({
    userId,
    designId,
    podProductId,
    title,
    description,
    mockup,
    designImage,
    price,
    oldPrice,
  });
  if (result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json({ success: true, product: result });
});

// 更新商品
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const {
    title,
    description,
    mockup,
    designImage,
    price,
    oldPrice,
    status,
  } = req.body || {};
  const result = CreatorProduct.update(id, {
    title,
    description,
    mockup,
    designImage,
    price,
    oldPrice,
    status,
  });
  if (result.error) {
    return res.status(404).json({ success: false, error: result.error });
  }
  res.json({ success: true, product: result.product });
});

// 激活商品
router.post('/:id/activate', (req, res) => {
  const id = Number(req.params.id);
  const result = CreatorProduct.activate(id);
  if (result.error) {
    return res.status(404).json({ success: false, error: result.error });
  }
  res.json({ success: true, product: result.product });
});

// 暂停商品
router.post('/:id/pause', (req, res) => {
  const id = Number(req.params.id);
  const result = CreatorProduct.pause(id);
  if (result.error) {
    return res.status(404).json({ success: false, error: result.error });
  }
  res.json({ success: true, product: result.product });
});

export default router;
