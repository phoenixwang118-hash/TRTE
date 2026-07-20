/**
 * DIY 工作流节点类型注册表
 *
 * 职责：
 *   1. 定义 13 种节点类型枚举（NODE_TYPES）
 *   2. 定义节点运行状态机（NODE_STATUS）
 *   3. 维护节点元信息（颜色 / 输入输出端口数 / 标题 / 图标 / 描述）
 *   4. 提供 createNodeData 工厂函数，生成节点初始 data
 *   5. 暴露 TOOLBAR_NODES 工具栏可拖拽节点列表（按业务流程排序）
 */

// 节点类型枚举
export const NODE_TYPES = {
  PROMPT: 'prompt',
  REFERENCE: 'reference',
  GENERATE: 'generate',
  IMAGE: 'image',
  REMOVE_BG: 'removeBackground',
  UPSCALE: 'upscale',
  PRODUCT: 'product',
  MOCKUP: 'mockup',
  PRODUCT_CONFIG: 'productConfig',
  PERSONAL_CHECKOUT: 'personalCheckout',
  CREATOR_PRICING: 'creatorPricing',
  SHARE_PRODUCT: 'shareProduct',
  CREATOR_EARNINGS: 'creatorEarnings',
};

// 节点状态机
export const NODE_STATUS = {
  IDLE: 'idle',
  QUEUED: 'queued',
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled',
};

// 节点元信息（颜色 / 输入输出端口 / 标题 / 图标 / 描述）
export const NODE_META = {
  [NODE_TYPES.PROMPT]:            { title: '提示词', color: '#7C3AED', inputs: 0, outputs: 1, icon: '✏️', desc: '输入文本提示词' },
  [NODE_TYPES.REFERENCE]:         { title: '参考图', color: '#60A5FA', inputs: 0, outputs: 1, icon: '🖼️', desc: '上传参考图片' },
  [NODE_TYPES.GENERATE]:          { title: 'AI 生成', color: '#7C3AED', inputs: 2, outputs: 1, icon: '✨', desc: '调用 AI 引擎生成图像' },
  [NODE_TYPES.IMAGE]:             { title: '图像', color: '#67E8F9', inputs: 0, outputs: 1, icon: '📸', desc: '静态图像输入' },
  [NODE_TYPES.REMOVE_BG]:         { title: '去背景', color: '#34D399', inputs: 1, outputs: 1, icon: '🪄', desc: 'Photoroom 去背景' },
  [NODE_TYPES.UPSCALE]:           { title: '高清放大', color: '#34D399', inputs: 1, outputs: 1, icon: '🔍', desc: 'Ideogram 高清放大' },
  [NODE_TYPES.PRODUCT]:           { title: '商品', color: '#FDBA74', inputs: 1, outputs: 1, icon: '📦', desc: '选择 POD 商品' },
  [NODE_TYPES.MOCKUP]:            { title: '合成效果图', color: '#FDBA74', inputs: 2, outputs: 1, icon: '🎨', desc: '将设计合成到 POD 商品' },
  [NODE_TYPES.PRODUCT_CONFIG]:    { title: '商品配置', color: '#FDBA74', inputs: 1, outputs: 1, icon: '⚙️', desc: '配置颜色 / 尺码 / 数量' },
  [NODE_TYPES.PERSONAL_CHECKOUT]: { title: '个人结算', color: '#F87171', inputs: 1, outputs: 0, icon: '🛒', desc: '个人购买结算' },
  [NODE_TYPES.CREATOR_PRICING]:   { title: '设计者定价', color: '#7C3AED', inputs: 1, outputs: 1, icon: '💰', desc: '为商品设置售价' },
  [NODE_TYPES.SHARE_PRODUCT]:     { title: '分享商品', color: '#60A5FA', inputs: 1, outputs: 1, icon: '🔗', desc: '生成分享链接' },
  [NODE_TYPES.CREATOR_EARNINGS]:  { title: '设计者收益', color: '#34D399', inputs: 0, outputs: 0, icon: '📊', desc: '查看佣金流水' },
};

// 创建节点初始 data
export function createNodeData(type) {
  const base = {
    type,
    title: NODE_META[type]?.title || type,
    status: NODE_STATUS.IDLE,
    output: null,        // 运行后产出（图像 dataURL 等）
    error: null,
    config: {},          // 节点特定配置
    updatedAt: Date.now(),
  };
  switch (type) {
    case NODE_TYPES.PROMPT:
      base.config = { text: '', engine: 'gemini' };
      break;
    case NODE_TYPES.REFERENCE:
      base.config = { imageUrl: '' };
      break;
    case NODE_TYPES.GENERATE:
      base.config = { engine: 'gemini', modelName: 'gemini-2.5-flash-image' };
      break;
    case NODE_TYPES.IMAGE:
      base.config = { imageUrl: '' };
      break;
    case NODE_TYPES.REMOVE_BG:
      base.config = { format: 'png' };
      break;
    case NODE_TYPES.UPSCALE:
      base.config = {};
      break;
    case NODE_TYPES.PRODUCT:
      base.config = { podProductId: 'pod_tshirt' };
      break;
    case NODE_TYPES.MOCKUP:
      base.config = {};
      break;
    case NODE_TYPES.PRODUCT_CONFIG:
      base.config = { color: '', size: '', quantity: 1 };
      break;
    case NODE_TYPES.PERSONAL_CHECKOUT:
      base.config = {};
      break;
    case NODE_TYPES.CREATOR_PRICING:
      base.config = { price: 0, oldPrice: 0 };
      break;
    case NODE_TYPES.SHARE_PRODUCT:
      base.config = { password: '', expiresInDays: 0, maxSales: 0, generatedLink: '' };
      break;
    case NODE_TYPES.CREATOR_EARNINGS:
      base.config = {};
      break;
  }
  return base;
}

// 工具栏可拖拽的节点列表（按业务流程排序）
export const TOOLBAR_NODES = [
  NODE_TYPES.PROMPT,
  NODE_TYPES.REFERENCE,
  NODE_TYPES.GENERATE,
  NODE_TYPES.IMAGE,
  NODE_TYPES.REMOVE_BG,
  NODE_TYPES.UPSCALE,
  NODE_TYPES.PRODUCT,
  NODE_TYPES.MOCKUP,
  NODE_TYPES.PRODUCT_CONFIG,
  NODE_TYPES.PERSONAL_CHECKOUT,
  NODE_TYPES.CREATOR_PRICING,
  NODE_TYPES.SHARE_PRODUCT,
  NODE_TYPES.CREATOR_EARNINGS,
];
