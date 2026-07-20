import React, { useState, useRef } from 'react';
import SVGIcon from './svgicon';

const ENGINES=[{k:'gemini',l:'Gemini'},{k:'bfl',l:'BFL'},{k:'doubao',l:'Doubao'}];
const MAX_SLOTS=8;

export default function LeftPanel({ activeTab, setActiveTab, isOpen, onClose, prompt, setPrompt, archiveTitle, setArchiveTitle, archiveSku, setArchiveSku, onDeepseekName, isNaming, onGenerate, isGenerating, hasApiKey, productArchives, onSaveArchive, onDeleteArchive, selectedApi, setSelectedApi, ecData, setEcData, ecTab, setEcTab, onRefImageChange, onRefRemove, refImages, setRefImages, onBatchGenerate, onBgRemove, onImageEdit, onVTO, onOutpaint, onErase, selectedStyle, setSelectedStyle, generationDetail, setGenerationDetail, textBackground, setTextBackground, textLighting, setTextLighting, textCamera, setTextCamera, textCommercialMaterial, setTextCommercialMaterial, onPromptModify, onAnalyzeRefImage, photoKey, setPhotoKey, onPhotoRemove, onPhotoScene, negativePrompt, setNegativePrompt, showNegative, setShowNegative, systemMsg, setSystemMsg, batchImages, onBatchUpload, onBatchRemoveOne, onBatchClear, onBatchRemove, onBatchScene, onIdeogramGenerate, onEcommerceDetailGenerate, onEcommercePlanGenerate, onEcommerceDescEnhance, onEcommerceSellingPoints, onEcommerceNameEnhance, onEcommerceSkuGenerate, ecPlan, setEcPlan, ecRefImages, setEcRefImages, batchParams, setBatchParams, geminiModel, setGeminiModel, bflModel, setBflModel }) {
  const [showAdvParams, setShowAdvParams] = useState(false);
const PRESETS = [
  {label:'快速预览',seed:'random',steps:20,cfg:5,sampler:'dpm2_karras'},
  {label:'标准全景',seed:'lock',steps:28,cfg:7,sampler:'dpm2_karras'},
  {label:'高清定稿',seed:'lock',steps:35,cfg:8,sampler:'dpm2_karras'},
  {label:'细节特写',seed:'lock',steps:32,cfg:8,sampler:'dpm_sde_karras'},
  {label:'场景重绘',seed:'clear',steps:28,cfg:7,sampler:'dpm2_karras'},
  {label:'局部微调',seed:'lock',steps:22,cfg:4,sampler:'dpm2_karras'},
];
const [presetMode, setPresetMode] = useState(0); // 0=快速预览
const [seedLocked, setSeedLocked] = useState('');
const [presetSeed, setPresetSeed] = useState('');
const [presetSteps, setPresetSteps] = useState(20);
const [presetCfg, setPresetCfg] = useState(5);
const [presetSampler, setPresetSampler] = useState('dpm2_karras');

const applyPreset = (idx) => {
  const p = PRESETS[idx];
  setPresetMode(idx);
  setPresetSteps(p.steps);
  setPresetCfg(p.cfg);
  setPresetSampler(p.sampler);
  if(p.seed==='random'){setPresetSeed(String(Math.floor(Math.random()*2147483647)));setSeedLocked('')}
  else if(p.seed==='lock'){setSeedLocked(presetSeed||String(Math.floor(Math.random()*2147483647)))}
  else if(p.seed==='clear'){setPresetSeed('');setSeedLocked('')}
};
  const title = activeTab==='generate'?'文生图':activeTab==='edit'?'图生图':activeTab==='vto'?'AI虚拟模特':'图生图';

  const handleUpload = (idx) => (e) => { const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{setRefImages(p=>{const n=[...p];n[idx]=r.result;return n});onRefImageChange?.(r.result, idx)}; r.readAsDataURL(f); e.target.value=''; };
  const removeSlot = (idx) => { if(refImages.length<=1)return; setRefImages(p=>p.filter((_,i)=>i!==idx)) };
  const addSlot = () => { if(refImages.length>=MAX_SLOTS)return; setRefImages(p=>[...p,null]) };
  const removeImage = (idx) => { setRefImages(p=>{const n=[...p];n[idx]=null;return n});onRefRemove?.(idx) };

  // 参考图上传 ref（用 label 包裹触发，避免 document.createElement + click 被浏览器拦截）
  const refFileInputRef = useRef(null);
  const [uploadIdx, setUploadIdx] = useState(0);
  const openRefUpload = (idx) => { setUploadIdx(idx); refFileInputRef.current?.click(); };
  // 全局隐藏的 file input（只创建一个，通过 uploadIdx 切换槽位）
  return (
    <>
    <input type="file" accept="image/*" ref={refFileInputRef} className="hidden" onChange={handleUpload(uploadIdx)}/>
    <div className="left-sidebar desktop-sidebar studio-panel flex flex-col border-r shrink-0 z-10 h-full">
      <div className="studio-dock-title flex items-center justify-between px-3 shrink-0"><span className="text-xs font-black text-white">{title}</span><button onClick={onClose} className="w-6 h-6 text-slate-500 hover:text-white">&times;</button></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 panel-scroll desktop-padding">
{(activeTab==='vto')&&<div className="space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="text-[10px] font-black text-slate-400 tracking-wide flex items-center gap-1"><SVGIcon name="sparkles" size={12}/> 提示词</label>
              <div className="flex gap-1">
                <button onClick={()=>setPrompt?.('')} disabled={!prompt.trim()} className="px-2 h-7 text-[10px] font-bold border bg-red-500/10 text-red-300 border-red-500/25 hover:bg-red-500 hover:text-white disabled:opacity-35 rounded">清空</button>
                <button onClick={()=>onPromptModify?.()} className="px-2 h-7 text-[10px] font-bold border bg-[#6366f1]/15 text-[#a5b4fc] border-[#6366f1]/30 hover:bg-[#6366f1] hover:text-white rounded">修改提示词</button>
              </div>
            </div>
            <textarea className="w-full h-20 bg-[#101216] border border-[#343740] rounded p-2 text-[11px] text-slate-300 resize-none outline-none focus:border-[#6366f1]" value={prompt||''} onChange={e=>setPrompt?.(e.target.value)} placeholder="描述试穿效果，如：model wearing the garment, professional fashion photography"/>
            <div className="flex justify-between text-[9px] text-slate-600 mt-1"><span>支持中英文输入</span><span>{(prompt||'').length}/1000</span></div>
          </div>
          <button onClick={()=>setShowNegative(!showNegative)} className="w-full text-[10px] font-bold text-slate-400 hover:text-white bg-[#141822] border border-[#2a2d35] rounded p-2 text-left flex items-center justify-between"><span>负面提示词 {showNegative?'▲':'▼'}</span><span className="text-[#a5b4fc]">{negativePrompt?'已启用':'关闭'}</span></button>
          {showNegative&&<textarea className="w-full h-16 bg-[#101216] border border-[#343740] rounded p-2 text-[11px] text-red-300 resize-none outline-none focus:border-[#6366f1]" value={negativePrompt||''} onChange={e=>setNegativePrompt?.(e.target.value)} placeholder="blurry, deformed, distorted, watermark, text, low quality"/>}
          {onDeepseekName && (
            <div className="border-t border-[#1f232d] pt-2">
              <div className="flex gap-1 items-end">
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">产品名称</label>
                  <input type="text" value={archiveTitle||''} onChange={e=>setArchiveTitle?.(e.target.value)} className="archive-field w-full text-[11px]" placeholder="产品名"/>
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">SKU 编码</label>
                  <input type="text" value={archiveSku||''} onChange={e=>setArchiveSku?.(e.target.value)} className="archive-field w-full text-[11px]" placeholder="SKU"/>
                </div>
                <button onClick={()=>onDeepseekName?.()} disabled={isNaming} className="h-8 px-3 text-[10px] font-bold border bg-[#6366f1]/15 text-[#a5b4fc] border-[#6366f1]/30 hover:bg-[#6366f1] hover:text-white disabled:opacity-40 rounded whitespace-nowrap shrink-0">{isNaming?'...':'取名'}</button>
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">参考图</label>
              <button onClick={addSlot} disabled={refImages.length>=MAX_SLOTS} className="text-[9px] text-[#6366f1] hover:text-white font-bold bg-[#6366f1]/10 px-2 py-1 rounded disabled:opacity-30">+ 增加槽位</button>
            </div>
            <div className="text-[8px] text-slate-600 mt-0.5">第1张: 模特图 | 第2张: 上衣 | 第3张: 下身 | 其余: 服装</div>
            <div className={`grid gap-2 mt-1 ${refImages.length<=4?'grid-cols-2':'grid-cols-4'}`}>
              {refImages.map((img,idx)=>(<div key={idx} className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[9px] text-slate-400 font-bold">{idx===0?'模特图':idx===1?'上衣':idx===2?'下身':'服装'+(idx-2)}</label>
                  {refImages.length>1&&<button onClick={()=>removeSlot(idx)} className="text-[8px] text-red-400/50 hover:text-red-400">移除</button>}
                </div>
                {img?(<div className="relative group rounded-lg overflow-hidden border border-[#2a2d35] h-24"><img src={img} className="w-full h-full object-cover" alt={`R${idx}`}/><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"><button onClick={()=>openRefUpload(idx)} className="p-2 bg-[#6366f1]/20 text-[#a5b4fc] rounded-lg hover:bg-[#6366f1] hover:text-white">↥</button><button onClick={()=>removeImage(idx)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white">✕</button></div></div>):(<button onClick={()=>openRefUpload(idx)} className="w-full h-24 border-2 border-dashed border-[#2a2d35] hover:border-[#6366f1] rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-[#a5b4fc]"><SVGIcon name="upload" size={14}/></button>)}
              </div>))}
            </div>
          </div>
        </div>}
        {(activeTab==='generate'||activeTab==='edit')&&(<div className="space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="text-[10px] font-black text-slate-400 tracking-wide flex items-center gap-1"><SVGIcon name="sparkles" size={12}/> 提示词</label>
              <div className="flex gap-1">
                <button onClick={()=>setPrompt('')} disabled={!prompt.trim()} className="px-2 h-7 text-[10px] font-bold border bg-red-500/10 text-red-300 border-red-500/25 hover:bg-red-500 hover:text-white disabled:opacity-35 rounded">清空</button>
                <button onClick={()=>onPromptModify?.()} className="px-2 h-7 text-[10px] font-bold border bg-[#6366f1]/15 text-[#a5b4fc] border-[#6366f1]/30 hover:bg-[#6366f1] hover:text-white rounded">修改提示词</button>
                {activeTab==='edit'&&onAnalyzeRefImage&&<button onClick={()=>onAnalyzeRefImage?.()} disabled={!refImages.filter(Boolean).length} className="px-2 h-7 text-[10px] font-bold border bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500 hover:text-white disabled:opacity-35 rounded">分析参考图</button>}
              </div>
            </div>
            <textarea className="w-full h-28 bg-[#101216] border border-[#343740] rounded p-2 text-[11px] text-slate-300 resize-none outline-none focus:border-[#6366f1] mt-1" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder=""/>
            <div className="flex justify-between text-[9px] text-slate-600 mt-1"><span>支持中文输入，编译后仍可修改</span><span>{prompt.length}/1000</span></div>
          </div>
          <button onClick={()=>setShowNegative(!showNegative)} className="w-full text-[10px] font-bold text-slate-400 hover:text-white bg-[#141822] border border-[#2a2d35] rounded p-2 text-left flex items-center justify-between"><span>负面提示词 {showNegative?'▲':'▼'}</span><span className="text-[#a5b4fc]">{negativePrompt?'已启用':'关闭'}</span></button>
          {showNegative&&<textarea className="w-full h-16 bg-[#101216] border border-[#343740] rounded p-2 text-[11px] text-red-300 resize-none outline-none focus:border-[#6366f1]" value={negativePrompt} onChange={e=>setNegativePrompt(e.target.value)} placeholder="模糊、变形、低分辨率..."/>}
          {onDeepseekName && (
            <div className="border-t border-[#1f232d] pt-2">
              <div className="flex gap-1 items-end">
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">产品名称</label>
                  <input type="text" value={archiveTitle||''} onChange={e=>setArchiveTitle?.(e.target.value)} className="archive-field w-full text-[11px]" placeholder="产品名"/>
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">SKU 编码</label>
                  <input type="text" value={archiveSku||''} onChange={e=>setArchiveSku?.(e.target.value)} className="archive-field w-full text-[11px]" placeholder="SKU"/>
                </div>
                <button onClick={()=>onDeepseekName?.()} disabled={isNaming} className="h-8 px-3 text-[10px] font-bold border bg-[#6366f1]/15 text-[#a5b4fc] border-[#6366f1]/30 hover:bg-[#6366f1] hover:text-white disabled:opacity-40 rounded whitespace-nowrap shrink-0">{isNaming?'...':'取名'}</button>
              </div>
            </div>
          )}
          <div className="border-t border-[#1f232d] pt-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">AI 引擎</label><div className="flex gap-2 mt-1"><select value={selectedApi} onChange={e=>setSelectedApi(e.target.value)} className="archive-field flex-1">{ENGINES.map(e=><option key={e.k} value={e.k}>{e.l}</option>)}</select>{selectedApi==='gemini'&&<select value={geminiModel} onChange={e=>setGeminiModel(e.target.value)} className="archive-field flex-1"><option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image 生图（默认，Vertex AI）</option><option value="gemini-2.0-flash-preview-image-generation">Gemini 2.0 Flash 生图</option><option value="gemini-3.1-flash-lite-image">Gemini 3.1 Flash-Lite 生图</option><option value="gemini-3-pro-image-preview">Gemini 3 Pro 生图</option></select>}{selectedApi==='bfl'&&<select value={bflModel} onChange={e=>setBflModel(e.target.value)} className="archive-field flex-1"><option value="flux-2-klein-9b-preview">FLUX 2 Klein 9B（默认）</option><option value="flux-2-pro-preview">FLUX 2 Pro Preview</option><option value="flux-2-pro">FLUX 2 Pro</option><option value="flux-2-max">FLUX 2 Max</option><option value="flux-dev">FLUX Dev</option></select>}{selectedApi==='doubao'&&<input value={douModelId} onChange={e=>setDouModelId(e.target.value)} className="archive-field flex-1" placeholder="模型ID"/>}</div></div>
          <div className="border-t border-[#1f232d] pt-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">生成模式</label>
            <select value={presetMode} onChange={e=>applyPreset(Number(e.target.value))} className="archive-field mt-1">
              {PRESETS.map((p,i)=><option key={i} value={i}>{p.label} (Steps:{p.steps} CFG:{p.cfg})</option>)}
            </select>
            <div className="grid grid-cols-4 gap-1 mt-1 text-[8px] text-slate-500">
              <div>Seed:{presetMode===4?'随机':presetMode===0?'随机→锁定':'锁定'}</div>
              <div>Steps:{presetSteps}</div>
              <div>CFG:{presetCfg}</div>
              <div>Sampler:{presetSampler==='dpm2_karras'?'DPM++2M':presetSampler==='dpm_sde_karras'?'DPM++SDE':'DPM++2M'}</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">参考图</label>
              <button onClick={addSlot} disabled={refImages.length>=MAX_SLOTS} className="text-[9px] text-[#6366f1] hover:text-white font-bold bg-[#6366f1]/10 px-2 py-1 rounded disabled:opacity-30">+ 增加槽位</button>
            </div>
            <div className={`grid gap-2 mt-1 ${refImages.length<=4?'grid-cols-2':'grid-cols-4'}`}>
              {refImages.map((img,idx)=>(<div key={idx} className="space-y-1">
                <div className="flex justify-between"><label className="text-[9px] text-slate-400 font-bold">参考图{idx+1}</label>{refImages.length>1&&<button onClick={()=>removeSlot(idx)} className="text-[8px] text-red-400/50 hover:text-red-400">移除</button>}</div>
                {img?(<div className="relative group rounded-lg overflow-hidden border border-[#2a2d35] h-24"><img src={img} className="w-full h-full object-cover" alt={`R${idx}`}/><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"><button onClick={()=>openRefUpload(idx)} className="p-2 bg-[#6366f1]/20 text-[#a5b4fc] rounded-lg hover:bg-[#6366f1] hover:text-white">↥</button><button onClick={()=>removeImage(idx)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white">✕</button></div></div>):(<button onClick={()=>openRefUpload(idx)} className="w-full h-24 border-2 border-dashed border-[#2a2d35] hover:border-[#6366f1] rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-[#a5b4fc]"><SVGIcon name="upload" size={14}/></button>)}
              </div>))}
            </div>
          <button onClick={onGenerate} disabled={isGenerating||!hasApiKey||!prompt.trim()} className="w-full py-3 neon-cta disabled:bg-[#2a2d35] disabled:text-slate-500 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all">{isGenerating?<span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"/>:<SVGIcon name="sparkles" size={16}/>}{isGenerating?'生成中...':'生成图像'}</button>
        </div>)}
      </div>
    </div>
    </>
  );
}
