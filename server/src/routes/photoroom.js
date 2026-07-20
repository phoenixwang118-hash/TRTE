/**
 * Photoroom API 代理路由
 * 支持抠图、AI 场景生成、Edit V2 编辑
 *
 * Photoroom 接收 FormData 上传图片，返回二进制图片流
 *
 * 修复：
 *   1. 改用 Web 原生 FormData（npm form-data 包产出的流不被原生 fetch 识别）
 *   2. 上游 fetch 超时 + 错误脱敏
 */
import { Router } from 'express';
import { getKey, maskKey } from '../keyManager.js';
import { fetchUpstream, throwUpstreamError, UpstreamError } from '../fetchWithTimeout.js';

const router = Router();

// 将 base64 转为 Buffer
function base64ToBuffer(base64Str) {
  const b64 = base64Str.startsWith('data:') ? base64Str.split(',')[1] : base64Str;
  return Buffer.from(b64, 'base64');
}

// Buffer 转 base64 data URL
function bufferToDataUrl(buf, mime = 'image/png') {
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// base64 转 Web Blob（用于原生 FormData）
function base64ToBlob(base64Str, mime = 'image/png') {
  const buf = base64ToBuffer(base64Str);
  return new Blob([new Uint8Array(buf)], { type: mime });
}

// 抠图（背景移除）
router.post('/bg-remove', async (req, res) => {
  const apiKey = getKey('photoroom', req);
  if (!apiKey) return res.status(401).json({ success: false, error: '未配置 Photoroom API Key' });

  const { image, format = 'png' } = req.body;
  if (!image) return res.status(400).json({ success: false, error: '缺少 image 参数' });

  try {
    // 使用原生 Web FormData（不要用 npm form-data）
    const fd = new FormData();
    const blob = base64ToBlob(image, 'image/png');
    fd.append('image_file', blob, 'image.png');
    fd.append('format', format);

    const resp = await fetchUpstream('https://sdk.photoroom.com/v1/segment', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: fd,
    }, { timeout: 30000 });

    if (!resp.ok) await throwUpstreamError(resp, 'Photoroom bg-remove');

    const resultBuf = Buffer.from(await resp.arrayBuffer());
    const dataUrl = bufferToDataUrl(resultBuf, `image/${format}`);
    console.log(`[Photoroom] 抠图成功，key=${maskKey(apiKey)}`);
    res.json({ success: true, image_data: dataUrl });
  } catch (err) {
    handleRouteError(res, err, 'Photoroom bg-remove');
  }
});

// AI 场景生成
router.post('/scene', async (req, res) => {
  const apiKey = getKey('photoroom', req);
  if (!apiKey) return res.status(401).json({ success: false, error: '未配置 Photoroom API Key' });

  const { image, prompt: scenePrompt } = req.body;
  if (!image) return res.status(400).json({ success: false, error: '缺少 image 参数' });

  try {
    const fd = new FormData();
    const blob = base64ToBlob(image, 'image/png');
    fd.append('imageFile', blob, 'image.png');
    if (scenePrompt) fd.append('background.prompt', scenePrompt);
    fd.append('background.mode', 'ai-generated');

    const resp = await fetchUpstream('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: fd,
    }, { timeout: 30000 });

    if (!resp.ok) await throwUpstreamError(resp, 'Photoroom Scene');

    const resultBuf = Buffer.from(await resp.arrayBuffer());
    const dataUrl = bufferToDataUrl(resultBuf);
    console.log(`[Photoroom Scene] 成功，prompt="${scenePrompt?.slice(0, 30) || ''}"，key=${maskKey(apiKey)}`);
    res.json({ success: true, image_data: dataUrl });
  } catch (err) {
    handleRouteError(res, err, 'Photoroom scene');
  }
});

// Edit V2 编辑（阴影、背景色、边距等）
router.post('/edit', async (req, res) => {
  const apiKey = getKey('photoroom', req);
  if (!apiKey) return res.status(401).json({ success: false, error: '未配置 Photoroom API Key' });

  const { image, options = {} } = req.body;
  if (!image) return res.status(400).json({ success: false, error: '缺少 image 参数' });

  try {
    const fd = new FormData();
    const blob = base64ToBlob(image, 'image/png');
    fd.append('imageFile', blob, 'image.png');

    if (options.shadowMode) fd.append('shadow.mode', options.shadowMode);
    if (options.bgColor) fd.append('background.color', options.bgColor);
    if (options.padding !== undefined) fd.append('padding', String(options.padding));

    const resp = await fetchUpstream('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: fd,
    }, { timeout: 30000 });

    if (!resp.ok) await throwUpstreamError(resp, 'Photoroom Edit V2');

    const resultBuf = Buffer.from(await resp.arrayBuffer());
    const dataUrl = bufferToDataUrl(resultBuf);
    console.log(`[Photoroom Edit V2] 成功，options=${JSON.stringify(options)}，key=${maskKey(apiKey)}`);
    res.json({ success: true, image_data: dataUrl });
  } catch (err) {
    handleRouteError(res, err, 'Photoroom edit');
  }
});

// ── 辅助：统一错误处理 ──
function handleRouteError(res, err, tag) {
  if (err instanceof UpstreamError) {
    return res.status(err.status).json({ success: false, error: err.publicMessage });
  }
  console.error(`[${tag}] error:`, err.message);
  res.status(500).json({ success: false, error: `${tag} 失败，请稍后重试` });
}

export default router;
