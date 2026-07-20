import React from 'react';
import BaseNode from './BaseNode';

// POD 商品类型选项：图标 + 中文名
const POD_OPTIONS = [
  { value: 'pod_tshirt', icon: '👕', label: 'T恤' },
  { value: 'pod_hoodie', icon: '🧥', label: '连帽衫' },
  { value: 'pod_tote', icon: '👜', label: '托特包' },
  { value: 'pod_phonecase', icon: '📱', label: '手机壳' },
  { value: 'pod_poster', icon: '🖼️', label: '海报' },
  { value: 'pod_mug', icon: '☕', label: '马克杯' },
];

// POD 商品选择节点
export default function ProductNode(props) {
  const { data, _callbacks } = props;
  const config = data.config || {};
  const current = POD_OPTIONS.find((o) => o.value === config.podProductId) || POD_OPTIONS[0];

  return (
    <BaseNode {...props}>
      <div className="wf-node-field">
        <label className="wf-node-label">商品类型</label>
        <select
          className="wf-node-select"
          value={config.podProductId || 'pod_tshirt'}
          onChange={(e) => _callbacks?.onUpdateConfig({ podProductId: e.target.value })}
        >
          {POD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.icon} {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="wf-node-product-info">
        <span className="wf-node-product-icon">{current.icon}</span>
        <span className="wf-node-product-name">{current.label}</span>
      </div>
    </BaseNode>
  );
}
