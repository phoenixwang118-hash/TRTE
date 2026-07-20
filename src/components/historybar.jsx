import React, { useState } from 'react';
import SVGIcon from './svgicon';

export default function HistoryBar({ history, currentImage, activeIndex, setActiveIndex, savedModels, onSelectHistory, onChatEdit }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasContent = (history?.length || 0) > 0 || (savedModels?.length || 0) > 0;

  // 选中某张历史图作为智能编辑目标：先切到画板，再打开 ChatPanel
  const handleChatEdit = (e, item) => {
    e.stopPropagation();
    onSelectHistory?.(item);
    onChatEdit?.();
  };

  return (
    <div className="absolute top-0 left-0 bottom-0 z-40 border-r border-[#1f2230] bg-[#0d0f14]/95 backdrop-blur-md flex flex-col" style={{ width: '102px' }}>
      <div className="h-8 shrink-0 flex items-center justify-between gap-3 text-slate-500 border-b border-[#1f2230] px-3">
        <button onClick={()=>setCollapsed(!collapsed)} className="h-full flex items-center justify-center gap-2 hover:text-slate-200 transition-colors px-2 text-[8px] font-bold">
          <SVGIcon name="chevronDown" size={14} style={{transform:collapsed?'rotate(-90deg)':'none'}}/>
          历史与模型 ({(history?.length || 0) + (savedModels?.length || 0)})
        </button>
      </div>
      <div className="flex-1 px-1 pb-2 flex flex-col gap-1 overflow-y-auto items-center panel-scroll">
        {/* Quick edit panel */}
        {currentImage && (
          <button onClick={() => setActiveIndex?.(-1)} className="shrink-0">
            <div className="w-15 h-15 rounded-lg overflow-hidden border border-[#2a2d35] hover:border-[#6366f1] bg-[#10141d] flex items-center justify-center" style={{width:'60px',height:'60px'}}>
              <img src={currentImage} className="w-full h-full object-cover" alt="当前" />
            </div>
            <div className="text-[8px] text-slate-400 text-center mt-1">当前</div>
          </button>
        )}
        {history?.map((item, idx) => (
          <button key={item.id} onClick={() => { setActiveIndex?.(idx); onSelectHistory?.(item); }} className="shrink-0 relative group">
            <div className={`rounded-lg overflow-hidden cursor-pointer border-2 bg-[#10141d] flex items-center justify-center relative ${activeIndex===idx?"border-[#6366f1] ring-1 ring-[#6366f1]/50":"border-[#2a2d35] hover:border-[#6366f1]/50"}`} style={{width:'60px',height:'60px'}}>
              <img src={item.data} className="w-full h-full object-cover" alt={item.name || `生成 #${history.length - idx}`} />
            </div>
            <div className="text-[8px] text-slate-400 text-center mt-1 truncate w-20">
              {item.name || `#${history.length - idx}`}
            </div>
            {/* 智能编辑快捷按钮 */}
            {onChatEdit && (
              <span
                onClick={(e) => handleChatEdit(e, item)}
                className="absolute top-0 right-0 -mr-1 -mt-1 w-4 h-4 bg-[#6366f1] text-white text-[8px] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#4f46e5] transition-opacity z-10"
                title="智能编辑此图"
              >💬</span>
            )}
          </button>
        ))}
        {!hasContent && <div className="text-[10px] text-slate-600 text-center w-full">暂无历史记录，生成图像后开始</div>}
      </div>
    </div>
  );
}
