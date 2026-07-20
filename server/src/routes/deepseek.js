/**
 * DeepSeek API 代理路由
 * 用于文本生成（产品命名、提示词优化）
 */
import { Router } from 'express';
import { getKey, maskKey } from '../keyManager.js';
import { cacheMiddleware } from '../cache.js';
import { fetchUpstream, throwUpstreamError, UpstreamError } from '../fetchWithTimeout.js';

const router = Router();

router.post('/chat', cacheMiddleware({ ttl: 3600 }), async (req, res) => {
  const apiKey = getKey('deepseek', req);
  if (!apiKey) return res.status(401).json({ success: false, error: '未配置 DeepSeek API Key' });

  const { messages, model = 'deepseek-chat' } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, error: '缺少 messages 参数' });
  }

  try {
    const resp = await fetchUpstream('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, stream: false }),
    }, { timeout: 60000 });

    if (!resp.ok) await throwUpstreamError(resp, 'DeepSeek');

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log(`[DeepSeek] 生成成功，${content.length} 字符，key=${maskKey(apiKey)}`);
    res.json({ success: true, content });
  } catch (err) {
    if (err instanceof UpstreamError) {
      return res.status(err.status).json({ success: false, error: err.publicMessage });
    }
    console.error('[DeepSeek] error:', err.message);
    res.status(500).json({ success: false, error: 'DeepSeek 生成失败，请稍后重试' });
  }
});

export default router;
