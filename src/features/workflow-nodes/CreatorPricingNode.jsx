import React from 'react';
import BaseNode from './BaseNode';

// 设计者定价节点：售价 + 原价
export default function CreatorPricingNode(props) {
  const { data, _callbacks } = props;
  const config = data.config || {};

  return (
    <BaseNode {...props}>
      <div className="wf-node-field">
        <label className="wf-node-label">售价</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="wf-node-input"
          value={config.price ?? 0}
          onChange={(e) => _callbacks?.onUpdateConfig({ price: Number(e.target.value) || 0 })}
        />
      </div>
      <div className="wf-node-field">
        <label className="wf-node-label">原价</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="wf-node-input"
          value={config.oldPrice ?? 0}
          onChange={(e) =>
            _callbacks?.onUpdateConfig({ oldPrice: Number(e.target.value) || 0 })
          }
        />
      </div>
    </BaseNode>
  );
}
