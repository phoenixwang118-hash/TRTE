/**
 * DIY 工作流主工作区
 *
 * 职责：
 *   1. 整合 WorkflowToolbar + WorkflowCanvas + WorkflowMiniMap
 *   2. 提供 handleAddNode：在画布上添加新节点（位置带随机偏移避免重叠）
 *   3. 实现 runNode 调度器：根据节点类型调用对应 API（Gemini / BFL / Photoroom /
 *      Ideogram / creatorProducts / shareLinks），并把结果写回 store
 *   4. 通过 window.__wfRunNode 全局变量把 runNode 暴露给 WorkflowCanvas 的 _callbacks.onRun
 *
 * Phase 2 简化：
 *   - MOCKUP 节点 composeMockup 直接返回原图（待 Phase 3 实现 Canvas 合成）
 *   - 节点调度器通过 window 全局变量传递，避免改 zustand store
 */
import React, { useCallback, useEffect } from 'react';
import WorkflowToolbar from './WorkflowToolbar';
import WorkflowCanvas from './WorkflowCanvas';
import { useWorkflowStore } from '../../stores/workflowStore';
import { NODE_TYPES, NODE_STATUS } from './workflowRegistry';
// AI 图像 API
import {
  GEMINI_DIRECT_API,
  BFL_DIRECT_API,
  IDEOGRAM_UPSCALE_API,
  PHOTOROOM_BG_REMOVE,
} from '../../api';
// 业务 API（POD / 购物车 / 设计者商品 / 分享链接）
import { creatorSalesApi, shareLinkApi } from '../../api';

export default function DIYWorkflowWorkspace() {
  const store = useWorkflowStore();

  // 添加节点（默认位置稍微随机避免重叠）
  const handleAddNode = useCallback((type) => {
    const position = {
      x: 120 + Math.random() * 240,
      y: 120 + Math.random() * 160,
    };
    store.addNode(type, position);
  }, [store]);

  // 节点运行调度器
  const runNode = useCallback(async (nodeId) => {
    const node = store.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const upstreamOutputs = store.getUpstreamOutput(nodeId);
    const firstInput = upstreamOutputs[0];

    store.setNodeStatus(nodeId, NODE_STATUS.RUNNING);
    try {
      let output = null;
      switch (node.type) {
        case NODE_TYPES.GENERATE: {
          // 拼接上游 PROMPT 文本 + 上游参考图
          const promptText = upstreamOutputs.map(o => o?.text).filter(Boolean).join('\n')
            || node.data.config?.text
            || 'a cute cat';
          const refImages = upstreamOutputs.map(o => o?.imageUrl).filter(Boolean);
          // 把拼接后的 prompt 回写到节点 config，便于后续重试
          store.updateNodeData(nodeId, { config: { ...node.data.config, text: promptText } });
          const engine = node.data.config.engine || 'gemini';
          if (engine === 'bfl') {
            const r = await BFL_DIRECT_API(promptText, refImages, null, node.data.config.modelName || 'flux-2-klein-9b-preview');
            output = { imageUrl: `data:image/png;base64,${r.image_data}` };
          } else {
            const r = await GEMINI_DIRECT_API(promptText, refImages, null, node.data.config.modelName || 'gemini-2.5-flash-image');
            output = { imageUrl: `data:image/png;base64,${r.image_data}` };
          }
          break;
        }
        case NODE_TYPES.REMOVE_BG: {
          if (!firstInput?.imageUrl) throw new Error('需要上游图像');
          const r = await PHOTOROOM_BG_REMOVE(firstInput.imageUrl, null, node.data.config.format || 'png');
          output = { imageUrl: `data:image/png;base64,${r.image_data}` };
          break;
        }
        case NODE_TYPES.UPSCALE: {
          if (!firstInput?.imageUrl) throw new Error('需要上游图像');
          const r = await IDEOGRAM_UPSCALE_API(firstInput.imageUrl, null);
          output = { imageUrl: `data:image/png;base64,${r.image_data}` };
          break;
        }
        case NODE_TYPES.MOCKUP: {
          // 前端 Canvas 合成：把设计图绘制到 POD 模板
          const designImg = firstInput?.imageUrl;
          if (!designImg) throw new Error('需要上游设计图');
          const mockup = await composeMockup(designImg, node.data.config.podProductId || 'pod_tshirt');
          output = { imageUrl: mockup };
          break;
        }
        case NODE_TYPES.CREATOR_PRICING: {
          // 仅记录价格，不调用 API
          output = { price: node.data.config.price, oldPrice: node.data.config.oldPrice };
          break;
        }
        case NODE_TYPES.SHARE_PRODUCT: {
          // 先在本地创建 creatorProduct（POST /api/creator-products）
          // 然后 createShareLink（POST /api/share-links）
          const cp = await creatorSalesApi.create({
            podProductId: node.data.config.podProductId || 'pod_tshirt',
            title: node.data.config.title || '我的设计',
            designImage: firstInput?.imageUrl || '',
            mockup: firstInput?.imageUrl || '',
            price: node.data.config.price || 25,
            oldPrice: node.data.config.oldPrice || 0,
          });
          const link = await shareLinkApi.create({ productId: cp.product.id });
          // 把生成的分享链接回写到 config.generatedLink
          store.updateNodeData(nodeId, {
            config: {
              ...node.data.config,
              generatedLink: `${window.location.origin}/p/${link.link.slug}`,
            },
          });
          output = {
            link: `${window.location.origin}/p/${link.link.slug}`,
            productId: cp.product.id,
          };
          break;
        }
        default:
          // 其他节点类型 Phase 2 占位
          output = { message: `${node.type} 节点运行占位` };
      }
      store.setNodeOutput(nodeId, output);
      store.setNodeStatus(nodeId, NODE_STATUS.SUCCESS);
    } catch (e) {
      store.updateNodeData(nodeId, { error: e.message });
      store.setNodeStatus(nodeId, NODE_STATUS.ERROR);
    }
  }, [store]);

  // 注入 runNode 到 window 全局变量，供 WorkflowCanvas 的 _callbacks.onRun 调用
  // Phase 2 简化方案：避免改 zustand store 结构
  useEffect(() => {
    window.__wfRunNode = runNode;
  }, [runNode]);

  return (
    <div className="wf-workspace">
      <WorkflowToolbar onAddNode={handleAddNode} />
      <div className="wf-canvas-container">
        <WorkflowCanvas />
      </div>
    </div>
  );
}

// 前端 Canvas 合成 mockup
// Phase 2 占位：直接返回原图，待 Phase 3 实现真正的 POD 模板合成
async function composeMockup(designImageUrl, podProductId) {
  return designImageUrl;
}
