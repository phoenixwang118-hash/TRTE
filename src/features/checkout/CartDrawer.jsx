import React, { useState, useEffect } from 'react';
import AddressForm from './AddressForm';
import PaymentSummary from './PaymentSummary';
import { cartApi, checkoutApi } from '../../api';

// 右侧滑出购物车抽屉：包含购物车 / 结算 / 下单成功三个视图
export default function CartDrawer({ open, onClose }) {
  const [view, setView] = useState('cart'); // cart | checkout | success
  const [items, setItems] = useState([]);
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try { const data = await cartApi.getCart(); setItems(data.items || []); }
    catch (e) { setError(e.message); }
  };

  useEffect(() => { if (open) load(); }, [open]);

  const updateQty = async (id, qty) => {
    await cartApi.updateItem(id, qty); load();
  };
  const removeItem = async (id) => {
    await cartApi.removeItem(id); load();
  };
  const goCheckout = () => setView('checkout');
  const submitAddress = async (address) => {
    setLoading(true); setError('');
    try {
      const data = await checkoutApi.createSession({ address });
      setOrderId(data.order.id);
      setView('success');
      load(); // 刷新购物车（已清空）
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const shipping = items.length > 0 ? 6 : 0;
  const tax = subtotal * 0.08;

  return (
    <>
      <div className={`v3-drawer-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`v3-cart-drawer ${open ? 'open' : ''}`}>
        <header className="v3-drawer-header">
          <h3>{view === 'cart' ? '购物车' : view === 'checkout' ? '结算' : '下单成功'}</h3>
          <button onClick={onClose} className="v3-drawer-close">✕</button>
        </header>
        {error && <div className="v3-error">⚠ {error}</div>}
        {view === 'cart' && (
          <div className="v3-drawer-body">
            {items.length === 0 ? <p className="v3-empty">购物车为空</p> : items.map(it => (
              <div key={it.id} className="v3-cart-item">
                <img src={it.mockup || it.designImage} alt="" />
                <div className="v3-cart-item-info">
                  <div className="v3-cart-item-title">{it.title}</div>
                  <div className="v3-cart-item-meta">{it.color} / {it.size}</div>
                  <div className="v3-cart-item-price">${it.unitPrice.toFixed(2)} × {it.quantity}</div>
                  <div className="v3-cart-item-actions">
                    <button onClick={() => updateQty(it.id, it.quantity - 1)}>−</button>
                    <span>{it.quantity}</span>
                    <button onClick={() => updateQty(it.id, it.quantity + 1)}>+</button>
                    <button onClick={() => removeItem(it.id)} className="v3-cart-item-remove">删除</button>
                  </div>
                </div>
              </div>
            ))}
            {items.length > 0 && (
              <button className="v3-btn v3-btn-primary" onClick={goCheckout}>去结算</button>
            )}
          </div>
        )}
        {view === 'checkout' && (
          <div className="v3-drawer-body">
            <h4>收货地址</h4>
            <AddressForm onSubmit={submitAddress} />
            <PaymentSummary items={items} shipping={shipping} tax={tax} />
            <p className="v3-hint">Phase 2 使用 mock 支付，提交后立即标记为已支付</p>
          </div>
        )}
        {view === 'success' && (
          <div className="v3-drawer-body v3-success">
            <div className="v3-success-icon">✓</div>
            <h3>下单成功！</h3>
            <p>订单号：{orderId}</p>
            <p>支付状态：已支付（mock）</p>
            <button className="v3-btn v3-btn-primary" onClick={() => { setView('cart'); onClose(); }}>完成</button>
          </div>
        )}
      </aside>
    </>
  );
}
