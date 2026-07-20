/**
 * DIY 工作流构建器 — 用户自定义 AI 设计流程
 *
 * 功能：
 *   - 从模板创建或从头构建
 *   - 拖拽/选择引擎和操作步骤
 *   - 配置每步参数
 *   - 保存为个人工作流
 *   - 一键运行
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';

export default function WorkflowBuilder() {
  const { user, plan, navigate } = useAuth();
  const [engines, setEngines] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [myWorkflows, setMyWorkflows] = useState([]);
  const [steps, setSteps] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('coxof_ai_token');
  const authHeaders = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

  useEffect(() => {
    // 检查订阅权限
    if (plan && !plan.workflowEnabled) {
      setError('DIY 工作流是专业版功能，请先升级订阅');
      return;
    }
    // 加载引擎列表和模板
    Promise.all([
      fetch('/api/workflows/engines', { headers: authHeaders }).then(r => r.json()),
      fetch('/api/workflows/templates', { headers: authHeaders }).then(r => r.json()),
      fetch('/api/workflows', { headers: authHeaders }).then(r => r.json()),
    ]).then(([engData, tplData, wfData]) => {
      if (engData.success) setEngines(engData.engines);
      if (tplData.success) setTemplates(tplData.templates);
      if (wfData.success) setMyWorkflows(wfData.workflows);
    });
  }, [plan]);

  const addStep = (engine, endpoint) => {
    const action = engines[engine]?.find(a => a.endpoint === endpoint);
    setSteps([...steps, {
      engine, endpoint,
      label: action?.label || endpoint,
      params: {},
      inputMapping: steps.length === 0 ? 'prompt' : 'prev_output',
    }]);
  };

  const removeStep = (idx) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const moveStep = (idx, dir) => {
    const newSteps = [...steps];
    const target = idx + dir;
    if (target < 0 || target >= newSteps.length) return;
    [newSteps[idx], newSteps[target]] = [newSteps[target], newSteps[idx]];
    setSteps(newSteps);
  };

  const save = async () => {
    if (!name || steps.length === 0) {
      setError('请填写名称并添加至少一个步骤');
      return;
    }
    setSaving(true);
    setError('');
    const resp = await fetch('/api/workflows', {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ name, steps, config: {} }),
    });
    const data = await resp.json();
    setSaving(false);
    if (data.success) {
      setMyWorkflows([...myWorkflows, data.workflow]);
      setName('');
      setSteps([]);
    } else {
      setError(data.error);
    }
  };

  const cloneTemplate = async (tplId) => {
    const resp = await fetch(`/api/workflows/template/${tplId}/clone`, {
      method: 'POST', headers: authHeaders,
    });
    const data = await resp.json();
    if (data.success) {
      setMyWorkflows([...myWorkflows, data.workflow]);
    }
  };

  const deleteWorkflow = async (wfId) => {
    await fetch(`/api/workflows/${wfId}`, { method: 'DELETE', headers: authHeaders });
    setMyWorkflows(myWorkflows.filter(w => w.id !== wfId));
  };

  if (plan && !plan.workflowEnabled) {
    return React.createElement('div', { style: centerStyle }, [
      React.createElement('div', { key: 'card', style: { textAlign: 'center' } }, [
        React.createElement('h2', { key: 'title', style: { fontSize: '24px', marginBottom: '12px' } }, 'DIY 工作流是专业版功能'),
        React.createElement('p', { key: 'desc', style: { color: 'rgba(255,255,255,0.5)', marginBottom: '24px' } }, '升级到专业版即可创建自定义 AI 设计流程'),
        React.createElement('button', { key: 'btn', onClick: () => navigate('/pricing'), style: primaryBtn }, '查看订阅方案'),
      ]),
    ]);
  }

  return React.createElement('div', {
    style: { minHeight: '100vh', background: '#0f0c29', color: '#fff', fontFamily: 'Inter, sans-serif' },
  }, [
    // 导航
    React.createElement('div', {
      key: 'nav',
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' },
    }, [
      React.createElement('button', { key: 'back', onClick: () => navigate('/dashboard'), style: ghostBtn }, '← Dashboard'),
      React.createElement('span', { key: 'title', style: { fontSize: '18px', fontWeight: 600 } }, 'DIY 工作流构建器'),
    ]),

    React.createElement('div', { key: 'main', style: { maxWidth: '1200px', margin: '0 auto', padding: '0 32px 40px' } }, [
      error && React.createElement('div', { key: 'error', style: { padding: '12px 16px', marginBottom: '16px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: '#ef4444', fontSize: '14px' } }, error),

      // 模板区
      React.createElement('div', { key: 'templates', style: { marginBottom: '32px' } }, [
        React.createElement('h3', { key: 'title', style: { fontSize: '16px', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' } }, '从模板创建'),
        React.createElement('div', { key: 'list', style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } },
          templates.map(tpl => React.createElement('div', {
            key: tpl.id,
            style: { padding: '20px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' },
            onClick: () => cloneTemplate(tpl.id),
          }, [
            React.createElement('h4', { key: 'name', style: { margin: '0 0 8px', fontSize: '14px', fontWeight: 600 } }, tpl.name),
            React.createElement('p', { key: 'desc', style: { margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' } }, tpl.config?.description || ''),
            React.createElement('div', { key: 'steps', style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
              tpl.steps.map((s, i) => React.createElement('span', { key: i, style: { padding: '2px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.15)', fontSize: '11px', color: '#818cf8' } }, s.label))
            ),
          ]))
        ),
      ]),

      // 构建器
      React.createElement('div', { key: 'builder', style: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' } }, [
        // 引擎选择面板
        React.createElement('div', { key: 'engines', style: cardStyle }, [
          React.createElement('h3', { key: 'title', style: { margin: '0 0 16px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' } }, '可用引擎'),
          engines && Object.entries(engines).map(([eng, actions]) => React.createElement('div', { key: eng, style: { marginBottom: '16px' } }, [
            React.createElement('p', { key: 'name', style: { fontSize: '13px', fontWeight: 600, color: '#818cf8', marginBottom: '8px', textTransform: 'uppercase' } }, eng),
            ...actions.map(a => React.createElement('button', {
              key: a.endpoint,
              onClick: () => addStep(eng, a.endpoint),
              style: {
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', marginBottom: '4px',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
                background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)',
                fontSize: '13px', cursor: 'pointer',
              },
            }, '+ ' + a.label)),
          ])),
        ]),

        // 步骤构建区
        React.createElement('div', { key: 'steps', style: cardStyle }, [
          React.createElement('div', { key: 'header', style: { display: 'flex', gap: '12px', marginBottom: '20px' } }, [
            React.createElement('input', {
              key: 'name',
              placeholder: '工作流名称',
              value: name, onChange: e => setName(e.target.value),
              style: { flex: 1, ...inputStyle },
            }),
            React.createElement('button', {
              key: 'save',
              onClick: save, disabled: saving,
              style: { padding: '0 24px', ...primaryBtn, opacity: saving ? 0.5 : 1 },
            }, saving ? '保存中...' : '保存'),
          ]),
          steps.length === 0
            ? React.createElement('p', { style: { color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px' } }, '从左侧选择引擎操作来添加步骤')
            : steps.map((s, i) => React.createElement('div', {
                key: i,
                style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', marginBottom: '8px', borderRadius: '10px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' },
              }, [
                React.createElement('span', { key: 'num', style: { width: '28px', height: '28px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600 } }, i + 1),
                React.createElement('div', { key: 'info', style: { flex: 1 } }, [
                  React.createElement('span', { key: 'label', style: { fontWeight: 600, fontSize: '14px' } }, s.label),
                  React.createElement('span', { key: 'engine', style: { marginLeft: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' } }, s.engine + ' / ' + s.endpoint),
                ]),
                React.createElement('div', { key: 'controls', style: { display: 'flex', gap: '4px' } }, [
                  React.createElement('button', { key: 'up', onClick: () => moveStep(i, -1), style: miniBtn }, '↑'),
                  React.createElement('button', { key: 'down', onClick: () => moveStep(i, 1), style: miniBtn }, '↓'),
                  React.createElement('button', { key: 'del', onClick: () => removeStep(i), style: { ...miniBtn, color: '#ef4444' } }, '×'),
                ]),
              ])),
          steps.length > 0 && React.createElement('div', { key: 'flow', style: { marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' } },
            '流程: ' + steps.map(s => s.label).join(' → ')),
        ]),
      ]),

      // 我的工作流
      myWorkflows.length > 0 && React.createElement('div', { key: 'mine', style: { marginTop: '32px' } }, [
        React.createElement('h3', { key: 'title', style: { fontSize: '16px', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' } }, '我的工作流'),
        React.createElement('div', { key: 'list', style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' } },
          myWorkflows.map(wf => React.createElement('div', {
            key: wf.id,
            style: { ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
          }, [
            React.createElement('div', { key: 'info' }, [
              React.createElement('p', { key: 'name', style: { margin: 0, fontWeight: 600, fontSize: '14px' } }, wf.name),
              React.createElement('p', { key: 'steps', style: { margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)' } }, wf.steps.map(s => s.label).join(' → ')),
            ]),
            React.createElement('div', { key: 'actions', style: { display: 'flex', gap: '8px' } }, [
              React.createElement('button', { key: 'run', onClick: () => navigate('/studio'), style: miniBtn }, '运行'),
              React.createElement('button', { key: 'del', onClick: () => deleteWorkflow(wf.id), style: { ...miniBtn, color: '#ef4444' } }, '删除'),
            ]),
          ]))
        ),
      ]),
    ]),
  ]);
}

const centerStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0c29', color: '#fff', fontFamily: 'Inter, sans-serif' };
const cardStyle = { padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' };
const ghostBtn = { padding: '8px 16px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' };
const primaryBtn = { border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #ec4899)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '10px 20px' };
const inputStyle = { padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none' };
const miniBtn = { width: '28px', height: '28px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '14px' };
