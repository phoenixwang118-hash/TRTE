import React, { useState } from 'react';
import { hsvToHex, clamp01, wrapHue, analyzeColorTone } from '../utils/colors';

const COLOR_MODES = [
  { key: 'duo1', label: '惊鸿对白', cat:'双色系', ratio: [80, 20] },
  { key: 'duo2', label: '晨昏絮语', cat:'双色系', ratio: [70, 30] },
  { key: 'duo3', label: '天秤轻曳', cat:'双色系', ratio: [60, 40] },
  { key: 'duo4', label: '镜像双生', cat:'双色系', ratio: [50, 50] },
  { key: 'duo5', label: '寄月念想', cat:'双色系', ratio: [85, 15] },
  { key: 'duo6', label: '静默呼吸', cat:'双色系', ratio: [90, 10] },
  { key: 'duo7', label: '雾屿私语', cat:'双色系', ratio: [92, 8] },
  { key: 'duo8', label: '星野相逢', cat:'双色系', ratio: [75, 25] },
  { key: 'duo9', label: '晚枫私藏', cat:'双色系', ratio: [65, 35] },
  { key: 'tri1', label: '微光之境', cat:'三色系', ratio: [80, 10, 10] },
  { key: 'tri2', label: '对话之诗', cat:'三色系', ratio: [70, 20, 10] },
  { key: 'tri3', label: '丰盈花环', cat:'三色系', ratio: [50, 30, 20] },
  { key: 'tri4', label: '裂色剧场', cat:'三色系', ratio: [60, 20, 20] },
  { key: 'tri5', label: '和风柔波', cat:'三色系', ratio: [50, 25, 25] },
  { key: 'tri6', label: '渐变絮语', cat:'三色系', ratio: [50, 35, 15] },
  { key: 'tri7', label: '沉浸独白', cat:'三色系', ratio: [70, 25, 5] },
  { key: 'tri8', label: '疏影暗香', cat:'三色系', ratio: [75, 15, 10] },
  { key: 'tri9', label: '云间漫渡', cat:'三色系', ratio: [65, 25, 10] },
  { key: 'tri10', label: '青野来信', cat:'三色系', ratio: [40, 35, 25] },
  { key: 'tri11', label: '月下花朝', cat:'三色系', ratio: [72, 18, 10] },
  { key: 'tri12', label: '松间慢叙', cat:'三色系', ratio: [55, 30, 15] },
  { key: 'tri13', label: '素白余温', cat:'三色系', ratio: [88, 8, 4] },
  { key: 'tri14', label: '霜花漫叙', cat:'三色系', ratio: [68, 22, 10] },
  { key: 'quad1', label: '色彩织锦', cat:'四色系', ratio: [60, 20, 10, 10] },
  { key: 'quad2', label: '落霞织序', cat:'四色系', ratio: [55, 20, 15, 10] },
  { key: 'quad3', label: '山野来信', cat:'四色系', ratio: [45, 25, 20, 10] },
];

export default function ColorPalette({ colors, setColors }) {
  const [mode, setMode] = useState('glimmer');

  const normalize = (palette) => {
    if (!palette?.length) return [];
    if (palette.length === 1) return [{ ...palette[0], weight: 100 }];
    let total = palette.reduce((s, c) => s + c.weight, 0);
    return palette.map(c => ({ ...c, weight: Math.max(1, Math.round(c.weight / total * 100)) }));
  };

  const addColor = () => {
    if (colors.length >= 10) return;
    setColors(normalize([...colors, { id: Date.now(), hex: '#ffffff', weight: 10 }]));
  };

  const removeColor = (id) => {
    if (colors.length <= 1) return;
    setColors(normalize(colors.filter(c => c.id !== id)));
  };

  const updateColor = (id, key, value) => {
    if (key === 'weight') {
      const updated = [...colors];
      const idx = updated.findIndex(c => c.id === id);
      updated[idx] = { ...updated[idx], weight: parseInt(value) || 1 };
      setColors(normalize(updated));
    } else {
      setColors(colors.map(c => c.id === id ? { ...c, [key]: value } : c));
    }
  };

  const applyMode = (modeKey) => {
    const modeData = COLOR_MODES.find(m => m.key === modeKey);
    if (!modeData) return;
    setMode(modeKey);
    const fallback = ['#4f46e5', '#ec4899', '#22c55e', '#f59e0b'];
    const updated = colors.map((c, i) => ({...c, weight: modeData.ratio[i] || 1}));
    while (updated.length < modeData.ratio.length) {
      updated.push({ id: Date.now() + updated.length, hex: fallback[updated.length % fallback.length], weight: modeData.ratio[updated.length] });
    }
    setColors(normalize(updated));
  };

  const randomize = () => {
    const seedHue = Math.random(), seedSat = Math.random() * 0.56 + 0.26, seedVal = Math.random() * 0.28 + 0.68;
    const mainHex = hsvToHex(seedHue, seedSat, seedVal);
    const analysis = analyzeColorTone(mainHex);
    // 三种色调配方（独立对象，避免 recipes 自引用导致的 TDZ ReferenceError）
    const RECIPES_BY_TONE = {
      warm: [{ h: 0, s: 1, v: 1 }, { h: 0.07, s: 0.56, v: 1.08 }, { h: -0.06, s: 0.74, v: 0.88 }],
      cool: [{ h: 0, s: 1, v: 1 }, { h: -0.08, s: 0.52, v: 1.1 }, { h: 0.07, s: 0.7, v: 0.9 }],
      neutral: [{ h: 0, s: 1, v: 1 }, { h: 0.06, s: 0.28, v: 1.08 }, { h: -0.05, s: 0.36, v: 0.86 }],
    };
    const recipes = RECIPES_BY_TONE[analysis.tone] || RECIPES_BY_TONE.neutral;
    const updated = colors.map((c, i) => ({
      ...c, hex: i === 0 ? mainHex : hsvToHex(wrapHue(analysis.h + recipes[i % recipes.length].h + (Math.random() - 0.5) * 0.08), clamp01(analysis.s * recipes[i % recipes.length].s + 0.05), clamp01(analysis.v * recipes[i % recipes.length].v + (Math.random() - 0.5) * 0.16))
    }));
    setColors(updated);
  };

  const tone = colors[0] ? analyzeColorTone(colors[0].hex) : { tone: 'neutral' };
  const toneLabels = { warm: '暖色调', cool: '冷色调', neutral: '中性色调' };
  const toneClasses = { warm: 'text-amber-300 bg-amber-500/10', cool: 'text-sky-300 bg-sky-500/10', neutral: 'text-slate-300 bg-slate-500/10' };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <span className={`col-span-2 text-[10px] font-black px-2 py-1 rounded h-8 flex items-center justify-center ${toneClasses[tone.tone]}`}>
          色调：{toneLabels[tone.tone]}
        </span>
        <button onClick={randomize} className="text-[10px] text-pink-400 hover:text-pink-300 bg-pink-500/10 px-2 py-1 rounded h-8">随机调色</button>
        <button onClick={addColor} className="text-[10px] text-[#a5b4fc] hover:text-white bg-[#6366f1]/20 px-2 py-1 rounded h-8">+ 增加颜色</button>
      </div>
      <select value={mode} onChange={e => applyMode(e.target.value)} className="w-full bg-[#141822] border border-[#2a2d35] rounded p-2 text-xs text-pink-300 font-medium">
        {['双色系','三色系','四色系'].map(cat=><optgroup key={cat} label={'【'+cat+'】'}>
          {COLOR_MODES.filter(m=>m.cat===cat).map(m=><option key={m.key} value={m.key}>{m.label}: {m.ratio.join(':')}</option>)}
        </optgroup>)}
      </select>
      <div className="space-y-2">
        {colors.map((c, idx) => (
          <div key={c.id} className="bg-[#141822] p-2 rounded-xl border border-[#2a2d35] space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded border border-[#343740] shrink-0" style={{ background: c.hex }} />
              <input type="color" value={c.hex} onChange={e => updateColor(c.id, 'hex', e.target.value)} className="w-7 h-7 bg-transparent border-0 cursor-pointer shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[9px] text-slate-500 mb-0.5">
                  <span>色 #{idx + 1} <span className="text-slate-400 font-mono ml-1">{c.hex.toUpperCase()}</span></span>
                  <span className="text-[#a5b4fc]">{c.weight}%</span>
                </div>
                <input type="range" min="1" max="99" value={c.weight} onChange={e => updateColor(c.id, 'weight', e.target.value)} className="w-full h-1" />
              </div>
              {colors.length > 1 && <button onClick={() => removeColor(c.id)} className="text-red-400 text-[9px] shrink-0">×</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
