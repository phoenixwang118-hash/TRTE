import React from 'react';
import { Handle, Position } from 'reactflow';
import { NODE_META, NODE_STATUS } from '../diy-workflow/workflowRegistry';

// 节点状态对应的圆点颜色
const STATUS_COLOR = {
  [NODE_STATUS.IDLE]: '#94A3B8',
  [NODE_STATUS.QUEUED]: '#F59E0B',
  [NODE_STATUS.RUNNING]: '#60A5FA',
  [NODE_STATUS.SUCCESS]: '#34D399',
  [NODE_STATUS.ERROR]: '#F87171',
  [NODE_STATUS.CANCELLED]: '#94A3B8',
};

// 基础节点壳：标题栏 + 状态点 + 端口 + 预览区 + 错误区 + 操作按钮
export default function BaseNode({ id, data, _callbacks, selected, children }) {
  const meta = NODE_META[data.type] || {};
  const color = meta.color || '#7C3AED';
  const statusColor = STATUS_COLOR[data.status] || STATUS_COLOR[NODE_STATUS.IDLE];

  return (
    <div
      className={`wf-node ${selected ? 'wf-node-selected' : ''}`}
      style={{ '--node-color': color, borderColor: selected ? color : undefined }}
    >
      {/* 输入端口 */}
      {meta.inputs > 0 && (
        <Handle type="target" position={Position.Left} className="wf-handle wf-handle-target" />
      )}
      {/* 标题栏 */}
      <div className="wf-node-header">
        <span className="wf-node-icon">{meta.icon}</span>
        <span className="wf-node-title">{data.title || meta.title}</span>
        <span className="wf-node-status" style={{ background: statusColor }} title={data.status} />
      </div>
      {/* 内容区 */}
      <div className="wf-node-body">{children}</div>
      {/* 预览区（有 output 时显示） */}
      {data.output?.imageUrl && (
        <div className="wf-node-preview">
          <img src={data.output.imageUrl} alt="preview" />
        </div>
      )}
      {/* 错误区 */}
      {data.error && <div className="wf-node-error">⚠ {data.error}</div>}
      {/* 操作按钮 */}
      <div className="wf-node-actions">
        {(data.status === NODE_STATUS.IDLE || data.status === NODE_STATUS.ERROR) && (
          <button className="wf-node-btn wf-node-btn-run" onClick={_callbacks?.onRun} title="运行">
            ▶
          </button>
        )}
        {data.status === NODE_STATUS.RUNNING && (
          <button className="wf-node-btn" disabled>
            …
          </button>
        )}
        <button className="wf-node-btn" onClick={_callbacks?.onDuplicate} title="复制">
          ⎘
        </button>
        <button className="wf-node-btn wf-node-btn-delete" onClick={_callbacks?.onDelete} title="删除">
          ✕
        </button>
      </div>
      {/* 输出端口 */}
      {meta.outputs > 0 && (
        <Handle type="source" position={Position.Right} className="wf-handle wf-handle-source" />
      )}
    </div>
  );
}
