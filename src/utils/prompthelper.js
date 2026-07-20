/**
 * Prompt Helper — Positive→Negative mapping + DeepSeek enhancement
 *
 * 修复：
 *   1. DeepSeek 增强调用改走后端代理（不再从前端直连 api.deepseek.com）
 *   2. tokenize 排序提前为常量（不再每个 segment 内重复排序）
 */
import { DEEPSEEK_DIRECT_API } from '../api';

// Positive→Negative keyword mapping (one-to-one reversal)
const POS2NEG = {
  '写实': '卡通',
  '高清': '低分辨率',
  '细腻': '粗糙',
  '柔和': '生硬',
  '明亮': '昏暗',
  '温暖': '冷色',
  '自然': '人造',
  '清晰': '模糊',
  '精致': '简陋',
  '优雅': '粗俗',
  '华丽': '朴素',
  '立体': '扁平',
  '饱满': '干瘪',
  '通透': '浑浊',
  '光滑': '粗糙',
  '金属': '塑料',
  '玻璃': '磨砂',
  '丝绸': '麻布',
  '水晶': '树脂',
  '黄金': '黄铜',
  '珠宝': '廉价饰品',
  '花卉': '杂草',
  '玫瑰': '塑料花',
  '花瓣': '碎纸',
  '花束': '枯枝',
  '绿叶': '枯叶',
  '花园': '荒地',
  '春天': '深秋',
  '夏天': '寒冬',
  '白天': '夜晚',
  '阳光': '阴天',
  '室内': '户外杂乱',
  '工作室': '仓库',
  '白色背景': '杂乱背景',
  '纯色背景': '花哨背景',
  '对称': '不对称',
  '居中': '偏移',
  '极简': '繁复',
  '现代': '老旧',
  '豪华': '廉价',
  '专业': '业余',
  '特写': '远景模糊',
  '微距': '广角变形',
  '浅景深': '全景深杂乱',
  '逆光': '平光死板',
  '侧光': '顶光阴影',
  '暖光': '冷白刺眼',
  '柔光': '硬光阴影',
  '金色光线': '灰暗光线',
};

// Global negative base library (Chinese, always appended)
const GLOBAL_NEG = [
  '低质量', '模糊', '变形', '畸形',
  '水印', '文字', 'logo', '签名',
  '丑陋', '变异', '解剖错误', '多余肢体',
  '杂乱', '脏乱', '噪点', '伪影',
  '过曝', '欠曝', '刺眼光线',
  '像素化', '压缩痕迹', '画质损失',
  '残缺', '破损', '污渍',
];

// 预排序的关键字列表（按长度降序，只在模块加载时排序一次）
const SORTED_POS2NEG_KEYS = Object.keys(POS2NEG).sort((a, b) => b.length - a.length);

/**
 * Tokenize Chinese/English prompt into keywords
 */
function tokenize(prompt) {
  const words = [];
  // Split by punctuation and spaces
  const segments = prompt.split(/[，,。.\s、；;：:！!？?\n]+/).filter(Boolean);
  for (const seg of segments) {
    // Try multi-char keywords from POS2NEG (longest match first)
    let remaining = seg;
    for (const key of SORTED_POS2NEG_KEYS) {
      if (remaining.includes(key)) {
        words.push(key);
        remaining = remaining.replace(key, '');
      }
    }
  }
  return words;
}

/**
 * Generate negative prompt from positive prompt using mapping dictionary
 */
export function generateNegativePrompt(positivePrompt) {
  const tokens = tokenize(positivePrompt);
  const specific = new Set();

  for (const token of tokens) {
    if (POS2NEG[token]) {
      specific.add(POS2NEG[token]);
    }
  }

  // Merge specific negatives + global blacklist
  const allNegative = [...specific, ...GLOBAL_NEG];
  // Deduplicate
  return [...new Set(allNegative)].join(', ');
}

/**
 * Enhance prompt using DeepSeek（通过后端代理，不再从前端直连）
 *
 * @param {string} positivePrompt - 原始正面提示词
 * @param {string} deepKey - DeepSeek API Key（通过请求头传给后端）
 * @returns {Promise<{enhanced: string, negative: string} | null>}
 */
export async function enhancePromptWithDeepSeek(positivePrompt, deepKey) {
  const systemMsg = `你是AI图像生成提示词工程师。请优化这个图像生成提示词，并为它生成专属的负面提示词。只返回JSON，不要其他内容：{"prompt":"优化后的正面提示词（中文）","negative":"负面提示词关键词（中文，逗号分隔）"}`;

  try {
    const text = await DEEPSEEK_DIRECT_API([
      { role: 'system', content: systemMsg },
      { role: 'user', content: `请优化这个图像生成提示词："${positivePrompt}"。只返回JSON格式，正面和负面都用中文。` },
    ], deepKey, 'deepseek-chat');
    // 提取 JSON（可能被 ```json 包裹）
    const jsonMatch = (text || '').match(/\{[\s\S]*\}/);
    try {
      const json = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
      return {
        enhanced: json.prompt || positivePrompt,
        negative: json.negative || generateNegativePrompt(positivePrompt),
      };
    } catch {
      return {
        enhanced: text || positivePrompt,
        negative: generateNegativePrompt(positivePrompt),
      };
    }
  } catch (err) {
    console.warn('DeepSeek prompt enhancement failed, using local mapping', err.message);
    return null;
  }
}
