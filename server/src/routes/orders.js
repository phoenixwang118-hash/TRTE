/**
 * 订单路由
 * 提供当前用户订单的列表 / 详情 / 取消能力
 */
import { Router } from 'express';
import { Order } from '../db.js';

const router = Router();

// 列出当前用户订单
router.get('/', (req, res) => {
  const userId = req.user?.id || 1;
  const orders = Order.findByUserId(userId);
  res.json({ success: true, orders });
});

// 按 ID 查找订单
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const order = Order.findById(id);
  if (!order) {
    return res.status(404).json({ success: false, error: '订单不存在' });
  }
  res.json({ success: true, order });
});

// 取消订单
router.post('/:id/cancel', (req, res) => {
  const id = Number(req.params.id);
  const result = Order.updateStatus(id, 'cancelled');
  if (result.error) {
    return res.status(404).json({ success: false, error: result.error });
  }
  res.json({ success: true, order: result.order });
});

export default router;
