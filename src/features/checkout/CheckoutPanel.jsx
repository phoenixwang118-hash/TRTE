import React, { useState } from 'react';
import AddressForm from './AddressForm';
import PaymentSummary from './PaymentSummary';
import { checkoutApi } from '../../api';

// 嵌入式结算面板：在页面内联展示地址表单 + 价格摘要 + 支付按钮
export default function CheckoutPanel({ items = [], onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState(null);
  const submit = async (addr) => {
    setAddress(addr);
    setLoading(true); setError('');
    try {
      const data = await checkoutApi.createSession({ address: addr });
      onSuccess?.(data.order);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const shipping = items.length > 0 ? 6 : 0;
  const tax = subtotal * 0.08;
  return (
    <div className="v3-checkout-panel">
      <h3>结算</h3>
      <AddressForm onSubmit={submit} />
      <PaymentSummary items={items} shipping={shipping} tax={tax} />
      {loading && <p>处理中…</p>}
      {error && <div className="v3-error">⚠ {error}</div>}
    </div>
  );
}
