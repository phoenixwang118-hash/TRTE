/**
 * CoXoF Ai Studio — Color utilities
 * Extracted from vedaart-desktop-100.html
 */

export const hsvToHex = (h, s, v) => {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r, g, b;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const hexToRgb = (hex) => {
  const value = String(hex || '').replace('#', '').trim();
  const normalized = value.length === 3 ? value.split('').map(ch => ch + ch).join('') : value;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16) / 255,
    g: parseInt(normalized.slice(2, 4), 16) / 255,
    b: parseInt(normalized.slice(4, 6), 16) / 255
  };
};

export const rgbToHsv = ({ r, g, b }) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
};

export const analyzeColorTone = (hex) => {
  const hsv = rgbToHsv(hexToRgb(hex) || { r: 0.8, g: 0.8, b: 0.8 });
  if (hsv.s < 0.18) return { ...hsv, tone: 'neutral' };
  const hue = hsv.h * 360;
  if (hue < 70 || hue >= 330) return { ...hsv, tone: 'warm' };
  if (hue >= 160 && hue <= 285) return { ...hsv, tone: 'cool' };
  return { ...hsv, tone: 'neutral' };
};

export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export const wrapHue = (value) => (value % 1 + 1) % 1;
