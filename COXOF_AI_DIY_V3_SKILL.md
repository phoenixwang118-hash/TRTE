---
name: coxof-ai-diy-v3-existing-app-upgrade
description: 将现有 COXOF React + Node.js 程序增量升级为 Apple Vision Pro 风格开放式 AI DIY 桌面，支持无限画布、POD 产品定制、个人购买、设计者创建分享商品、客户支付、平台生产发货、佣金结算与提现。必须保留现有六个 AI 引擎路由、统一 api.js、认证与中间件链，不允许整套重写。
---

# COXOF AI DIY V3 中文开发 Skill

## 1. 项目目标

在现有程序基础上进行增量升级，不重新开发现有 AI 引擎，不推翻现有前后端结构。

最终产品定位：

```text
AI DIY 创作
+
POD 商品定制
+
个人直接购买
+
设计者分享销售
+
在线收款
+
平台生产
+
平台发货
+
设计者佣金与提现
```

平台不开发公共商城。

平台只支持两条业务主线。

### 1.1 个人购买

```text
AI / DIY 设计
→ 选择 POD 产品
→ 生成 Mockup
→ 配置颜色、尺码、数量
→ 加入购物车
→ 支付
→ 平台生产
→ 平台发货
→ 查看物流
```

### 1.2 设计者分享销售

```text
设计者创作
→ 选择 POD 产品
→ 配置商品
→ 设置销售价格
→ 查看成本与利润
→ 生成专属商品链接
→ 分享给客户
→ 客户下单付款
→ 平台生产
→ 平台发货
→ 设计者获得利润
→ 申请提现
```

---

## 2. 现有程序架构

必须保留以下结构：

```text
前端 5173                              后端 3002
────────────────────                  ─────────────────────

main.jsx                              index.js
└─ App（app.jsx，约1292行）            ├─ config
   ├─ TopMenu                         ├─ rateLimit
   ├─ LeftRail                        ├─ helmet
   ├─ LeftPanel（约158行）             ├─ cors
   ├─ CanvasView                      ├─ optionalAuth
   ├─ RightSidebar（约227行）          ├─ /api/health
   ├─ HistoryBar                      └─ /api/ai/*
   ├─ ChatPanel                          ├─ gemini
   └─ RefImageBar                        ├─ bfl
                                         ├─ doubao
api.js                                  ├─ photoroom
utils/                                  ├─ deepseek
                                         └─ ideogram
```

### 2.1 禁止修改

不得：

- 把项目迁移到 Next.js
- 一次性改成 TypeScript
- 重写现有认证
- 重写后端中间件链
- 删除现有六个 AI 路由
- 让前端节点直接调用 AI Provider
- 绕过统一 `api.js`
- 一次性重写 `app.jsx`
- 删除现有经典工作区
- 开发公共商城、排行榜、推荐流

---

## 3. 必须保留的现有能力

必须继续保留：

- `main.jsx`
- 当前 Provider 结构
- `TopMenu`
- `LeftRail`
- `LeftPanel`
- `CanvasView`
- `RightSidebar`
- `HistoryBar`
- `ChatPanel`
- `RefImageBar`
- `api.js`
- `utils/prompt`
- `utils/ecommerce`
- `utils/backup`
- `utils/colors`
- `/api/ai/gemini`
- `/api/ai/bfl`
- `/api/ai/doubao`
- `/api/ai/photoroom`
- `/api/ai/deepseek`
- `/api/ai/ideogram`

---

## 4. 视觉设计方向

采用 Apple Vision Pro 风格的开放式 Web Desktop。

### 4.1 视觉特征

- 明亮玻璃感
- 柔和半透明
- 宽阔开放式内容区
- 大面积无限画布
- 漂浮式玻璃面板
- 低对比柔和阴影
- 蓝紫极光背景
- 消费者友好
- POD 产品与 AI 工具自然融合
- 不使用传统后台管理风格
- 不使用大面积深黑色
- 不把所有卡片都做成紫色

### 4.2 推荐颜色

```css
--background: #EEF5FF;
--surface: rgba(255,255,255,0.62);
--surface-strong: rgba(255,255,255,0.84);
--surface-soft: rgba(248,250,252,0.54);
--border: rgba(255,255,255,0.78);
--text-primary: #111827;
--text-secondary: #64748B;
--brand-purple: #7C3AED;
--vision-blue: #60A5FA;
--ice-cyan: #67E8F9;
--soft-lavender: #C4B5FD;
--soft-orange: #FDBA74;
--success: #34D399;
--warning: #F59E0B;
--danger: #F87171;
```

### 4.3 玻璃效果

```css
background: rgba(255,255,255,0.62);
backdrop-filter: blur(28px);
border: 1px solid rgba(255,255,255,0.72);
box-shadow:
  0 20px 60px rgba(64,92,160,0.12),
  inset 0 1px 0 rgba(255,255,255,0.85);
```

---

## 5. 目标桌面结构

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Logo · 搜索 · 项目 · 保存 · 分享链接 · 购物车 · 订单 · 用户               │
├─────────────┬────────────────────────────────────────┬────────────────────┤
│ 左侧导航    │                                        │ 右侧属性栏         │
│             │                                        │                    │
│ AI 工具     │            无限开放画布                │ 当前节点设置       │
│ POD 产品    │                                        │ AI 助手            │
│ 销售中心    │                                        │ 成本与利润         │
│ 订单        │                                        │                    │
│ 收益        │                                        │                    │
├─────────────┴────────────────────────────────────────┴────────────────────┤
│ 产品推荐 · 历史 · 任务 · 缩放 · 自动保存状态 · 运行状态                  │
└────────────────────────────────────────────────────────────────────────────┘
```

无限画布必须占据桌面最大区域。

---

## 6. 双工作区模式

不得直接删除现有 `CanvasView`。

必须增加两种模式：

```text
classic
diy-workflow
```

示例：

```jsx
function CanvasView({ workspaceMode }) {
  if (workspaceMode === "diy-workflow") {
    return <DIYWorkflowWorkspace />;
  }

  return <ClassicCanvasView />;
}
```

作用：

- 保留旧功能
- 新功能可逐步测试
- 出错可以快速回滚
- 降低升级风险

---

## 7. 新增前端目录

```text
src/
├─ features/
│  ├─ diy-workflow/
│  │  ├─ DIYWorkflowWorkspace.jsx
│  │  ├─ WorkflowCanvas.jsx
│  │  ├─ WorkflowToolbar.jsx
│  │  ├─ WorkflowMiniMap.jsx
│  │  ├─ workflowRegistry.js
│  │  ├─ workflowValidation.js
│  │  └─ workflowSerializer.js
│  │
│  ├─ workflow-nodes/
│  │  ├─ BaseNode.jsx
│  │  ├─ PromptNode.jsx
│  │  ├─ ReferenceNode.jsx
│  │  ├─ GenerateNode.jsx
│  │  ├─ ImageNode.jsx
│  │  ├─ RemoveBackgroundNode.jsx
│  │  ├─ UpscaleNode.jsx
│  │  ├─ ProductNode.jsx
│  │  ├─ MockupNode.jsx
│  │  ├─ ProductConfigNode.jsx
│  │  ├─ PersonalCheckoutNode.jsx
│  │  ├─ CreatorPricingNode.jsx
│  │  ├─ ShareProductNode.jsx
│  │  └─ CreatorEarningsNode.jsx
│  │
│  ├─ pod/
│  │  ├─ PODProductCatalog.jsx
│  │  ├─ ProductCustomizer.jsx
│  │  ├─ ProductVariantSelector.jsx
│  │  ├─ PrintAreaEditor.jsx
│  │  ├─ MockupPreview.jsx
│  │  └─ CostBreakdown.jsx
│  │
│  ├─ checkout/
│  │  ├─ CartDrawer.jsx
│  │  ├─ CheckoutPanel.jsx
│  │  ├─ AddressForm.jsx
│  │  ├─ ShippingOptions.jsx
│  │  └─ PaymentSummary.jsx
│  │
│  ├─ creator-sales/
│  │  ├─ CreatorProductPanel.jsx
│  │  ├─ CreatorPricingPanel.jsx
│  │  ├─ ShareLinkPanel.jsx
│  │  ├─ CreatorProductsPage.jsx
│  │  ├─ CreatorOrdersPage.jsx
│  │  ├─ EarningsDashboard.jsx
│  │  ├─ EarningsTransactions.jsx
│  │  └─ PayoutPanel.jsx
│  │
│  └─ production/
│     ├─ ProductionStatus.jsx
│     ├─ ShipmentTracking.jsx
│     └─ OrderTimeline.jsx
│
├─ stores/
│  ├─ workspaceStore.js
│  ├─ workflowStore.js
│  ├─ workflowHistoryStore.js
│  ├─ podStore.js
│  ├─ cartStore.js
│  ├─ orderStore.js
│  ├─ creatorSalesStore.js
│  └─ earningsStore.js
```

---

## 8. 左侧导航

```text
AI 创作
├─ AI 生成
├─ 图生图
├─ AI 模特
├─ 去背景
├─ 放大
└─ 智能 Mockup

DIY 工作区
├─ 我的设计
├─ 草稿
├─ 素材库
└─ 品牌资料

POD 产品
├─ 所有产品
├─ 服装
├─ 配饰
├─ 家居
├─ 手机壳
└─ 海报 / 画布

设计者销售
├─ 我的销售商品
├─ 分享链接
├─ 销售订单
├─ 佣金收益
└─ 提现管理

个人购买
├─ 购物车
├─ 我的订单
├─ 收货地址
└─ 售后服务

生产与发货
├─ 生产订单
├─ 文件检查
├─ 物流追踪
└─ 售后管理
```

不得出现：

- Marketplace
- 热门榜单
- 公共商品搜索
- 创作者排行榜
- 平台推荐流

---

## 9. 无限画布技术要求

推荐使用 React Flow 负责：

- 节点布局
- 节点连接
- 无限平移
- 缩放
- MiniMap
- 选择
- 拖动
- 连线验证
- 工作流状态

现有 Fabric.js 或现有编辑画布继续负责：

- 图片编辑
- 文本
- SVG
- 图层
- 裁切
- 变换
- 导出

不得使用 Fabric.js 作为工作流图引擎。

### 9.1 必须实现

- 无限平移
- 缩放
- MiniMap
- 多选
- 节点拖动
- 连线
- 删除
- 复制
- 粘贴
- 撤销
- 重做
- 自动保存
- 项目恢复
- 节点执行状态
- 节点输入输出校验
- 失败重试
- 运行单节点
- 从当前节点继续运行

---

## 10. 核心工作流

```text
Prompt
→ AI Generate
→ Remove Background
→ Product
→ Mockup
→ Product Configuration
```

之后分为两个出口：

```text
A. Personal Checkout
B. Creator Pricing → Share Product → Customer Checkout
```

---

## 11. 节点规范

```js
export const NODE_STATUS = {
  IDLE: "idle",
  QUEUED: "queued",
  RUNNING: "running",
  SUCCESS: "success",
  ERROR: "error",
  CANCELLED: "cancelled",
};

export function createNodeData({
  type,
  title,
  config = {},
  output = null,
}) {
  return {
    type,
    title,
    version: 1,
    status: NODE_STATUS.IDLE,
    config,
    output,
    error: null,
    estimatedCost: 0,
    actualCost: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
```

每个节点必须包含：

- 标题
- 图标
- 类型
- 输入端口
- 输出端口
- 状态
- 简要预览
- 运行
- 重试
- 复制
- 删除

复杂参数放在 `RightSidebar`。

---

## 12. 现有 AI 路由映射

```text
文生图
- BFL
- Ideogram
- Gemini

图生图
- BFL
- Ideogram
- Gemini

AI 模特 / VTO
- BFL VTO
- Gemini

去背景
- PhotoRoom

场景生成
- PhotoRoom

Outpaint
- BFL

Erase / Inpaint
- BFL
- PhotoRoom

Deblur
- BFL

Upscale
- Ideogram
- BFL

提示词优化
- DeepSeek
- Gemini

商品文案
- DeepSeek
- Gemini
```

节点组件不得直接调用 Provider 路由。

必须统一调用 `api.js`。

---

## 13. api.js 扩展

```js
export const workflowApi = {
  createProject,
  loadProject,
  saveProject,
  saveCanvas,
  runNode,
  runWorkflow,
  cancelJob,
  getJobStatus,
};

export const podApi = {
  getProducts,
  getProduct,
  getVariants,
  calculateCost,
  createMockup,
};

export const cartApi = {
  getCart,
  addItem,
  updateItem,
  removeItem,
};

export const checkoutApi = {
  createSession,
  getPaymentStatus,
};

export const orderApi = {
  getOrders,
  getOrder,
  cancelOrder,
  getTracking,
};

export const creatorSalesApi = {
  createProduct,
  updateProduct,
  activateProduct,
  pauseProduct,
  createShareLink,
  getProducts,
  getOrders,
};

export const earningsApi = {
  getSummary,
  getTransactions,
  getBalance,
  requestPayout,
  getPayouts,
};
```

---

## 14. 后端新增路由

保留全部 `/api/ai/*`。

新增：

```text
/api/designs
/api/designs/:id
/api/designs/:id/versions

/api/workflows
/api/workflows/:id
/api/workflows/:id/run
/api/workflow-jobs/:jobId

/api/pod/products
/api/pod/products/:id
/api/pod/mockups
/api/pod/calculate

/api/cart
/api/cart/items

/api/checkout/session
/api/payments/webhook

/api/orders
/api/orders/:id
/api/orders/:id/cancel

/api/production/jobs
/api/production/jobs/:id

/api/shipping/rates
/api/shipping/tracking/:id

/api/creator-products
/api/creator-products/:id
/api/creator-products/:id/activate
/api/creator-products/:id/pause

/api/share-links
/api/share-links/:slug

/api/creator-orders
/api/earnings
/api/earnings/summary
/api/earnings/transactions

/api/payout-accounts
/api/payouts
/api/payouts/:id

/api/pricing/calculate
/api/commission-rules
```

---

## 15. 设计者销售商品

### 15.1 流程

```text
设计
→ POD 产品
→ Mockup
→ 商品配置
→ 设置售价
→ 查看利润
→ 生成分享商品
→ 生成 URL 与二维码
→ 客户购买
```

### 15.2 售价面板

必须显示：

- 销售价格
- POD 基础成本
- 印刷成本
- 包装成本
- 支付手续费预估
- 平台服务费
- 设计者预计利润
- 利润率
- 最低允许售价

计算公式：

```text
设计者利润
=
销售价格
- POD 基础成本
- 印刷成本
- 包装成本
- 平台服务费
- 支付手续费
- 平台承担优惠
```

运费和税费通常单独向客户收取。

### 15.3 分享商品

必须生成：

- 唯一 URL
- 二维码
- 复制链接
- 下载二维码
- 分享按钮
- 启用 / 暂停
- 可选密码
- 可选过期时间
- 可选最大销售数量
- 客户可选颜色、尺码、数量

示例：

```text
https://coxof.com/p/7F3KQ9
```

---

## 16. 佣金系统

佣金必须采用交易流水方式。

不得只在用户表保存一个可变余额。

### 16.1 佣金状态

```text
pending
locked
available
reversed
paid
```

### 16.2 状态变化

```text
客户支付成功
→ pending

生产任务已接受
→ locked

已送达并超过售后保护期
→ available

提现完成
→ paid
```

发生退款、取消、拒付或生产失败：

```text
pending / locked
→ reversed
```

### 16.3 余额分类

```text
待确认
锁定中
可提现
已提现
```

### 16.4 收益流水字段

```text
id
creator_id
order_id
order_item_id
type
gross_amount
pod_cost
printing_cost
packaging_cost
platform_fee
payment_fee
refund_amount
net_earning
status
available_at
paid_at
created_at
```

---

## 17. 数据表

```text
users
profiles

designs
design_versions
assets

workflows
workflow_nodes
workflow_edges
workflow_runs
generation_jobs

pod_products
pod_product_variants
print_areas
mockups
customized_products

carts
cart_items
orders
order_items
payments
refunds
addresses

creator_products
creator_product_variants
share_links
creator_orders

commission_rules
earning_transactions
creator_balances
payout_accounts
payout_requests
payout_transactions

production_jobs
shipments
tracking_events
```

---

## 18. app.jsx 拆分规则

`app.jsx` 当前约 1292 行。

不得一次性全部重写。

第一步只抽出工作区外壳。

```jsx
function App() {
  return (
    <>
      <TopMenu />
      <WorkspaceShell />
    </>
  );
}
```

```jsx
function WorkspaceShell() {
  return (
    <div className="workspace-shell">
      <LeftRail />
      <LeftPanel />
      <CanvasView />
      <RightSidebar />
      <HistoryBar />
      <ChatPanel />
      <RefImageBar />
    </div>
  );
}
```

第一阶段目标：

```text
app.jsx
1292 行
→ 约 350–500 行
```

不是一次性压缩到 200 行以下。

---

## 19. 第一阶段开发范围

### 新建

```text
DIYWorkflowWorkspace.jsx
WorkflowCanvas.jsx
WorkflowToolbar.jsx
BaseNode.jsx
PromptNode.jsx
ReferenceNode.jsx
GenerateNode.jsx
ImageNode.jsx
RemoveBackgroundNode.jsx
ProductNode.jsx
MockupNode.jsx
ProductConfigNode.jsx
PersonalCheckoutNode.jsx
CreatorPricingNode.jsx
ShareProductNode.jsx
workflowRegistry.js
workflowStore.js
workflowHistoryStore.js
podStore.js
creatorSalesStore.js
```

### 修改

```text
app.jsx
CanvasView.jsx
LeftPanel.jsx
RightSidebar.jsx
TopMenu.jsx
api.js
index.css
```

### 第一条必须跑通的流程

```text
Prompt
→ 调用现有 BFL / Ideogram / Gemini
→ PhotoRoom 去背景
→ 选择 POD T-shirt
→ 生成 Mockup
→ 配置颜色、尺码、数量
```

最终提供两个按钮：

```text
自己购买
创建销售商品
```

---

## 20. 第二阶段

增加：

```text
购物车
结算
支付回调
订单
生产任务
物流
设计者商品链接
客户购买页
pending 佣金流水
```

---

## 21. 第三阶段

增加：

```text
佣金自动状态
退款冲正
售后保护期
提现账户
提现申请
提现交易
设计者收益中心
真实 POD 供应商
真实物流接口
```

---

## 22. 文件改动预算

第一阶段修改文件不应超过约 20 个。

如果必须超过 25 个：

1. 停止继续扩展
2. 说明依赖原因
3. 拆成多个阶段
4. 保留可回滚版本

不得把：

- 桌面重构
- 支付
- 生产
- 发货
- 佣金提现

放在同一个版本一次完成。

---

## 23. 开发前必须输出

```text
本次目标
保持不变的内容
新增文件
修改文件
新增依赖
后端路由
数据库变化
风险
回滚方案
验收标准
```

---

## 24. 开发后必须输出

```text
已完成
未完成
修改文件
运行方式
测试方式
已知限制
下一阶段
```

---

## 25. 验收标准

### 桌面

- Apple Vision Pro 风格
- 明亮玻璃界面
- 无限画布占据中心
- 左右面板可折叠
- 现有 AI 功能可继续使用
- 不存在公共商城入口

### 工作流

- 节点可添加
- 节点可拖动
- 节点可连接
- 节点可删除
- 节点可保存
- 刷新后可恢复
- AI 失败可以重试
- 失败不会丢失输入

### 个人购买

- 产品可选
- 颜色可选
- 尺码可选
- 数量可选
- 成本可见
- 可进入结算

### 设计者销售

- 可设置售价
- 最低售价被强制校验
- 可看到预计利润
- 可生成分享链接
- 客户可选择规格
- 客户下单后生成 pending 佣金流水

### 安全

- AI 密钥只在后端
- 支付回调必须验签
- 支付回调必须幂等
- 佣金未 available 前不能提现
- 退款必须冲正佣金
- 提现必须有审计记录

---

## 26. 禁止事项

不得：

- 重写所有 AI 引擎
- 前端直接调用付费模型
- 删除经典工作区
- 开发公共 Marketplace
- 开发排行榜
- 开发公共推荐流
- 允许低于最低成本的售价
- 支付成功后立即允许提现
- 只保存一个余额数字
- 把所有新逻辑继续写入 `app.jsx`
- 把全部状态放进一个 Store
- 迁移 Next.js
- 全量迁移 TypeScript
- 替换现有认证
- 暴露支付密钥
- 暴露 AI Provider 密钥

---

## 27. 最终完整流程

```text
用户进入 COXOF AI DIY
→ AI / DIY 创作
→ 选择 POD 产品
→ 生成 Mockup
→ 配置商品
→ 选择结果

结果 A：
自己购买
→ 购物车
→ 支付
→ 生产
→ 发货
→ 物流

结果 B：
设置销售价格
→ 生成分享商品
→ 生成链接与二维码
→ 客户下单
→ 支付
→ 生产
→ 发货
→ 佣金变为可提现
→ 设计者提现
```
