/**
 * 结算路由（mock 支付）
 * 提供创建结算会话 / 查询支付状态 / mock webhook 能力
 * Phase 2 使用 mock 支付，支付立即标记为 paid
 */
import { Router } from 'express';
import {
  Address,
  Cart,
  Order,
  Payment,
  CreatorProduct,
  calculatePodCost,
  Earning,
} from '../db.js';

const router = Router();

// 创建结算会话（mock 立即支付成功）
router.post('/session', (req, res) => {
  const userId = req.user?.id || 1;
  const { address: addrBody } = req.body || {};

  // 1. 保存地址
  const address = Address.create(userId, addrBody || {});

  // 2. 拿到购物车条目
  const items = Cart.listItems(userId);

  // 3. 计算金额
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const shipping = items.length > 0 ? 6 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // 4. 创建订单
  const order = Order.create({
    userId,
    items,
    address,
    subtotal,
    shipping,
    tax,
    total,
  });

  // 5. 创建支付记录
  const payment = Payment.create({ orderId: order.id, amount: total, method: 'mock' });

  // 6. 立即标记支付为 paid（mock 立即成功）
  Payment.updateStatus(payment.id, 'paid');

  // 7. 把订单支付状态标记为 paid
  Order.updatePaymentStatus(order.id, 'paid');

  // 8. 为每个含 creatorProductId 的条目创建 pending 佣金记录
  for (const it of items) {
    if (!it.creatorProductId) continue;
    const cp = CreatorProduct.findById(it.creatorProductId);
    if (!cp) continue;
    const cost = calculatePodCost(it.podProductId, it.quantity);
    Earning.create({
      orderId: order.id,
      creatorUserId: cp.userId,
      grossAmount: it.unitPrice * it.quantity,
      costUnit: cost.total,
      breakdown: {
        base: cost.base,
        printing: cost.printing,
        packaging: cost.packaging,
        platform: cost.platform,
        payment: cost.payment,
      },
    });
  }

  // 9. 清空购物车
  Cart.clear(userId);

  // 10. 返回订单和支付信息
  res.json({ success: true, order, payment });
});

// 查询订单支付状态
router.get('/status/:orderId', (req, res) => {
  const orderId = Number(req.params.orderId);
  const order = Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: '订单不存在' });
  }
  res.json({
    success: true,
    orderId: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
  });
});

// Mock webhook
router.post('/webhook', (req, res) => {
  res.json({ success: true, message: 'mock webhook received' });
});

export default router;
