/**
 * Ideogram API 代理路由
 * 官方文档：https://developer.ideogram.ai/api-reference
 *
 * 三个端点：
 *   1. POST /v1/generate  - 文生图（JSON body）
 *   2. POST /v1/remix     - 图像混合/编辑（multipart/form-data，含 image_file）
 *   3. POST /v1/upscale   - 图像放大高清（multipart/form-data，含 image_file）
 *
 * 鉴权：Authorization: Bearer <API_KEY>
 * 返回：图片 URL（24小时内有效），后端自动下载转 base64 返回前端
 *
 * 安全修复：
 *   1. downloadImageAsBase64 增加 host 白名单（防 SSRF）
 *   2. base64/Blob 转换改用高效的 Buffer API（不再逐字节 Array.from）
 *   3. 上游 fetch 超时 + 错误脱敏
 */
import { Router } from 'express';
import { getKey } from '../keyManager.js';
import { fetchUpstream, throwUpstreamError, UpstreamError } from '../fetchWithTimeout.js';

const router = Router();
const IDEOGRAM_BASE = 'https://api.ideogram.ai';

/**
 * 去掉 data URL 前缀，返回纯 base64
 */
function stripDataUrl(str) {
  if (!str || typeof str !== 'string') return str;
  const idx = str.indexOf(';base64,');
  if (idx >= 0) return str.slice(idx + 8);
  return str;
}

/**
 * base64 字符串转 Blob（使用高效 Buffer API）
 */
function base64ToBlob(b64, mimeType = 'image/png') {
  const buf = Buffer.from(b64, 'base64');
  return new Blob([new Uint8Array(buf)], { type: mimeType });
}

// ── SSRF 防护：只允许下载 Ideogram 官方域名的图片 ──
const ALLOWED_DOWNLOAD_HOSTS = ['ideogram.ai', 'prod-cdn.ideogram.ai', 'cdn.ideogram.ai'];

function isAllowedDownloadUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:') return false;
    // 允许 ideogram.ai 或其子域名
    return u.hostname === 'ideogram.ai' || u.hostname.endsWith('.ideogram.ai') || ALLOWED_DOWNLOAD_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

/**
 * 下载图片 URL 并转为 base64 data URL
 * 仅允许 https + ideogram.ai 域名，防止 SSRF
 */
async function downloadImageAsBase64(url) {
  if (!isAllowedDownloadUrl(url)) {
    throw new UpstreamError('非法的图片下载地址: ' + (url || '').slice(0, 80), {
      publicMessage: '图片下载地址校验失败',
    });
  }
  const resp = await fetchUpstream(url, {}, { timeout: 30000 });
  if (!resp.ok) await throwUpstreamError(resp, 'Ideogram Download');
  const buf = Buffer.from(await resp.arrayBuffer());
  // 高效转换：不再逐字节 Array.from + btoa
  const b64 = buf.toString('base64');
  // 从 content-type 推断格式
  const ct = resp.headers.get('content-type') || 'image/png';
  return `data:${ct};base64,${b64}`;
}

// ── 文生图 ──
// POST /api/ai/ideogram/generate
router.post('/generate', async (req, res) => {
  const apiKey = getKey('ideogram', req);
  if (!apiKey) return res.status(401).json({ success: false, error: '未配置 Ideogram API Key' });

  const {
    prompt,
    aspectRatio = 'ASPECT_1_1',
    model = 'V_2',
    styleType = 'GENERAL',
    magicPromptOption = 'AUTO',
    negativePrompt = '',
  } = req.body;

  if (!prompt) return res.status(400).json({ success: false, error: '缺少 prompt 参数' });

  try {
    const body = {
      image_request: {
        prompt,
        aspect_ratio: aspectRatio,
        model,
        style_type: styleType,
        magic_prompt_option: magicPromptOption,
      },
    };
    if (negativePrompt) body.image_request.negative_prompt = negativePrompt;

    console.log(`[Ideogram] 文生图 model=${model} aspect=${aspectRatio} prompt="${prompt.slice(0, 50)}..."`);

    const resp = await fetchUpstream(`${IDEOGRAM_BASE}/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    }, { timeout: 30000 });

    if (!resp.ok) await throwUpstreamError(resp, 'Ideogram generate');

    const result = await resp.json();
    if (!result.data?.length) throw new UpstreamError('Ideogram: 无图片返回');

    // 下载第一张图片转 base64
    const imageUrl = result.data[0].url;
    const base64 = await downloadImageAsBase64(imageUrl);

    console.log(`[Ideogram] 文生图成功，分辨率=${result.data[0].resolution}`);

    res.json({
      success: true,
      image_data: base64,
      all_images: [base64], // 简化：只返回第一张
      seed: result.data[0].seed,
      resolution: result.data[0].resolution,
    });
  } catch (err) {
    handleRouteError(res, err, 'Ideogram generate');
  }
});

// ── 图像混合/编辑（Remix） ──
// POST /api/ai/ideogram/remix
router.post('/remix', async (req, res) => {
  const apiKey = getKey('ideogram', req);
  if (!apiKey) return res.status(401).json({ success: false, error: '未配置 Ideogram API Key' });

  const {
    image,        // base64 data URL
    prompt,
    aspectRatio = 'ASPECT_1_1',
    model = 'V_2',
    imageWeight = 50,
    magicPromptOption = 'AUTO',
    negativePrompt = '',
  } = req.body;

  if (!image) return res.status(400).json({ success: false, error: '缺少 image 参数' });
  if (!prompt) return res.status(400).json({ success: false, error: '缺少 prompt 参数' });

  try {
    // 构造 multipart/form-data
    const fd = new FormData();
    const imageRequest = {
      prompt,
      aspect_ratio: aspectRatio,
      model,
      image_weight: clampInt(imageWeight, 50, 0, 100),
      magic_prompt_option: magicPromptOption,
    };
    if (negativePrompt) imageRequest.negative_prompt = negativePrompt;

    fd.append('image_request', JSON.stringify(imageRequest));

    // 添加图片文件
    const b64 = stripDataUrl(image);
    const blob = base64ToBlob(b64, 'image/png');
    fd.append('image_file', blob, 'image.png');

    console.log(`[Ideogram Remix] 图像编辑 weight=${imageWeight} prompt="${prompt.slice(0, 50)}..."`);

    const resp = await fetchUpstream(`${IDEOGRAM_BASE}/v1/remix`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: fd,
    }, { timeout: 30000 });

    if (!resp.ok) await throwUpstreamError(resp, 'Ideogram remix');

    const result = await resp.json();
    if (!result.data?.length) throw new UpstreamError('Ideogram Remix: 无图片返回');

    const imageUrl = result.data[0].url;
    const base64 = await downloadImageAsBase64(imageUrl);

    console.log(`[Ideogram Remix] 成功，分辨率=${result.data[0].resolution}`);

    res.json({
      success: true,
      image_data: base64,
      seed: result.data[0].seed,
      resolution: result.data[0].resolution,
    });
  } catch (err) {
    handleRouteError(res, err, 'Ideogram remix');
  }
});

// ── 图像放大高清（Upscale） ──
// POST /api/ai/ideogram/upscale
router.post('/upscale', async (req, res) => {
  const apiKey = getKey('ideogram', req);
  if (!apiKey) return res.status(401).json({ success: false, error: '未配置 Ideogram API Key' });

  const { image } = req.body;
  if (!image) return res.status(400).json({ success: false, error: '缺少 image 参数' });

  try {
    const fd = new FormData();
    const b64 = stripDataUrl(image);
    const blob = base64ToBlob(b64, 'image/png');
    fd.append('image_file', blob, 'image.png');

    console.log(`[Ideogram Upscale] 图像放大`);

    const resp = await fetchUpstream(`${IDEOGRAM_BASE}/v1/upscale`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: fd,
    }, { timeout: 30000 });

    if (!resp.ok) await throwUpstreamError(resp, 'Ideogram upscale');

    const result = await resp.json();
    if (!result.data?.length) throw new UpstreamError('Ideogram Upscale: 无图片返回');

    const imageUrl = result.data[0].url;
    const base64 = await downloadImageAsBase64(imageUrl);

    console.log(`[Ideogram Upscale] 成功，分辨率=${result.data[0].resolution}`);

    res.json({
      success: true,
      image_data: base64,
      resolution: result.data[0].resolution,
    });
  } catch (err) {
    handleRouteError(res, err, 'Ideogram upscale');
  }
});

// ── 辅助：数值范围校验 ──
function clampInt(v, def, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.round(n)));
}

// ── 辅助：统一错误处理 ──
function handleRouteError(res, err, tag) {
  if (err instanceof UpstreamError) {
    return res.status(err.status).json({ success: false, error: err.publicMessage });
  }
  console.error(`[${tag}] error:`, err.message);
  res.status(500).json({ success: false, error: `${tag} 失败，请稍后重试` });
}

export default router;
