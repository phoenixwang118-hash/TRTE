/**
 * API Key 统一管理模块 — SaaS 版
 *
 * 优先级：
 *   1. 用户自有 Key（数据库存储，登录用户）
 *   2. 平台 Key（环境变量，管理员配置）
 *   3. 前端请求头透传（兼容旧前端）
 *
 * 安全：永远不把 Key 写入日志
 */
import config from './config.js';
import { ApiKey } from './db.js';

/**
 * 获取指定提供商的 API Key
 * @param {string} provider - gemini | bfl | photoroom | deepseek | doubao | ideogram
 * @param {object} req - Express request（含 req.user 如果已登录）
 * @returns {string} API Key
 */
export function getKey(provider, req) {
  // 1. 用户自有 Key（数据库存储）
  if (req?.user?.id) {
    const userKey = ApiKey.get(req.user.id, provider);
    if (userKey) return userKey;
  }

  // 2. 平台 Key（环境变量）
  const envKey = config.apiKeys[provider];
  if (envKey) return envKey;

  // 3. 前端透传的专用 Key
  const headerKey = req?.headers[`x-api-key-${provider}`];
  if (headerKey) return headerKey;

  // 4. 通用 Key 头（兼容旧前端）
  const genericKey = req?.headers['x-key'];
  if (genericKey) return genericKey;

  return '';
}

export function hasKey(provider, req) {
  return !!getKey(provider, req);
}

export function listConfiguredProviders(req) {
  const providers = ['gemini', 'bfl', 'photoroom', 'deepseek', 'doubao', 'ideogram'];
  return providers.filter(p => hasKey(p, req));
}

export function maskKey(key) {
  if (!key || key.length < 12) return '***';
  return key.slice(0, 4) + '****' + key.slice(-4);
}
