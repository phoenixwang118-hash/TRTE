/**
 * 佣金流水路由
 * 提供当前用户佣金流水的列表 / 余额汇总 / 状态流转能力
 */
import { Router } from 'express';
import { Earning } from '../db.js';

const router = Router();

// 列出当前用户的佣金流水
router.get('/', (req, res) => {
  const userId = req.user?.id || 1;
  const earnings = Earning.findByCreator(userId);
  res.json({ success: true, earnings });
});

// 余额汇总
router.get('/summary', (req, res) => {
  const userId = req.user?.id || 1;
  const summary = Earning.getSummary(userId);
  res.json({ success: true, summary });
});

// 状态流转
router.post('/:id/transition', (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  const result = Earning.transition(id, status);
  if (result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json({ success: true, earning: result.earning });
});

export default router;
