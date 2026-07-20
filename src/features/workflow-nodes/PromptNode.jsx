import React from 'react';
import BaseNode from './BaseNode';

// 提示词输入节点
export default function PromptNode(props) {
  const { data, _callbacks } = props;
  const config = data.config || {};

  return (
    <BaseNode {...props}>
      <div className="wf-node-field">
        <label className="wf-node-label">提示词</label>
        <textarea
          className="wf-node-textarea"
          rows={4}
          placeholder="描述你想要生成的图像..."
          value={config.text || ''}
          onChange={(e) => _callbacks?.onUpdateConfig({ text: e.target.value })}
        />
      </div>
      <div className="wf-node-field">
        <label className="wf-node-label">引擎</label>
        <select
          className="wf-node-select"
          value={config.engine || 'gemini'}
          onChange={(e) => _callbacks?.onUpdateConfig({ engine: e.target.value })}
        >
          <option value="gemini">Gemini</option>
          <option value="bfl">BFL</option>
        </select>
      </div>
    </BaseNode>
  );
}
