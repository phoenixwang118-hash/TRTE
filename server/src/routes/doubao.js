/**
 * 豆包（Doubao）API 代理路由
 * 通过火山引擎 Ark API 调用
 */
import { Router } from 'express';
import { getKey, maskKey } from '../keyManager.js';
import { fetchUpstream, throwUpstreamError, UpstreamError } from '../fetchWithTimeout.js';

const router = Router();

router.post('/chat', async (req, res) => {
  const apiKey = getKey('doubao', req);
  if (!apiKey) return res.status(401).json({ success: false, error: '未配置 Doubao API Key' });

  const { prompt, modelName } = req.body;
  if (!prompt) return res.status(400).json({ success: false, error: '缺少 prompt 参数' });

  // modelName 不再硬编码默认值（避免绑死某账号的 endpoint ID）
  // 前端或环境变量必须提供
  const model = modelName || process.env.DOUBAO_DEFAULT_MODEL || '';
  if (!model) return res.status(400).json({ success: false, error: '缺少 modelName 参数' });

  try {
    const messages = [
      { role: 'system', content: '你是人工智能助手.' },
      { role: 'user', content: prompt },
    ];

    const resp = await fetchUpstream('https://ark.cn-beijing.volces.com/apiv3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages }),
    }, { timeout: 60000 });

    if (!resp.ok) await throwUpstreamError(resp, 'Doubao');

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log(`[Doubao] 生成成功，key=${maskKey(apiKey)}`);

    // 尝试从内容中提取图片 URL
    let imageUrl = null;
    const imgMatch = content.match(/!\[.*?\]\((.*?)\)/);
    if (imgMatch) imageUrl = imgMatch[1];
    else {
      const urlMatch = content.match(/https?:\/\/[^\s<>"']+\.(?:png|jpg|jpeg|webp)/i);
      if (urlMatch) imageUrl = urlMatch[0];
    }

    res.json({
      success: true,
      content,
      image_data: imageUrl || content,
    });
  } catch (err) {
    if (err instanceof UpstreamError) {
      return res.status(err.status).json({ success: false, error: err.publicMessage });
    }
    console.error('[Doubao] error:', err.message);
    res.status(500).json({ success: false, error: 'Doubao 生成失败，请稍后重试' });
  }
});

export default router;
