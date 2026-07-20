/**
 * DIY 工作流撤销 / 重做栈 Store
 *
 * 设计：
 *   - past: 历史快照栈（最新在最末）
 *   - future: 重做栈（undo 后可重做的快照）
 *   - 栈最大长度 50，超过时丢弃最旧的快照（FIFO）
 *
 * 约定：
 *   - push(snapshot) 在每次"可撤销操作"前调用，记录操作前的画布快照
 *   - undo() 弹出 past 顶部 → 推入 future，返回该快照供调用方恢复画布
 *   - redo() 弹出 future 顶部 → 推入 past，返回该快照供调用方恢复画布
 */
import { create } from 'zustand';

const MAX_HISTORY = 50;

export const useWorkflowHistoryStore = create((set, get) => ({
  // ── State ──
  past: [],
  future: [],

  // ── 派生 ──
  get canUndo() {
    return get().past.length > 0;
  },
  get canRedo() {
    return get().future.length > 0;
  },

  // ── Actions ──

  // 入栈：记录一个历史快照（操作前的画布状态）
  push(snapshot) {
    set((state) => {
      const past = [...state.past, snapshot];
      // 超过上限弹出最旧
      if (past.length > MAX_HISTORY) past.shift();
      // 任何新操作都会清空 future 栈
      return { past, future: [] };
    });
  },

  // 撤销：弹出 past 顶部 → 推入 future，返回该快照
  undo() {
    const { past } = get();
    if (past.length === 0) return null;
    const newPast = [...past];
    const snapshot = newPast.pop();
    set({ past: newPast, future: [snapshot, ...get().future] });
    return snapshot;
  },

  // 重做：弹出 future 顶部 → 推入 past，返回该快照
  redo() {
    const { future } = get();
    if (future.length === 0) return null;
    const newFuture = [...future];
    const snapshot = newFuture.shift();
    set({ future: newFuture, past: [...get().past, snapshot] });
    return snapshot;
  },

  // 清空历史
  clear() {
    set({ past: [], future: [] });
  },
}));
