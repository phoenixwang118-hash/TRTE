/**
 * 用户 Dashboard — 用量统计 + 快捷入口
 *
 * 展示：
 *   - 今日用量 / 剩余额度
 *   - 7 天趋势图
 *   - 按引擎用量分布
 *   - 快捷操作入口
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';

export default function Dashboard() {
  const { user, plan, navigate, logout } = useAuth();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('coxof_ai_token');
    fetch('/api/billing/usage', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setUsage(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return React.createElement('div', { style: centerStyle }, '加载中...');

  const todayCount = usage?.usage?.todayCount || 0;
  const total = usage?.usage?.totalCount || 0;
  const remaining = usage?.remaining;
  const byProvider = usage?.usage?.byProvider || {};
  const trend = usage?.usage?.last7Days || [];

  const maxTrend = Math.max(...trend.map(d => d.count), 1);

  return React.createElement('div', {
    style: { minHeight: '100vh', background: '#0f0c29', color: '#fff', fontFamily: 'Inter, sans-serif' },
  }, [
    // 顶部导航
    React.createElement('div', {
      key: 'nav',
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    }, [
      React.createElement('div', { key: 'brand', style: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
        React.createElement('div', { key: 'logo', style: { width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' } }, 'C'),
        React.createElement('span', { key: 'name', style: { fontWeight: 600 } }, 'CoXoF Ai Studio'),
      ]),
      React.createElement('div', { key: 'actions', style: { display: 'flex', gap: '16px', alignItems: 'center' } }, [
        React.createElement('span', { key: 'plan', style: badgeStyle(plan?.name) }, plan?.name || '免费版'),
        React.createElement('span', { key: 'user', style: { color: 'rgba(255,255,255,0.5)', fontSize: '14px' } }, user?.email),
        React.createElement('button', { key: 'logout', onClick: logout, style: ghostBtnStyle }, '退出'),
      ]),
    ]),

    // 主体
    React.createElement('div', { key: 'main', style: { maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' } }, [
      // 统计卡片
      React.createElement('div', { key: 'stats', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' } }, [
        statCard('今日用量', todayCount, remaining === null ? '无限制' : `剩余 ${remaining}`, '#6366f1'),
        statCard('累计生成', total, '全部历史记录', '#ec4899'),
        statCard('当前方案', plan?.name, `${plan?.dailyLimit === -1 ? '无限' : plan?.dailyLimit}/天`, '#10b981'),
        statCard('工作空间', plan?.workspaces === -1 ? '无限' : plan?.workspaces, '多租户隔离', '#f59e0b'),
      ]),

      // 7天趋势图
      React.createElement('div', { key: 'trend', style: cardStyle }, [
        React.createElement('h3', { key: 'title', style: { margin: '0 0 20px', fontSize: '16px', color: 'rgba(255,255,255,0.8)' } }, '最近 7 天用量趋势'),
        React.createElement('div', { key: 'chart', style: { display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px' } },
          trend.map((d, i) => React.createElement('div', {
            key: i,
            style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
          }, [
            React.createElement('div', {
              key: 'bar',
              style: {
                width: '100%', height: Math.max(4, (d.count / maxTrend) * 140) + 'px',
                borderRadius: '6px 6px 0 0',
                background: 'linear-gradient(180deg, #6366f1, #4f46e5)',
                transition: 'height 0.5s ease',
              },
            }),
            React.createElement('span', { key: 'label', style: { fontSize: '11px', color: 'rgba(255,255,255,0.3)' } }, d.date.slice(5)),
          ]))
        ),
      ]),

      // 引擎分布 + 快捷入口
      React.createElement('div', { key: 'row', style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' } }, [
        // 引擎分布
        React.createElement('div', { key: 'providers', style: cardStyle }, [
          React.createElement('h3', { key: 'title', style: { margin: '0 0 16px', fontSize: '16px', color: 'rgba(255,255,255,0.8)' } }, '引擎使用分布'),
          Object.keys(byProvider).length > 0
            ? Object.entries(byProvider).map(([p, c]) => React.createElement('div', { key: p, style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' } }, [
                React.createElement('span', { key: 'name', style: { width: '80px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' } }, p),
                React.createElement('div', { key: 'bar-bg', style: { flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' } },
                  React.createElement('div', { style: { width: (c / total * 100) + '%', height: '100%', borderRadius: '4px', background: '#6366f1' } })
                ),
                React.createElement('span', { key: 'count', style: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', width: '30px', textAlign: 'right' } }, c),
              ]))
            : React.createElement('p', { style: { color: 'rgba(255,255,255,0.3)', fontSize: '14px' } }, '暂无使用记录'),
        ]),
        // 快捷入口
        React.createElement('div', { key: 'actions', style: cardStyle }, [
          React.createElement('h3', { key: 'title', style: { margin: '0 0 16px', fontSize: '16px', color: 'rgba(255,255,255,0.8)' } }, '快捷操作'),
          ...[
            { label: '进入设计工作区', path: '/studio', icon: 'M4 4h16v16H4z' },
            { label: 'DIY 工作流', path: '/workflows', icon: 'M12 2L2 7l10 5 10-5-10-5z' },
            { label: '管理 API Key', path: '/settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z' },
            { label: '升级订阅', path: '/pricing', icon: 'M5 12h14M12 5l7 7-7 7' },
          ].map(item => React.createElement('button', {
            key: item.path,
            onClick: () => navigate(item.path),
            style: {
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '14px 16px', marginBottom: '8px',
              border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.7)',
              fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
            },
          }, [
            React.createElement('span', { key: 'label' }, item.label),
            React.createElement('span', { key: 'arrow', style: { color: 'rgba(255,255,255,0.2)' } }, '→'),
          ])),
        ]),
      ]),
    ]),
  ]);
}

function statCard(label, value, sub, color) {
  return React.createElement('div', {
    style: {
      padding: '24px', borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)',
    },
  }, [
    React.createElement('p', { key: 'label', style: { color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 } }, label),
    React.createElement('p', { key: 'value', style: { fontSize: '32px', fontWeight: 700, margin: '8px 0 4px', color } }, value),
    React.createElement('p', { key: 'sub', style: { color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: 0 } }, sub),
  ]);
}

const cardStyle = {
  padding: '24px', borderRadius: '16px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.05)',
};

const centerStyle = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#0f0c29', color: '#fff', fontFamily: 'Inter, sans-serif',
};

function ghostBtnStyle() {
  return {
    padding: '8px 16px', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', background: 'transparent', color: 'rgba(255,255,255,0.6)',
    fontSize: '13px', cursor: 'pointer',
  };
}

function badgeStyle(name) {
  const colors = { '免费版': '#6366f1', '专业版': '#ec4899', '企业版': '#f59e0b' };
  return {
    padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
    background: (colors[name] || '#6366f1') + '20', color: colors[name] || '#6366f1',
  };
}
