/**
 * 应用根路由 — BrowserRouter
 *
 * 路由表：
 *   /* → App（Studio 工作区，含经典 / DIY 双模式）
 *
 * （第二阶段：删除会员系统后，根路径直接进入 Studio 工作区。
 *   注意：sandbox 重置导致第二阶段的 PublicProductPage / features /
 *   stores 等文件丢失，待恢复后重新挂载 /p/:slug 路由）
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './app';

export default function RootRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}
