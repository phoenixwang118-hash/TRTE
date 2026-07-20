/**
 * TopMenu — Vision Pro 风格顶部栏（DIY 工作流专用）
 *
 * 元素：
 *   - 品牌 Logo + 名称
 *   - 中间：当前模式标识 "DIY 工作流"
 *   - 右侧：购物车 / 收益 入口按钮
 */
import React from 'react';

export default function TopMenu({ onOpenCart, onOpenEarnings }) {
  return (
    <header className="vision-topbar vision-topbar-diy">
      <div className="vision-brand">
        <div className="vision-logo">CX</div>
        <div className="vision-brand-info">
          <div className="vision-brand-text">CoXoF Ai · DIY</div>
          <div className="vision-provider">V3 · Apple Vision Pro</div>
        </div>
      </div>

      <div className="vision-mode">
        <span className="vision-mode-toggle vision-mode-toggle-active">
          <span className="vision-mode-toggle-dot" />
          DIY 工作流
        </span>
      </div>

      <div className="vision-actions">
        <button className="vision-action-btn" onClick={onOpenCart} title="购物车">
          🛒 <span className="vision-action-label">购物车</span>
        </button>
        <button className="vision-action-btn" onClick={onOpenEarnings} title="设计者收益">
          📊 <span className="vision-action-label">收益</span>
        </button>
      </div>
    </header>
  );
}
