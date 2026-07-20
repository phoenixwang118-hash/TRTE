/**
 * 设计稿 CRUD 路由
 * 提供当前用户设计稿的列表 / 详情 / 创建 / 更新能力
 */
import { Router } from 'express';
import { Design } from '../db.js';

const router = Router();

// 列出当前用户的设计稿
router.get('/', (req, res) => {
  const userId = req.user?.id || 1;
  const designs = Design.findByUserId(userId);
  res.json({ success: true, designs });
});

// 按 ID 查找设计稿
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const design = Design.findById(id);
  if (!design) {
    return res.status(404).json({ success: false, error: '设计稿不存在' });
  }
  res.json({ success: true, design });
});

// 创建设计稿
router.post('/', (req, res) => {
  const userId = req.user?.id || 1;
  const { title, imageUrl, prompt, engine, source } = req.body || {};
  const design = Design.create({ userId, title, imageUrl, prompt, engine, source });
  res.json({ success: true, design });
});

// 更新设计稿
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { title, imageUrl, prompt } = req.body || {};
  const result = Design.update(id, { title, imageUrl, prompt });
  if (result.error) {
    return res.status(404).json({ success: false, error: result.error });
  }
  res.json({ success: true, design: result.design });
});

export default router;
