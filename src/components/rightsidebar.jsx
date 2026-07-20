import React from 'react';
import SVGIcon from './svgicon';
import ColorPalette from './colorpalette';

// 安全读取 localStorage 中的品牌模板（防止 JSON 畸形导致渲染崩溃）
function getBrandTemplates() {
  try {
    const raw = localStorage.getItem('vedaartBrandTemplates');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function RightSidebar({ activeTab, selectedStyle, setSelectedStyle, textLighting, setTextLighting, textCamera, setTextCamera, textBackground, setTextBackground, textCommercialMaterial, setTextCommercialMaterial, textTone, setTextTone, textCreativity, setTextCreativity, textRealism, setTextRealism, textSharpness, setTextSharpness, generationDetail, setGenerationDetail, aspectRatio, setAspectRatio, batchCount, setBatchCount, canvasGrid, onGridChange, generationSteps, setGenerationSteps, cfgScale, setCfgScale, sampler, setSampler, refWeight, setRefWeight, structLock, setStructLock, i2iStrength, setI2iStrength, i2iStyleStrength, setI2iStyleStrength, i2iDetailStrength, setI2iDetailStrength, floralStyle, setFloralStyle, material, setMaterial, gradientModel, setGradientModel, colorSchemeEnabled, setColorSchemeEnabled, colors, setColors, onClose, setSystemMsg, batchImages, onBatchOutfit, onEnhance, onMagicErase, onGlareRemove, onExpandCanvas, onSaveTemplate, onStyleUnify, onPresetExport, onShadowGen, isGenerating, batchParams, setBatchParams, collapsedSections, setCollapsedSections, modelPresets, onIdeogramGenerate, onIdeogramRemix, onIdeogramUpscale, selectedApi, bflPromptOnly, setBflPromptOnly, seedValue, setSeedValue, editParamEnabled, setEditParamEnabled }) {
  const title = activeTab==='generate'?'文生图参数':activeTab==='edit'?'图生图参数':activeTab==='vto'?'AI虚拟模特参数':'图生图参数';
  // 图生图参数区块开关（与标题同行，关闭后折叠内容且不拼接参数到 prompt）
  const ep = editParamEnabled || {};
  const setEP = (k, v) => setEditParamEnabled?.({ ...ep, [k]: v });
  const EPToggle = ({ k }) => (
    <label className="flex items-center gap-1 text-[9px] cursor-pointer shrink-0">
      <input type="checkbox" checked={!!ep[k]} onChange={e => setEP(k, e.target.checked)} className="accent-[#6366f1] w-3 h-3"/>
      <span className="text-slate-500">{ep[k] ? '已启用' : '已关闭'}</span>
    </label>
  );
  
  return <aside className="right-sidebar desktop-sidebar studio-panel flex flex-col border-l shrink-0 z-10 h-full">
    <div className="studio-dock-title flex items-center px-3 text-xs font-black text-white shrink-0">{title}<button onClick={onClose} className="ml-auto w-6 h-6 text-slate-500 hover:text-white">&times;</button></div>
    <div className="flex-1 overflow-y-auto p-4 space-y-2 panel-scroll desktop-padding">
      {activeTab==='generate'&&<div className="space-y-2">
        {selectedApi==='bfl'&&<label className="flex items-center justify-between bg-[#0d0f14]/60 rounded p-2 border border-[#1f232d]">
          <span className="text-[9px] font-bold text-slate-300">BFL 纯净模式<div className="text-[8px] text-slate-600 font-normal">关闭后拼入风格/灯光等控制参数</div></span>
          <input type="checkbox" checked={bflPromptOnly} onChange={e=>setBflPromptOnly(e.target.checked)} className="w-4 h-4"/>
        </label>}
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">基础参数</div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-[9px] font-bold text-slate-400">分辨率</label><select className="archive-field mt-1"><option>1K (1024p)</option><option>2K (2048p)</option><option>4K (4096p)</option></select></div>
          <div><label className="text-[9px] font-bold text-slate-400">批次数量</label><input type="number" min="1" max="10" value={batchCount} onChange={e=>setBatchCount(Number(e.target.value))} className="archive-field mt-1"/></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-[9px] font-bold text-slate-400">宽高比</label><select value={aspectRatio} onChange={e=>setAspectRatio(e.target.value)} className="archive-field mt-1"><option value="1:1">1:1</option><option value="4:3">4:3</option><option value="3:4">3:4</option><option value="16:9">16:9</option></select></div>
          <div><label className="text-[9px] font-bold text-slate-400">画布输出数量</label><select value={canvasGrid||2} onChange={e=>onGridChange?.(Number(e.target.value))} className="archive-field mt-1"><option value={1}>1格</option><option value={2}>2格</option><option value={4}>4格</option><option value={6}>6格</option><option value={9}>9格</option></select></div>
        </div>
        <div className="border-t border-[#1f232d] pt-2"><div className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">电商摄影控制</div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[9px] font-bold text-slate-400">风格</label><select value={selectedStyle} onChange={e=>setSelectedStyle(e.target.value)} className="archive-field mt-1"><option value="Photorealistic">写实摄影</option><option value="Oil Painting">古典油画</option><option value="Watercolor">水彩手绘</option><option value="3D Render">3D渲染</option><option value="Anime">二次元插画</option></select></div>
            <div><label className="text-[9px] font-bold text-slate-400">镜头</label><select value={textCamera} onChange={e=>setTextCamera(e.target.value)} className="archive-field mt-1"><option value="Front">50mm 标准镜头</option><option value="Top-down">俯拍45°</option><option value="Macro">微距特写</option><option value="Wide">广角环绕</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div><label className="text-[9px] font-bold text-slate-400">光线</label><select value={textLighting} onChange={e=>setTextLighting(e.target.value)} className="archive-field mt-1"><option value="Softbox">柔和漫射光</option><option value="HardTop">硬顶光</option><option value="SideBack">侧逆光</option><option value="Rim">轮廓光</option><option value="Spot">棚拍聚光</option><option value="Natural">自然光窗边</option><option value="CoolSoft">冷调柔光</option><option value="MetalReflect">金属反光</option><option value="Shadowless">无影纯白底光</option></select></div>
            <div><label className="text-[9px] font-bold text-slate-400">构图</label><select value={textBackground} onChange={e=>setTextBackground(e.target.value)} className="archive-field mt-1"><option value="Studio">正面平视</option><option value="Top45">45°俯拍</option><option value="Top">顶部俯拍</option><option value="Side45">侧面45°</option><option value="Macro">局部特写</option><option value="Center">居中构图</option><option value="Rule3">三分构图</option><option value="WhiteSpace">留白构图</option><option value="Symmetry">对称构图</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div><label className="text-[9px] font-bold text-slate-400">色调</label><select value={textTone} onChange={e=>setTextTone(e.target.value)} className="archive-field mt-1"><option value="默认色调">暖色调</option><option value="Cool">冷色调</option><option value="White">中性纯白</option><option value="Morandi">莫兰迪低饱和</option><option value="GoldBlack">高级黑金</option><option value="Ins">ins冷淡风</option><option value="Vintage">复古胶片色调</option></select></div>
            <div><label className="text-[9px] font-bold text-slate-400">材质</label><select value={textCommercialMaterial} onChange={e=>setTextCommercialMaterial(e.target.value)} className="archive-field mt-1"><option value="默认材质">默认</option><option value="陶瓷">陶瓷</option><option value="金属">金属</option><option value="玻璃">玻璃</option><option value="布艺毛绒">布艺毛绒</option><option value="木质">木质</option><option value="树脂">树脂</option><option value="亚克力">亚克力</option><option value="皮革">皮革</option><option value="哑光塑料">哑光塑料</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>细节度</span><span className="text-[#a5b4fc]">{generationDetail}/5</span></div><input type="range" min="1" max="5" value={generationDetail} onChange={e=>setGenerationDetail(Number(e.target.value))} className="w-full"/></div>
            <div><label className="text-[9px] font-bold text-slate-400">景深</label><select className="archive-field mt-1"><option>浅景深</option><option>中景深</option><option>深景深</option><option>极浅景深</option><option>微距景深</option></select></div>
          </div>
        </div>
        <div className="border-t border-[#1f232d] pt-2">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">参考图控制</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>构图锁定</span><span className="text-[#a5b4fc]">{structLock||100}%</span></div><input type="range" min="0" max="100" value={structLock||100} onChange={e=>setStructLock?.(Number(e.target.value))} className="w-full"/></div>
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>参考图权重</span><span className="text-[#a5b4fc]">{refWeight}%</span></div><input type="range" min="0" max="150" value={refWeight} onChange={e=>setRefWeight?.(Number(e.target.value))} className="w-full"/></div>
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>风格强度</span><span className="text-[#a5b4fc]">{i2iStyleStrength}%</span></div><input type="range" min="0" max="100" step="5" value={i2iStyleStrength} onChange={e=>setI2iStyleStrength(Number(e.target.value))} className="w-full"/></div>
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>细节强度</span><span className="text-[#a5b4fc]">{i2iDetailStrength}%</span></div><input type="range" min="0" max="100" step="5" value={i2iDetailStrength} onChange={e=>setI2iDetailStrength(Number(e.target.value))} className="w-full"/></div>
          </div>
        </div>
        <div className="border-t border-[#1f232d] pt-2">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">画质控制</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>创造力</span><span className="text-[#a5b4fc]">{textCreativity}</span></div><input type="range" min="1" max="5" value={textCreativity} onChange={e=>setTextCreativity(Number(e.target.value))} className="w-full"/></div>
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>写实度</span><span className="text-[#a5b4fc]">{textRealism}</span></div><input type="range" min="1" max="5" value={textRealism} onChange={e=>setTextRealism(Number(e.target.value))} className="w-full"/></div>
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>锐度</span><span className="text-[#a5b4fc]">{textSharpness}</span></div><input type="range" min="1" max="5" value={textSharpness} onChange={e=>setTextSharpness(Number(e.target.value))} className="w-full"/></div>
          </div>
        </div>
      </div>}
      {activeTab==='edit'&&<div className="space-y-2">
        {selectedApi==='bfl'&&<label className="flex items-center justify-between bg-[#0d0f14]/60 rounded p-2 border border-[#1f232d]">
          <span className="text-[9px] font-bold text-slate-300">BFL 纯净模式<div className="text-[8px] text-slate-600 font-normal">关闭后拼入风格/灯光等控制参数</div></span>
          <input type="checkbox" checked={bflPromptOnly} onChange={e=>setBflPromptOnly(e.target.checked)} className="w-4 h-4"/>
        </label>}
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">基础参数</div>
          <EPToggle k="basic"/>
        </div>
        {ep.basic&&<div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[9px] font-bold text-slate-400">宽高比</label><select value={aspectRatio} onChange={e=>setAspectRatio(e.target.value)} className="archive-field mt-1"><option value="1:1">1:1</option><option value="4:3">4:3</option><option value="3:4">3:4</option><option value="16:9">16:9</option></select></div>
            <div><label className="text-[9px] font-bold text-slate-400">画布输出数量</label><select value={canvasGrid||2} onChange={e=>onGridChange?.(Number(e.target.value))} className="archive-field mt-1"><option value={1}>1格</option><option value={2}>2格</option><option value={4}>4格</option><option value={6}>6格</option><option value={9}>9格</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[9px] font-bold text-slate-400">批次数量</label><input type="number" min="1" max="10" value={batchCount} onChange={e=>setBatchCount(Number(e.target.value))} className="archive-field mt-1"/></div>
            <div className="space-y-1"><div className="flex justify-between text-[9px] font-bold text-slate-500"><span>Seed 值</span><button onClick={()=>setSeedValue?.(String(Math.floor(Math.random()*2147483647)))} className="text-[9px] text-[#a5b4fc]">随机</button></div><input type="number" value={seedValue||''} onChange={e=>setSeedValue?.(e.target.value)} className="archive-field" placeholder="随机"/></div>
          </div>
        </div>}
        <div className="border-t border-[#1f232d] pt-2">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">参考图控制</div>
            <EPToggle k="refCtrl"/>
          </div>
          {ep.refCtrl&&<div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>变化强度</span><span className="text-[#a5b4fc]">{Math.round((i2iStrength||0.7)*100)}%</span></div><input type="range" min="0" max="1" step="0.05" value={i2iStrength||0.7} onChange={e=>setI2iStrength?.(Number(e.target.value))} className="w-full"/></div>
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>构图锁定</span><span className="text-[#a5b4fc]">{structLock||100}%</span></div><input type="range" min="0" max="100" value={structLock||100} onChange={e=>setStructLock?.(Number(e.target.value))} className="w-full"/></div>
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>参考图权重</span><span className="text-[#a5b4fc]">{refWeight}%</span></div><input type="range" min="0" max="150" value={refWeight} onChange={e=>setRefWeight?.(Number(e.target.value))} className="w-full"/></div>
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>风格强度</span><span className="text-[#a5b4fc]">{i2iStyleStrength}%</span></div><input type="range" min="0" max="100" step="5" value={i2iStyleStrength} onChange={e=>setI2iStyleStrength(Number(e.target.value))} className="w-full"/></div>
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>细节强度</span><span className="text-[#a5b4fc]">{i2iDetailStrength}%</span></div><input type="range" min="0" max="100" step="5" value={i2iDetailStrength} onChange={e=>setI2iDetailStrength(Number(e.target.value))} className="w-full"/></div>
          </div>}
        </div>
        <div className="border-t border-[#1f232d] pt-2">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">电商摄影控制</div>
            <EPToggle k="ecommerce"/>
          </div>
          {ep.ecommerce&&<div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[9px] font-bold text-slate-400">镜头</label><select value={textCamera} onChange={e=>setTextCamera(e.target.value)} className="archive-field mt-1"><option value="Front">50mm 标准镜头</option><option value="Top-down">俯拍45°</option><option value="Macro">微距特写</option><option value="Wide">广角环绕</option></select></div>
              <div><label className="text-[9px] font-bold text-slate-400">光线</label><select value={textLighting} onChange={e=>setTextLighting(e.target.value)} className="archive-field mt-1"><option value="Softbox">柔和漫射光</option><option value="HardTop">硬顶光</option><option value="SideBack">侧逆光</option><option value="Rim">轮廓光</option><option value="Spot">棚拍聚光</option><option value="Natural">自然光窗边</option><option value="CoolSoft">冷调柔光</option><option value="MetalReflect">金属反光</option><option value="Shadowless">无影纯白底光</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div><label className="text-[9px] font-bold text-slate-400">构图</label><select value={textBackground} onChange={e=>setTextBackground(e.target.value)} className="archive-field mt-1"><option value="Studio">正面平视</option><option value="Top45">45°俯拍</option><option value="Top">顶部俯拍</option><option value="Side45">侧面45°</option><option value="Macro">局部特写</option><option value="Center">居中构图</option><option value="Rule3">三分构图</option><option value="WhiteSpace">留白构图</option><option value="Symmetry">对称构图</option></select></div>
              <div><label className="text-[9px] font-bold text-slate-400">色调</label><select value={textTone} onChange={e=>setTextTone(e.target.value)} className="archive-field mt-1"><option value="默认色调">暖色调</option><option value="Cool">冷色调</option><option value="White">中性纯白</option><option value="Morandi">莫兰迪低饱和</option><option value="GoldBlack">高级黑金</option><option value="Ins">ins冷淡风</option><option value="Vintage">复古胶片色调</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>细节度</span><span className="text-[#a5b4fc]">{generationDetail}/5</span></div><input type="range" min="1" max="5" value={generationDetail} onChange={e=>setGenerationDetail(Number(e.target.value))} className="w-full"/></div>
              <div><label className="text-[9px] font-bold text-slate-400">景深</label><select className="archive-field mt-1"><option>浅景深</option><option>中景深</option><option>深景深</option><option>极浅景深</option><option>微距景深</option></select></div>
            </div>
          </div>}
        </div>
        <div className="border-t border-[#1f232d] pt-2">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">画质控制</div>
            <EPToggle k="quality"/>
          </div>
          {ep.quality&&<div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>创造力</span><span className="text-[#a5b4fc]">{textCreativity}</span></div><input type="range" min="1" max="5" value={textCreativity} onChange={e=>setTextCreativity(Number(e.target.value))} className="w-full"/></div>
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>写实度</span><span className="text-[#a5b4fc]">{textRealism}</span></div><input type="range" min="1" max="5" value={textRealism} onChange={e=>setTextRealism(Number(e.target.value))} className="w-full"/></div>
            <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>锐度</span><span className="text-[#a5b4fc]">{textSharpness}</span></div><input type="range" min="1" max="5" value={textSharpness} onChange={e=>setTextSharpness(Number(e.target.value))} className="w-full"/></div>
          </div>}
        </div>
        <div className="border-t border-[#1f232d] pt-2">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">配色方案</div>
            <label className="flex items-center gap-1 text-[9px] cursor-pointer">
              <input type="checkbox" checked={colorSchemeEnabled} onChange={e=>setColorSchemeEnabled?.(e.target.checked)} className="accent-[#6366f1]"/>
              <span className="text-slate-400">{colorSchemeEnabled?"已启用":"已关闭"}</span>
            </label>
          </div>
          {colorSchemeEnabled&&<div className="space-y-1 mb-2">
            <div><label className="text-[9px] font-bold text-slate-400">设计风格</label><select value={floralStyle} onChange={e=>setFloralStyle(Number(e.target.value))} className="archive-field mt-1"><option value={0}>写实平面</option><option value={1}>轻奢几何</option><option value={2}>写意国风</option><option value={3}>森系野趣</option><option value={4}>印象派光影</option><option value={5}>浮世绘线描</option><option value={6}>超现实液态</option><option value={7}>解构剪纸</option><option value={8}>禅意枯笔</option><option value={9}>波普撞色</option></select></div>
            <div><label className="text-[9px] font-bold text-slate-400">物理材质</label><select value={material} onChange={e=>setMaterial(Number(e.target.value))} className="archive-field mt-1"><option value={0}>默认</option><option value={1}>欧根纱</option><option value={2}>磨砂玻璃</option><option value={3}>金属</option><option value={4}>丝绒</option><option value={5}>流体金属</option><option value={6}>3D黏土</option><option value={7}>丝光缎</option><option value={8}>雾绒</option></select></div>
          </div>}
          {colorSchemeEnabled&&<div className="grid grid-cols-2 gap-2 mt-1">
            <div><label className="text-[9px] font-bold text-slate-400">渐变模型</label><select value={gradientModel} onChange={e=>setGradientModel(Number(e.target.value))} className="archive-field mt-1"><option value={0}>无渐变</option><option value={1}>线性渐变</option><option value={2}>径向渐变</option><option value={3}>角度渐变</option><option value={4}>对称渐变</option><option value={5}>菱形渐变</option></select></div>
          </div>}
          {colorSchemeEnabled&&<ColorPalette colors={colors} setColors={setColors}/>}
        </div>
      </div>}
      {/* 批量自动化已移至左侧面板（批量抠图/批量场景） */}
        {/* AI 虚拟模特 - 独立 tab 面板 */}
        {activeTab==='vto'&&<div className="space-y-2">
          {batchParams && setBatchParams && <div className="space-y-2">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">模特参数</div>
            <div>
              <label className="text-[9px] font-bold text-slate-400">贴合/穿搭模特选择</label>
              <select value={batchParams.vtoModel||0} onChange={e=>setBatchParams({...batchParams,vtoModel:Number(e.target.value)})} className="archive-field mt-1 w-full text-[10px]">
                {(modelPresets||[]).map((m,i)=><option key={i} value={i}>{i+1}. {m.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-slate-400">模特姿势</label>
                <select value={batchParams.vtoPose||'standing'} onChange={e=>setBatchParams({...batchParams,vtoPose:e.target.value})} className="archive-field mt-1 w-full text-[10px]">
                  <option value="standing">站立</option>
                  <option value="sitting">坐姿</option>
                  <option value="walking">行走</option>
                  <option value="casual">休闲</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400">拍摄角度</label>
                <select value={batchParams.vtoAngle||'front'} onChange={e=>setBatchParams({...batchParams,vtoAngle:e.target.value})} className="archive-field mt-1 w-full text-[10px]">
                  <option value="front">正面</option>
                  <option value="angle45">45度</option>
                  <option value="side">侧面</option>
                  <option value="back">背面</option>
                  <option value="top">俯拍</option>
                  <option value="low">仰拍</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400">背景</label>
              <select value={batchParams.vtoBg||'plain'} onChange={e=>setBatchParams({...batchParams,vtoBg:e.target.value})} className="archive-field mt-1 w-full text-[10px]">
                <option value="plain">纯色背景</option>
                <option value="studio">摄影棚</option>
                <option value="outdoor">户外场景</option>
              </select>
            </div>
            <div className="border-t border-[#1f232d] pt-2"><div className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">试穿控制</div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[9px] font-bold text-slate-400">贴合度</label><select value={batchParams.vtoFit||'regular'} onChange={e=>setBatchParams({...batchParams,vtoFit:e.target.value})} className="archive-field mt-1 w-full text-[10px]"><option value="tight">紧身</option><option value="regular">合身</option><option value="loose">宽松</option></select></div>
                <div><label className="text-[9px] font-bold text-slate-400">镜头</label><select value={batchParams.vtoShot||'full'} onChange={e=>setBatchParams({...batchParams,vtoShot:e.target.value})} className="archive-field mt-1 w-full text-[10px]"><option value="head">头部特写</option><option value="bust">半身</option><option value="half">大半身</option><option value="full">全身</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>脸部保留度</span><span className="text-[#a5b4fc]">{batchParams.vtoFaceKeep||100}%</span></div><input type="range" min="0" max="100" value={batchParams.vtoFaceKeep||100} onChange={e=>setBatchParams({...batchParams,vtoFaceKeep:Number(e.target.value)})} className="w-full"/></div>
                <div className="space-y-0.5"><div className="flex justify-between text-[8px] font-bold text-slate-500"><span>身材保留度</span><span className="text-[#a5b4fc]">{batchParams.vtoBodyKeep||100}%</span></div><input type="range" min="0" max="100" value={batchParams.vtoBodyKeep||100} onChange={e=>setBatchParams({...batchParams,vtoBodyKeep:Number(e.target.value)})} className="w-full"/></div>
              </div>
            </div>
            <div className="border-t border-[#1f232d] pt-2"><div className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">画质控制</div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[9px] font-bold text-slate-400">光线</label><select value={batchParams.vtoLighting||'Softbox'} onChange={e=>setBatchParams({...batchParams,vtoLighting:e.target.value})} className="archive-field mt-1 w-full text-[10px]"><option value="Softbox">柔和漫射光</option><option value="HardTop">硬顶光</option><option value="SideBack">侧逆光</option><option value="Rim">轮廓光</option><option value="Spot">棚拍聚光</option><option value="Natural">自然光窗边</option><option value="Shadowless">无影纯白底光</option></select></div>
                <div><label className="text-[9px] font-bold text-slate-400">画质</label><select value={batchParams.vtoQuality||'high'} onChange={e=>setBatchParams({...batchParams,vtoQuality:e.target.value})} className="archive-field mt-1 w-full text-[10px]"><option value="standard">标准</option><option value="high">高清</option><option value="ultra">超清</option></select></div>
              </div>
              <div className="mt-1"><label className="text-[9px] font-bold text-slate-400">输出格式</label><select value={batchParams.vtoFormat||'jpeg'} onChange={e=>setBatchParams({...batchParams,vtoFormat:e.target.value})} className="archive-field mt-1 w-full text-[10px]"><option value="jpeg">JPEG</option><option value="png">PNG</option><option value="webp">WebP</option></select></div>
            </div>
          </div>}
          <div className="border-t border-[#1f232d] pt-2">
            <button onClick={onBatchOutfit} disabled={isGenerating} className="w-full h-9 bg-[#6366f1]/20 hover:bg-[#6366f1] text-[#a5b4fc] hover:text-white text-[10px] font-bold rounded border border-[#6366f1]/30 disabled:opacity-40 disabled:cursor-not-allowed">OTV</button>
          </div>
        </div>}
    </div>
  </aside>;
}
