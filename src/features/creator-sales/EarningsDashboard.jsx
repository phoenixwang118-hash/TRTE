import React, { useState, useEffect } from 'react';
import { earningsApi } from '../../api';

// 设计者收益面板：以弹窗形式展示余额网格 + 佣金流水列表
export default function EarningsDashboard({ onClose }) {
  const [summary, setSummary] = useState({ pending: 0, locked: 0, available: 0, paid: 0, total: 0, count: 0 });
  const [list, setList] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const s = await earningsApi.getSummary();
      const l = await earningsApi.list();
      setSummary(s.summary); setList(l.earnings || []);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const statusColor = { pending: '#F59E0B', locked: '#60A5FA', available: '#34D399', paid: '#7C3AED', reversed: '#F87171' };

  return (
    <div className="v3-earnings-overlay" onClick={onClose}>
      <div className="v3-earnings-panel" onClick={e => e.stopPropagation()}>
        <header><h3>设计者收益</h3><button onClick={onClose}>✕</button></header>
        {error && <div className="v3-error">⚠ {error}</div>}
        <div className="v3-balance-grid">
          <div className="v3-balance-card"><span>待确认</span><strong>${summary.pending}</strong></div>
          <div className="v3-balance-card"><span>已锁定</span><strong>${summary.locked}</strong></div>
          <div className="v3-balance-card"><span>可提现</span><strong>${summary.available}</strong></div>
          <div className="v3-balance-card"><span>已支付</span><strong>${summary.paid}</strong></div>
        </div>
        <div className="v3-earnings-list">
          <h4>佣金流水</h4>
          {list.length === 0 ? <p className="v3-empty">暂无记录</p> : list.map(e => (
            <div key={e.id} className="v3-earning-item">
              <div className="v3-earning-meta">
                <span className="v3-earning-status" style={{ color: statusColor[e.status] }}>● {e.status}</span>
                <span>订单 #{e.orderId}</span>
                <span>{new Date(e.createdAt).toLocaleString()}</span>
              </div>
              <div className="v3-earning-amount">
                <span>毛 ${e.grossAmount}</span>
                <span>成本 ${e.costUnit}</span>
                <strong>净 ${e.netAmount}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
