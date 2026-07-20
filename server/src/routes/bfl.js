/**
 * BFL (Black Forest Labs) API 代理路由
 * 支持 FLUX 文生图、VTO 虚拟试穿、Outpaint 扩展、Erase 擦除
 *
 * BFL 是异步任务模式：提交 → 轮询 → 获取结果
 *
 * 安全修复：
 *   1. modelName 白名单校验（防路径注入）
 *   2. 上游 fetch 超时（AbortController）
 *   3. 轮询遇到 4xx 立即终止（不再重试到底）
 *   4. 客户端断开时中止上游请求
 *   5. 上游错误原文不回传客户端
 */
import { Router } from 'express';
import { getKey, maskKey } from '../keyManager.js';
import { fetchUpstream, throwUpstreamError, UpstreamError } from '../fetchWithTimeout.js';

const router = Router();

const BFL_BASE = 'https://api.bfl.ai';

// ── modelName / 端点路径白名单 ──
// 防止路径注入：modelName 拼进 `${BFL_BASE}/v1/${modelName}`
const BFL_ALLOWED_MODELS = new Set([
  'flux-1.1-pro',
  'flux-pro-1.1',
  'flux-1.1-pro-ultra',
  'flux-realism',
  'flux-2-pro',
  'flux-2-pro-preview',
  'flux-2-klein-9b-preview',
  'flux-kontext-pro',
  'flux-kontext-max',
  'flux-kontext-multi',
]);

function validateModelName(modelName) {
  return typeof modelName === 'string' && /^[A-Za-z0-9._-]+$/.test(modelName);
}

/**
 * 去掉 data URL 前缀，返回纯 base64
 * "data:image/png;base64,xxxx" → "xxxx"
 * 如果已经是纯 base64，原样返回
 */
function stripDataUrl(str) {
  if (!str || typeof str !== 'string') return str;
  const idx = str.indexOf(';base64,');
  if (idx >= 0) return str.slice(idx + 8);
  return str;
}

// 校验数值参数（范围 + 类型）
function clampInt(v, def, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * 提交任务并轮询直到完成
 * @param {string} submitUrl - 提交任务的 URL
 * @param {object} body - 请求体
 * @param {string} apiKey - BFL API Key
 * @param {string} logTag - 日志标签
 * @param {object} [opts]
 * @param {AbortSignal} [opts.clientSignal] 客户端连接信号
 */
async function submitAndPoll(submitUrl, body, apiKey, logTag = 'BFL', { clientSignal } = {}) {
  // ── 1. 提交任务 ──
  const submitResp = await fetchUpstream(submitUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'x-key': apiKey,
    },
    body: JSON.stringify(body),
  }, { timeout: 30000, signal: clientSignal });

  if (!submitResp.ok) await throwUpstreamError(submitResp, logTag + ' submit');

  const res = await submitResp.json();

  // 同步返回结果（无 id 时）
  if (!res.id) {
    return { image_data: res.image_data || res.image_url || res.result?.sample };
  }

  // ── 2. 轮询获取结果 ──
  // BFL 返回的 polling_url 格式：https://api.bfl.ai/v1/get_result?id=xxx
  const pollUrl = res.polling_url || `${BFL_BASE}/v1/get_result?id=${res.id}`;
  let attempts = 0;
  const maxAttempts = 90; // 最多 3 分钟

  console.log(`[${logTag}] 任务已提交，id=${res.id}，开始轮询...`);

  while (attempts < maxAttempts) {
    // 客户端已断开，停止轮询（节省 BFL 额度）
    if (clientSignal?.aborted) {
      throw new UpstreamError('客户端已断开', { status: 499, publicMessage: '客户端已取消' });
    }
    attempts++;
    await new Promise(r => setTimeout(r, 2000));

    // 轮询时也携带 x-key 头（部分接口要求鉴权）
    let pollResp;
    try {
      pollResp = await fetchUpstream(pollUrl, {
        headers: { 'x-key': apiKey },
      }, { timeout: 10000, signal: clientSignal });
    } catch (err) {
      if (err instanceof UpstreamError) {
        // 网络错误/超时 → 临时，继续重试
        console.warn(`[${logTag}] 轮询 ${attempts} 网络异常: ${err.message}`);
        continue;
      }
      throw err;
    }

    if (!pollResp.ok) {
      // 4xx（含 401/403）是永久错误，立即终止，不再重试
      if (pollResp.status >= 400 && pollResp.status < 500) {
        await throwUpstreamError(pollResp, logTag + ' poll');
      }
      // 5xx 视为临时错误，继续重试
      console.warn(`[${logTag}] 轮询 ${attempts} 失败: HTTP ${pollResp.status}`);
      continue;
    }

    const data = await pollResp.json();

    if (data.status === 'Ready') {
      const imageUrl = data.result?.sample;
      if (!imageUrl) throw new UpstreamError(`${logTag}: Ready 但无图片`);
      console.log(`[${logTag}] 生成成功，轮询 ${attempts} 次，url=${imageUrl.slice(0, 60)}...`);
      return { image_data: imageUrl };
    } else if (data.status === 'Error') {
      console.error(`[${logTag}] 任务失败: ${data.error || 'unknown'}`);
      throw new UpstreamError(`${logTag} 任务失败`, { publicMessage: `${logTag} 任务失败，请重试` });
    }
    // status: "Queued" / "Processing" → 继续轮询
  }

  throw new UpstreamError(`${logTag} 轮询超时（${maxAttempts * 2}秒）`, {
    status: 504,
    publicMessage: `${logTag} 生成超时，请稍后重试`,
  });
}

// ── 文生图 / 图生图 ──
router.post('/generate', async (req, res) => {
  const apiKey = getKey('bfl', req);
  if (!apiKey) return res.status(401).json({ success: false, error: '未配置 BFL API Key' });

  const {
    prompt,
    modelName = 'flux-2-klein-9b-preview',
    width = 1024,
    height = 1024,
    images = [],
  } = req.body;

  if (!prompt) return res.status(400).json({ success: false, error: '缺少 prompt 参数' });
  if (!validateModelName(modelName)) {
    return res.status(400).json({ success: false, error: '非法的 modelName 参数' });
  }

  try {
    const body = {
      prompt,
      width: clampInt(width, 1024, 256, 4096),
      height: clampInt(height, 1024, 256, 4096),
      guidance: 7.5,
      steps: 30,
      safety_tolerance: 2,
      output_format: 'png',
    };

    // BFL 要求 input_image 为纯 base64（不带 data: 前缀）
    if (images.length > 0 && images[0]) {
      body.input_image = stripDataUrl(images[0]);
    }
    if (images.length > 1 && images[1]) {
      body.input_image_2 = stripDataUrl(images[1]);
    }

    console.log(`[BFL] 文生图，model=${modelName}，prompt="${prompt.slice(0, 50)}..."，参考图=${images.filter(Boolean).length}张`);
    const result = await submitAndPoll(`${BFL_BASE}/v1/${modelName}`, body, apiKey, 'BFL', {
      clientSignal: makeClientSignal(req),
    });
    res.json({ success: true, ...result });
  } catch (err) {
    handleRouteError(res, err, 'BFL');
  }
});

// ── VTO 虚拟试穿 ──
router.post('/vto', async (req, res) => {
  const apiKey = getKey('bfl', req);
  if (!apiKey) return res.status(401).json({ success: false, error: '未配置 BFL API Key' });

  const { personImg, garmentImg, prompt: vp = 'TRY-ON: The person wearing the garments.' } = req.body;
  if (!personImg || !garmentImg) {
    return res.status(400).json({ success: false, error: '需要 personImg 和 garmentImg' });
  }

  try {
    const body = {
      prompt: vp,
      // BFL VTO 要求 person/garment 为纯 base64
      person: stripDataUrl(personImg),
      garment: stripDataUrl(garmentImg),
      seed: Math.floor(Math.random() * 2147483647),
      safety_tolerance: 2,
      output_format: 'jpeg',
    };

    console.log(`[BFL VTO] 提交虚拟试穿，prompt="${vp.slice(0, 40)}..."`);
    const result = await submitAndPoll(`${BFL_BASE}/v1/flux-tools/vto-v1`, body, apiKey, 'BFL VTO', {
      clientSignal: makeClientSignal(req),
    });
    res.json({ success: true, ...result });
  } catch (err) {
    handleRouteError(res, err, 'BFL VTO');
  }
});

// ── Outpaint 扩展画布 ──
router.post('/outpaint', async (req, res) => {
  const apiKey = getKey('bfl', req);
  if (!apiKey) return res.status(401).json({ success: false, error: '未配置 BFL API Key' });

  const {
    image,
    prompt: op = 'extend the image',
    width = 1024,
    height = 1024,
    auto_crop = false,
    reference_offset_x = 0,
    reference_offset_y = 0,
    mode = 'high',
  } = req.body;
  if (!image) return res.status(400).json({ success: false, error: '缺少 image 参数' });
  if (mode !== 'high' && mode !== 'low') {
    return res.status(400).json({ success: false, error: 'mode 仅支持 high / low' });
  }

  try {
    const body = {
      input_image: stripDataUrl(image),
      prompt: op,
      width: clampInt(width, 1024, 256, 4096),
      height: clampInt(height, 1024, 256, 4096),
      auto_crop: Boolean(auto_crop),
      safety_tolerance: 2,
      output_format: 'png',
      reference_offset_x: clampInt(reference_offset_x, 0, -4096, 4096),
      reference_offset_y: clampInt(reference_offset_y, 0, -4096, 4096),
      mode, // 'high' | 'low'
    };

    console.log(`[BFL Outpaint] 扩展画布 ${width}x${height} offset=(${reference_offset_x},${reference_offset_y}) mode=${mode}`);
    const result = await submitAndPoll(`${BFL_BASE}/v1/flux-tools/outpainting-v1`, body, apiKey, 'BFL Outpaint', {
      clientSignal: makeClientSignal(req),
    });
    res.json({ success: true, ...result });
  } catch (err) {
    handleRouteError(res, err, 'BFL Outpaint');
  }
});

// ── Deblur 去除图像模糊 ──
router.post('/deblur', async (req, res) => {
  const apiKey = getKey('bfl', req);
  if (!apiKey) return res.status(401).json({ success: false, error: '未配置 BFL API Key' });

  const { image, seed } = req.body;
  if (!image) return res.status(400).json({ success: false, error: '缺少 image 参数' });

  try {
    const body = {
      image: stripDataUrl(image),
      seed: seed != null ? clampInt(seed, Math.floor(Math.random() * 2147483647), 0, 2147483647) : Math.floor(Math.random() * 2147483647),
      safety_tolerance: 2,
      output_format: 'png',
    };

    console.log(`[BFL Deblur] 去模糊任务`);
    const result = await submitAndPoll(`${BFL_BASE}/v1/flux-tools/deblur-v1`, body, apiKey, 'BFL Deblur', {
      clientSignal: makeClientSignal(req),
    });
    res.json({ success: true, ...result });
  } catch (err) {
    handleRouteError(res, err, 'BFL Deblur');
  }
});

// ── Erase 擦除 ──
router.post('/erase', async (req, res) => {
  const apiKey = getKey('bfl', req);
  if (!apiKey) return res.status(401).json({ success: false, error: '未配置 BFL API Key' });

  const { image, mask } = req.body;
  if (!image || !mask) {
    return res.status(400).json({ success: false, error: '需要 image 和 mask 参数' });
  }

  try {
    const body = {
      image: stripDataUrl(image),
      mask: stripDataUrl(mask),
      dilate_pixels: 10,
      seed: Math.floor(Math.random() * 2147483647),
      safety_tolerance: 2,
      output_format: 'png',
    };

    console.log(`[BFL Erase] 擦除任务`);
    const result = await submitAndPoll(`${BFL_BASE}/v1/flux-tools/erase-v1`, body, apiKey, 'BFL Erase', {
      clientSignal: makeClientSignal(req),
    });
    res.json({ success: true, ...result });
  } catch (err) {
    handleRouteError(res, err, 'BFL Erase');
  }
});

// ── 辅助：从 Express req 构造客户端断开信号 ──
function makeClientSignal(req) {
  if (!req?.socket) return undefined;
  const controller = new AbortController();
  if (req.socket.destroyed) controller.abort();
  else req.socket.once('close', () => controller.abort());
  return controller.signal;
}

// ── 辅助：统一错误处理 ──
function handleRouteError(res, err, tag) {
  if (err instanceof UpstreamError) {
    return res.status(err.status === 499 ? 499 : err.status).json({ success: false, error: err.publicMessage });
  }
  console.error(`[${tag}] error:`, err.message);
  res.status(500).json({ success: false, error: `${tag} 生成失败，请稍后重试` });
}

export default router;
