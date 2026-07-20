/**
 * CoXoF Ai DIY V3 — 应用主壳
 *
 * 架构：删除经典 Studio + 会员系统后，应用根路径直接进入 DIY 工作流。
 *
 * 结构：
 *   ┌─ TopMenu（Vision Pro 顶部栏：品牌 / 模式 / 购物车 / 收益）
 *   ├─ DIYWorkflowWorkspace（React Flow 无限画布 + 13 节点）
 *   ├─ CartDrawer（右侧滑出购物车抽屉）
 *   └─ EarningsDashboard（设计者收益浮层）
 */
import React, { useState, useEffect } from 'react';
import TopMenu from './components/TopMenu';
import DIYWorkflowWorkspace from './features/diy-workflow/DIYWorkflowWorkspace';
import CartDrawer from './features/checkout/CartDrawer';
import EarningsDashboard from './features/creator-sales/EarningsDashboard';
import { podApi } from './api';
import { usePodStore } from './stores/podStore';

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [earningsOpen, setEarningsOpen] = useState(false);

  // 初始化：加载 POD 商品目录到前端 store
  const setPodProducts = usePodStore(s => s.setProducts);
  useEffect(() => {
    podApi.getProducts().then(data => setPodProducts(data.products || [])).catch(() => {});
  }, [setPodProducts]);

  // 注入全局钩子（节点组件通过 window.__openCart / __openEarnings 触发）
  useEffect(() => {
    window.__openCart = () => setCartOpen(true);
    window.__openEarnings = () => setEarningsOpen(true);
    return () => { delete window.__openCart; delete window.__openEarnings; };
  }, []);

  return (
    <div className="vedaart-shell vision-shell">
      <TopMenu
        onOpenCart={() => setCartOpen(true)}
        onOpenEarnings={() => setEarningsOpen(true)}
      />
      <main className="vision-main">
        <DIYWorkflowWorkspace />
      </main>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {earningsOpen && <EarningsDashboard onClose={() => setEarningsOpen(false)} />}
    </div>
  );
}
