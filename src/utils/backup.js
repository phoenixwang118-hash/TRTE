/**
 * CoXoF Ai Studio — Backup & Restore
 * Workspace data persistence via JSON export/import
 *
 * 修复：恢复时只写入白名单内的 key，防止恶意备份注入任意 localStorage 条目
 */

const BACKUP_KEYS = [
  'vedaartBflCfg','vedaartBflDenoise','vedaartPromptAiProvider','vedaartGeminiApiKey',
  'vedaartBflApiKey',
  'vedaartGenerationDetail','vedaartGenerationSteps','vedaartTextCreativity','vedaartTextRealism',
  'vedaartTextSharpness','vedaartTextBackground','vedaartTextLighting','vedaartTextCameraAngle',
  'vedaartTextCommercialMaterial','vedaartDeepseekApiKey','vedaartDeepseekModel',
  'vedaartDoubaoApiKey','vedaartDoubaoModel','vedaartShowDeepseekNaming','vedaartSavedModels','vedaartProductArchives',
  'vedaartIdeogramApiKey'
];

// 白名单 Set（O(1) 查找）
const BACKUP_KEYS_SET = new Set(BACKUP_KEYS);

// 历史记录的特殊 key（允许恢复）
const HISTORY_KEY = '_history';

// 单个 value 最大 10MB
const MAX_VALUE_SIZE = 10 * 1024 * 1024;

export function exportWorkspaceBackup(generationHistory = []) {
  const data = { exportedAt: new Date().toISOString(), version: 2, keys: {} };
  BACKUP_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val !== null) data.keys[key] = val;
  });
  if (generationHistory.length > 0) {
    data.keys[HISTORY_KEY] = JSON.stringify(
      generationHistory.slice(0, 50).map(item => ({
        id: item.id, prompt: item.prompt, type: item.type,
        name: item.name, data: (item.data?.length < 500000) ? item.data : null, modelConfig: item.modelConfig
      }))
    );
  }
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `CoXoF_Backup_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(link); link.click();
  setTimeout(() => { link.remove(); URL.revokeObjectURL(url); }, 1000);
  localStorage.setItem('vedaartLastBackup', new Date().toISOString());
  return true;
}

export function restoreWorkspaceBackup(onRestored) {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result).replace(/^\uFEFF/, ''));
        if (!data?.keys || typeof data.keys !== 'object') throw new Error('Invalid backup format');
        let count = 0;
        Object.entries(data.keys).forEach(([k, v]) => {
          // 安全校验：只写入白名单内的 key
          if (k !== HISTORY_KEY && !BACKUP_KEYS_SET.has(k)) return;
          // 安全校验：value 必须是字符串且不超过最大尺寸
          if (typeof v !== 'string') v = JSON.stringify(v);
          if (v.length > MAX_VALUE_SIZE) return;
          localStorage.setItem(k, v);
          count++;
        });
        onRestored?.(count);
        setTimeout(() => location.reload(), 1000);
      } catch (err) {
        onRestored?.(0, err.message);
      }
      input.remove();
    };
    reader.readAsText(file, 'utf-8');
  };
  document.body.appendChild(input);
  input.click();
}

export function autoBackupCheck() {
  const last = localStorage.getItem('vedaartLastBackup');
  if (!last) return false;
  return (Date.now() - new Date(last).getTime()) / 3600000 < 24;
}
