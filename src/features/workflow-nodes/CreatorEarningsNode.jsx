import React from 'react';
import BaseNode from './BaseNode';

// 设计者收益节点
export default function CreatorEarningsNode(props) {
  const handleOpenEarnings = () => {
    // 由 app.jsx 注入到 window 上的收益面板打开方法
    if (typeof window !== 'undefined' && typeof window.__openEarnings === 'function') {
      window.__openEarnings();
    }
  };

  return (
    <BaseNode {...props}>
      <div className="wf-node-hint">查看佣金流水</div>
      <button className="wf-node-action-btn" onClick={handleOpenEarnings}>
        打开收益面板
      </button>
    </BaseNode>
  );
}
