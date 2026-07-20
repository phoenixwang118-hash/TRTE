/**
 * 左侧节点工具栏
 *
 * 职责：
 *   1. 渲染 TOOLBAR_NODES 列出的节点按钮（按业务流程排序）
 *   2. 点击按钮 → 调用 onAddNode(type) 在画布上添加节点
 *   3. 每个按钮通过 CSS 变量 --node-color 注入节点主色
 *   4. 底部显示使用提示
 */
import React from 'react';
import { NODE_META, TOOLBAR_NODES } from './workflowRegistry';

export default function WorkflowToolbar({ onAddNode }) {
  return (
    <aside className="wf-toolbar">
      <div className="wf-toolbar-header">
        <h3>节点</h3>
        <p>点击添加到画布</p>
      </div>
      <div className="wf-toolbar-list">
        {TOOLBAR_NODES.map(type => {
          const meta = NODE_META[type];
          return (
            <button
              key={type}
              className="wf-toolbar-item"
              onClick={() => onAddNode(type)}
              style={{ '--node-color': meta.color }}
              title={meta.desc}
            >
              <span className="wf-toolbar-icon">{meta.icon}</span>
              <span className="wf-toolbar-label">{meta.title}</span>
            </button>
          );
        })}
      </div>
      <div className="wf-toolbar-help">
        <p>💡 拖动节点连接端口构建流程</p>
        <p>💡 点击节点右上角 ▶ 运行</p>
      </div>
    </aside>
  );
}
