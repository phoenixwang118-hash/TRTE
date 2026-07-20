import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { shareLinkApi, cartApi } from '../api';

// 客户公开购买页（路由 /p/:slug）：通过分享链接访问商品并加入购物车
export default function PublicProductPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const d = await shareLinkApi.fetchBySlug(slug);
      setData(d);
      if (d.pod?.colors?.length) setColor(d.pod.colors[0]);
      if (d.pod?.sizes?.length) setSize(d.pod.sizes[0]);
    } catch (e) {
      // 后端在密码错误时直接返回 403，前端按错误信息判断是否需要密码
      if (e.message.includes('密码') || e.message.toLowerCase().includes('password')) {
        setNeedPassword(true);
      }
      setError(e.message);
    }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [slug]);

  const verify = async () => {
    try {
      const ok = await shareLinkApi.verify(slug, password);
      if (ok) load();
      else setError('密码错误');
    } catch (e) { setError(e.message); }
  };

  const addToCart = async () => {
    try {
      await cartApi.addItem({
        creatorProductId: data.product.id,
        podProductId: data.product.podProductId,
        designImage: data.product.designImage,
        mockup: data.product.mockup,
        title: data.product.title,
        color, size, quantity,
        unitPrice: data.product.price,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) { setError(e.message); }
  };

  if (loading) return <div className="v3-public-page"><div className="v3-loading">加载中…</div></div>;
  if (error && !data) return (
    <div className="v3-public-page">
      <div className="v3-error-box">
        <h2>无法访问</h2>
        <p>{error}</p>
        {needPassword && (
          <div className="v3-password-form">
            <input className="v3-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="访问密码" />
            <button className="v3-btn v3-btn-primary" onClick={verify}>验证</button>
          </div>
        )}
      </div>
    </div>
  );

  const { product, pod } = data || {};
  return (
    <div className="v3-public-page">
      <header className="v3-public-header">
        <div className="v3-public-brand">CoXoF Ai · DIY</div>
        <button className="v3-cart-fab" onClick={() => setCartOpen(true)}>🛒</button>
      </header>
      <main className="v3-public-main">
        <div className="v3-public-image">
          <img src={product.mockup || product.designImage} alt={product.title} />
        </div>
        <div className="v3-public-info">
          <h1>{product.title}</h1>
          {product.oldPrice > 0 && <span className="v3-old-price">${product.oldPrice}</span>}
          <span className="v3-price">${product.price}</span>
          {product.description && <p className="v3-desc">{product.description}</p>}
          {pod?.colors && (
            <div className="v3-option-group">
              <label>颜色</label>
              <select className="v3-input" value={color} onChange={e => setColor(e.target.value)}>
                {pod.colors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          {pod?.sizes && (
            <div className="v3-option-group">
              <label>尺码</label>
              <select className="v3-input" value={size} onChange={e => setSize(e.target.value)}>
                {pod.sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div className="v3-option-group">
            <label>数量</label>
            <input type="number" min="1" className="v3-input" value={quantity} onChange={e => setQuantity(+e.target.value)} />
          </div>
          <button className="v3-btn v3-btn-primary v3-btn-large" onClick={addToCart} disabled={added}>
            {added ? '已加入 ✓' : '加入购物车'}
          </button>
          <p className="v3-pod-info">{pod?.name} · {pod?.material} · {pod?.printing}</p>
        </div>
      </main>
      {/* 复用 CartDrawer */}
      <CartDrawerLazy open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

// 懒加载 CartDrawer（避免循环依赖）
function CartDrawerLazy(props) {
  const [Comp, setComp] = useState(null);
  useEffect(() => {
    import('../features/checkout/CartDrawer').then(m => setComp(() => m.default));
  }, []);
  if (!Comp) return null;
  return React.createElement(Comp, props);
}
