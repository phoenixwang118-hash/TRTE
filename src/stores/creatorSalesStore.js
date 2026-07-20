/**
 * 设计者销售前端本地状态 Store
 *
 * 用途：
 *   - 缓存 creator_products / share_links / earning_transactions 三类资源的本地副本
 *   - 节点 UI（如分享链接节点 / 销售看板节点）直接读本地状态，无需每帧打后端
 *   - 与后端 db.json 同步策略：动作执行后调用对应 api，成功后更新本地副本
 *
 * 持久化 key: coxof_creator_sales_v1（含 products / shareLinks / earnings 三个数组）
 */
import { create } from 'zustand';

const STORAGE_KEY = 'coxof_creator_sales_v1';

// 从 localStorage 加载本地缓存（失败时返回空结构）
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { products: [], shareLinks: [], earnings: [] };
    const parsed = JSON.parse(raw);
    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      shareLinks: Array.isArray(parsed.shareLinks) ? parsed.shareLinks : [],
      earnings: Array.isArray(parsed.earnings) ? parsed.earnings : [],
    };
  } catch (e) {
    console.warn('[creatorSalesStore] 加载本地缓存失败:', e?.message);
    return { products: [], shareLinks: [], earnings: [] };
  }
}

// 写入 localStorage
function saveToStorage({ products, shareLinks, earnings }) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ products, shareLinks, earnings })
    );
  } catch (e) {
    console.warn('[creatorSalesStore] 保存本地缓存失败:', e?.message);
  }
}

const initial = loadFromStorage();

export const useCreatorSalesStore = create((set, get) => ({
  // ── State ──
  products: initial.products,    // creator_products 本地副本
  shareLinks: initial.shareLinks, // share_links 本地副本
  earnings: initial.earnings,     // earning_transactions 本地副本

  // ── Products Actions ──

  // 设置商品列表（与后端同步后整体替换）
  setProducts(list) {
    const products = Array.isArray(list) ? list : [];
    set((state) => {
      saveToStorage({ products, shareLinks: state.shareLinks, earnings: state.earnings });
      return { products };
    });
  },

  // 追加一个商品
  addProduct(p) {
    set((state) => {
      const products = [p, ...state.products];
      saveToStorage({ products, shareLinks: state.shareLinks, earnings: state.earnings });
      return { products };
    });
  },

  // 更新商品部分字段
  updateProduct(id, partial) {
    set((state) => {
      const products = state.products.map((p) =>
        p.id === id ? { ...p, ...partial } : p
      );
      saveToStorage({ products, shareLinks: state.shareLinks, earnings: state.earnings });
      return { products };
    });
  },

  // 删除商品
  removeProduct(id) {
    set((state) => {
      const products = state.products.filter((p) => p.id !== id);
      saveToStorage({ products, shareLinks: state.shareLinks, earnings: state.earnings });
      return { products };
    });
  },

  // ── ShareLinks Actions ──

  // 追加一个分享链接
  addShareLink(l) {
    set((state) => {
      const shareLinks = [l, ...state.shareLinks];
      saveToStorage({ products: state.products, shareLinks, earnings: state.earnings });
      return { shareLinks };
    });
  },

  // ── Earnings Actions ──

  // 设置佣金流水列表（与后端同步后整体替换）
  setEarnings(list) {
    const earnings = Array.isArray(list) ? list : [];
    set((state) => {
      saveToStorage({ products: state.products, shareLinks: state.shareLinks, earnings });
      return { earnings };
    });
  },

  // 追加一条佣金流水
  addEarning(e) {
    set((state) => {
      const earnings = [e, ...state.earnings];
      saveToStorage({ products: state.products, shareLinks: state.shareLinks, earnings });
      return { earnings };
    });
  },

  // 更新佣金流水状态
  updateEarningStatus(id, status) {
    set((state) => {
      const earnings = state.earnings.map((e) =>
        e.id === id ? { ...e, status } : e
      );
      saveToStorage({ products: state.products, shareLinks: state.shareLinks, earnings });
      return { earnings };
    });
  },
}));
