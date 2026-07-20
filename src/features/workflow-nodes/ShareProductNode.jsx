import React from 'react';
import BaseNode from './BaseNode';

// POD 商品类型选项（与 ProductNode 保持一致）
const POD_OPTIONS = [
  { value: 'pod_tshirt', icon: '👕', label: 'T恤' },
  { value: 'pod_hoodie', icon: '🧥', label: '连帽衫' },
  { value: 'pod_tote', icon: '👜', label: '托特包' },
  { value: 'pod_phonecase', icon: '📱', label: '手机壳' },
  { value: 'pod_poster', icon: '🖼️', label: '海报' },
  { value: 'pod_mug', icon: '☕', label: '马克杯' },
];

// 分享商品节点
export default function ShareProductNode(props) {
  const { data, _callbacks } = props;
  const config = data.config || {};

  const handleCopyLink = () => {
    if (config.generatedLink && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(config.generatedLink);
    }
  };

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
      <div className="wf-node-field">
        <label className="wf-node-label">标题</label>
        <input
          type="text"
          className="wf-node-input"
          placeholder="商品标题"
          value={config.title || ''}
          onChange={(e) => _callbacks?.onUpdateConfig({ title: e.target.value })}
        />
      </div>
      <div className="wf-node-field">
        <label className="wf-node-label">售价</label>
        <input
          type="number"
          min="0"
          className="wf-node-input"
          value={config.price ?? 0}
          onChange={(e) => _callbacks?.onUpdateConfig({ price: Number(e.target.value) || 0 })}
        />
      </div>
      {config.generatedLink && (
        <div className="wf-node-link-row">
          <span className="wf-node-link" title={config.generatedLink}>
            {config.generatedLink}
          </span>
          <button className="wf-node-btn" onClick={handleCopyLink} title="复制链接">
            ⎘
          </button>
        </div>
      )}
    </BaseNode>
  );
}
