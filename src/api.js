/**
 * CoXoF Ai SaaS — 统一 API 调用层
 *
 * SaaS 升级：
 *   1. 自动携带 JWT Token（登录用户）
 *   2. 后端统一用量追踪、限流、缓存
 *   3. 兼容旧前端 Key 透传模式
 */

// 后端 API 基础路径（通过 vite proxy 转发到 localhost:3002）
const API_BASE = '/api/ai';

// 工具：构建认证请求头（JWT + 旧版 Key 透传）
function getAuthHeaders(provider) {
  const headers = { 'Content-Type': 'application/json' };

  // SaaS: JWT Token
  const token = localStorage.getItem('coxof_ai_token');
  if (token) headers['Authorization'] = 'Bearer ' + token;

  // 兼容旧前端: localStorage 中的 Key 透传
  const keyMap = {
    gemini: 'vedaartGeminiApiKey',
    bfl: 'vedaartBflApiKey',
    photoroom: 'vedaartPhotoroomApiKey',
    deepseek: 'vedaartDeepseekApiKey',
    doubao: 'vedaartDoubaoApiKey',
    ideogram: 'vedaartIdeogramApiKey',
  };
  const storageKey = keyMap[provider];
  const key = storageKey ? (localStorage.getItem(storageKey) || '') : '';
  if (key) headers[`x-api-key-${provider}`] = key;

  return headers;
}

// 统一错误处理
async function handleResponse(resp) {
  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    // 响应非 JSON（可能是 HTML 错误页或空响应）
    throw new Error(`响应解析失败 (HTTP ${resp.status}): ${text.slice(0, 200) || '(空响应)'}`);
  }
  if (!resp.ok || !data.success) {
    throw new Error(data.error || `HTTP ${resp.status}`);
  }
  return data;
}

// ── Gemini API ──
export const GEMINI_DIRECT_API = async (prompt, images, apiKey, modelName = 'gemini-2.5-flash-image') => {
  const resp = await fetch(`${API_BASE}/gemini/generate`, {
    method: 'POST',
    headers: getAuthHeaders('gemini'),
    body: JSON.stringify({ prompt, images: images || [], modelName }),
  });
  const data = await handleResponse(resp);
  return { image_data: data.image_data, all_images: data.all_images };
};

export const GEMINI_BATCH_API = async (prompts, apiKey, modelName = 'gemini-3-pro-image-preview') => {
  const resp = await fetch(`${API_BASE}/gemini/batch`, {
    method: 'POST',
    headers: getAuthHeaders('gemini'),
    body: JSON.stringify({ prompts, modelName }),
  });
  const data = await handleResponse(resp);
  return data.result;
};

// ── BFL API ──
export const BFL_DIRECT_API = async (prompt, images, apiKey, modelName = 'flux-2-klein-9b-preview') => {
  const resp = await fetch(`${API_BASE}/bfl/generate`, {
    method: 'POST',
    headers: getAuthHeaders('bfl'),
    body: JSON.stringify({ prompt, images: images || [], modelName }),
  });
  const data = await handleResponse(resp);
  return { image_data: data.image_data };
};

export const BFL_VTO_API = async (personImg, garmentImg, prompt, apiKey) => {
  const resp = await fetch(`${API_BASE}/bfl/vto`, {
    method: 'POST',
    headers: getAuthHeaders('bfl'),
    body: JSON.stringify({ personImg, garmentImg, prompt }),
  });
  const data = await handleResponse(resp);
  return { image_data: data.image_data };
};

export const BFL_OUTPAINT_API = async (image, prompt, width, height, apiKey, options = {}) => {
  const resp = await fetch(`${API_BASE}/bfl/outpaint`, {
    method: 'POST',
    headers: getAuthHeaders('bfl'),
    body: JSON.stringify({
      image, prompt, width, height,
      auto_crop: options.auto_crop ?? false,
      reference_offset_x: options.reference_offset_x ?? 0,
      reference_offset_y: options.reference_offset_y ?? 0,
      mode: options.mode ?? 'high', // 'high' | 'low'
    }),
  });
  const data = await handleResponse(resp);
  return { image_data: data.image_data };
};

// 去除图像模糊（Deblur）
export const BFL_DEBLUR_API = async (image, apiKey, seed) => {
  const resp = await fetch(`${API_BASE}/bfl/deblur`, {
    method: 'POST',
    headers: getAuthHeaders('bfl'),
    body: JSON.stringify({ image, seed }),
  });
  const data = await handleResponse(resp);
  return { image_data: data.image_data };
};

export const BFL_ERASE_API = async (image, mask, apiKey) => {
  const resp = await fetch(`${API_BASE}/bfl/erase`, {
    method: 'POST',
    headers: getAuthHeaders('bfl'),
    body: JSON.stringify({ image, mask }),
  });
  const data = await handleResponse(resp);
  return { image_data: data.image_data };
};

// ── Photoroom API ──
export const PHOTOROOM_BG_REMOVE = async (image, apiKey, format = 'png') => {
  const resp = await fetch(`${API_BASE}/photoroom/bg-remove`, {
    method: 'POST',
    headers: getAuthHeaders('photoroom'),
    body: JSON.stringify({ image, format }),
  });
  const data = await handleResponse(resp);
  return { image_data: data.image_data };
};

export const PHOTOROOM_SCENE = async (image, prompt, apiKey) => {
  const resp = await fetch(`${API_BASE}/photoroom/scene`, {
    method: 'POST',
    headers: getAuthHeaders('photoroom'),
    body: JSON.stringify({ image, prompt }),
  });
  const data = await handleResponse(resp);
  return { image_data: data.image_data };
};

export const PHOTOROOM_EDIT_V2 = async (image, apiKey, options = {}) => {
  const resp = await fetch(`${API_BASE}/photoroom/edit`, {
    method: 'POST',
    headers: getAuthHeaders('photoroom'),
    body: JSON.stringify({ image, options }),
  });
  const data = await handleResponse(resp);
  return { image_data: data.image_data };
};

// ── DeepSeek API ──
export const DEEPSEEK_DIRECT_API = async (messages, apiKey, model = 'deepseek-chat') => {
  const resp = await fetch(`${API_BASE}/deepseek/chat`, {
    method: 'POST',
    headers: getAuthHeaders('deepseek'),
    body: JSON.stringify({ messages, model }),
  });
  const data = await handleResponse(resp);
  return data.content;
};

// ── Gemini Chat API（文本生成 + 图像分析，走 Vertex AI）──
export const GEMINI_CHAT_API = async (messages, modelName = 'gemini-2.5-flash') => {
  const resp = await fetch(`${API_BASE}/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, modelName }),
  });
  const data = await handleResponse(resp);
  return data.content;
};

// ── Doubao API ──
export const DOUBAO_DIRECT_API = async (prompt, images, apiKey, modelName = 'ep-20260605205933-jj5fh') => {
  const fullPrompt = images?.length ? prompt + '（已附参考图）' : prompt;
  const resp = await fetch(`${API_BASE}/doubao/chat`, {
    method: 'POST',
    headers: getAuthHeaders('doubao'),
    body: JSON.stringify({ prompt: fullPrompt, modelName }),
  });
  const data = await handleResponse(resp);
  return { image_data: data.image_data };
};


// ── Ideogram API ──
// 文生图（支持精准文字渲染）
export const IDEOGRAM_GENERATE_API = async (prompt, apiKey, options = {}) => {
  const resp = await fetch(`${API_BASE}/ideogram/generate`, {
    method: 'POST',
    headers: getAuthHeaders('ideogram'),
    body: JSON.stringify({
      prompt,
      aspectRatio: options.aspectRatio || 'ASPECT_1_1',
      model: options.model || 'V_2',
      styleType: options.styleType || 'GENERAL',
      magicPromptOption: options.magicPromptOption || 'AUTO',
      negativePrompt: options.negativePrompt || '',
    }),
  });
  const data = await handleResponse(resp);
  return { image_data: data.image_data, seed: data.seed, resolution: data.resolution };
};

// 图像混合/编辑（Remix）— 基于上传图片 + prompt 重新设计
export const IDEOGRAM_REMIX_API = async (image, prompt, apiKey, options = {}) => {
  const resp = await fetch(`${API_BASE}/ideogram/remix`, {
    method: 'POST',
    headers: getAuthHeaders('ideogram'),
    body: JSON.stringify({
      image,
      prompt,
      aspectRatio: options.aspectRatio || 'ASPECT_1_1',
      model: options.model || 'V_2',
      imageWeight: options.imageWeight ?? 50,
      magicPromptOption: options.magicPromptOption || 'AUTO',
      negativePrompt: options.negativePrompt || '',
    }),
  });
  const data = await handleResponse(resp);
  return { image_data: data.image_data, seed: data.seed, resolution: data.resolution };
};

// 图像放大高清（Upscale）
export const IDEOGRAM_UPSCALE_API = async (image, apiKey) => {
  const resp = await fetch(`${API_BASE}/ideogram/upscale`, {
    method: 'POST',
    headers: getAuthHeaders('ideogram'),
    body: JSON.stringify({ image }),
  });
  const data = await handleResponse(resp);
  return { image_data: data.image_data, resolution: data.resolution };
};

// ── 系统状态查询 ──
export const getSystemHealth = async () => {
  const resp = await fetch('/api/health');
  return resp.json();
};

export const getConfiguredProviders = async () => {
  const resp = await fetch('/api/providers');
  return resp.json();
};
