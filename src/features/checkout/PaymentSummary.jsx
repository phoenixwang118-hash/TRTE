import React from 'react';

// 价格摘要组件：根据购物车条目、运费、税费计算并展示订单金额
export default function PaymentSummary({ items = [], shipping = 0, tax = 0 }) {
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const total = subtotal + shipping + tax;
  return (
    <div className="v3-payment-summary">
      <h4>订单摘要</h4>
      {items.map((it, i) => (
        <div key={i} className="v3-summary-line">
          <span>{it.title} × {it.quantity}</span>
          <span>${(it.unitPrice * it.quantity).toFixed(2)}</span>
        </div>
      ))}
      <div className="v3-summary-line v3-summary-sub">
        <span>小计</span><span>${subtotal.toFixed(2)}</span>
      </div>
      <div className="v3-summary-line"><span>运费</span><span>${shipping.toFixed(2)}</span></div>
      <div className="v3-summary-line"><span>税费</span><span>${tax.toFixed(2)}</span></div>
      <div className="v3-summary-line v3-summary-total">
        <span>合计</span><span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
