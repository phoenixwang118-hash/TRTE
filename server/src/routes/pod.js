/**
 * POD 商品目录路由
 * 提供 POD 商品列表 / 详情 / 成本估算 / Mockup 占位接口
 */
import { Router } from 'express';
import { POD_CATALOG, getPodProduct, calculatePodCost } from '../db.js';

const router = Router();

// 返回所有 POD 目录
router.get('/products', (req, res) => {
  res.json({ success: true, products: POD_CATALOG });
});

// 返回单个 POD 商品
router.get('/products/:id', (req, res) => {
  const product = getPodProduct(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'POD 商品不存在' });
  }
  res.json({ success: true, product });
});

// 计算 POD 成本
router.post('/calculate', (req, res) => {
  const { podProductId, quantity } = req.body || {};
  const cost = calculatePodCost(podProductId, quantity);
  res.json({ success: true, cost });
});

// Mockup 生成占位（Phase 2）
router.post('/mockups', (req, res) => {
  res.json({ success: true, message: 'Mockup 生成 Phase 2 占位' });
});

export default router;
