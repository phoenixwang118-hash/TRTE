import React, { useState } from 'react';

export default function ChatPanel({ onChatGenerate, geminiKey, isOpen, onClose, currentImage }) {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [generating, setGenerating] = useState(false);

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    // 没有当前图时，提示用户先选图
    if (!currentImage) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: '请先在画板或历史栏点击一张图作为修改目标' }]);
      return;
    }
    const msg = chatInput.trim();
    // 先构造完整上下文（含本次用户消息），避免 setChatHistory 异步导致闭包过期丢消息
    const fullHistory = [...chatHistory, { role: 'user', text: msg }];
    setChatHistory(fullHistory);
    setChatInput('');
    setGenerating(true);
    try {
      // 传完整上下文给生成函数，不再用过期的 chatHistory 闭包
      const image = await onChatGenerate?.(fullHistory);
      if (image) {
        setChatHistory(prev => [...prev, { role: 'assistant', text: '已修改完成', image }]);
      }
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: '修改失败: ' + e.message }]);
    }
    setGenerating(false);
  };

  if (!isOpen) return null;
  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 bg-[#0d0f14]/98 border-t border-[#1f232d] backdrop-blur-md" style={{ height: '150px' }}>
      <div className="h-8 flex items-center justify-between px-3 border-b border-[#1f232d]">
        <span className="text-[10px] font-black text-white">智能编辑</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white">&times;</button>
      </div>
      {/* 当前修改目标预览 */}
      <div className="h-8 flex items-center gap-2 px-3 border-b border-[#1f232d] bg-[#101216]/50">
        {currentImage ? (
          <>
            <img src={currentImage} className="w-6 h-6 object-cover rounded border border-[#2a2d35]" alt="target" />
            <span className="text-[9px] text-[#a5b4fc] font-bold">当前修改目标</span>
            <span className="text-[9px] text-slate-500">点历史栏可切换目标图，输入指令小修改</span>
          </>
        ) : (
          <span className="text-[9px] text-red-400">未选中修改目标 — 请先在画板或历史栏点击一张图</span>
        )}
      </div>
      <div className="h-10 flex gap-1 px-2 border-b border-[#1f232d] items-center">
        <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()}
          className="flex-1 h-7 bg-[#101216] border border-[#343740] rounded px-2 text-[10px] text-slate-300 outline-none focus:border-[#6366f1]" placeholder='描述修改：如 把背景换为海边日落、调整模特姿势、移除水印...' />
        <button onClick={sendChat} disabled={!chatInput.trim() || generating || !currentImage} className="h-7 px-3 bg-[#6366f1] hover:bg-[#4f46e5] disabled:bg-[#2a2d35] text-white text-[10px] font-bold rounded">发送</button>
      </div>
      <div className="flex-1 overflow-x-auto p-2 flex gap-2 items-start" style={{ height: 'calc(100% - 108px)' }}>
        {chatHistory.length === 0 && <div className="text-[10px] text-slate-500 text-center py-4">基于当前画板图迭代小修改，支持文生图/图生图/AI虚拟模特等所有生成结果</div>}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-2 rounded text-[10px] ${msg.role === 'user' ? 'bg-[#6366f1]/20 text-[#a5b4fc]' : 'bg-[#141822] text-slate-300'}`}>
              {msg.image ? <img src={msg.image} className="w-16 h-16 object-cover rounded mb-1" alt="result" /> : null}
              {msg.text}
            </div>
          </div>
        ))}
        {generating && <div className="text-[10px] text-slate-500 text-center">修改中...</div>}
      </div>
    </div>
  );
}
