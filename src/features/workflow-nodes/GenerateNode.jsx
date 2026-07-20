import React from 'react';
import BaseNode from './BaseNode';

// AI 生成节点
export default function GenerateNode(props) {
  const { data, _callbacks } = props;
  const config = data.config || {};

  // 不同引擎对应的模型列表
  const modelOptions =
    config.engine === 'bfl'
      ? [{ value: 'flux-2-klein-9b-preview', label: 'FLUX 2 Klein 9B Preview' }]
      : [
          { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image' },
          { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image Preview' },
        ];

  return (
    <BaseNode {...props}>
      <div className="wf-node-field">
        <label className="wf-node-label">引擎</label>
        <select
          className="wf-node-select"
          value={config.engine || 'gemini'}
          onChange={(e) => {
            const engine = e.target.value;
            // 切换引擎时重置模型为该引擎的默认模型
            const defaultModel =
              engine === 'bfl' ? 'flux-2-klein-9b-preview' : 'gemini-2.5-flash-image';
            _callbacks?.onUpdateConfig({ engine, modelName: defaultModel });
          }}
        >
          <option value="gemini">Gemini</option>
          <option value="bfl">BFL</option>
        </select>
      </div>
      <div className="wf-node-field">
        <label className="wf-node-label">模型</label>
        <select
          className="wf-node-select"
          value={config.modelName || 'gemini-2.5-flash-image'}
          onChange={(e) => _callbacks?.onUpdateConfig({ modelName: e.target.value })}
        >
          {modelOptions.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="wf-node-status-text">状态：{data.status || 'idle'}</div>
    </BaseNode>
  );
}
