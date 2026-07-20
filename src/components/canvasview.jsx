import React from 'react';
import SVGIcon from './svgicon';

export default function CanvasView({ canvasGrid, refImages, currentImage, history, activeImageIndex, batchImages, onRemoveImage, onSelectImage }) {
  const grid = canvasGrid || 1;

  if (batchImages?.length > 0) {
    const cols = Math.ceil(Math.sqrt(batchImages.length));
    return (
      <div className="w-full h-full overflow-auto p-2">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: '80%', margin: '0 auto' }}>
          {batchImages.map((img, i) => (
            <div key={img.id} className="relative group bg-[#0d0f14] rounded-lg overflow-hidden border border-[#1f232d] flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
              <img src={img.data} className="w-full h-full object-contain" alt={img.name || ''} />
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">#{i + 1}</div>
              {img.processed && !img.error && <div className="absolute top-1 left-1 bg-green-500/70 text-white text-[8px] px-1 rounded">已抠图</div>}
              {img.error && <div className="absolute top-1 left-1 bg-red-500/70 text-white text-[8px] px-1 rounded">失败</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentImage && refImages.filter(Boolean).length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
        <SVGIcon name="sparkles" size={32} />
        <div className="text-xs">输入提示词，点击生成</div>
      </div>
    );
  }

  if (grid > 1) {
    const items = [];
    if (currentImage) items.push({ data: currentImage, label: '当前', id: 'current' });
    history.slice(0, grid - 1).forEach((h, i) => {
      if (h?.data) items.push({ data: h.data, label: h.name || `历史#${i+1}`, id: h.id || `hist_${i}` });
    });
    while (items.length < grid) items.push(null);
    return (
      <div className={`w-full h-full grid gap-1 p-2 ${grid <= 2 ? 'grid-cols-1' : grid <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {items.map((item, i) => (
          <div key={i} className="relative group bg-[#0d0f14] rounded-lg overflow-hidden border border-[#1f232d] flex items-center justify-center">
            {item?.data ? (
              <>
                <img src={item.data} className="w-full h-full object-contain cursor-pointer" alt={item.label || ''} onClick={() => onSelectImage?.(item.data, i)} />
                <button onClick={() => onRemoveImage?.(item.id)} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white w-5 h-5 rounded text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">×</button>
              </>
            ) : (
              <div className="text-slate-600 text-xs">空</div>
            )}
            {item?.label && <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">{item.label}</div>}
          </div>
        ))}
      </div>
    );
  }

  if (currentImage) {
    return (
      <div className="w-full h-full flex items-center justify-center p-2">
        <img src={currentImage} className="max-w-full max-h-full object-contain rounded-lg" alt="当前图片" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
      <SVGIcon name="image" size={32} />
      <div className="text-xs">暂无图像</div>
    </div>
  );
}
