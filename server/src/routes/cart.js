/**
 * 购物车路由
 * 提供购物车条目的列表 / 加购 / 更新数量 / 删除 / 清空能力
 */
import { Router } from 'express';
import { Cart } from '../db.js';

const router = Router();

// 列出当前用户购物车条目
router.get('/', (req, res) => {
  const userId = req.user?.id || 1;
  const items = Cart.listItems(userId);
  res.json({ success: true, items });
});

// 加购
router.post('/items', (req, res) => {
  const userId = req.user?.id || 1;
  const {
    creatorProductId,
    podProductId,
    designImage,
    mockup,
    title,
    color,
    size,
    quantity,
    unitPrice,
  } = req.body || {};
  const items = Cart.addItem(userId, {
    creatorProductId,
    podProductId,
    designImage,
    mockup,
    title,
    color,
    size,
    quantity,
    unitPrice,
  });
  res.json({ success: true, items });
});

// 更新数量
router.put('/items/:id', (req, res) => {
  const userId = req.user?.id || 1;
  const itemId = Number(req.params.id);
  const { quantity } = req.body || {};
  const result = Cart.updateItem(userId, itemId, { quantity });
  if (result.error) {
    return res.status(404).json({ success: false, error: result.error });
  }
  res.json({ success: true, item: result.item });
});

// 删除条目
router.delete('/items/:id', (req, res) => {
  const userId = req.user?.id || 1;
  const itemId = Number(req.params.id);
  Cart.removeItem(userId, itemId);
  res.json({ success: true });
});

// 清空购物车
router.delete('/', (req, res) => {
  const userId = req.user?.id || 1;
  Cart.clear(userId);
  res.json({ success: true });
});

export default router;
