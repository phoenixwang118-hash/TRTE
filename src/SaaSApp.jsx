/**
 * SaaS 路由包装器 — 在原始 Studio 应用外层添加 SaaS 页面路由
 *
 * 路由表：
 *   #/            → 落地页（公开）
 *   #/login       → 登录/注册页（公开）
 *   #/pricing     → 订阅方案（公开）
 *   #/dashboard   → 用户 Dashboard（需登录）
 *   #/workflows   → DIY 工作流构建器（需登录）
 *   #/settings    → API Key 管理（需登录）
 *   #/studio      → 原始 Studio 设计工作区（需登录）
 */
import React from 'react';
import { useAuth } from './saas/AuthContext.jsx';
import LandingPage from './saas/LandingPage.jsx';
import LoginPage from './saas/LoginPage.jsx';
import Dashboard from './saas/Dashboard.jsx';
import PricingPage from './saas/PricingPage.jsx';
import WorkflowBuilder from './saas/WorkflowBuilder.jsx';
import SettingsPage from './saas/SettingsPage.jsx';
import StudioApp from './app.jsx';

// 公开路由（无需登录）
const PUBLIC_ROUTES = ['/', '/login', '/pricing'];

export default function SaaSApp() {
  const { user, route, loading, navigate } = useAuth();

  // 加载中
  if (loading) {
    return React.createElement('div', {
      style: {
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0a0a0f', color: '#fff', fontFamily: 'Inter, sans-serif',
      },
    }, React.createElement('div', { style: { textAlign: 'center' } }, [
      React.createElement('div', {
        key: 'spinner',
        style: {
          width: '40px', height: '40px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        },
      }),
      React.createElement('p', {
        key: 'text',
        style: { color: 'rgba(255,255,255,0.4)', fontSize: '14px' },
      }, 'Loading...'),
    ]));
  }

  // ── 公开路由（无需登录）──
  if (route === '/login') {
    return React.createElement(LoginPage);
  }

  if (route === '/' || route === '') {
    return React.createElement(LandingPage);
  }

  if (route === '/pricing') {
    return React.createElement(PricingPage);
  }

  // ── 以下页面需要登录 ──
  if (!user) {
    // 未登录，延迟跳转到登录页
    setTimeout(() => navigate('/login'), 0);
    return React.createElement('div', {
      style: { minHeight: '100vh', background: '#0a0a0f' },
    });
  }

  // 解析路由中的 query 参数（如 /studio?tab=vto）
  const routeBase = route.split('?')[0];
  const routeParams = new URLSearchParams(route.split('?')[1] || '');
  const studioTab = routeParams.get('tab');

  // SaaS 页面路由（需登录）
  switch (routeBase) {
    case '/dashboard':
      return React.createElement(Dashboard);
    case '/workflows':
      return React.createElement(WorkflowBuilder);
    case '/settings':
      return React.createElement(SettingsPage);
    case '/studio':
      return React.createElement(StudioApp, { initialTab: studioTab });
    default:
      // 默认: 落地页
      return React.createElement(LandingPage);
  }
}
