/**
 * Gemini API 代理路由
 * 支持文生图、图生图、批量生成
 *
 * 双模式：
 *   1. Vertex AI 模式（推荐）：GOOGLE_GENAI_USE_VERTEXAI=true，用服务账号 JSON 认证
 *      - 需设置 GOOGLE_APPLICATION_CREDENTIALS 指向服务账号 JSON 文件
 *      - 需设置 GOOGLE_CLOUD_PROJECT（项目ID）和 GOOGLE_CLOUD_LOCATION（区域）
 *   2. AI Studio 模式（兜底）：用 GEMINI_API_KEY 或前端透传的 Key
 */
import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import config from '../config.js';
import { getKey, hasKey, maskKey } from '../keyManager.js';
import { cacheMiddleware } from '../cache.js';
import { fetchUpstream, throwUpstreamError, UpstreamError } from '../fetchWithTimeout.js';

const router = Router();

// ── modelName 白名单 ──
// 防止路径注入：modelName 直接拼进上游 URL，必须严格校验
const GEMINI_ALLOWED_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  // Vertex AI 生图模型（Gemini 2.5 Flash Image，原生支持图像生成）
  'gemini-2.5-flash-image',
  // AI Studio 生图模型（兜底模式用）
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.0-flash-exp-image-generation',
  'gemini-3.1-flash-lite-image',
  'gemini-3-pro-image-preview',
  'gemini-exp-image-generation',
]);

function validateModelName(modelName) {
  // 仅允许字母、数字、-、_、.（杜绝 ../ ? # 等路径注入字符）
  return typeof modelName === 'string' && /^[A-Za-z0-9._-]+$/.test(modelName);
}

// ── 图片转 inlineData（支持 data URL / HTTP URL / 纯 base64）──
// 返回 { mimeType, data } 或 null（跳过空值）
async function toInlineData(img) {
  if (!img) return null;
  if (img.startsWith('data:image')) {
    const m = img.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
    if (m) return { mimeType: m[1], data: m[2] };
    return { mimeType: 'image/png', data: img.split(',')[1] };
  }
  if (/^https?:\/\//.test(img)) {
    // URL：先下载再转 base64（走 fetchUpstream 支持代理）
    const r = await fetchUpstream(img, { timeout: 30000 });
    if (!r.ok) throw new UpstreamError(`下载图片失败 HTTP ${r.status}`, { publicMessage: `参考图下载失败 ${r.status}` });
    const buf = Buffer.from(await r.arrayBuffer());
    return { mimeType: r.headers.get('content-type') || 'image/jpeg', data: buf.toString('base64') };
  }
  // 纯 base64
  return { mimeType: 'image/png', data: img };
}

// ── Vertex AI 客户端单例（启用时创建）──
let vertexClient = null;
function getVertexClient() {
  if (!config.vertexai.enabled) return null;
  if (!config.vertexai.project) {
    console.warn('[Gemini] Vertex AI 已启用但未配置 GOOGLE_CLOUD_PROJECT，回退到 AI Studio 模式');
    return null;
  }
  if (vertexClient) return vertexClient;
  try {
    // 服务账号认证：SDK 自动读取 GOOGLE_APPLICATION_CREDENTIALS 环境变量
    // API Key 认证：传入 apiKey 参数（GOOGLE_CLOUD_API_KEY）
    const opts = {
      vertexai: true,
      project: config.vertexai.project,
      location: config.vertexai.location,
    };
    if (config.vertexai.apiKey) opts.apiKey = config.vertexai.apiKey;
    vertexClient = new GoogleGenAI(opts);
    console.log(`[Gemini] Vertex AI 客户端已创建 (project=${config.vertexai.project}, location=${config.vertexai.location})`);
    return vertexClient;
  } catch (err) {
    console.error('[Gemini] Vertex AI 客户端创建失败:', err.message);
    return null;
  }
}

// ── 调用 Vertex AI SDK 生图 ──
async function generateWithVertex(modelName, prompt, images = []) {
  const ai = getVertexClient();
  if (!ai) throw new UpstreamError('Vertex AI 客户端未就绪', { publicMessage: 'Vertex AI 未正确配置' });

  const parts = [{ text: prompt }];
  if (Array.isArray(images)) {
    for (const img of images) {
      const inline = await toInlineData(img);
      if (inline) parts.push({ inlineData: inline });
    }
  }

  console.log(`[Gemini/Vertex] 请求: ${modelName}, prompt=${prompt.slice(0, 30)}...`);
  const response = await ai.models.generateContent({
    model: modelName,
    contents: [{ role: 'user', parts }],
    config: { responseModalities: ['TEXT', 'IMAGE'] },
  });

  // 提取图片
  const allImages = [];
  for (const candidate of (response.candidates || [])) {
    for (const p of (candidate.content?.parts || [])) {
      if (p.inlineData?.data) {
        allImages.push(`data:image/png;base64,${p.inlineData.data}`);
      }
    }
  }
  if (allImages.length === 0) {
    throw new UpstreamError('Gemini/Vertex: no image output', { publicMessage: 'Gemini 未返回图片，该模型可能不支持图像生成' });
  }
  console.log(`[Gemini/Vertex] 生成成功，${allImages.length} 张图片`);
  return { image_data: allImages[0], all_images: allImages };
}

// 生成内容（文生图/图生图）
router.post('/generate', cacheMiddleware({ ttl: 1800 }), async (req, res) => {
  const { prompt, images = [], modelName = 'gemini-2.5-flash' } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, error: '缺少 prompt 参数' });
  }
  if (!validateModelName(modelName)) {
    return res.status(400).json({ success: false, error: '非法的 modelName 参数' });
  }

  // Vertex AI 模式：用 SDK + 服务账号认证，无需 API Key
  if (config.vertexai.enabled && getVertexClient()) {
    try {
      const result = await generateWithVertex(modelName, prompt, images);
      return res.json({ success: true, ...result });
    } catch (err) {
      if (err instanceof UpstreamError) {
        return res.status(err.status).json({ success: false, error: err.publicMessage });
      }
      console.error('[Gemini/Vertex] error:', err.message);
      return res.status(500).json({ success: false, error: 'Gemini (Vertex) 生成失败：' + err.message });
    }
  }

  // AI Studio 模式（兜底）：需要 API Key
  const apiKey = getKey('gemini', req);
  if (!apiKey) {
    return res.status(401).json({ success: false, error: '未配置 Gemini API Key（也未启用 Vertex AI）' });
  }

  try {
    const parts = [{ text: prompt }];
    if (Array.isArray(images)) {
      for (const img of images) {
        const inline = await toInlineData(img);
        if (inline) parts.push({ inlineData: inline });
      }
    }

    const body = {
      contents: [{ parts }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    console.log(`[Gemini/AIStudio] 请求: ${modelName}, prompt=${prompt.slice(0, 30)}...`);

    const resp = await fetchUpstream(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, { signal: req.socket?.destroyed ? AbortSignal.abort() : undefined });

    console.log(`[Gemini/AIStudio] 响应: HTTP ${resp.status}`);

    const text = await resp.text();
    if (!text) throw new UpstreamError(`Gemini: empty response (HTTP ${resp.status})`);

    const result = JSON.parse(text);
    if (result.error) {
      const errMsg = result.error.message || JSON.stringify(result.error);
      console.error('[Gemini/AIStudio] API error:', errMsg);
      throw new UpstreamError('Gemini API error', { publicMessage: 'Gemini 错误: ' + errMsg });
    }

    const allImages = [];
    for (const candidate of (result.candidates || [])) {
      for (const p of (candidate.content?.parts || [])) {
        if (p.inlineData?.data) {
          allImages.push(`data:image/png;base64,${p.inlineData.data}`);
        }
      }
    }

    if (allImages.length === 0) {
      throw new UpstreamError('Gemini: no image output', { publicMessage: 'Gemini 未返回图片，该模型可能不支持图像生成' });
    }

    console.log(`[Gemini/AIStudio] 生成成功，${allImages.length} 张图片，key=${maskKey(apiKey)}`);
    res.json({ success: true, image_data: allImages[0], all_images: allImages });
  } catch (err) {
    if (err instanceof UpstreamError) {
      return res.status(err.status).json({ success: false, error: err.publicMessage });
    }
    console.error('[Gemini/AIStudio] error:', err.message);
    if (err.cause) console.error('[Gemini/AIStudio] cause:', err.cause.code || err.cause.message || err.cause);
    res.status(500).json({ success: false, error: 'Gemini 生成失败，请稍后重试' });
  }
});

// 批量生成
router.post('/batch', cacheMiddleware({ ttl: 1800 }), async (req, res) => {
  const { prompts = [], modelName = 'gemini-2.5-flash' } = req.body;
  if (!prompts.length) {
    return res.status(400).json({ success: false, error: '缺少 prompts 参数' });
  }
  if (!validateModelName(modelName)) {
    return res.status(400).json({ success: false, error: '非法的 modelName 参数' });
  }

  // Vertex AI 模式：串行调用 SDK
  if (config.vertexai.enabled && getVertexClient()) {
    try {
      const allImages = [];
      for (const p of prompts) {
        const result = await generateWithVertex(modelName, p, []);
        if (result.image_data) allImages.push(result.image_data);
      }
      return res.json({ success: true, result: { images: allImages } });
    } catch (err) {
      if (err instanceof UpstreamError) {
        return res.status(err.status).json({ success: false, error: err.publicMessage });
      }
      return res.status(500).json({ success: false, error: 'Gemini (Vertex) 批量生成失败：' + err.message });
    }
  }

  // AI Studio 模式（兜底）
  const apiKey = getKey('gemini', req);
  if (!apiKey) {
    return res.status(401).json({ success: false, error: '未配置 Gemini API Key（也未启用 Vertex AI）' });
  }

  try {
    const requests = prompts.map(p => ({
      contents: [{ parts: [{ text: p }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const resp = await fetchUpstream(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    }, { timeout: 60000 });

    if (!resp.ok) await throwUpstreamError(resp, 'Gemini Batch');
    const result = await resp.json();
    res.json({ success: true, result });
  } catch (err) {
    if (err instanceof UpstreamError) {
      return res.status(err.status).json({ success: false, error: err.publicMessage });
    }
    console.error('[Gemini Batch] error:', err.message);
    res.status(500).json({ success: false, error: 'Gemini 批量生成失败，请稍后重试' });
  }
});

// 文本生成（用于提示词优化、参考图分析，纯文本输出，走 Vertex AI gemini-2.5-flash）
// messages 支持 images 字段（base64 字符串数组）用于图像分析
router.post('/chat', async (req, res) => {
  const { messages, modelName = 'gemini-2.5-flash' } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, error: '缺少 messages 参数' });
  }
  if (!validateModelName(modelName)) {
    return res.status(400).json({ success: false, error: '非法的 modelName 参数' });
  }

  // 构建内容 parts：文本 + 图片（如有）
  // 每条 message 可含 content(文本) 和 images(data URL / HTTP URL / base64 数组)
  async function buildParts(msg) {
    const parts = [];
    if (msg.content) parts.push({ text: msg.content });
    if (Array.isArray(msg.images)) {
      for (const img of msg.images) {
        const inline = await toInlineData(img);
        if (inline) parts.push({ inlineData: inline });
      }
    }
    return parts;
  }

  // Vertex AI 模式：用 SDK 做纯文本生成
  if (config.vertexai.enabled && getVertexClient()) {
    try {
      const ai = getVertexClient();
      const systemMsg = messages.find(m => m.role === 'system')?.content || '';
      const nonSystemMsgs = messages.filter(m => m.role !== 'system');
      const contents = await Promise.all(nonSystemMsgs.map(msg => (async () => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: await buildParts(msg) }))()));

      const imgCount = messages.reduce((n, m) => n + (Array.isArray(m.images) ? m.images.length : 0), 0);
      console.log(`[Gemini/Vertex Chat] 请求: ${modelName}, messages=${messages.length}, images=${imgCount}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: systemMsg,
          responseModalities: ['TEXT'],
        },
      });

      let text = '';
      for (const candidate of (response.candidates || [])) {
        for (const p of (candidate.content?.parts || [])) {
          if (p.text) text += p.text;
        }
      }
      if (!text) {
        throw new UpstreamError('Gemini/Vertex Chat: no text output', { publicMessage: 'Gemini 未返回文本' });
      }
      console.log(`[Gemini/Vertex Chat] 成功，${text.length} 字符`);
      return res.json({ success: true, content: text });
    } catch (err) {
      if (err instanceof UpstreamError) {
        return res.status(err.status).json({ success: false, error: err.publicMessage });
      }
      console.error('[Gemini/Vertex Chat] error:', err.message);
      return res.status(500).json({ success: false, error: 'Gemini 文本生成失败: ' + err.message });
    }
  }

  // AI Studio 兜底模式
  const apiKey = getKey('gemini', req);
  if (!apiKey) {
    return res.status(401).json({ success: false, error: '未配置 Gemini API Key 或 Vertex AI' });
  }
  try {
    const contents = await Promise.all(messages.filter(m => m.role !== 'system').map(m => (async () => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: await buildParts(m) }))()));
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const resp = await fetchUpstream(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction: systemMsg, generationConfig: { responseModalities: ['TEXT'] } }),
    }, { timeout: 60000 });
    if (!resp.ok) await throwUpstreamError(resp, 'Gemini Chat');
    const result = await resp.json();
    let text = '';
    for (const candidate of (result.candidates || [])) {
      for (const p of (candidate.content?.parts || [])) {
        if (p.text) text += p.text;
      }
    }
    console.log(`[Gemini Chat] 成功，${text.length} 字符，key=${maskKey(apiKey)}`);
    res.json({ success: true, content: text });
  } catch (err) {
    if (err instanceof UpstreamError) {
      return res.status(err.status).json({ success: false, error: err.publicMessage });
    }
    console.error('[Gemini Chat] error:', err.message);
    res.status(500).json({ success: false, error: 'Gemini 文本生成失败，请稍后重试' });
  }
});

export default router;
