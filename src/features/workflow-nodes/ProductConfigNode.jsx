import React from 'react';
import BaseNode from './BaseNode';

// 商品配置节点：颜色 / 尺寸 / 数量
export default function ProductConfigNode(props) {
  const { data, _callbacks } = props;
  const config = data.config || {};

  return (
    <BaseNode {...props}>
      <div className="wf-node-field">
        <label className="wf-node-label">颜色</label>
        <select
          className="wf-node-select"
          value={config.color || ''}
          onChange={(e) => _callbacks?.onUpdateConfig({ color: e.target.value })}
        >
          <option value="">选择颜色</option>
          <option value="black">黑色</option>
          <option value="white">白色</option>
          <option value="gray">灰色</option>
          <option value="navy">藏青</option>
          <option value="red">红色</option>
          <option value="blue">蓝色</option>
          <option value="green">绿色</option>
        </select>
      </div>
      <div className="wf-node-field">
        <label className="wf-node-label">尺寸</label>
        <select
          className="wf-node-select"
          value={config.size || ''}
          onChange={(e) => _callbacks?.onUpdateConfig({ size: e.target.value })}
        >
          <option value="">选择尺寸</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="XXL">XXL</option>
        </select>
      </div>
      <div className="wf-node-field">
        <label className="wf-node-label">数量</label>
        <input
          type="number"
          min="1"
          className="wf-node-input"
          value={config.quantity ?? 1}
          onChange={(e) =>
            _callbacks?.onUpdateConfig({ quantity: Number(e.target.value) || 1 })
          }
        />
      </div>
    </BaseNode>
  );
}
