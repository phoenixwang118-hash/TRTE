import React from 'react';
import BaseNode from './BaseNode';

// 去背景节点
export default function RemoveBackgroundNode(props) {
  const { data, _callbacks } = props;
  const config = data.config || {};

  return (
    <BaseNode {...props}>
      <div className="wf-node-field">
        <label className="wf-node-label">输出格式</label>
        <select
          className="wf-node-select"
          value={config.format || 'png'}
          onChange={(e) => _callbacks?.onUpdateConfig({ format: e.target.value })}
        >
          <option value="png">PNG</option>
          <option value="webp">WebP</option>
        </select>
      </div>
      <div className="wf-node-hint">连接到上游图像</div>
    </BaseNode>
  );
}
