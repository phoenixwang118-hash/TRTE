import React from 'react';
import SVGIcon from './svgicon';

export default function LeftRail({ activeTab, setActiveTab, onNewArchive, onOpenFile, onSave, onExport }) {
  const buttons = [
    { id: 'generate', icon: 'sparkles', label: '文生图', tab: 'generate' },
    { id: 'edit', icon: 'image', label: '图生图', tab: 'edit' },
    { id: 'vto', icon: 'user', label: 'AI虚拟模特', tab: 'vto' },
  ];

  return (
    <aside className="studio-rail shrink-0 flex flex-col items-stretch py-2 z-30">
      <button onClick={onNewArchive} className="studio-rail-button h-14 flex flex-col items-center justify-center gap-1 text-[9px]">新建</button>
      <button onClick={onOpenFile} className="studio-rail-button h-14 flex flex-col items-center justify-center gap-1 text-[9px]">打开</button>
      <button onClick={onSave} className="studio-rail-button h-14 flex flex-col items-center justify-center gap-1 text-[9px]">保存</button>
      <button onClick={onExport} className="studio-rail-button h-14 flex flex-col items-center justify-center gap-1 text-[9px]">导出</button>
      <div className="h-px bg-[#2b2e34] my-2 mx-3" />
      {buttons.map(b => (
        <button key={b.id} onClick={() => setActiveTab(b.tab)}
          className={`studio-rail-button h-14 flex flex-col items-center justify-center gap-1 text-[9px] ${activeTab === b.tab ? 'active' : ''}`}>
          {b.label}
        </button>
      ))}
    </aside>
  );
}
