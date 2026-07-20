/**
 * 应用根路由 — BrowserRouter
 *
 * 路由表：
 *   /p/:slug   → PublicProductPage（公开，客户购买页）
 *   /*         → App（DIY 工作流主壳）
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './app';
import PublicProductPage from './pages/PublicProductPage.jsx';

export default function RootRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/p/:slug" element={<PublicProductPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}
