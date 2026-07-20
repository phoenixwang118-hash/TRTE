/**
 * 登录/注册页 — CoXoF Ai SaaS 入口
 *
 * 设计风格：深色渐变背景 + 玻璃拟态卡片 + 流光动画
 */
import React, { useState } from 'react';
import { useAuth } from './AuthContext.jsx';

export default function LoginPage() {
  const { login, register, navigate } = useAuth();
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = mode === 'login'
      ? await login(email, password)
      : await register(email, password, name);
    setLoading(false);
    if (result.success) {
      navigate('/studio');
    } else {
      setError(result.error || '操作失败');
    }
  };

  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    },
  }, [
    // 装饰性光斑
    React.createElement('div', {
      key: 'glow1',
      style: {
        position: 'absolute', width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        top: '-200px', right: '-100px',
        filter: 'blur(40px)',
      },
    }),
    React.createElement('div', {
      key: 'glow2',
      style: {
        position: 'absolute', width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
        bottom: '-150px', left: '-100px',
        filter: 'blur(40px)',
      },
    }),
    // 主卡片
    React.createElement('div', {
      key: 'card',
      style: {
        position: 'relative',
        width: '420px',
        maxWidth: '90vw',
        padding: '48px 40px',
        borderRadius: '24px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(30px) saturate(200%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      },
    }, [
      // Logo
      React.createElement('div', {
        key: 'logo',
        style: { textAlign: 'center', marginBottom: '32px' },
      }, [
        React.createElement('div', {
          key: 'icon',
          style: {
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            fontSize: '28px', marginBottom: '12px',
            boxShadow: '0 10px 30px rgba(99,102,241,0.3)',
          },
        }, 'C'),
        React.createElement('h1', {
          key: 'title',
          style: { color: '#fff', fontSize: '24px', fontWeight: 700, margin: 0 },
        }, 'CoXoF Ai Studio'),
        React.createElement('p', {
          key: 'subtitle',
          style: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' },
        }, 'AI 设计 SaaS 平台'),
      ]),

      // 切换按钮
      React.createElement('div', {
        key: 'tabs',
        style: {
          display: 'flex', gap: '4px', padding: '4px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px', marginBottom: '24px',
        },
      }, [
        ['login', '登录'],
        ['register', '注册'],
      ].map(([key, label]) => React.createElement('button', {
        key,
        onClick: () => { setMode(key); setError(''); },
        style: {
          flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
          background: mode === key ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
          color: mode === key ? '#fff' : 'rgba(255,255,255,0.5)',
          fontSize: '14px', fontWeight: 500, cursor: 'pointer',
          transition: 'all 0.3s ease',
        },
      }, label))),

      // 表单
      React.createElement('form', { key: 'form', onSubmit: handleSubmit }, [
        mode === 'register' && React.createElement('input', {
          key: 'name',
          type: 'text', placeholder: '昵称（可选）',
          value: name, onChange: e => setName(e.target.value),
          style: inputStyle,
        }),
        React.createElement('input', {
          key: 'email',
          type: 'email', placeholder: '邮箱', required: true,
          value: email, onChange: e => setEmail(e.target.value),
          style: { ...inputStyle, marginTop: mode === 'register' ? '12px' : '0' },
        }),
        React.createElement('input', {
          key: 'password',
          type: 'password', placeholder: '密码（至少6位）', required: true,
          value: password, onChange: e => setPassword(e.target.value),
          style: { ...inputStyle, marginTop: '12px' },
        }),
        error && React.createElement('p', {
          key: 'error',
          style: { color: '#ef4444', fontSize: '13px', marginTop: '12px', textAlign: 'center' },
        }, error),
        React.createElement('button', {
          key: 'submit',
          type: 'submit', disabled: loading,
          style: {
            width: '100%', padding: '14px', marginTop: '20px',
            border: 'none', borderRadius: '12px',
            background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #ec4899)',
            color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 10px 30px rgba(99,102,241,0.3)',
          },
        }, loading ? '处理中...' : (mode === 'login' ? '登录' : '创建账号')),
      ]),

      // 免费试用提示
      React.createElement('p', {
        key: 'hint',
        style: { color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', marginTop: '20px' },
      }, '注册即享免费版 · 每日 20 次 AI 生成'),
    ]),
  ]);
}

const inputStyle = {
  width: '100%', padding: '14px 16px',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.3s ease',
};
