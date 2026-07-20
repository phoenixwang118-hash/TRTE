/**
 * React Flow 画布包装器
 *
 * 职责：
 *   1. 注册 13 种节点类型组件到 React Flow
 *   2. 通过 renderNode 高阶函数把 _callbacks（onUpdateConfig / onRun / onRetry /
 *      onDuplicate / onDelete / onSelect）注入到每个节点组件
 *   3. 渲染 Background + Controls
 *
 * 注意：
 *   - onRun / onRetry 走 window.__wfRunNode 全局函数（由 DIYWorkflowWorkspace 注入），
 *     因为 zustand store 不便直接挂载方法。Phase 2 简化方案。
 *   - store.setSelectedNodeId 不一定存在，使用 ?. 链路在缺失时自动 noop。
 */
import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '../../stores/workflowStore';
import { NODE_META, NODE_TYPES } from './workflowRegistry';
// 节点组件
import PromptNode from '../workflow-nodes/PromptNode';
import ReferenceNode from '../workflow-nodes/ReferenceNode';
import GenerateNode from '../workflow-nodes/GenerateNode';
import ImageNode from '../workflow-nodes/ImageNode';
import RemoveBackgroundNode from '../workflow-nodes/RemoveBackgroundNode';
import UpscaleNode from '../workflow-nodes/UpscaleNode';
import ProductNode from '../workflow-nodes/ProductNode';
import MockupNode from '../workflow-nodes/MockupNode';
import ProductConfigNode from '../workflow-nodes/ProductConfigNode';
import PersonalCheckoutNode from '../workflow-nodes/PersonalCheckoutNode';
import CreatorPricingNode from '../workflow-nodes/CreatorPricingNode';
import ShareProductNode from '../workflow-nodes/ShareProductNode';
import CreatorEarningsNode from '../workflow-nodes/CreatorEarningsNode';

// 包装：注入 _callbacks 到每个节点组件
function renderNode(NodeComp) {
  return function Wrapped(props) {
    const store = useWorkflowStore();
    const callbacks = useMemo(() => ({
      // 合并 partial 到节点 config
      onUpdateConfig: (partial) => store.updateNodeData(props.id, { config: { ...props.data.config, ...partial } }),
      // 运行节点：通过 window.__wfRunNode 调度（由 DIYWorkflowWorkspace 注入）
      onRun: () => window.__wfRunNode?.(props.id),
      // 重试：同样走全局调度器
      onRetry: () => window.__wfRunNode?.(props.id),
      // 复制节点
      onDuplicate: () => store.duplicateNode(props.id),
      // 删除节点
      onDelete: () => store.removeNode(props.id),
      // 选中节点：store 可能没有 setSelectedNodeId，使用 ?. 在缺失时 noop
      onSelect: () => store.setSelectedNodeId?.(props.id),
    }), [props.id, props.data.config]);
    return React.createElement(NodeComp, { ...props, _callbacks: callbacks });
  };
}

// 节点类型 → 渲染组件映射
const nodeTypes = {
  [NODE_TYPES.PROMPT]: renderNode(PromptNode),
  [NODE_TYPES.REFERENCE]: renderNode(ReferenceNode),
  [NODE_TYPES.GENERATE]: renderNode(GenerateNode),
  [NODE_TYPES.IMAGE]: renderNode(ImageNode),
  [NODE_TYPES.REMOVE_BG]: renderNode(RemoveBackgroundNode),
  [NODE_TYPES.UPSCALE]: renderNode(UpscaleNode),
  [NODE_TYPES.PRODUCT]: renderNode(ProductNode),
  [NODE_TYPES.MOCKUP]: renderNode(MockupNode),
  [NODE_TYPES.PRODUCT_CONFIG]: renderNode(ProductConfigNode),
  [NODE_TYPES.PERSONAL_CHECKOUT]: renderNode(PersonalCheckoutNode),
  [NODE_TYPES.CREATOR_PRICING]: renderNode(CreatorPricingNode),
  [NODE_TYPES.SHARE_PRODUCT]: renderNode(ShareProductNode),
  [NODE_TYPES.CREATOR_EARNINGS]: renderNode(CreatorEarningsNode),
};

export default function WorkflowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkflowStore();
  return (
    <div className="wf-canvas-wrapper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{ style: { stroke: '#7C3AED', strokeWidth: 2 }, animated: true }}
      >
        <Background color="#C4B5FD" gap={20} size={1.5} />
        <Controls className="wf-controls" />
        <MiniMap
          nodeColor={(node) => NODE_META[node.type]?.color || '#7C3AED'}
          maskColor="rgba(238, 245, 255, 0.6)"
          style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 12 }}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
