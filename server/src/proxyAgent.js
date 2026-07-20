/**
 * 代理配置模块
 *
 * 解决：Node.js 原生 fetch 不自动读取系统代理，导致访问 Google/BFL 等境外 API 超时
 *
 * 安全说明：
 *   代理回退改为 null（无代理则直连），不再硬编码 127.0.0.1:10808。
 *   所有 API Key 会经过代理传输，所以生产环境不应使用不可信的代理。
 */
import { ProxyAgent, setGlobalDispatcher } from 'undici';

// 代理地址：仅从环境变量读取，无回退猜测
const PROXY_URL = process.env.HTTPS_PROXY || process.env.https_proxy
  || process.env.HTTP_PROXY || process.env.http_proxy
  || null; // 无环境变量 = 不使用代理（直连）

let dispatcher = null;

/**
 * 获取代理 dispatcher（单例）
 * 如果代理不可用或未配置，返回 null（使用默认 fetch）
 */
export function getDispatcher() {
  if (dispatcher !== null) return dispatcher;
  if (!PROXY_URL) {
    dispatcher = null;
    console.log('[Proxy] 未配置代理环境变量，将直连上游');
    return null;
  }
  try {
    dispatcher = new ProxyAgent(PROXY_URL);
    console.log(`[Proxy] 使用代理: ${PROXY_URL}`);
    return dispatcher;
  } catch (err) {
    console.warn(`[Proxy] 代理初始化失败: ${err.message}`);
    dispatcher = false; // 标记为不可用
    return false;
  }
}

/**
 * 带代理的 fetch 包装
 * 自动应用代理 dispatcher
 */
export async function fetchWithProxy(url, options = {}) {
  const d = getDispatcher();
  if (d) {
    options.dispatcher = d;
  }
  return fetch(url, options);
}

/**
 * 设置为全局 dispatcher（影响所有 fetch 调用）
 */
export function applyGlobalProxy() {
  const d = getDispatcher();
  if (d) {
    setGlobalDispatcher(d);
    console.log('[Proxy] 已设置为全局 dispatcher');
  }
}
