/**
 * DIY 工作流画布状态 Store（基于 React Flow）
 *
 * 职责：
 *   1. 维护节点 / 边 / 当前选中节点
 *   2. 暴露 React Flow 所需的 onNodesChange / onEdgesChange / onConnect 回调
 *   3. 提供 addNode / removeNode / duplicateNode / updateNodeData 等业务操作
 *   4. 通过 localStorage 持久化画布（key: coxof_workflow_canvas_v1）
 */
import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { createNodeData } from '../features/diy-workflow/workflowRegistry.js';

// localStorage 持久化 key
const STORAGE_KEY = 'coxof_workflow_canvas_v1';

// 生成节点 id
function genNodeId() {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// 生成边 id
function genEdgeId() {
  return `e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// 从 localStorage 加载初始状态（失败时返回空画布）
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { nodes: [], edges: [] };
    const parsed = JSON.parse(raw);
    return {
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
    };
  } catch (e) {
    console.warn('[workflowStore] 加载本地画布失败:', e?.message);
    return { nodes: [], edges: [] };
  }
}

// 写入 localStorage
function saveToStorage({ nodes, edges }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  } catch (e) {
    console.warn('[workflowStore] 保存本地画布失败:', e?.message);
  }
}

const initial = loadFromStorage();

export const useWorkflowStore = create((set, get) => ({
  // ── State ──
  nodes: initial.nodes,
  edges: initial.edges,
  selectedNodeId: null,

  // ── Actions ──

  // 创建新节点
  addNode(type, position) {
    const node = {
      id: genNodeId(),
      type,
      position,
      data: createNodeData(type),
    };
    set((state) => {
      const nodes = [...state.nodes, node];
      saveToStorage({ nodes, edges: state.edges });
      return { nodes, selectedNodeId: node.id };
    });
    return node;
  },

  // 合并节点 data 的部分字段
  updateNodeData(id, partial) {
    set((state) => {
      const nodes = state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...partial } } : n
      );
      saveToStorage({ nodes, edges: state.edges });
      return { nodes };
    });
  },

  // 更新节点状态（data.status）
  setNodeStatus(id, status) {
    get().updateNodeData(id, { status });
  },

  // 更新节点输出（data.output）
  setNodeOutput(id, output) {
    get().updateNodeData(id, { output });
  },

  // 删除节点 + 相连的 edges
  removeNode(id) {
    set((state) => {
      const nodes = state.nodes.filter((n) => n.id !== id);
      const edges = state.edges.filter((e) => e.source !== id && e.target !== id);
      saveToStorage({ nodes, edges });
      return {
        nodes,
        edges,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      };
    });
  },

  // 复制节点（位置偏移 +40）
  duplicateNode(id) {
    const src = get().nodes.find((n) => n.id === id);
    if (!src) return null;
    const newNode = {
      id: genNodeId(),
      type: src.type,
      position: { x: (src.position?.x || 0) + 40, y: (src.position?.y || 0) + 40 },
      data: { ...src.data },
    };
    set((state) => {
      const nodes = [...state.nodes, newNode];
      saveToStorage({ nodes, edges: state.edges });
      return { nodes, selectedNodeId: newNode.id };
    });
    return newNode;
  },

  // 应用 React Flow 节点变更
  onNodesChange(changes) {
    set((state) => {
      const nodes = applyNodeChanges(changes, state.nodes);
      saveToStorage({ nodes, edges: state.edges });
      return { nodes };
    });
  },

  // 应用 React Flow 边变更
  onEdgesChange(changes) {
    set((state) => {
      const edges = applyEdgeChanges(changes, state.edges);
      saveToStorage({ nodes: state.nodes, edges });
      return { edges };
    });
  },

  // 添加新 edge（React Flow onConnect 回调）
  onConnect(connection) {
    const edge = { ...connection, id: genEdgeId() };
    set((state) => {
      const edges = addEdge(edge, state.edges);
      saveToStorage({ nodes: state.nodes, edges });
      return { edges };
    });
  },

  // 找到所有连入此节点的 edges，返回 source 节点的 output 数组
  getUpstreamOutput(id) {
    const { nodes, edges } = get();
    const incomingEdges = edges.filter((e) => e.target === id);
    const outputs = [];
    for (const e of incomingEdges) {
      const src = nodes.find((n) => n.id === e.source);
      if (src && typeof src.data !== 'undefined') {
        outputs.push(src.data.output);
      }
    }
    return outputs;
  },
}));
