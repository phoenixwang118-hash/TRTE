import React from 'react';
import BaseNode from './BaseNode';

// 个人结算节点
export default function PersonalCheckoutNode(props) {
  const handleOpenCart = () => {
    // 由 app.jsx 注入到 window 上的购物车打开方法
    if (typeof window !== 'undefined' && typeof window.__openCart === 'function') {
      window.__openCart();
    }
  };

  return (
    <BaseNode {...props}>
      <div className="wf-node-hint">个人购买结算</div>
      <button className="wf-node-action-btn" onClick={handleOpenCart}>
        打开购物车
      </button>
    </BaseNode>
  );
}
