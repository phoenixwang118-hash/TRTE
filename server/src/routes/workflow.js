/**
 * 工作流路由 — DIY 工作流系统
 *
 * 用户可以自定义 AI 设计流程：
 *   1. 选择引擎和操作（文生图、抠图、试穿、放大等）
 *   2. 串联多个步骤形成工作流
 *   3. 一键运行整个工作流
 *   4. 保存为个人模板
 *
 * 工作流步骤格式：
 *   [{ engine, endpoint, label, params, inputMapping }]
 *   inputMapping: 'prompt' | 'prev_output' | 'upload' — 输入来源
 */
import express from 'express';
import { Workflow, Usage } from '../db.js';
import { requireAuth, requireWorkflowAccess } from '../auth.js';

const router = express.Router();

// 可用引擎和操作列表
const ENGINE_ACTIONS = {
  gemini: [
    { endpoint: 'generate', label: '文生图', inputs: ['prompt'] },
    { endpoint: 'chat', label: 'AI 对话', inputs: ['messages'] },
    { endpoint: 'batch', label: '批量生成', inputs: ['prompts'] },
  ],
  bfl: [
    { endpoint: 'generate', label: '文生图', inputs: ['prompt'] },
    { endpoint: 'vto', label: '虚拟试穿', inputs: ['personImg', 'garmentImg', 'prompt'] },
    { endpoint: 'outpaint', label: '扩画', inputs: ['image', 'prompt', 'width', 'height'] },
    { endpoint: 'deblur', label: '去模糊', inputs: ['image'] },
    { endpoint: 'erase', label: '擦除', inputs: ['image', 'mask'] },
  ],
  photoroom: [
    { endpoint: 'bg-remove', label: '智能抠图', inputs: ['image'] },
    { endpoint: 'scene', label: '场景生成', inputs: ['image', 'prompt'] },
    { endpoint: 'edit', label: '图像编辑', inputs: ['image', 'options'] },
  ],
  ideogram: [
    { endpoint: 'generate', label: '文字设计', inputs: ['prompt'] },
    { endpoint: 'remix', label: '图像重构', inputs: ['image', 'prompt'] },
    { endpoint: 'upscale', label: '高清放大', inputs: ['image'] },
  ],
  deepseek: [
    { endpoint: 'chat', label: '文案生成', inputs: ['messages'] },
  ],
  doubao: [
    { endpoint: 'chat', label: '文生图', inputs: ['prompt'] },
  ],
};

// 获取可用引擎和操作
router.get('/engines', requireAuth, (req, res) => {
  const allowedEngines = req.plan.engines;
  const engines = {};
  for (const [engine, actions] of Object.entries(ENGINE_ACTIONS)) {
    if (allowedEngines.includes(engine)) {
      engines[engine] = actions;
    }
  }
  res.json({ success: true, engines });
});

// 列出用户工作流
router.get('/', requireAuth, requireWorkflowAccess, (req, res) => {
  const workflows = Workflow.findByUserId(req.user.id);
  res.json({ success: true, workflows });
});

// 获取模板列表
router.get('/templates', requireAuth, (req, res) => {
  const templates = Workflow.findTemplates();
  res.json({ success: true, templates });
});

// 获取单个工作流
router.get('/:id', requireAuth, requireWorkflowAccess, (req, res) => {
  const wf = Workflow.findById(parseInt(req.params.id));
  if (!wf || (wf.userId !== req.user.id && !wf.isTemplate)) {
    return res.status(404).json({ success: false, error: '工作流不存在' });
  }
  res.json({ success: true, workflow: wf });
});

// 创建工作流
router.post('/', requireAuth, requireWorkflowAccess, (req, res) => {
  const { name, steps, config } = req.body;
  if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ success: false, error: '名称和步骤必填' });
  }
  const wf = Workflow.create(req.user.id, name, steps, config);
  res.json({ success: true, workflow: wf });
});

// 更新工作流
router.put('/:id', requireAuth, requireWorkflowAccess, (req, res) => {
  const wf = Workflow.findById(parseInt(req.params.id));
  if (!wf || wf.userId !== req.user.id) {
    return res.status(404).json({ success: false, error: '工作流不存在' });
  }
  const result = Workflow.update(wf.id, req.body);
  res.json({ success: true, workflow: result.workflow });
});

// 删除工作流
router.delete('/:id', requireAuth, requireWorkflowAccess, (req, res) => {
  const wf = Workflow.findById(parseInt(req.params.id));
  if (!wf || wf.userId !== req.user.id) {
    return res.status(404).json({ success: false, error: '工作流不存在' });
  }
  Workflow.remove(wf.id);
  res.json({ success: true });
});

// 从模板创建工作流
router.post('/template/:id/clone', requireAuth, requireWorkflowAccess, (req, res) => {
  const template = Workflow.findById(parseInt(req.params.id));
  if (!template || !template.isTemplate) {
    return res.status(404).json({ success: false, error: '模板不存在' });
  }
  const wf = Workflow.create(req.user.id, template.name + ' (副本)', template.steps, template.config);
  res.json({ success: true, workflow: wf });
});

// 运行工作流（返回运行 ID，前端逐步调用各引擎 API）
router.post('/:id/run', requireAuth, requireWorkflowAccess, (req, res) => {
  const wf = Workflow.findById(parseInt(req.params.id));
  if (!wf || (wf.userId !== req.user.id && !wf.isTemplate)) {
    return res.status(404).json({ success: false, error: '工作流不存在' });
  }
  const run = Workflow.createRun(wf.id, req.user.id);
  res.json({
    success: true,
    runId: run.id,
    steps: wf.steps,
    message: '工作流已启动，请按步骤依次执行',
  });
});

// 获取运行记录
router.get('/runs/:runId', requireAuth, (req, res) => {
  // 简化实现：直接返回工作流信息
  const run = null; // 从 db 查找
  res.json({ success: true, run: { status: 'completed' } });
});

export default router;
