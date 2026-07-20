import React, { useState } from 'react';

export default function RefImageBar({ refImages, selectedRefIndex, onSelectRef, onDeleteRef, onAddSlot, refSlotCount, maxSlots }) {
  const [zoomedIdx, setZoomedIdx] = useState(-1);
  const activeRefs = refImages.slice(0, refSlotCount);
  
  if (zoomedIdx >= 0 && activeRefs[zoomedIdx]) {
    return (
      <div className="absolute inset-0 z-[300] bg-black/90 flex flex-col items-center justify-center" onClick={() => setZoomedIdx(-1)}>
        <button onClick={() => setZoomedIdx(-1)} className="absolute top-4 right-4 text-white text-2xl hover:text-red-400">&times;</button>
        <div className="flex gap-4 mb-4">
          <button onClick={(e)=>{e.stopPropagation();setZoomedIdx(p=>Math.max(0,p-1))}} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded" disabled={zoomedIdx<=0}>← 上一张</button>
          <button onClick={(e)=>{e.stopPropagation();setZoomedIdx(p=>Math.min(activeRefs.length-1,p+1))}} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded" disabled={zoomedIdx>=activeRefs.length-1}>下一张 →</button>
        </div>
        <img src={activeRefs[zoomedIdx]} className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg" alt={`参考图${zoomedIdx+1}`} onClick={e=>e.stopPropagation()}/>
        <div className="text-white text-sm mt-2">参考图{zoomedIdx+1}</div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-[#0d0f14] border-t border-[#1f2230] overflow-x-auto shrink-0">
      {activeRefs.map((img, i) => (
        <div key={i} className={`relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 cursor-pointer ${selectedRefIndex === i ? 'border-[#6366f1]' : 'border-transparent hover:border-[#6366f1]/50'}`}
          onClick={() => img ? setZoomedIdx(i) : onSelectRef(i)}>
          {img ? (
            <>
              <img src={img} className="w-full h-full object-cover" alt={`参考图${i+1}`} />
              <button onClick={(e) => { e.stopPropagation(); onDeleteRef(i); }}
                className="absolute top-0 right-0 bg-red-500/80 hover:bg-red-500 text-white w-4 h-4 rounded-bl text-[8px] flex items-center justify-center z-10">×</button>
              </>
          ) : (
            <div className="w-full h-full bg-[#141822] flex items-center justify-center text-[8px] text-slate-600">空</div>
          )}
        </div>
      ))}
      {refSlotCount < maxSlots && (
        <button onClick={onAddSlot} className="shrink-0 w-12 h-12 border-2 border-dashed border-[#2a2d35] hover:border-[#6366f1] rounded-lg flex items-center justify-center text-slate-500 hover:text-[#a5b4fc] text-lg">+</button>
      )}
    </div>
  );
}
