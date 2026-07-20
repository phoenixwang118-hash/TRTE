import React, { useState, useEffect } from 'react';
import { shareLinkApi } from '../../api';

// 分享链接管理面板：为指定商品创建带密码 / 有效期 / 销量上限的分享链接
export default function ShareLinkPanel({ productId }) {
  const [links, setLinks] = useState([]);
  const [form, setForm] = useState({ password: '', expiresInDays: 0, maxSales: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try { const data = await shareLinkApi.listByProduct(productId); setLinks(data.links || []); }
    catch (e) { setError(e.message); }
  };
  useEffect(() => { if (productId) load(); }, [productId]);

  const create = async () => {
    setLoading(true); setError('');
    try {
      await shareLinkApi.create({ productId, ...form });
      setForm({ password: '', expiresInDays: 0, maxSales: 0 });
      load();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  const copy = (url) => navigator.clipboard.writeText(url);

  return (
    <div className="v3-share-panel">
      <h3>分享链接</h3>
      <div className="v3-share-form">
        <label>密码（可选）<input className="v3-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
        <label>有效期（天，0=永久）<input type="number" className="v3-input" value={form.expiresInDays} onChange={e => setForm({ ...form, expiresInDays: +e.target.value })} /></label>
        <label>最大销量（0=不限）<input type="number" className="v3-input" value={form.maxSales} onChange={e => setForm({ ...form, maxSales: +e.target.value })} /></label>
        <button className="v3-btn v3-btn-primary" onClick={create} disabled={loading}>生成链接</button>
      </div>
      {error && <div className="v3-error">⚠ {error}</div>}
      <div className="v3-share-list">
        {links.map(l => {
          const url = `${window.location.origin}/p/${l.slug}`;
          return (
            <div key={l.id} className="v3-share-item">
              <div className="v3-share-url">{url}</div>
              <div className="v3-share-meta">
                销量 {l.salesCount} / {l.maxSales || '∞'} ·
                {l.expiresAt ? ` ${new Date(l.expiresAt).toLocaleDateString()} 过期` : ' 永久'} ·
                {l.active ? ' 启用' : ' 停用'}
              </div>
              <button className="v3-btn" onClick={() => copy(url)}>复制</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
