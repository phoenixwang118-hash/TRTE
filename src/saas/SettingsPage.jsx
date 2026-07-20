/**
 * API Key 管理页 — 用户自有 Key 配置
 *
 * 用户可以为每个引擎配置自己的 API Key，
 * 优先级高于平台 Key（管理员在 .env 中配置的）
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';

const PROVIDERS = [
  { key: 'gemini', label: 'Google Gemini', desc: '文生图 + 对话 + 图像理解' },
  { key: 'bfl', label: 'BFL (Flux)', desc: '文生图 + 虚拟试穿 + 扩画/擦除/去模糊' },
  { key: 'photoroom', label: 'Photoroom', desc: '智能抠图 + 场景生成' },
  { key: 'ideogram', label: 'Ideogram', desc: '文字设计 + Remix + 高清放大' },
  { key: 'deepseek', label: 'DeepSeek', desc: 'AI 对话 + 文案生成' },
  { key: 'doubao', label: 'Doubao (豆包)', desc: '文生图' },
];

export default function SettingsPage() {
  const { navigate, plan } = useAuth();
  const [keys, setKeys] = useState([]);
  const [editing, setEditing] = useState({});
  const [saving, setSaving] =('');

  const token = localStorage.getItem('coxof_ai_token');
  const authHeaders = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = () => {
    fetch('/api/auth/keys', { headers: authHeaders })
      .then(r => r.json())
      .then(d => { if (d.success) setKeys(d.keys); });
  };

  const saveKey = async (provider) => {
    const key = editing[provider];
    if (!key) return;
    setSaving(provider);
    await fetch('/api/auth/keys', {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ provider, key }),
    });
    setSaving('');
    setEditing({ ...editing, [provider]: '' });
    loadKeys();
  };

  const deleteKey = async (provider) => {
    await fetch(`/api/auth/keys/${provider}`, { method: 'DELETE', headers: authHeaders });
    loadKeys();
  };

  const getKeyStatus = (provider) => keys.find(k => k.provider === provider);

  return React.createElement('div', {
    style: { minHeight: '100vh', background: '#0f0c29', color: '#fff', fontFamily: 'Inter, sans-serif' },
  }, [
    React.createElement('div', {
      key: 'nav',
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' },
    }, [
      React.createElement('button', { key: 'back', onClick: () => navigate('/dashboard'), style: ghostBtn }, '← Dashboard'),
      React.createElement('span', { key: 'title', style: { fontSize: '18px', fontWeight: 600 } }, 'API Key 管理'),
    ]),

    React.createElement('div', { key: 'main', style: { maxWidth: '800px', margin: '0 auto', padding: '0 32px 40px' } }, [
      React.createElement('div', {
        key: 'notice',
        style: { padding: '16px', marginBottom: '24px', borderRadius: '12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '13px', color: 'rgba(255,255,255,0.6)' },
      }, '配置你自己的 API Key 后，系统将优先使用你的 Key 调用对应引擎。未配置的引擎会使用平台 Key（如管理员已配置）。'),

      PROVIDERS.map(p => {
        const status = getKeyStatus(p.key);
        const allowed = plan?.engines?.includes(p.key);
        return React.createElement('div', {
          key: p.key,
          style: { ...cardStyle, marginBottom: '16px', opacity: allowed ? 1 : 0.5 },
        }, [
          React.createElement('div', { key: 'header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } }, [
            React.createElement('div', { key: 'info' }, [
              React.createElement('span', { key: 'label', style: { fontWeight: 600, fontSize: '15px' } }, p.label),
              !allowed && React.createElement('span', { key: 'lock', style: { marginLeft: '8px', fontSize: '11px', color: '#f59e0b' } }, '需升级专业版'),
            ]),
            status?.hasKey
              ? React.createElement('span', { key: 'status', style: { padding: '4px 10px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '12px' } }, '已配置')
              : React.createElement('span', { key: 'status', style: { padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', fontSize: '12px' } }, '未配置'),
          ]),
          React.createElement('p', { key: 'desc', style: { margin: '0 0 12px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' } }, p.desc),
          React.createElement('div', { key: 'input-row', style: { display: 'flex', gap: '8px' } }, [
            React.createElement('input', {
              key: 'input',
              type: 'password',
              placeholder: '输入 API Key...',
              value: editing[p.key] || '',
              onChange: e => setEditing({ ...editing, [p.key]: e.target.value }),
              disabled: !allowed,
              style: { flex: 1, ...inputStyle },
            }),
            React.createElement('button', {
              key: 'save',
              onClick: () => saveKey(p.key),
              disabled: !editing[p.key] || saving === p.key,
              style: { ...primaryBtn, opacity: (!editing[p.key] || saving === p.key) ? 0.5 : 1, padding: '10px 16px' },
            }, saving === p.key ? '...' : '保存'),
            status?.hasKey && React.createElement('button', {
              key: 'del',
              onClick: () => deleteKey(p.key),
              style: { ...ghostBtn, color: '#ef4444' },
            }, '删除'),
          ]),
        ]);
      }),
    ]),
  ]);
}

const cardStyle = { padding: '20px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' };
const ghostBtn = { padding: '8px 16px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' };
const primaryBtn = { border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #ec4899)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' };
const inputStyle = { padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none' };
