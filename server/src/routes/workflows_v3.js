/**
 * DIY 工作流保存/读取路由（V3）
 * 命名为 _v3 以避免与已删除的 workflow.js 冲突
 * 提供工作流的列表 / 详情 / 保存 / 占位运行能力
 */
import { Router } from 'express';
import { Workflow } from '../db.js';

const router = Router();

// 列出当前用户的工作流
router.get('/', (req, res) => {
  const userId = req.user?.id || 1;
  const workflows = Workflow.findByUserId(userId);
  res.json({ success: true, workflows });
});

// 按 ID 查找工作流
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const workflow = Workflow.findById(id);
  if (!workflow) {
    return res.status(404).json({ success: false, error: '工作流不存在' });
  }
  res.json({ success: true, workflow });
});

// 保存工作流
router.post('/', (req, res) => {
  const userId = req.user?.id || 1;
  const { name, steps, config } = req.body || {};
  const workflow = Workflow.create(userId, name, steps, config);
  res.json({ success: true, workflow });
});

// 占位运行接口（Phase 2）
router.post('/:id/run', (req, res) => {
  res.json({
    success: true,
    runId: 1,
    message: '工作流执行为 Phase 2 占位',
  });
});

export default router;
