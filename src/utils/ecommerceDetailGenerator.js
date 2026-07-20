/**
 * 电商详情页生成器 - 完整实现14个skill引擎
 *
 * 工作流：产品分析 → 配色 → 字体 → 模板规划 → 文案 → 布局 → 场景 → 图标 → 组件 → 自动布局 → 导出
 * 设计规则：一图一信息、强视觉层级、品牌一致性、移动优先、桌面兼容
 */

// ── 设计规则常量（来自 design-rules.md）──
export const DESIGN_RULES = {
  principles: ['一图一信息', '强视觉层级', '品牌一致性', '移动优先', '桌面兼容'],
  visualWeight: { hero: 50, title: 20, features: 15, desc: 10, decor: 5 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 40, '2xl': 60 },
  radius: { button: 8, card: 12, image: 8, label: 4, avatar: '50%' },
  shadow: {
    card: '0 2px 8px rgba(0,0,0,0.08)',
    floating: '0 4px 16px rgba(0,0,0,0.12)',
    modal: '0 8px 32px rgba(0,0,0,0.16)',
  },
  contrast: 4.5, // WCAG AA
  minFont: 14,
  minButtonHeight: 44,
  minImageWidth: 750,
  checklist: [
    '每张图只传达一个信息', '视觉层级清晰', '配色一致', '字体一致（最多2种）',
    '间距统一', '文字可读（对比度≥4.5:1）', '移动端可读（字号≥14px）',
    '按钮可点（高度≥44px）', '图片清晰', '无水印/无错别字',
  ],
};

// ── 1. Product Analyzer（产品分析器）──
const CATEGORY_MAP = {
  '服装': { type: 'apparel', scenes: ['室内穿搭', '户外街拍', '办公室', '咖啡厅', '海边'] },
  '3C数码': { type: 'electronics', scenes: ['桌面办公', '手持使用', '客厅娱乐', '户外携带'] },
  '家居': { type: 'home', scenes: ['客厅', '卧室', '厨房', '浴室', '阳台'] },
  '美妆': { type: 'beauty', scenes: ['梳妆台', '浴室', '户外', '特写上脸效果'] },
  '食品': { type: 'food', scenes: ['餐桌', '厨房', '户外野餐', '特写质感'] },
  '母婴': { type: 'baby', scenes: ['婴儿房', '客厅', '户外'] },
  '运动': { type: 'sports', scenes: ['健身房', '户外运动', '运动场'] },
  '户外': { type: 'outdoor', scenes: ['山林', '露营地', '徒步路线'] },
  '汽配': { type: 'auto', scenes: ['车库', '公路', '汽车内部'] },
};

const MATERIAL_KEYWORDS = {
  '金属': ['metal', 'steel', 'aluminum', '铁', '钢', '铝', '合金'],
  '塑料': ['plastic', 'abs', 'pc', '塑料', '树脂'],
  '木质': ['wood', 'wooden', 'oak', '木', '橡木', '胡桃木'],
  '棉麻': ['cotton', 'linen', '棉', '麻', '帆布'],
  '皮革': ['leather', 'pu', '皮', '牛皮', '羊皮'],
  '丝绸': ['silk', 'satin', '丝绸', '缎面'],
  '玻璃': ['glass', '玻璃'],
  '陶瓷': ['ceramic', '陶瓷', '瓷'],
};

const STYLE_KEYWORDS = {
  '现代': ['modern', 'contemporary', '现代'],
  '复古': ['vintage', 'retro', '复古', '怀旧'],
  '极简': ['minimal', 'minimalist', '极简', '简约'],
  '奢华': ['luxury', 'premium', 'luxurious', '奢华', '高端'],
  '运动': ['sport', 'athletic', '运动', '活力'],
  '可爱': ['cute', 'kawaii', '可爱', '萌'],
};

export function analyzeProduct(productName, category, description, keywords, style) {
  const cat = CATEGORY_MAP[category] || { type: 'general', scenes: ['生活场景'] };
  const desc = description || '';
  const allText = (desc + ' ' + (keywords || []).join(' ')).toLowerCase();

  // 材质识别
  let material = '待识别';
  for (const [m, kws] of Object.entries(MATERIAL_KEYWORDS)) {
    if (kws.some(k => allText.includes(k.toLowerCase()))) { material = m; break; }
  }

  // 风格判断
  let detectedStyle = style || '现代';
  if (!style) {
    for (const [s, kws] of Object.entries(STYLE_KEYWORDS)) {
      if (kws.some(k => allText.includes(k.toLowerCase()))) { detectedStyle = s; break; }
    }
  }

  // 卖点提取（3-5个，按逗号/句号分隔）
  const sellingPoints = desc.split(/[,，。.；;]/).map(s => s.trim()).filter(Boolean).slice(0, 5);
  const finalPoints = sellingPoints.length > 0 ? sellingPoints : ['高品质', '耐用', '实用'];

  // 尺寸规格
  const sizeMatch = desc.match(/(\d+(\.\d+)?\s*(cm|cm|英寸|inch|mm|米|m)\s*[x×*]\s*\d+)/i);
  const dimensions = sizeMatch ? sizeMatch[1] : '';

  return {
    category: cat.type,
    productType: category || '通用',
    material,
    style: detectedStyle,
    sellingPoints: finalPoints,
    dimensions,
    useCases: cat.scenes,
    keywords: keywords || [],
    productName: productName || '产品',
  };
}

// ── 2. Color Engine（配色引擎）──
const COLOR_PALETTES = {
  '现代': { primary: '#1A1A1A', secondary: '#F5F5F5', accent: '#FF6B35', background: '#FFFFFF', textPrimary: '#1A1A1A', textSecondary: '#555555', textMuted: '#888888', success: '#4CAF50', warning: '#FF9800', error: '#F44336' },
  '极简': { primary: '#000000', secondary: '#E0E0E0', accent: '#FF6B35', background: '#FFFFFF', textPrimary: '#000000', textSecondary: '#666666', textMuted: '#999999', success: '#4CAF50', warning: '#FF9800', error: '#F44336' },
  '奢华': { primary: '#1A1A2E', secondary: '#16213E', accent: '#D4AF37', background: '#FFFFFF', textPrimary: '#1A1A2E', textSecondary: '#444444', textMuted: '#777777', success: '#4CAF50', warning: '#FF9800', error: '#F44336' },
  '科技': { primary: '#0066CC', secondary: '#003366', accent: '#00C6FF', background: '#F8FAFC', textPrimary: '#1A1A1A', textSecondary: '#555555', textMuted: '#888888', success: '#4CAF50', warning: '#FF9800', error: '#F44336' },
  '运动': { primary: '#FF6B35', secondary: '#004E89', accent: '#FFD23F', background: '#FFFFFF', textPrimary: '#1A1A1A', textSecondary: '#555555', textMuted: '#888888', success: '#4CAF50', warning: '#FF9800', error: '#F44336' },
  '温馨': { primary: '#8B4513', secondary: '#D2691E', accent: '#FF8C00', background: '#FFFAF0', textPrimary: '#3E2723', textSecondary: '#6D4C41', textMuted: '#A1887F', success: '#4CAF50', warning: '#FF9800', error: '#F44336' },
  '复古': { primary: '#5D4037', secondary: '#8D6E63', accent: '#FF7043', background: '#FAF4E6', textPrimary: '#3E2723', textSecondary: '#5D4037', textMuted: '#8D6E63', success: '#4CAF50', warning: '#FF9800', error: '#F44336' },
  '可爱': { primary: '#F48FB1', secondary: '#CE93D8', accent: '#FFAB91', background: '#FFF9F9', textPrimary: '#4A2C38', textSecondary: '#7A5263', textMuted: '#A88896', success: '#4CAF50', warning: '#FF9800', error: '#F44336' },
  '自然': { primary: '#2C5F2D', secondary: '#97BC62', accent: '#FF6B35', background: '#FAFAF5', textPrimary: '#1A1A1A', textSecondary: '#555555', textMuted: '#888888', success: '#4CAF50', warning: '#FF9800', error: '#F44336' },
};

export function generateColorScheme(style, category, platform) {
  const palette = COLOR_PALETTES[style] || COLOR_PALETTES['现代'];
  // 亚马逊主图必须白底
  if (platform === 'amazon') palette.background = '#FFFFFF';
  return palette;
}

// ── 3. Typography Engine（字体引擎）──
const FONT_LIBRARY = {
  '现代': { title: 'Montserrat', body: 'Open Sans' },
  '奢华': { title: 'Playfair Display', body: 'Lora' },
  '极简': { title: 'Helvetica Neue', body: 'Helvetica Neue' },
  '科技': { title: 'Roboto', body: 'Roboto' },
  '复古': { title: 'Bebas Neue', body: 'Crimson Text' },
  '运动': { title: 'Oswald', body: 'Source Sans Pro' },
  '可爱': { title: 'Quicksand', body: 'Nunito' },
  '温馨': { title: 'Poppins', body: 'Nunito' },
  '自然': { title: 'Poppins', body: 'Open Sans' },
};

const PLATFORM_FONTS = {
  amazon: { title: 'Arial Black', body: 'Arial' },
  tiktok: { title: 'Proxima Nova', body: 'Proxima Nova' },
  xiaohongshu: { title: 'PingFang SC', body: 'PingFang SC' },
  taobao: { title: 'PingFang SC', body: 'PingFang SC' },
  jd: { title: 'PingFang SC', body: 'PingFang SC' },
};

export function generateTypography(style, platform, colors) {
  const lib = FONT_LIBRARY[style] || FONT_LIBRARY['现代'];
  const pf = PLATFORM_FONTS[platform];
  const titleFont = pf ? pf.title : lib.title;
  const bodyFont = pf ? pf.body : lib.body;
  const tc = colors || {};
  return {
    h1: { font: titleFont, weight: 800, size: '48px', lineHeight: 1.2, color: tc.textPrimary || '#1A1A1A' },
    h2: { font: titleFont, weight: 700, size: '32px', lineHeight: 1.3, color: tc.textPrimary || '#333333' },
    h3: { font: titleFont, weight: 600, size: '22px', lineHeight: 1.4, color: tc.textSecondary || '#555555' },
    body: { font: bodyFont, weight: 400, size: '16px', lineHeight: 1.6, color: tc.textSecondary || '#555555' },
    caption: { font: bodyFont, weight: 400, size: '12px', lineHeight: 1.4, color: tc.textMuted || '#888888' },
    button: { font: titleFont, weight: 700, size: '14px', lineHeight: 1.0, color: '#FFFFFF' },
    label: { font: bodyFont, weight: 600, size: '11px', lineHeight: 1.2, color: tc.textSecondary || '#555555' },
  };
}

// ── 4. Template Planner（模板规划器）──
const CATEGORY_SEQUENCES = {
  apparel: ['hero', 'features', 'details', 'size', 'lifestyle', 'package'],
  electronics: ['hero', 'features', 'specifications', 'details', 'installation', 'lifestyle', 'package'],
  home: ['hero', 'features', 'materials', 'details', 'lifestyle', 'size', 'package'],
  beauty: ['hero', 'features', 'ingredients', 'details', 'lifestyle', 'brand'],
  food: ['hero', 'features', 'ingredients', 'nutrition', 'lifestyle', 'package', 'brand'],
  baby: ['hero', 'features', 'materials', 'details', 'lifestyle', 'safety', 'package'],
  sports: ['hero', 'features', 'materials', 'details', 'lifestyle', 'size', 'package'],
  outdoor: ['hero', 'features', 'materials', 'details', 'lifestyle', 'package'],
  auto: ['hero', 'features', 'materials', 'details', 'installation', 'lifestyle', 'package'],
  general: ['hero', 'features', 'details', 'lifestyle', 'package'],
};

const MODULE_TITLES = {
  hero: '主图', features: '核心卖点', materials: '材质工艺', details: '细节展示',
  size: '尺寸指南', lifestyle: '生活场景', installation: '安装说明', package: '包装内容',
  specifications: '技术参数', ingredients: '成分信息', nutrition: '营养信息',
  safety: '安全信息', brand: '品牌故事', faq: '常见问题', comparison: '竞品对比', reviews: '用户评价',
};

const PLATFORM_LIMITS = {
  amazon: 8, shopify: 10, tiktok: 9, xiaohongshu: 9, taobao: 5,
  jd: 5, pdd: 10, aliexpress: 6, facebook: 8, instagram: 9, crossborder: 8,
};

export function planTemplate(category, platform) {
  const seq = CATEGORY_SEQUENCES[category] || CATEGORY_SEQUENCES.general;
  const max = PLATFORM_LIMITS[platform] || 8;
  return seq.slice(0, max).map((type, i) => ({
    index: i + 1, type, title: MODULE_TITLES[type] || type,
  }));
}

// ── 5. Layout Engine（布局引擎）──
const LAYOUT_MAP = {
  hero: 'hero-center', features: 'grid', materials: 'split', details: 'magazine',
  size: 'specification', lifestyle: 'lifestyle', installation: 'timeline',
  package: 'grid', specifications: 'specification', ingredients: 'infographic',
  nutrition: 'infographic', safety: 'infographic', brand: 'hero-left',
  faq: 'grid', comparison: 'comparison', reviews: 'grid',
};

// 布局 zones 定义（坐标为相对比例 0-1）
const LAYOUT_ZONES = {
  'hero-center': [
    { name: 'title', type: 'text', x: 0.1, y: 0.05, w: 0.8, h: 0.1 },
    { name: 'product', type: 'image', x: 0.25, y: 0.2, w: 0.5, h: 0.55 },
    { name: 'cta', type: 'button', x: 0.35, y: 0.82, w: 0.3, h: 0.08 },
  ],
  'hero-left': [
    { name: 'product', type: 'image', x: 0.05, y: 0.15, w: 0.5, h: 0.7 },
    { name: 'title', type: 'text', x: 0.6, y: 0.2, w: 0.35, h: 0.15 },
    { name: 'desc', type: 'text', x: 0.6, y: 0.4, w: 0.35, h: 0.3 },
    { name: 'cta', type: 'button', x: 0.6, y: 0.75, w: 0.25, h: 0.08 },
  ],
  'grid': [
    { name: 'title', type: 'text', x: 0.1, y: 0.05, w: 0.8, h: 0.1 },
    { name: 'card1', type: 'card', x: 0.05, y: 0.2, w: 0.42, h: 0.35 },
    { name: 'card2', type: 'card', x: 0.53, y: 0.2, w: 0.42, h: 0.35 },
    { name: 'card3', type: 'card', x: 0.05, y: 0.6, w: 0.42, h: 0.35 },
    { name: 'card4', type: 'card', x: 0.53, y: 0.6, w: 0.42, h: 0.35 },
  ],
  'split': [
    { name: 'left', type: 'image', x: 0.05, y: 0.1, w: 0.45, h: 0.8 },
    { name: 'right', type: 'text', x: 0.55, y: 0.2, w: 0.4, h: 0.6 },
  ],
  'magazine': [
    { name: 'main', type: 'image', x: 0.05, y: 0.05, w: 0.6, h: 0.6 },
    { name: 'sub1', type: 'image', x: 0.7, y: 0.05, w: 0.25, h: 0.28 },
    { name: 'sub2', type: 'image', x: 0.7, y: 0.38, w: 0.25, h: 0.28 },
    { name: 'desc', type: 'text', x: 0.05, y: 0.7, w: 0.9, h: 0.25 },
  ],
  'specification': [
    { name: 'title', type: 'text', x: 0.1, y: 0.05, w: 0.8, h: 0.1 },
    { name: 'table', type: 'table', x: 0.1, y: 0.2, w: 0.8, h: 0.7 },
  ],
  'lifestyle': [
    { name: 'bg', type: 'image', x: 0, y: 0, w: 1, h: 1 },
    { name: 'title', type: 'text', x: 0.1, y: 0.8, w: 0.8, h: 0.1 },
    { name: 'desc', type: 'text', x: 0.1, y: 0.9, w: 0.8, h: 0.08 },
  ],
  'timeline': [
    { name: 'title', type: 'text', x: 0.1, y: 0.05, w: 0.8, h: 0.1 },
    { name: 'step1', type: 'card', x: 0.05, y: 0.2, w: 0.28, h: 0.7 },
    { name: 'step2', type: 'card', x: 0.36, y: 0.2, w: 0.28, h: 0.7 },
    { name: 'step3', type: 'card', x: 0.67, y: 0.2, w: 0.28, h: 0.7 },
  ],
  'infographic': [
    { name: 'title', type: 'text', x: 0.1, y: 0.05, w: 0.8, h: 0.1 },
    { name: 'icon1', type: 'icon', x: 0.1, y: 0.25, w: 0.2, h: 0.2 },
    { name: 'icon2', type: 'icon', x: 0.4, y: 0.25, w: 0.2, h: 0.2 },
    { name: 'icon3', type: 'icon', x: 0.7, y: 0.25, w: 0.2, h: 0.2 },
    { name: 'data', type: 'text', x: 0.1, y: 0.55, w: 0.8, h: 0.35 },
  ],
  'comparison': [
    { name: 'title', type: 'text', x: 0.1, y: 0.05, w: 0.8, h: 0.1 },
    { name: 'left', type: 'card', x: 0.05, y: 0.2, w: 0.42, h: 0.7 },
    { name: 'right', type: 'card', x: 0.53, y: 0.2, w: 0.42, h: 0.7 },
  ],
};

export function selectLayout(moduleType) {
  return LAYOUT_MAP[moduleType] || 'hero-center';
}

export function getLayoutZones(layoutType) {
  return LAYOUT_ZONES[layoutType] || LAYOUT_ZONES['hero-center'];
}

// ── 6. Copywriting Engine（文案引擎）──
export function generateCopy(productName, analysis, platform, language = 'en') {
  const points = analysis.sellingPoints || [];
  const isEn = language === 'en';
  const material = analysis.material !== '待识别' ? analysis.material : '';
  const styleMap = {
    'amazon': { tone: '功能导向', seo: 'high', titleLen: 50 },
    'shopify': { tone: '品牌导向', seo: 'mid', titleLen: 100 },
    'tiktok': { tone: '情绪导向', seo: 'low', titleLen: 30 },
    'xiaohongshu': { tone: '生活化', seo: 'mid', titleLen: 60 },
  };
  const ps = styleMap[platform] || styleMap.amazon;

  const features = points.slice(0, 5).map((p, i) => ({
    title: isEn ? `Feature ${i + 1}` : `卖点${i + 1}`,
    desc: isEn ? p : p,
  }));

  return {
    hero: {
      headline: isEn ? (productName || 'Premium Product') : (productName || '优质产品'),
      subheadline: isEn ? 'Quality You Can Trust' : '品质之选 值得信赖',
    },
    features,
    benefits: points.slice(0, 3).map((p, i) => ({
      title: isEn ? `Benefit ${i + 1}` : `利益点${i + 1}`,
      desc: isEn ? `Experience ${p}` : `享受${p}`,
    })),
    cta: isEn ? 'Shop Now' : '立即购买',
    ctaUrgent: isEn ? 'Limited Time Offer' : '限时优惠',
    faq: [
      { q: isEn ? 'What materials are used?' : '产品用什么材质？', a: isEn ? `Premium ${material || 'quality'} materials` : `优质${material || '材料'}` },
      { q: isEn ? 'What sizes are available?' : '有哪些尺寸？', a: isEn ? 'Multiple sizes available' : '多种尺寸可选' },
      { q: isEn ? 'How to use?' : '如何使用？', a: isEn ? 'See instruction manual' : '请参阅使用说明' },
      { q: isEn ? 'Return policy?' : '售后政策？', a: isEn ? '30-day return guarantee' : '30天退货保障' },
    ],
    brandStory: isEn ? 'Committed to quality and innovation, delivering premium products to enhance your life.' : '致力于品质与创新，为您提供优质产品，提升生活品质。',
    platform: ps,
  };
}

// ── 7. Scene Generator（场景生成器）+ Prompt Library（提示词库）──
const STYLE_MODIFIERS = {
  '现代': 'modern, clean, elegant',
  '极简': 'minimal, clean, simple, elegant',
  '奢华': 'luxurious, premium, elegant, sophisticated',
  '科技': 'futuristic, tech, modern, sleek',
  '运动': 'vibrant, energetic, dynamic, bold',
  '温馨': 'warm, cozy, inviting, comfortable',
  '复古': 'vintage, retro, classic, nostalgic',
  '可爱': 'cute, playful, soft, adorable',
  '自然': 'natural, organic, eco-friendly, earthy',
};

const SCENE_TYPE_MAP = {
  hero: 'studio', features: 'studio', materials: 'detail', details: 'detail',
  lifestyle: 'lifestyle', package: 'studio', brand: 'lifestyle',
  size: 'studio', specifications: 'studio', installation: 'in-use',
  ingredients: 'detail', nutrition: 'detail', safety: 'studio', reviews: 'lifestyle',
};

export function generateScenePrompt(moduleType, productName, analysis, platform, style) {
  const product = productName || 'product';
  const scenes = analysis.useCases || ['modern studio'];
  const scene = scenes[0] || 'modern studio';
  const scene2 = scenes[1] || scenes[0] || 'clean background';
  const material = analysis.material !== '待识别' ? analysis.material : '';
  const styleMod = STYLE_MODIFIERS[style] || STYLE_MODIFIERS['现代'];
  const sellingPoints = (analysis.sellingPoints || []).slice(0, 3);

  // 每个模块类型用高度差异化的视觉描述，确保生成结果各不相同
  const prompts = {
    hero: `Hero product shot of ${product}, pure white seamless background, centered composition, soft diffused studio lighting from above, product fills 80% of frame, sharp focus, professional e-commerce main image, ${styleMod}, 8K photorealistic`,
    features: `Infographic style product showcase of ${product}, clean light gray background, ${sellingPoints.length} feature callout zones arranged around the product with thin connecting lines, modern flat design aesthetic, ${sellingPoints.map(s=>s).join(', ')} highlighted, brand colors accent, professional layout, ${styleMod}`,
    lifestyle: `Lifestyle photography of ${product} being used in ${scene}, warm natural sunlight streaming through window, cozy realistic environment, shallow depth of field with bokeh background, person interacting with product, editorial magazine style, ${styleMod}, 8K photorealistic`,
    materials: `Extreme macro close-up of ${product} ${material||''} surface texture, filling entire frame, showing fiber weave grain or material detail, dramatic side lighting revealing texture depth, studio macro photography, sharp focus on material quality, 8K ultra detailed`,
    details: `Close-up detail shot of ${product} focusing on craftsmanship elements like stitching seams buttons zippers or joints, shallow depth of field with blurred background, professional product photography, warm accent lighting, ${styleMod}, 8K`,
    package: `Flat lay unboxing view of ${product} packaging, all contents neatly arranged on clean white surface, gift box opened showing interior, professional overhead product photography, organized composition, ${styleMod}, 8K`,
    brand: `Cinematic brand story image featuring ${product} in ${scene2}, dramatic moody lighting with rim light, editorial photography style, atmospheric depth, warm tones, ${styleMod}, 8K cinematic`,
    size: `Technical size guide diagram for ${product}, clean white background, product shown with dimension arrows and measurements, minimalist infographic style, precise engineering drawing aesthetic, professional specification layout, 8K`,
    specifications: `Technical specifications infographic for ${product}, dark background with glowing accent lines, data visualization style, parameter labels arranged in grid, modern tech aesthetic, ${styleMod}, 8K`,
    installation: `Step-by-step installation guide for ${product}, 3-panel sequential layout showing process from left to right, clean instructional design, numbered steps with arrows, professional technical illustration style, 8K`,
    ingredients: `Ingredients showcase for ${product}, overhead shot of raw materials arranged artistically around product, natural earthy tones, soft natural lighting, organic aesthetic, ${styleMod}, 8K`,
    nutrition: `Nutrition facts visual for ${product}, clean infographic layout with data charts and icons, professional health-oriented design, green and white color scheme, 8K`,
    safety: `Safety information display for ${product}, clean professional layout with warning icons and certification badges, regulatory compliance aesthetic, clear readable typography, 8K`,
    reviews: `Social proof collage for ${product}, lifestyle vignettes showing happy users, star rating graphics, testimonial quote overlays, warm inviting atmosphere, ${styleMod}, 8K`,
    comparison: `Side-by-side comparison layout for ${product} vs alternatives, split screen design, before/after or product A vs B visual, clean dividing line, professional comparison chart aesthetic, 8K`,
  };
  return prompts[moduleType] || prompts.hero;
}

export function generateNegativePrompt(category) {
  const base = 'blurry, distorted, watermark, text, low quality, deformed, pixelated, compressed, artifact, noise, grain';
  const person = 'deformed hands, extra fingers, missing limbs, bad anatomy, unnatural pose, distorted face';
  const product = 'damaged, scratched, dirty, stained, faded color, wrong proportions, misaligned, crooked';
  const needsPerson = ['apparel', 'beauty'].includes(category);
  return needsPerson ? `${base}, ${person}, ${product}` : `${base}, ${product}`;
}

// ── 8. Icon Engine（图标引擎）──
const ICON_LIBRARY = {
  // 材质类
  material: {
    '金属': { name: 'hexagon', emoji: '⬢', style: 'outline' },
    '塑料': { name: 'circle', emoji: '○', style: 'outline' },
    '木质': { name: 'ruler', emoji: '📐', style: 'line' },
    '棉麻': { name: 'leaf', emoji: '🌿', style: 'line' },
    '皮革': { name: 'diamond', emoji: '◆', style: 'line' },
    '丝绸': { name: 'star', emoji: '✦', style: 'line' },
    '玻璃': { name: 'droplet', emoji: '💧', style: 'outline' },
    '陶瓷': { name: 'circle', emoji: '⚪', style: 'solid' },
  },
  // 功能类
  feature: [
    { kw: 'waterproof', name: 'droplet', emoji: '💧', style: 'line' },
    { kw: 'breathable', name: 'wind', emoji: '🌬️', style: 'line' },
    { kw: 'lightweight', name: 'feather', emoji: '🪶', style: 'line' },
    { kw: 'durable', name: 'shield', emoji: '🛡️', style: 'line' },
    { kw: 'portable', name: 'package', emoji: '📦', style: 'line' },
    { kw: 'rechargeable', name: 'battery', emoji: '🔋', style: 'line' },
    { kw: 'wireless', name: 'wifi', emoji: '📶', style: 'line' },
    { kw: 'noise', name: 'volume', emoji: '🔊', style: 'line' },
  ],
  // 体验类
  experience: [
    { kw: 'comfortable', name: 'cloud', emoji: '☁️', style: 'line' },
    { kw: 'eco', name: 'sprout', emoji: '🌱', style: 'line' },
    { kw: 'safe', name: 'check', emoji: '✓', style: 'line' },
    { kw: 'fast', name: 'zap', emoji: '⚡', style: 'line' },
    { kw: 'premium', name: 'crown', emoji: '👑', style: 'line' },
    { kw: 'new', name: 'sparkles', emoji: '✨', style: 'line' },
  ],
  // 使用类
  usage: [
    { kw: 'indoor', name: 'home', emoji: '🏠', style: 'line' },
    { kw: 'outdoor', name: 'mountain', emoji: '🏔️', style: 'line' },
    { kw: 'travel', name: 'plane', emoji: '✈️', style: 'line' },
    { kw: 'sport', name: 'runner', emoji: '🏃', style: 'line' },
    { kw: 'kitchen', name: 'pan', emoji: '🍳', style: 'line' },
    { kw: 'bathroom', name: 'shower', emoji: '🚿', style: 'line' },
  ],
};

export function recommendIcons(analysis) {
  const icons = [];
  const colors = { primary: '#2C5F2D' };

  // 按材质推荐
  if (analysis.material && ICON_LIBRARY.material[analysis.material]) {
    icons.push({ ...ICON_LIBRARY.material[analysis.material], keyword: analysis.material, color: colors.primary });
  }

  // 按卖点关键词匹配功能/体验类
  const allText = (analysis.sellingPoints || []).join(' ').toLowerCase();
  ['feature', 'experience', 'usage'].forEach(cat => {
    ICON_LIBRARY[cat].forEach(ic => {
      if (allText.includes(ic.kw)) {
        icons.push({ ...ic, keyword: ic.kw, color: colors.primary });
      }
    });
  });

  // 按类别补充默认图标
  const categoryDefaults = {
    apparel: [{ name: 'tshirt', emoji: '👕', style: 'line' }, { name: 'ruler', emoji: '📏', style: 'line' }],
    electronics: [{ name: 'cpu', emoji: '🔌', style: 'outline' }, { name: 'battery', emoji: '🔋', style: 'outline' }],
    home: [{ name: 'home', emoji: '🏠', style: 'line' }, { name: 'heart', emoji: '❤️', style: 'line' }],
    beauty: [{ name: 'droplet', emoji: '💧', style: 'line' }, { name: 'flower', emoji: '🌸', style: 'line' }],
    food: [{ name: 'utensils', emoji: '🍴', style: 'line' }, { name: 'leaf', emoji: '🌿', style: 'line' }],
    baby: [{ name: 'baby', emoji: '👶', style: 'line' }, { name: 'shield', emoji: '🛡️', style: 'line' }],
    sports: [{ name: 'activity', emoji: '⚽', style: 'line' }, { name: 'flame', emoji: '🔥', style: 'line' }],
  };
  const defaults = categoryDefaults[analysis.category] || [{ name: 'star', emoji: '⭐', style: 'line' }, { name: 'check', emoji: '✓', style: 'line' }];
  defaults.forEach(d => {
    if (!icons.find(i => i.name === d.name)) icons.push({ ...d, keyword: '', color: colors.primary });
  });

  return icons.slice(0, 8);
}

// ── 9. Component Engine（组件引擎）──
export function generateComponents(moduleType, layout, copy, analysis, icons, colors) {
  const c = colors || {};
  const components = [];

  // 文字类组件
  if (copy.hero) {
    components.push({ type: 'title', props: { text: copy.hero.headline, level: 'h1', align: 'center', color: c.textPrimary } });
    components.push({ type: 'subtitle', props: { text: copy.hero.subheadline, align: 'center', color: c.textSecondary } });
  }

  // 卡片类组件（卖点卡片）
  if (copy.features) {
    copy.features.forEach((f, i) => {
      const icon = icons?.[i] || { emoji: '⭐', name: 'star' };
      components.push({
        type: 'feature-card',
        props: { icon: icon.emoji, iconColor: c.primary, title: f.title, desc: f.desc, bgColor: c.secondary },
      });
    });
  }

  // CTA 按钮
  components.push({ type: 'cta-button', props: { text: copy.cta, style: 'primary', bgColor: c.accent, color: '#FFFFFF' } });

  // 按模块类型补充组件
  if (moduleType === 'specifications' || moduleType === 'size') {
    components.push({
      type: 'parameter-table',
      props: {
        rows: [
          { label: '材质', value: analysis.material || '优质材料' },
          { label: '类别', value: analysis.productType },
          { label: '尺寸', value: analysis.dimensions || '多种规格' },
        ],
      },
    });
  }
  if (moduleType === 'faq' && copy.faq) {
    components.push({ type: 'faq-list', props: { items: copy.faq } });
  }
  if (moduleType === 'brand') {
    components.push({ type: 'body-text', props: { text: copy.brandStory, size: '16px', color: c.textSecondary } });
  }

  // 图标组
  if (icons && icons.length > 0) {
    components.push({ type: 'icon-group', props: { icons: icons.map(i => i.emoji), cols: 4 } });
  }

  // 徽章
  components.push({ type: 'badge', props: { text: analysis.style || '现代', color: c.accent, position: 'top-right' } });

  return components;
}

// ── 10. Auto Layout Engine（自动布局引擎）──
const PLATFORM_CANVAS = {
  amazon: { w: 2000, h: 2000, ratio: '1:1' },
  shopify: { w: 1080, h: 1350, ratio: '4:5' },
  tiktok: { w: 1080, h: 1920, ratio: '9:16' },
  xiaohongshu: { w: 1080, h: 1440, ratio: '3:4' },
  taobao: { w: 800, h: 800, ratio: '1:1' },
  jd: { w: 800, h: 800, ratio: '1:1' },
  pdd: { w: 750, h: 750, ratio: '1:1' },
  aliexpress: { w: 800, h: 800, ratio: '1:1' },
  facebook: { w: 1200, h: 1200, ratio: '1:1' },
  instagram: { w: 1080, h: 1080, ratio: '1:1' },
  crossborder: { w: 2000, h: 2000, ratio: '1:1' },
};

export function autoLayout(layout, components, canvas, colors) {
  const zones = getLayoutZones(layout);
  const W = canvas.w, H = canvas.h;
  const elements = [];

  zones.forEach((zone, i) => {
    const comp = components[i] || components[0];
    if (!comp) return;
    elements.push({
      id: zone.name,
      type: zone.type,
      componentType: comp.type,
      x: Math.round(zone.x * W),
      y: Math.round(zone.y * H),
      w: Math.round(zone.w * W),
      h: Math.round(zone.h * H),
      z: zone.type === 'button' ? 10 : zone.type === 'text' ? 5 : 1,
      props: comp.props,
    });
  });

  return {
    canvas: { width: W, height: H, background: colors?.background || '#FFFFFF' },
    elements,
    spacing: DESIGN_RULES.spacing,
    safeAreas: { top: 80, bottom: 100, left: 40, right: 40 },
  };
}

// ── 11. Export Engine（导出引擎）──
export function getPlatformSpecs(platform) {
  const canvas = PLATFORM_CANVAS[platform] || PLATFORM_CANVAS.amazon;
  const specs = {
    amazon: { ...canvas, maxImages: 8, format: 'jpeg', bg: '#FFFFFF', mainBgWhite: true, fileSize: '<10MB', colorSpace: 'sRGB', rules: ['主图白底RGB255,255,255', '主图产品占比≥85%', '不得含文字/水印/Logo', '副图可含文字和场景'] },
    shopify: { ...canvas, maxImages: 10, format: 'jpeg', bg: 'free', fileSize: '<5MB' },
    tiktok: { ...canvas, maxImages: 9, format: 'jpeg', bg: 'free', fileSize: '<5MB', rules: ['竖版优先9:16', '前3秒抓眼球', '大字标题'] },
    xiaohongshu: { ...canvas, maxImages: 9, format: 'jpeg', bg: 'free', fileSize: '<10MB', rules: ['生活化真实感', '少文字多图片', '美感优先'] },
    taobao: { ...canvas, maxImages: 5, format: 'jpeg', bg: 'free', fileSize: '<3MB' },
    jd: { ...canvas, maxImages: 5, format: 'jpeg', bg: 'free', fileSize: '<3MB' },
    pdd: { ...canvas, maxImages: 10, format: 'jpeg', bg: 'free', fileSize: '<1MB' },
    aliexpress: { ...canvas, maxImages: 6, format: 'jpeg', bg: 'free', fileSize: '<5MB' },
    facebook: { ...canvas, maxImages: 8, format: 'jpeg', bg: 'free', fileSize: '<5MB' },
    instagram: { ...canvas, maxImages: 9, format: 'jpeg', bg: 'free', fileSize: '<8MB' },
    crossborder: { ...canvas, maxImages: 8, format: 'jpeg', bg: '#FFFFFF', fileSize: '<10MB' },
  };
  return specs[platform] || specs.amazon;
}

export function generateExportPlan(platform, pages) {
  const specs = getPlatformSpecs(platform);
  return pages.map((p, i) => ({
    name: `${platform}_${p.type}_${String(i + 1).padStart(2, '0')}.${specs.format}`,
    format: specs.format,
    module: p.type,
    width: specs.w,
    height: specs.h,
  }));
}

// ── 12. 主调度器：生成完整详情页方案 ──
export function generateDetailPlan(productName, category, description, keywords, platform, style) {
  // Step 1: 产品分析
  const analysis = analyzeProduct(productName, category, description, keywords, style);
  // Step 2: 配色方案
  const colors = generateColorScheme(analysis.style, analysis.category, platform);
  // Step 3: 字体方案
  const typography = generateTypography(analysis.style, platform, colors);
  // Step 4: 模板规划
  const sequence = planTemplate(analysis.category, platform);
  // Step 5: 文案
  const copy = generateCopy(productName, analysis, platform, 'en');
  // Step 6: 图标
  const icons = recommendIcons(analysis);
  // Step 7: 平台规格
  const specs = getPlatformSpecs(platform);
  // Step 8: 设计规则
  const designRules = DESIGN_RULES;

  // 为每个模块生成完整方案
  const pages = sequence.map(mod => {
    const layout = selectLayout(mod.type);
    const components = generateComponents(mod.type, layout, copy, analysis, icons, colors);
    const canvas = { w: specs.w, h: specs.h };
    const layoutResult = autoLayout(layout, components, canvas, colors);
    return {
      ...mod,
      layout,
      layoutZones: getLayoutZones(layout),
      components,
      autoLayout: layoutResult,
      prompt: generateScenePrompt(mod.type, productName, analysis, platform, analysis.style),
      negativePrompt: generateNegativePrompt(analysis.category),
      sceneType: SCENE_TYPE_MAP[mod.type] || 'studio',
    };
  });

  // Step 9: 导出计划
  const exportPlan = generateExportPlan(platform, pages);

  return {
    analysis,
    colors,
    typography,
    sequence,
    copy,
    icons,
    specs,
    designRules,
    pages,
    exportPlan,
  };
}
