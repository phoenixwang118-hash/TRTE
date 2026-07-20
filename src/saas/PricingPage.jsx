/**
 * 订阅方案页 — Free / Pro / Enterprise
 *
 * 展示三种方案的功能对比，支持一键升级
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';

export default function PricingPage() {
  const { user, plan, updatePlan, navigate } = useAuth();
  const [loading, setLoading] = useState('');
  const [plans, setPlans] = useState(null);

  useEffect(() => {
    fetch('/api/billing/plans').then(r => r.json()).then(d => {
      if (d.success) setPlans(d.plans);
    });
  }, []);

  const handleSubscribe = async (planKey) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (planKey === user?.plan) return;
    setLoading(planKey);
    const result = await updatePlan(planKey);
    setLoading('');
    if (result.success) {
      navigate('/dashboard');
    }
  };

  if (!plans) return React.createElement('div', { style: centerStyle }, '加载中...');

  const planList = Object.entries(plans);

  return React.createElement('div', {
    style: { minHeight: '100vh', background: '#0f0c29', color: '#fff', fontFamily: 'Inter, sans-serif' },
  }, [
    // 导航
    React.createElement('div', {
      key: 'nav',
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' },
    }, [
      React.createElement('button', { key: 'back', onClick: () => navigate(user ? '/dashboard' : '/'), style: ghostBtn }, user ? '← 返回 Dashboard' : '← 返回首页'),
      React.createElement('span', { key: 'title', style: { fontSize: '18px', fontWeight: 600 } }, '选择订阅方案'),
    ]),

    // 方案卡片
    React.createElement('div', {
      key: 'plans',
      style: { maxWidth: '1100px', margin: '40px auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
    }, planList.map(([key, p]) => {
      const isCurrent = user?.plan === key;
      const isPro = key === 'pro';
      return React.createElement('div', {
        key,
        style: {
          position: 'relative', padding: '32px', borderRadius: '20px',
          background: isPro ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
          border: isPro ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.05)',
        },
      }, [
        isPro && React.createElement('div', {
          key: 'badge',
          style: {
            position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
            padding: '4px 16px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            fontSize: '12px', fontWeight: 600,
          },
        }, '推荐'),
        React.createElement('h3', { key: 'name', style: { fontSize: '20px', fontWeight: 700, margin: '0 0 8px' } }, p.name),
        React.createElement('div', { key: 'price', style: { marginBottom: '24px' } }, [
          React.createElement('span', { key: 'amount', style: { fontSize: '36px', fontWeight: 800 } }, p.price === 0 ? '免费' : '¥' + p.price),
          p.price > 0 && React.createElement('span', { key: 'period', style: { color: 'rgba(255,255,255,0.4)', fontSize: '14px' } }, '/月'),
        ]),
        React.createElement('div', { key: 'limit', style: { marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' } }, [
          React.createElement('span', { key: 'daily', style: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' } }, '每日限额: '),
          React.createElement('span', { key: 'val', style: { fontWeight: 600 } }, p.dailyLimit === -1 ? '无限' : p.dailyLimit + ' 次'),
        ]),
        React.createElement('ul', { key: 'features', style: { listStyle: 'none', padding: 0, margin: '0 0 24px' } },
          p.features.map((f, i) => React.createElement('li', {
            key: i,
            style: { padding: '8px 0', fontSize: '14px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '8px' },
          }, [
            React.createElement('span', { key: 'check', style: { color: '#10b981' } }, '✓'),
            React.createElement('span', { key: 'text' }, f),
          ]))
        ),
        React.createElement('button', {
          key: 'btn',
          onClick: () => handleSubscribe(key),
          disabled: isCurrent || loading === key,
          style: {
            width: '100%', padding: '14px', border: 'none', borderRadius: '12px',
            background: isCurrent ? 'rgba(255,255,255,0.05)' : isPro ? 'linear-gradient(135deg, #6366f1, #ec4899)' : 'rgba(255,255,255,0.1)',
            color: isCurrent ? 'rgba(255,255,255,0.3)' : '#fff',
            fontSize: '14px', fontWeight: 600, cursor: isCurrent ? 'default' : 'pointer',
          },
        }, isCurrent ? '当前方案' : loading === key ? '处理中...' : '选择此方案'),
      ]);
    })),
  ]);
}

const centerStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0c29', color: '#fff', fontFamily: 'Inter, sans-serif' };
const ghostBtn = { padding: '8px 16px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' };
