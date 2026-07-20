import React from 'react';
import BaseNode from './BaseNode';

// 合成效果图节点
export default function MockupNode(props) {
  const { data } = props;
  const config = data.config || {};

  return (
    <BaseNode {...props}>
      <div className="wf-node-hint">上游设计图 + POD 商品 → 合成 mockup</div>
      {config.podProductId && (
        <div className="wf-node-meta">当前商品：{config.podProductId}</div>
      )}
    </BaseNode>
  );
}
