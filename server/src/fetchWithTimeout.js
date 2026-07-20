/**
 * 带超时与脱敏错误处理的 fetch 封装
 *
 * 解决：
 *   1. Node 原生 fetch 无默认超时 —— 上游挂起会无限占用连接与额度
 *   2. 上游错误原文直接回传客户端 —— 信息泄露（账户/堆栈/请求ID）
 *
 * 用法：
 *   const { fetchUpstream, UpstreamError } = await import('./fetchWithTimeout.js');
 *   const resp = await fetchUpstream(url, { method: 'POST', ... }, { timeout: 30000 });
 */

const DEFAULT_TIMEOUT = 30000; // 30 秒

/**
 * 上游错误：携带真实信息供服务端日志，但对外只暴露通用文案
 */
export class UpstreamError extends Error {
  constructor(message, { status = 502, publicMessage = '上游服务暂不可用，请稍后重试' } = {}) {
    super(message);
    this.name = 'UpstreamError';
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

/**
 * 带超时的 fetch
 * @param {string} url
 * @param {object} options - 标准 fetch options
 * @param {object} [extra]
 * @param {number} [extra.timeout=30000] 超时毫秒
 * @param {AbortSignal} [extra.signal] 额外信号（如客户端断开）
 */
export async function fetchUpstream(url, options = {}, { timeout = DEFAULT_TIMEOUT, signal: externalSignal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  // 如果外部还提供了信号（如 req 退出），则联动 abort
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new UpstreamError(`请求超时或已取消: ${url}`, {
        status: 504,
        publicMessage: '上游请求超时，请稍后重试',
      });
    }
    throw new UpstreamError(`网络错误: ${err.message}`, {
      status: 502,
      publicMessage: '无法连接上游服务，请稍后重试',
    });
  } finally {
    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
  }
}

/**
 * 读取上游错误响应并抛出脱敏错误
 * 详细内容仅记录到服务端日志，不回传客户端
 * @param {Response} resp - 上游响应
 * @param {string} tag - 日志标签，如 'Gemini' / 'BFL'
 * @param {number} [sliceLen=200] - 日志保留的响应体长度
 */
export async function throwUpstreamError(resp, tag, sliceLen = 300) {
  let detail = '';
  try {
    detail = (await resp.text()).slice(0, sliceLen);
  } catch { /* 忽略读取失败 */ }
  // 服务端日志：保留真实状态码与摘要供排查
  console.error(`[${tag}] 上游错误 HTTP ${resp.status}: ${detail}`);
  // 对外：仅返回通用文案（不暴露上游内部信息）
  throw new UpstreamError(`${tag} 上游 HTTP ${resp.status}`, {
    status: 502,
    publicMessage: `${tag} 服务暂不可用 (HTTP ${resp.status})`,
  });
}

export default fetchUpstream;
