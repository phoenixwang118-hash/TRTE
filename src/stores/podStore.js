/**
 * POD 商品本地缓存 Store
 *
 * 设计：
 *   - products 初始为空，由 app 启动时通过 podApi.getProducts() 加载
 *   - 与后端 POD_CATALOG 对齐（6 个静态 POD 产品）
 *   - 成本计算复刻后端 calculatePodCost 逻辑：
 *       unitCost = baseCost + printingCost + packagingCost
 *       subtotal = unitCost * quantity
 *       platform = subtotal * 10%
 *       payment  = subtotal * 2.9%
 *       total    = subtotal + platform + payment
 *   - 设计者佣金 = 销售额 - 成本
 */
import { create } from 'zustand';

// 平台费率（占小计百分比）
const PLATFORM_FEE_RATE = 0.10;
// 支付费率（占小计百分比）
const PAYMENT_FEE_RATE = 0.029;

export const usePodStore = create((set, get) => ({
  // ── State ──
  products: [],

  // ── Actions ──

  // 设置 POD 商品列表（通常在 app 初始化时调用）
  setProducts(list) {
    set({ products: Array.isArray(list) ? list : [] });
  },

  // 获取单个 POD 商品
  getProduct(id) {
    return get().products.find((p) => p.id === id) || null;
  },
}));

/**
 * 工具函数：计算 POD 成本（与后端 calculatePodCost 对齐）
 * @param {string} productId POD 商品 id
 * @param {number} quantity 数量
 * @returns {{total:number, base:number, printing:number, packaging:number, platform:number, payment:number}}
 */
export function calculateCost(productId, quantity = 1) {
  const pod = usePodStore.getState().products.find((p) => p.id === productId);
  if (!pod) {
    return { total: 0, base: 0, printing: 0, packaging: 0, platform: 0, payment: 0 };
  }
  const unitCost = pod.baseCost + pod.printingCost + pod.packagingCost;
  const subtotal = unitCost * quantity;
  const platform = +(subtotal * PLATFORM_FEE_RATE).toFixed(2);
  const payment = +(subtotal * PAYMENT_FEE_RATE).toFixed(2);
  return {
    base: +(pod.baseCost * quantity).toFixed(2),
    printing: +(pod.printingCost * quantity).toFixed(2),
    packaging: +(pod.packagingCost * quantity).toFixed(2),
    platform,
    payment,
    total: +(subtotal + platform + payment).toFixed(2),
  };
}

/**
 * 工具函数：计算设计者佣金
 * @param {string} productId POD 商品 id
 * @param {number} quantity 数量
 * @param {number} salePrice 单件售价
 * @returns {number} 佣金金额（销售额 - 成本）
 */
export function calculateCreatorEarning(productId, quantity, salePrice) {
  const cost = calculateCost(productId, quantity);
  const revenue = (Number(salePrice) || 0) * (Number(quantity) || 0);
  return +(revenue - cost.total).toFixed(2);
}
