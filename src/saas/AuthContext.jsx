/**
 * SaaS 认证上下文 — 全局管理用户登录状态
 *
 * 提供：
 *   - user: 当前用户信息（null = 未登录）
 *   - plan: 当前订阅方案
 *   - login(email, password): 登录
 *   - register(email, password, name): 注册
 *   - logout(): 退出
 *   - updatePlan(plan): 升级订阅
 *   - loading: 初始化加载中
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/');

  // 监听 hash 路由变化
  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // 导航函数
  const navigate = useCallback((path) => {
    window.location.hash = path;
    setRoute(path);
  }, []);

  // 从 localStorage 恢复 token，验证登录状态
  useEffect(() => {
    const token = localStorage.getItem('coxof_ai_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch('/api/auth/me', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
          setPlan(data.plan);
        } else {
          localStorage.removeItem('coxof_ai_token');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 登录
  const login = useCallback(async (email, password) => {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await resp.json();
    if (data.success) {
      localStorage.setItem('coxof_ai_token', data.token);
      setUser(data.user);
      setPlan(data.plan);
      return { success: true };
    }
    return { success: false, error: data.error };
  }, []);

  // 注册
  const register = useCallback(async (email, password, name) => {
    const resp = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await resp.json();
    if (data.success) {
      localStorage.setItem('coxof_ai_token', data.token);
      setUser(data.user);
      setPlan(data.plan);
      return { success: true };
    }
    return { success: false, error: data.error };
  }, []);

  // 退出
  const logout = useCallback(() => {
    localStorage.removeItem('coxof_ai_token');
    setUser(null);
    setPlan(null);
    navigate('/');
  }, [navigate]);

  // 升级订阅
  const updatePlan = useCallback(async (newPlan) => {
    const token = localStorage.getItem('coxof_ai_token');
    const resp = await fetch('/api/billing/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ plan: newPlan }),
    });
    const data = await resp.json();
    if (data.success) {
      setUser(data.user);
      setPlan(data.plan);
      return { success: true };
    }
    return { success: false, error: data.error };
  }, []);

  // 获取 auth headers（供 api.js 使用）
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('coxof_ai_token');
    return token ? { Authorization: 'Bearer ' + token } : {};
  }, []);

  const value = {
    user,
    plan,
    loading,
    route,
    navigate,
    login,
    register,
    logout,
    updatePlan,
    getAuthHeader,
    isAuthenticated: !!user,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}
