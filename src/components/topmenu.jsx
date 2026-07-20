import React, { useState } from 'react';
import SVGIcon from './svgicon';

const MENU_ITEMS = {
  文件: [
    { label: '新建平台', shortcut: 'Ctrl+N', action: 'new' },
    { label: '打开文件...', shortcut: 'Ctrl+O', action: 'open' },
    null,
    { label: '保存模型', shortcut: 'Ctrl+S', action: 'save' },
    { label: '导出PDF画册', action: 'exportPdf' },
    { label: '导出分图层PSD', action: 'exportPsd' },
    null,
    { label: '导出工作区备份', shortcut: 'Ctrl+B', action: 'backup' },
    { label: '从备份恢复...', action: 'restore' },
  ],
  编辑: [
    { label: '撤销历史', shortcut: 'Ctrl+Z', action: 'undo' },
    { label: '清空画布', action: 'clear' },
  ],
  视图: [
    { label: '切换专注模式', action: 'focus' },
    { label: '重置布局', action: 'resetLayout' },
  ],
};

export default function TopMenu({ onMenuAction, apiProvider, onToggleApiSettings }) {
  const [openMenu, setOpenMenu] = useState(null);

  return (
    <header className="studio-topbar shrink-0 flex items-center justify-between px-4 text-[15px]">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 font-black text-white tracking-wide text-lg">
          <div className="w-8 h-8 neon-cta flex items-center justify-center text-[13px] rounded font-black shadow-lg">CX</div>
          <span className="neon-text">CoXoF Ai Studio</span>
        </div>
        <nav className="main-menubar">
          {Object.entries(MENU_ITEMS).map(([name, items]) => (
            <div key={name} className="nav-item" onMouseEnter={() => openMenu && setOpenMenu(name)}>
              <button onClick={() => setOpenMenu(openMenu === name ? null : name)} className={`menu-trigger ${openMenu === name ? 'active' : ''}`}>{name}</button>
              {openMenu === name && (
                <div className="dropdown-menu">
                  {items.map((item, i) => item === null ? <div key={i} className="menu-sep" /> : (
                    <button key={i} onClick={() => { setOpenMenu(null); onMenuAction?.(item.action); }} className="menu-item" disabled={item.disabled}>
                      <span>{item.label}</span>
                      {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button onClick={onToggleApiSettings} className="menu-trigger">接口配置</button>
          <button onClick={() => onMenuAction?.('help')} className="menu-trigger">帮助</button>
        </nav>
      </div>
      <div className="flex items-center gap-3 text-slate-500">
        <span>{apiProvider?.toUpperCase() || 'GEMINI'}</span>
        <span className="w-2 h-2 rounded-full bg-[#06b6d4]"></span>
      </div>
    </header>
  );
}
