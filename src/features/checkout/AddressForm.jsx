import React, { useState } from 'react';

// 收货地址表单组件：用于结算流程收集用户地址信息
export default function AddressForm({ onSubmit, initial = {} }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    phone: initial.phone || '',
    line1: initial.line1 || '',
    line2: initial.line2 || '',
    city: initial.city || '',
    state: initial.state || '',
    zip: initial.zip || '',
    country: initial.country || 'US',
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = (e) => { e.preventDefault(); onSubmit(form); };
  return (
    <form className="v3-address-form" onSubmit={submit}>
      <div className="v3-form-row">
        <label>姓名<input className="v3-input" value={form.name} onChange={set('name')} required /></label>
        <label>电话<input className="v3-input" value={form.phone} onChange={set('phone')} required /></label>
      </div>
      <label>地址行 1<input className="v3-input" value={form.line1} onChange={set('line1')} required /></label>
      <label>地址行 2（可选）<input className="v3-input" value={form.line2} onChange={set('line2')} /></label>
      <div className="v3-form-row">
        <label>城市<input className="v3-input" value={form.city} onChange={set('city')} required /></label>
        <label>州/省<input className="v3-input" value={form.state} onChange={set('state')} /></label>
      </div>
      <div className="v3-form-row">
        <label>邮编<input className="v3-input" value={form.zip} onChange={set('zip')} required /></label>
        <label>国家<input className="v3-input" value={form.country} onChange={set('country')} /></label>
      </div>
      <button type="submit" className="v3-btn v3-btn-primary">提交地址</button>
    </form>
  );
}
