import React, { useState, useCallback, useEffect } from 'react';
import TopMenu from './components/topmenu';
import LeftRail from './components/leftrail';
import LeftPanel from './components/leftpanel';
import RightSidebar from './components/rightsidebar';
import HistoryBar from './components/historybar';
import RefImageBar from './components/refimagebar';
import CanvasView from './components/canvasview';
import ChatPanel from './components/chatpanel';
import { createEcommerceInfo } from './utils/ecommerce';
import { exportWorkspaceBackup, restoreWorkspaceBackup, autoBackupCheck } from './utils/backup';
import { generateNegativePrompt, enhancePromptWithDeepSeek } from './utils/prompthelper';
import { generateDetailPlan, getPlatformSpecs, generateColorScheme, generateTypography } from './utils/ecommerceDetailGenerator';
import { GEMINI_DIRECT_API, BFL_DIRECT_API, DOUBAO_DIRECT_API, DEEPSEEK_DIRECT_API, GEMINI_BATCH_API, BFL_VTO_API, BFL_OUTPAINT_API, BFL_ERASE_API, PHOTOROOM_BG_REMOVE, PHOTOROOM_SCENE, PHOTOROOM_EDIT_V2, GEMINI_CHAT_API, IDEOGRAM_GENERATE_API, IDEOGRAM_REMIX_API, IDEOGRAM_UPSCALE_API } from './api';

const ENGINES=[{k:'gemini',l:'Gemini'},{k:'bfl',l:'BFL'},{k:'doubao',l:'Doubao'}];
export default function App({ initialTab }) {
  const validTabs = ['generate', 'edit', 'vto'];
  const [activeTab, setActiveTab] = useState(validTabs.includes(initialTab) ? initialTab : 'generate');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [systemMsg, setSystemMsg] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegative, setShowNegative] = useState(false);
  const [batchImages, setBatchImages] = useState([]);
  const [batchParams, setBatchParams] = useState({
    // 批量自动化
    bgRemoveFormat: 'png',
    scenePrompt: 'modern studio, soft shadow',
    sceneShadow: 'ai.soft',
    multiAngle: {front:true, angle45:true, top:true, side:true},
    exportFormat: 'png',
    exportPrefix: 'vedaart_export_',
    // AI 虚拟模特
    vtoModel: 0,                  // 模特预设索引 0-7
    vtoSwitchModels: [true,true,true,true,false,false,false,false],  // 切换模特勾选
    vtoPose: 'standing',          // 姿势: standing|sitting|walking|casual
    vtoAngle: 'front',           // 拍摄角度（单选）: front|angle45|side|back|top|low
    vtoBg: 'plain',               // 背景: plain|studio|outdoor
    vtoFit: 'regular',            // 贴合度: tight|regular|loose
    vtoFaceKeep: 100,             // 脸部保留度 0-100
    vtoBodyKeep: 100,             // 身材保留度 0-100
    vtoLighting: 'Softbox',       // 光线
    vtoShot: 'full',              // 镜头: head|bust|half|full
    vtoQuality: 'high',           // 画质: standard|high|ultra
    vtoFormat: 'jpeg',            // 输出格式: jpeg|png|webp
    // 图像精修
    shadowMode: 'ai.soft',        // ai.soft|ai.hard|ai.cast|ai.float|ai.contact
    erasePrompt: 'remove unwanted objects, blemishes, watermarks, dust, scratches',
    glareStrength: 'medium',      // low|medium|strong
    expandWidth: 1024,
    expandHeight: 1024,
    expandMode: 'high',           // high|low
    // 品牌标准化
    templateIndex: 0,             // 模板索引
    presetPlatforms: {amazon:true,shopify:false,tiktok:false,facebook:false,xiaohongshu:false,instagram:false},
    // 图像设计（Ideogram）
    ideoModel: 'V_2',             // V_1 | V_1_TURBO | V_2 | V_2_TURBO
    ideoAspect: 'ASPECT_1_1',     // ASPECT_1_1 | ASPECT_16_9 | ASPECT_9_16 等
    ideoStyle: 'GENERAL',         // GENERAL | REALISTIC | DESIGN | RENDERS
    ideoMagicPrompt: 'AUTO',      // AUTO | ON | OFF
    ideoImageWeight: 50,          // 0-100，Remix 图片权重
    ideoNegativePrompt: '',       // 负面提示词
    // 图像设计 - 模块分类
    ideoModule: {
      theme: '',         // 主题
      artStyle: '',      // 画风
      fontStyle: '',     // 字体样式
      layout: '',        // 版式布局
      texture: '',       // 肌理质感
      decoration: '',    // 装饰元素
      colorScheme: '',   // 配色方案
    },
    // 图像设计 - 字体设计
    ideoTypography: {
      fontStyle: '',      // 字体风格
      fontWeight: '',     // 字重
      fontWidth: '',      // 字宽
      caseFormat: '',     // 大小写格式
      alignment: '',      // 对齐方式
      typography: '',     // 版式排版
      letterSpacing: '',  // 字距
      lineHeight: '',     // 行距
      stroke: '',         // 描边
      shadow: '',         // 阴影效果
      texture: '',        // 肌理质感
      decoration: '',     // 装饰元素
      textEffect: '',     // 文字特效
    },
  });
  const [collapsedSections, setCollapsedSections] = useState({
    batch: false, vto: false, retouch: false, brand: false, design: false, module: false, typography: false,
  });
  // 图生图各参数区块启用开关（关闭后不拼接对应参数到 prompt，UI 也折叠）
  const [editParamEnabled, setEditParamEnabled] = useState({
    basic: true,       // 基础参数（宽高比等）
    sampling: false,   // 采样控制
    refCtrl: true,     // 参考图控制
    ecommerce: false,  // 电商摄影控制
    quality: false,    // 画质控制
    // colorScheme 已有 colorSchemeEnabled 独立开关
  });
  // API keys
  const [selectedApi, setSelectedApi] = useState('gemini');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('vedaartGeminiApiKey')||'');
  const [bflKey, setBflKey] = useState(localStorage.getItem('vedaartBflApiKey')||'');
  const [douKey, setDouKey] = useState(localStorage.getItem('vedaartDoubaoApiKey')||'');
  const [douModel, setDouModel] = useState(localStorage.getItem('vedaartDoubaoModel')||'');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash-image');
  const [bflModel, setBflModel] = useState('flux-2-klein-9b-preview');
  const [deepKey, setDeepKey] = useState(localStorage.getItem('vedaartDeepseekApiKey')||'');
  const [photoKey, setPhotoKey] = useState(localStorage.getItem('vedaartPhotoroomApiKey')||'');
  const [ideoKey, setIdeoKey] = useState(localStorage.getItem('vedaartIdeogramApiKey')||'');
  // Generation
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generationSteps, setGenerationSteps] = useState(24);
  const [textCreativity, setTextCreativity] = useState(3);
  const [textRealism, setTextRealism] = useState(4);
  const [textSharpness, setTextSharpness] = useState(4);
  const [textBackground, setTextBackground] = useState('Studio');
  const [textLighting, setTextLighting] = useState('Softbox');
  const [textCamera, setTextCamera] = useState('Front');
  const [floralStyle, setFloralStyle] = useState(0);
  const [material, setMaterial] = useState(0);
  const [gradientModel, setGradientModel] = useState(0);
  const [generationDetail, setGenerationDetail] = useState(4);
  const [structLock, setStructLock] = useState(100);
  const [colorSchemeEnabled, setColorSchemeEnabled] = useState(true);
  const [refWeight, setRefWeight] = useState(95);
  const [i2iStrength, setI2iStrength] = useState(0.7);
  const [i2iDetailStrength, setI2iDetailStrength] = useState(75);
  const [i2iStyleStrength, setI2iStyleStrength] = useState(60);
  const [i2iColorPreserve, setI2iColorPreserve] = useState(false);
  const [i2iShapePreserve, setI2iShapePreserve] = useState(true);
  const [i2iFacePreserve, setI2iFacePreserve] = useState(false);
  const [i2iReplaceBg, setI2iReplaceBg] = useState(false);
  const [cfgScale, setCfgScale] = useState(7);
  const [sampler, setSampler] = useState('euler');
  const [textCommercialMaterial, setTextCommercialMaterial] = useState("默认材质");
  const [textTone, setTextTone] = useState("默认色调");
    const [seedValue, setSeedValue] = useState('');
  // Colors
  const [colors, setColors] = useState([{id:1,hex:'#D7E8D6',weight:80},{id:2,hex:'#F3EDE1',weight:10},{id:3,hex:'#C4956A',weight:10}]);
  // Canvas
  const [isNaming, setIsNaming] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(-1);
  const [history, setHistory] = useState([]);
  const [canvasGrid, setCanvasGrid] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ecTab, setEcTab] = useState(0);
  const [batchCount, setBatchCount] = useState(1);
  const [refImages, setRefImages] = useState([null, null]);
  // BFL 纯净模式：开启时 BFL 只用原始 prompt，不拼接风格/灯光/视角等控制参数
  const [bflPromptOnly, setBflPromptOnly] = useState(true);

  const [viewMode, setViewMode] = useState('generated');
  // 电商详情页方案（14个skill引擎输出）
  const [ecPlan, setEcPlan] = useState(null);
  // 电商详情页产品图片（1-8张）
  const [ecRefImages, setEcRefImages] = useState([null]);
  const [activeRefIndex, setActiveRefIndex] = useState(0);
  const [refSlotCount, setRefSlotCount] = useState(2);
    // EC
  const [ecData, setEcData] = useState(()=>{const saved=localStorage.getItem('vedaartEcData');if(saved)try{return JSON.parse(saved)}catch{return createEcommerceInfo()}return createEcommerceInfo()});
  const [archiveTitle, setArchiveTitle] = useState('');
  const [archiveSku, setArchiveSku] = useState('');
  const [productArchives, setProductArchives] = useState(JSON.parse(localStorage.getItem('vedaartProductArchives')||'[]'));
  const [savedModels, setSavedModels] = useState(JSON.parse(localStorage.getItem('vedaartSavedModels')||'[]'));

  const currentKey = selectedApi==='gemini'?geminiKey:selectedApi==='bfl'?bflKey:selectedApi==='doubao'?douKey:'';
  const getApiFunc = () => selectedApi==='bfl'?BFL_DIRECT_API:selectedApi==='doubao'?DOUBAO_DIRECT_API:GEMINI_DIRECT_API;

  const handleMenuAction = useCallback((action) => {
    switch(action){case'backup':exportWorkspaceBackup(history);setSystemMsg('数据已导出');break;case'save':saveModel();break;case'exportPdf':case'exportPsd':if(currentImage){const a=document.createElement('a');a.href=currentImage;a.download='CoXoF_'+Date.now()+'.png';a.click();setSystemMsg('图片已下载')}else{setSystemMsg('暂无图片可下载')}break;case'restore':restoreWorkspaceBackup((c,e)=>setSystemMsg(e||'已恢复 '+c+' 条记录'));break;case'new':setPrompt('');setCurrentImage(null);setHistory([]);setSystemMsg('新工作区');break;case'focus':setFocusMode(!focusMode);break;case'resetLayout':setLeftPanelOpen(true);setRightPanelOpen(true);break;}
  },[history,focusMode]);

  // DeepSeek 为产品取名 + 生成 SKU 编码
  const handleDeepseekName = useCallback(async () => {
    if(!deepKey) return setSystemMsg('请先配置 DeepSeek API Key');
    const baseName = archiveTitle || prompt.slice(0, 30) || '产品';
    setIsNaming(true);
    setSystemMsg('正在用 DeepSeek 取名...');
    try{
      const r=await DEEPSEEK_DIRECT_API([{role:'system',content:'你是电商产品命名专家。根据产品描述生成简洁的产品名称和SKU编码。只返回JSON，不要其他内容：{"name":"产品中文名","sku":"SKU编码(大写字母+数字，8-12位)","meaning":"命名含义简述"}'},{role:'user',content:`产品描述：${baseName}。风格：${selectedStyle}。请生成产品名和SKU编码。`}],deepKey);
      const p=JSON.parse(r);
      if(p.name) setArchiveTitle(p.name);
      if(p.sku) setArchiveSku(p.sku);
      setSystemMsg('取名完成：'+(p.name||'')+' / SKU:'+(p.sku||''));
    }catch(e){setSystemMsg('取名失败:'+e.message)}
    finally{setIsNaming(false)}
  },[archiveTitle,archiveSku,prompt,selectedStyle,deepKey,setSystemMsg]);

  const handlePromptModify = useCallback(async () => {
    if(!prompt.trim()) return setSystemMsg('请先输入提示词');
    setSystemMsg('正在优化提示词...');
    try{
      const result = await enhancePromptWithDeepSeek(prompt, deepKey);
      if(result){
        setPrompt(result.enhanced);
        if(result.negative){setNegativePrompt(result.negative);setShowNegative(true);}
        setSystemMsg('提示词已优化');
        return;
      }
    }catch(e){console.warn('Prompt enhance failed, using local', e.message)}
    // Local fallback: generate negative prompt from mapping
    const neg = generateNegativePrompt(prompt);
    setNegativePrompt(neg);
    setShowNegative(true);
    setSystemMsg('已生成负面提示词: ' + neg.slice(0, 50) + '...');
  },[prompt, deepKey, setSystemMsg]);

  // 参考图分析：用 Gemini 2.5 Flash 分析参考图，生成描述提示词
  const handleAnalyzeRefImage = useCallback(async () => {
    const imgs = refImages.filter(Boolean);
    if (imgs.length === 0) return setSystemMsg('请先上传参考图');
    setSystemMsg('正在分析参考图...');
    try {
      const systemMsg = `你是AI图像分析专家。请分析图片，生成一段详细的图像生成提示词（中文），描述主体、构图、光线、色调、风格、材质等关键特征，便于AI生图模型复刻类似效果。只返回提示词文本，不要其他说明。`;
      const messages = [
        { role: 'system', content: systemMsg },
        { role: 'user', content: '请分析这张图片并生成图像生成提示词。', images: imgs },
      ];
      const text = await GEMINI_CHAT_API(messages, 'gemini-2.5-flash');
      if (text) {
        setPrompt(text.trim());
        setSystemMsg('参考图分析完成，已填充提示词');
      } else {
        setSystemMsg('分析失败：未返回内容');
      }
    } catch (e) {
      console.warn('Analyze ref image failed', e.message);
      setSystemMsg('参考图分析失败: ' + e.message);
    }
  },[refImages, setPrompt, setSystemMsg]);

  // Prompt builder
  const buildFullPrompt = useCallback(() => {
    const base=prompt.trim().toLowerCase();
    // BFL 纯净模式：只用原始 prompt，不拼接控制参数
    if(selectedApi==='bfl'&&bflPromptOnly) return prompt.trim();
    const parts=[prompt.trim()];
    const hasWord=(w)=>base.includes(w.toLowerCase());
    if(activeTab==='generate'){
      // 英文自然语言描述，所有模型都能理解
      if(selectedStyle&&selectedStyle!=='Photorealistic'&&!hasWord(selectedStyle))parts.push('art style: '+selectedStyle);
      if(generationDetail>0)parts.push('detail level '+generationDetail+'/5');
      if(textBackground&&textBackground!=='Studio'&&!hasWord(textBackground))parts.push('background: '+textBackground);
      if(textLighting&&textLighting!=='Softbox'&&!hasWord(textLighting))parts.push('lighting: '+textLighting);
      if(textCamera&&textCamera!=='Front'&&!hasWord(textCamera))parts.push('camera angle: '+textCamera);
      if(textCommercialMaterial&&textCommercialMaterial!=='默认材质'&&!hasWord(textCommercialMaterial))parts.push('material: '+textCommercialMaterial);
    }else if(activeTab==='edit'){
      const styleMap=['写实平面','轻奢几何','写意国风','森系野趣','印象派光影','浮世绘线描','超现实液态','解构剪纸','禅意枯笔','波普撞色'];
      const matMap=['默认','欧根纱','磨砂玻璃','金属','丝绒','流体金属','3D黏土','丝光缎','雾绒'];
      if(floralStyle>0)parts.push('floral style: '+styleMap[floralStyle]);
      if(material>0)parts.push('material: '+matMap[material]);
      const gradMap=['','linear gradient','radial gradient','angular gradient','symmetric gradient','diamond gradient'];
      if(gradientModel>0)parts.push('gradient: '+gradMap[gradientModel]);
      const colorHex=colors.filter(c=>c.weight>10).map(c=>c.hex).join(', ');
      if(colorSchemeEnabled&&colorHex)parts.push('color palette: '+colorHex);
    }
    // 基础参数开关控制 aspectRatio 拼接
    if(activeTab!=='edit'||editParamEnabled.basic)parts.push('aspect ratio '+aspectRatio);
    return parts.join(', ');
  },[prompt,activeTab,selectedStyle,floralStyle,material,gradientModel,textBackground,textLighting,textCamera,textCommercialMaterial,generationDetail,colors,aspectRatio,selectedApi,bflPromptOnly,editParamEnabled]);

  const handleText2Image = useCallback(async () => {
    const fullPrompt=buildFullPrompt();
    if(!fullPrompt.trim()||!currentKey) return setSystemMsg('Please enter prompt and API key');
    setIsGenerating(true);
    const refs=refImages.filter(Boolean);
    const structPrompt=refs.length>0?`, reference image weight ${refWeight}%, keep ${structLock}% structure of reference image`:'';
    try{
      const count=canvasGrid>1?canvasGrid:1;
      const model=selectedApi==='gemini'?geminiModel:selectedApi==='bfl'?bflModel:selectedApi==='doubao'?douModel:'gemini-2.5-flash-image';
      for(let i=0;i<count;i++){
        const p=count>1?fullPrompt+(i===0?'':', variant '+(i+1)):fullPrompt;
        const finalPrompt=p+structPrompt;
        const result=await getApiFunc()(finalPrompt,refs,currentKey,model);
        const item={id:Date.now()+i,data:result.image_data,prompt:finalPrompt,type:'generate',name:count>1?'生成'+(i+1):null,modelConfig:{}};
        if(i===0){setCurrentImage(result.image_data);setActiveImageIndex(0)}
        setHistory(prev=>[item,...prev]);
      }
      setSystemMsg('Generated x'+count);
    }catch(err){setSystemMsg('Error: '+err.message)}
    finally{setIsGenerating(false)}
  },[buildFullPrompt,currentKey,refImages,canvasGrid,structLock,refWeight,geminiModel,bflModel,douModel,selectedApi]);
  const handleChatGenerate = useCallback(async (history) => {
    // 后端已配置 Vertex AI，无需前端 Key；geminiKey 仅作为兜底透传
    const key=geminiKey||localStorage.getItem('vedaartGeminiApiKey')||'';
    if(!currentImage) return setSystemMsg('请先在画板或历史栏选择要修改的图');
    setIsGenerating(true);
    try{
      const context=history.map(h=>h.role+': '+h.text).join('\n');
      const prompt='Based on conversation context, modify the image. Keep overall composition, only apply requested changes:\n'+context;
      const r=await GEMINI_DIRECT_API(prompt,[currentImage],key,geminiModel);
      const img=r.image_data;
      const item={id:Date.now(),data:img,prompt,type:'chat',name:'智能编辑',modelConfig:{}};
      setCurrentImage(img);setHistory(prev=>[item,...prev]);setSystemMsg('智能编辑完成');
      return img;
    }catch(e){setSystemMsg('对话:'+e.message)}
    finally{setIsGenerating(false)}
  },[currentImage,geminiKey,geminiModel]);

  const handleImg2Img = useCallback(async () => {
    const fullPrompt=buildFullPrompt();
    const refs=refImages.filter(Boolean);
    if(!fullPrompt.trim()||!currentKey) return setSystemMsg('Please enter prompt and API key');
    if(refs.length===0) return setSystemMsg('请先上传参考图用于图生图');
    setIsGenerating(true);
    try{
      const model=selectedApi==='gemini'?geminiModel:selectedApi==='bfl'?bflModel:selectedApi==='doubao'?douModel:'gemini-2.5-flash-image';
      // 参考图控制参数仅在 refCtrl 开关开启时拼接
      let finalPrompt=fullPrompt;
      if(editParamEnabled.refCtrl){
        finalPrompt+=`, reference image weight ${refWeight}%, keep ${structLock}% structure, variation strength ${Math.round(i2iStrength*100)}%, detail strength ${i2iDetailStrength}%, style strength ${i2iStyleStrength}%${i2iColorPreserve?', preserve original colors':''}${i2iShapePreserve?', lock shape outline':''}${i2iFacePreserve?', preserve facial features':''}${i2iReplaceBg?', replace background':''}`;
      }
      const result=await getApiFunc()(finalPrompt,refs,currentKey,model);
      const item={id:Date.now(),data:result.image_data,prompt:finalPrompt,type:'edit',name:null,modelConfig:{}};
      setCurrentImage(result.image_data);setHistory(prev=>[item,...prev]);setActiveImageIndex(0);setSystemMsg('Generated');
    }catch(err){setSystemMsg('Error: '+err.message)}
    finally{setIsGenerating(false)}
  },[buildFullPrompt,currentKey,refImages,structLock,refWeight,i2iStrength,i2iDetailStrength,i2iStyleStrength,i2iColorPreserve,i2iShapePreserve,i2iFacePreserve,i2iReplaceBg,geminiModel,bflModel,douModel,selectedApi,editParamEnabled]);

  React.useEffect(()=>{localStorage.setItem('vedaartProductArchives',JSON.stringify(productArchives.slice(0,100)))},[productArchives]);
  React.useEffect(()=>{localStorage.setItem('vedaartSavedModels',JSON.stringify(savedModels.slice(0,30)))},[savedModels]);
  React.useEffect(()=>{if(activeTab==='archive'){setRightPanelOpen(true);setLeftPanelOpen(true)}},[activeTab]);
  // 落地页工作台卡片跳转时，响应 tab 参数变化
  React.useEffect(()=>{if(validTabs.includes(initialTab)){setActiveTab(initialTab);setLeftPanelOpen(true)}},[initialTab]);

  const saveArchive = ()=>{if(!archiveTitle.trim())return setSystemMsg('Enter product title');setProductArchives(prev=>[{id:Date.now(),title:archiveTitle,sku:archiveSku,snapshot:{},ecInfo:ecData,createdAt:new Date().toISOString()},...prev]);setSystemMsg('Archive saved')};
  const deleteArchive = (id)=>{setProductArchives(prev=>prev.filter(a=>a.id!==id))};
  const saveModel = ()=>{setSavedModels(prev=>[{id:Date.now(),name:archiveTitle||'Model #'+Date.now(),prompt,thumbnail:currentImage,savedAt:new Date().toISOString()},...prev]);setSystemMsg('Model saved')};
  const handleGridChange = (n) => { setCanvasGrid(n); };
  const handleRefImage = (img, idx) => { const next=[...refImages];next[idx]=img;setRefImages(next);setActiveImageIndex(-1);const item={id:Date.now()+idx,data:img,prompt:'参考图'+(idx+1),type:'refImg',name:'参考图'+(idx+1),modelConfig:{}};setHistory(prev=>{const clean=prev.filter(h=>h.type!=='refImg');clean.unshift(item);return clean}); };
  const handleRemoveRef = (idx) => { const next=[...refImages];next[idx]=null;setRefImages(next);const remaining=next.filter(Boolean);setCurrentImage(remaining[0]||null); };
  const handleVTO = useCallback(async () => {
    const bflKey=localStorage.getItem('vedaartBflApiKey');
    if(!bflKey||refImages.filter(Boolean).length<2) return setSystemMsg('需要BFL Key和2张参考图(人物+服装)');
    const refs=refImages.filter(Boolean);
    setIsGenerating(true);setSystemMsg('虚拟试穿中...');
    try{const r=await BFL_VTO_API(refs[0],refs[1],prompt,bflKey);
      const item={id:Date.now(),data:r.image_data,prompt:'VTO',type:'vto',name:'虚拟试穿',modelConfig:{}};
      setCurrentImage(r.image_data);setHistory(prev=>[item,...prev]);setSystemMsg('虚拟试穿完成');
    }catch(e){setSystemMsg('VTO错误:'+e.message)}finally{setIsGenerating(false)}
  },[refImages,prompt]);
  const handleOutpaint = useCallback(async () => {
    const bflKey=localStorage.getItem('vedaartBflApiKey');
    if(!bflKey||!currentImage) return setSystemMsg('需要BFL Key和当前图片');
    setIsGenerating(true);setSystemMsg('涂绘扩展中...');
    try{const r=await BFL_OUTPAINT_API(currentImage,prompt,1024,1024,bflKey);
      const item={id:Date.now(),data:r.image_data,prompt:'Outpaint',type:'outpaint',name:'涂绘扩展',modelConfig:{}};
      setCurrentImage(r.image_data);setHistory(prev=>[item,...prev]);setSystemMsg('涂绘扩展完成');
    }catch(e){setSystemMsg('Outpaint错误:'+e.message)}finally{setIsGenerating(false)}
  },[currentImage,prompt]);
  const handleErase = useCallback(async () => {
    const bflKey=localStorage.getItem('vedaartBflApiKey');
    if(!bflKey||!currentImage) return setSystemMsg('需要BFL Key和当前图片');
    setIsGenerating(true);setSystemMsg('涂擦中...');
    try{const r=await BFL_ERASE_API(currentImage,currentImage,bflKey);
      const item={id:Date.now(),data:r.image_data,prompt:'Erase',type:'erase',name:'涂擦',modelConfig:{}};
      setCurrentImage(r.image_data);setHistory(prev=>[item,...prev]);setSystemMsg('涂擦完成');
    }catch(e){setSystemMsg('Erase错误:'+e.message)}finally{setIsGenerating(false)}
  },[currentImage]);
  const handlePhotoRemove = useCallback(async () => {
    const key = photoKey||localStorage.getItem('vedaartPhotoroomApiKey');
    if(!key||!currentImage) return setSystemMsg('需要Photoroom Key和当前图片');
    setIsGenerating(true);setSystemMsg('Photoroom抠图中...');
    try{const r=await PHOTOROOM_BG_REMOVE(currentImage,key);
      const item={id:Date.now(),data:r.image_data,prompt:'AI抠图',type:'photoroom',name:'抠图',modelConfig:{}};
      setCurrentImage(r.image_data);setHistory(prev=>[item,...prev]);setSystemMsg('抠图完成');
    }catch(e){setSystemMsg('Photoroom:'+e.message)}
    finally{setIsGenerating(false)}
  },[currentImage,photoKey]);
  const handleBatchUpload = useCallback((files)=>{
    const imgs=[...files].filter(f=>f.type.startsWith('image/'));
    if(imgs.length===0) return setSystemMsg('请选择图片文件');
    if(batchImages.length+imgs.length>100) return setSystemMsg('最多上传100张图片');
    const readers=imgs.map(f=>new Promise(res=>{const r=new FileReader();r.onload=()=>res({id:Date.now()+Math.random(),data:r.result,name:f.name});r.readAsDataURL(f)}));
    Promise.all(readers).then(results=>{setBatchImages(prev=>[...prev,...results]);setSystemMsg('已上传'+results.length+'张图片，共'+(batchImages.length+results.length)+'张')});
  },[batchImages]);
  const handleBatchRemove = useCallback(async ()=>{
    const key=photoKey||localStorage.getItem('vedaartPhotoroomApiKey');
    if(!key) return setSystemMsg('需要Photoroom Key');
    if(batchImages.length===0) return setSystemMsg('请先上传图片');
    const fmt=batchParams?.bgRemoveFormat||'png';
    setIsGenerating(true);setSystemMsg('批量抠图('+fmt.toUpperCase()+')中 0/'+batchImages.length+'...');
    const results=[];
    for(let i=0;i<batchImages.length;i++){
      try{const r=await PHOTOROOM_BG_REMOVE(batchImages[i].data,key,fmt);
        results.push({...batchImages[i],data:r.image_data,processed:true});
        setSystemMsg('批量抠图 '+(i+1)+'/'+batchImages.length+' 完成');
      }catch(e){results.push({...batchImages[i],error:true});setSystemMsg('第'+(i+1)+'张失败:'+e.message)}
    }
    setBatchImages(results);
    const ok=results.filter(r=>!r.error);
    if(ok.length){const item={id:Date.now(),data:ok[0].data,prompt:'批量抠图',type:'batch',name:'批量抠图'+ok.length+'张',modelConfig:{}};setCurrentImage(ok[0].data);setHistory(prev=>[item,...prev])}
    setSystemMsg('批量抠图完成：'+ok.length+'/'+batchImages.length+'张成功');
    setIsGenerating(false);
  },[batchImages,photoKey,batchParams]);
  const handleBatchRemoveOne=useCallback((id)=>{setBatchImages(prev=>prev.filter(img=>img.id!==id))},[]);
  const handleBatchClear=useCallback(()=>{setBatchImages([])},[]);
  // 批量场景 = Ideogram 批量生图（支持提示词、负面提示词、设计参数、模块分类、字体设计，100张一组）
  const handleBatchScene = useCallback(async ()=>{
    const key=ideoKey||localStorage.getItem('vedaartIdeogramApiKey');
    if(!key) return setSystemMsg('需要Ideogram Key');
    if(!prompt.trim()) return setSystemMsg('请先输入提示词');
    setIsGenerating(true);setSystemMsg('批量场景生成中 0/100...');
    // 构建完整提示词 = 用户prompt + 模块分类 + 字体设计
    const modPrompt=buildModulePrompt(batchParams?.ideoModule);
    const typoPrompt=buildTypographyPrompt(batchParams?.ideoTypography);
    const extraParts=[prompt.trim()];
    if(modPrompt)extraParts.push(modPrompt);
    if(typoPrompt)extraParts.push(typoPrompt);
    const finalPrompt=extraParts.join(', ');
    const negPrompt=negativePrompt||'';
    const total=100;
    const results=[];
    for(let i=0;i<total;i++){
      try{
        const r=await IDEOGRAM_GENERATE_API(finalPrompt,key,{
          aspectRatio:batchParams?.ideoAspect||'ASPECT_1_1',
          model:batchParams?.ideoModel||'V_2',
          styleType:batchParams?.ideoStyle||'GENERAL',
          magicPromptOption:batchParams?.ideoMagicPrompt||'AUTO',
          negativePrompt:negPrompt,
        });
        results.push({id:Date.now()+i,data:r.image_data,processed:true,scene:true,name:'场景'+(i+1)});
        setSystemMsg('批量场景 '+(i+1)+'/'+total+' 完成');
      }catch(e){results.push({id:Date.now()+i,error:true,name:'场景'+(i+1)});setSystemMsg('第'+(i+1)+'张失败:'+e.message)}
    }
    setBatchImages(results);
    const ok=results.filter(r=>!r.error);
    if(ok.length){const item={id:Date.now(),data:ok[0].data,prompt:finalPrompt,type:'batch',name:'批量场景'+ok.length+'张',modelConfig:{model:batchParams?.ideoModel}};setCurrentImage(ok[0].data);setHistory(prev=>[item,...prev])}
    setSystemMsg('批量场景完成：'+ok.length+'/'+total+'张成功');
    setIsGenerating(false);
  },[prompt,negativePrompt,ideoKey,batchParams]);
  const handleBatchExport = useCallback(()=>{
    if(batchImages.length===0) return setSystemMsg('请先上传图片');
    const ok=batchImages.filter(img=>!img.error);
    if(ok.length===0) return setSystemMsg('没有可导出的图片');
    const fmt=batchParams?.exportFormat||'png';
    const prefix=batchParams?.exportPrefix||'vedaart_export_';
    setSystemMsg('开始导出 '+ok.length+' 张 ('+fmt.toUpperCase()+')...');
    ok.forEach((img,i)=>{
      setTimeout(()=>{
        const a=document.createElement('a');
        // 如果图片是data URL且格式不同，转换格式
        if(img.data.startsWith('data:image/')&&fmt!=='png'){
          // 用canvas转换格式
          const c=document.createElement('canvas');const ctx=c.getContext('2d');
          const im=new Image();im.onload=()=>{c.width=im.width;c.height=im.height;ctx.drawImage(im,0,0);a.href=c.toDataURL('image/'+fmt,0.92);a.download=prefix+String(i+1).padStart(3,'0')+'.'+fmt;a.click();setSystemMsg('导出 '+(i+1)+'/'+ok.length+'...')};im.src=img.data;return;
        }
        a.href=img.data;a.download=prefix+String(i+1).padStart(3,'0')+'.'+fmt;a.click();setSystemMsg('导出 '+(i+1)+'/'+ok.length+'...')
      },i*300);
    });
    setTimeout(()=>setSystemMsg('导出完成：'+ok.length+'张 ('+fmt.toUpperCase()+')'),ok.length*300+500);
  },[batchImages,batchParams]);
  const handleBatchMultiAngle = useCallback(async ()=>{
    const key=photoKey||localStorage.getItem('vedaartPhotoroomApiKey');
    if(!key) return setSystemMsg('需要Photoroom Key');
    if(batchImages.length===0) return setSystemMsg('请先上传图片');
    const anglesMap=[
      {key:'front',label:'正面',prompt:'front view, eye level'},
      {key:'angle45',label:'45度',prompt:'45 degree angle view'},
      {key:'top',label:'俯拍',prompt:'top-down view, overhead'},
      {key:'side',label:'侧面',prompt:'side profile view'},
    ];
    // 从参数面板获取勾选的角度
    const ma=batchParams?.multiAngle||{};
    const selected=anglesMap.filter(a=>ma[a.key]!==false);
    if(selected.length===0) return setSystemMsg('请至少勾选一个角度');
    const total=batchImages.length*selected.length;
    setIsGenerating(true);setSystemMsg('多角度生成 0/'+total+'...');
    const results=[];
    let done=0;
    for(let i=0;i<batchImages.length;i++){
      const angleResults=[];
      for(const a of selected){
        try{const r=await PHOTOROOM_SCENE(batchImages[i].data,a.prompt,key);
          angleResults.push({angle:a.label,data:r.image_data});
          done++;setSystemMsg('多角度 '+(done)+'/'+total+' ('+a.label+')');
        }catch(e){angleResults.push({angle:a.label,error:true});done++;setSystemMsg('第'+(i+1)+'张'+a.label+'失败')}
      }
      const hasOk=angleResults.some(r=>!r.error);
      if(hasOk){results.push({...batchImages[i],data:angleResults.find(r=>!r.error)?.data||batchImages[i].data,processed:true,multiAngle:true,angles:angleResults})}
      else{results.push({...batchImages[i],error:true})}
    }
    setBatchImages(results);
    const ok=results.filter(r=>!r.error);
    if(ok.length){const item={id:Date.now(),data:ok[0].data,prompt:'多角度生成',type:'batch',name:'多角度'+ok.length+'张x'+selected.length+'角度',modelConfig:{}};setCurrentImage(ok[0].data);setHistory(prev=>[item,...prev])}
    setSystemMsg('多角度完成：'+ok.length+'/'+batchImages.length+'张，共'+total+'张图');
    setIsGenerating(false);
  },[batchImages,photoKey,batchParams]);
  const MODEL_PRESETS=[
    {label:'使用上传模特图',prompt:''},
    {label:'亚洲女性-苗条',prompt:'slim asian female model, fair skin, height 170cm, professional pose'},
    {label:'亚洲男性-标准',prompt:'standard asian male model, fair skin, height 180cm, professional pose'},
    {label:'欧美女性-曲线',prompt:'curvy european female model, fair skin, height 175cm, professional pose'},
    {label:'欧美男性-健壮',prompt:'muscular european male model, tan skin, height 185cm, professional pose'},
    {label:'非洲女性-高挑',prompt:'tall african female model, dark skin, height 178cm, professional pose'},
    {label:'非洲男性-健壮',prompt:'muscular african male model, dark skin, height 188cm, professional pose'},
    {label:'拉丁女性-丰满',prompt:'curvy latina female model, tan skin, height 170cm, professional pose'},
    {label:'儿童-中性',prompt:'child model, neutral, height 120cm, cute pose'},
  ];
  // 角度参数 → 英文 prompt 片段
  const angleMap = { front: 'front view', angle45: '45 degree angle view', side: 'side view', back: 'back view', top: 'top down view', low: 'low angle view' };
  const poseMap = { standing: 'standing pose', sitting: 'sitting pose', walking: 'walking pose', casual: 'casual relaxed pose' };
  const bgMap = { plain: 'plain background', studio: 'studio background', outdoor: 'outdoor lifestyle background' };

  const handleVTOFit = useCallback(async ()=>{
    const bflKey=localStorage.getItem('vedaartBflApiKey');
    if(!bflKey) return setSystemMsg('需要BFL Key');
    if(batchImages.length===0) return setSystemMsg('请先上传服装图片');
    const mi=Math.max(1, batchParams?.vtoModel||1);
    const model=MODEL_PRESETS[mi];
    const pose=poseMap[batchParams?.vtoPose||'standing'];
    const bg=bgMap[batchParams?.vtoBg||'plain'];
    const angles=[batchParams?.vtoAngle||'front'];
    setIsGenerating(true);setSystemMsg('生成模特图片中('+model.label+')...');
    let modelImg;
    try{const mr=await BFL_DIRECT_API(model.prompt+', full body, '+pose+', '+bg+', fashion photography',null,bflKey);modelImg=mr.image_data;}catch(e){setSystemMsg('模特图片生成失败:'+e.message);setIsGenerating(false);return;}
    setSystemMsg('模特图片已生成，开始贴合... 0/'+(batchImages.length*angles.length));
    const results=[];
    let done=0;
    for(let bi=0;bi<batchImages.length;bi++){
      const angleResults=[];
      for(const ang of angles){
        const angPrompt=angleMap[ang]||'front view';
        try{const r=await BFL_VTO_API(modelImg,batchImages[bi].data,model.prompt+', '+angPrompt,bflKey);
          angleResults.push({angle:ang,data:r.image_data});
          done++;setSystemMsg('贴合模特 '+(done)+'/'+(batchImages.length*angles.length)+' ('+model.label+'-'+angPrompt+')');
        }catch(e){angleResults.push({angle:ang,error:true});done++;setSystemMsg('第'+(bi+1)+'张'+ang+'失败:'+e.message)}
      }
      const ok=angleResults.filter(r=>!r.error);
      if(ok.length){results.push({...batchImages[bi],data:ok[0].data,processed:true,vto:true,angles:angleResults})}
      else{results.push({...batchImages[bi],error:true})}
    }
    setBatchImages(results);
    const allOk=results.filter(r=>!r.error);
    if(allOk.length){const item={id:Date.now(),data:allOk[0].data,prompt:'贴合模特',type:'batch',name:'贴合模特'+allOk.length+'张x'+angles.length+'角度('+model.label+')',modelConfig:{}};setCurrentImage(allOk[0].data);setHistory(prev=>[item,...prev])}
    setSystemMsg('贴合模特完成：'+allOk.length+'/'+batchImages.length+'张 x '+angles.length+'角度 ('+model.label+')');
    setIsGenerating(false);
  },[batchImages,batchParams]);

  const handleVTOSwitch = useCallback(async ()=>{
    const bflKey=localStorage.getItem('vedaartBflApiKey');
    if(!bflKey) return setSystemMsg('需要BFL Key');
    if(batchImages.length===0) return setSystemMsg('请先上传图片');
    const mi=Math.max(1, batchParams?.vtoModel||1);
    const model=MODEL_PRESETS[mi];
    const pose=poseMap[batchParams?.vtoPose||'standing'];
    const bg=bgMap[batchParams?.vtoBg||'plain'];
    const angles=[batchParams?.vtoAngle||'front'];
    setIsGenerating(true);setSystemMsg('生成模特图片中('+model.label+')...');
    let modelImg;
    try{const mr=await BFL_DIRECT_API(model.prompt+', full body, '+pose+', '+bg+', fashion photography',null,bflKey);modelImg=mr.image_data;}catch(e){setSystemMsg('模特'+model.label+'生成失败');setIsGenerating(false);return;}
    const total=batchImages.length*angles.length;
    setSystemMsg('开始切换模特 0/'+total+'...');
    const results=[];let done=0;
    for(let bi=0;bi<batchImages.length;bi++){
      const angleResults=[];
      for(const ang of angles){
        const angPrompt=angleMap[ang]||'front view';
        try{const r=await BFL_VTO_API(modelImg,batchImages[bi].data,'TRY-ON: The person wearing the garments. '+angPrompt,bflKey);
          angleResults.push({angle:ang,data:r.image_data});
          done++;setSystemMsg('切换模特 '+(done)+'/'+total+' ('+model.label+'-'+angPrompt+')');
        }catch(e){angleResults.push({angle:ang,error:true});done++;setSystemMsg('第'+(bi+1)+'张'+ang+'失败')}
      }
      const ok=angleResults.filter(r=>!r.error);
      if(ok.length){results.push({...batchImages[bi],data:ok[0].data,processed:true,switched:true,angles:angleResults})}
      else{results.push({...batchImages[bi],error:true})}
    }
    setBatchImages(results);
    const allOk=results.filter(r=>!r.error);
    if(allOk.length){const item={id:Date.now(),data:allOk[0].data,prompt:'切换模特',type:'batch',name:'切换模特'+allOk.length+'张x'+angles.length+'角度('+model.label+')',modelConfig:{}};setCurrentImage(allOk[0].data);setHistory(prev=>[item,...prev])}
    setSystemMsg('切换模特完成：'+allOk.length+'/'+batchImages.length+'张 x '+angles.length+'角度 ('+model.label+')');
    setIsGenerating(false);
  },[batchImages,batchParams]);

  const handleFabricWrinkle = useCallback(async ()=>{
    const key=photoKey||localStorage.getItem('vedaartPhotoroomApiKey');
    if(!key) return setSystemMsg('需要Photoroom Key');
    if(batchImages.length===0) return setSystemMsg('请先上传图片');
    const angles=[batchParams?.vtoAngle||'front'];
    const bg=bgMap[batchParams?.vtoBg||'plain'];
    setIsGenerating(true);
    const total=batchImages.length*(angles.length>0?angles.length:1);
    setSystemMsg('面料褶皱生成中 0/'+total+'...');
    let wrinklePrompt='realistic fabric folds and natural wrinkles, soft draping, high detail textile texture, professional studio lighting';
    if(bg) wrinklePrompt+=', '+bg;
    if(angles.length>0) wrinklePrompt+=', '+angles.map(a=>angleMap[a]).join(', ');
    const results=[];let done=0;
    for(let i=0;i<batchImages.length;i++){
      try{const r=await PHOTOROOM_SCENE(batchImages[i].data,wrinklePrompt,key);
        results.push({...batchImages[i],data:r.image_data,processed:true,wrinkle:true});
        done++;setSystemMsg('面料褶皱 '+(done)+'/'+total+' 完成');
      }catch(e){results.push({...batchImages[i],error:true});done++;setSystemMsg('第'+(i+1)+'张失败:'+e.message)}
    }
    setBatchImages(results);
    const ok=results.filter(r=>!r.error);
    if(ok.length){const item={id:Date.now(),data:ok[0].data,prompt:'面料褶皱',type:'batch',name:'面料褶皱'+ok.length+'张',modelConfig:{}};setCurrentImage(ok[0].data);setHistory(prev=>[item,...prev])}
    setSystemMsg('面料褶皱完成：'+ok.length+'/'+batchImages.length+'张');
    setIsGenerating(false);
  },[batchImages,photoKey,batchParams]);

  const handleBatchOutfit = useCallback(async ()=>{
    const bflKey=localStorage.getItem('vedaartBflApiKey');
    if(!bflKey) return setSystemMsg('需要BFL Key');
    const angles=[batchParams?.vtoAngle||'front'];
    // 读取右侧AI虚拟模特参数
    const pose=poseMap[batchParams?.vtoPose||'standing']||'standing pose';
    const bg=bgMap[batchParams?.vtoBg||'plain']||'plain background';
    const modelIdx=batchParams?.vtoModel??0;
    const modelPreset=MODEL_PRESETS[modelIdx]||MODEL_PRESETS[0];
    const modelLabel=modelPreset.label;
    const useUploadedModel = modelIdx===0;  // 索引0=使用上传模特图，>0=生成模特图
    // 模特图与服装图来源：上传模式 refImages[0]=模特图、refImages[1:]=服装；生成模式 refImages[0:]=服装
    const garmentLabel=(origIdx)=>origIdx===1?'上衣':origIdx===2?'下身':'服装'+(origIdx-2);
    const garmentTypeEn=(origIdx)=>origIdx===1?'top':origIdx===2?'bottoms':'garment';
    let personImg;
    let garmentSlots;
    if(useUploadedModel){
      personImg=refImages[0];
      if(!personImg) return setSystemMsg('第1张必须为模特图（参考图1），或在下拉中选择其他模特预设自动生成');
      garmentSlots=refImages.slice(1).map((img,idx)=>img?{data:img,origIdx:idx+1}:null).filter(Boolean);
    } else {
      garmentSlots=refImages.map((img,idx)=>img?{data:img,origIdx:idx+1}:null).filter(Boolean);
    }
    if(garmentSlots.length===0) return setSystemMsg('请上传至少1张服装图（'+(useUploadedModel?'参考图2=上衣，参考图3=下身':'参考图1=上衣，参考图2=下身')+'）');
    // 新增控制参数
    const fitMap={tight:'slim fit, form-fitting',regular:'regular fit, natural drape',loose:'loose fit, relaxed silhouette'};
    const shotMap={head:'head shot close-up',bust:'bust shot',half:'half-body shot',full:'full body shot'};
    const lightMap={Softbox:'soft diffused lighting',HardTop:'hard top lighting',SideBack:'side-back lighting',Rim:'rim lighting',Spot:'studio spotlight',Natural:'natural window light',Shadowless:'shadowless white background lighting'};
    const fit=fitMap[batchParams?.vtoFit||'regular']||fitMap.regular;
    const shot=shotMap[batchParams?.vtoShot||'full']||shotMap.full;
    const light=lightMap[batchParams?.vtoLighting||'Softbox']||lightMap.Softbox;
    const faceKeep=batchParams?.vtoFaceKeep??100;
    const bodyKeep=batchParams?.vtoBodyKeep??100;
    const faceInstr=faceKeep>=90?'maintaining exactly their face':faceKeep>=50?'keeping facial features':'adjusting facial appearance';
    const bodyInstr=bodyKeep>=90?'preserving body shape':bodyKeep>=50?'slightly adjusting body shape':'adjusting body shape';
    setIsGenerating(true);
    const userPrompt=(prompt||'').trim();
    const userNeg=(negativePrompt||'').trim();
    setSystemMsg('OTV参数：'+modelLabel+' | '+pose+' | '+bg+' | '+fit+' | '+shot+' | 角度'+angles.length+'个 | 服装'+garmentSlots.length+'件');
    // 生成模式：先用 BFL 生成模特图
    if(!useUploadedModel){
      setSystemMsg('生成模特图中（'+modelLabel+'）...');
      try{const mr=await BFL_DIRECT_API(modelPreset.prompt+', full body, '+pose+', '+bg+', fashion photography',null,bflKey);personImg=mr.image_data;}
      catch(e){setSystemMsg('模特图生成失败:'+e.message);setIsGenerating(false);return;}
      setSystemMsg('模特图已生成，开始穿搭 0/'+garmentSlots.length+'件服装');
    }
    await new Promise(r=>setTimeout(r,800));
    const allResults=[];
    const errors=[];
    for(let ai=0;ai<angles.length;ai++){
      const ang=angles[ai];
      const angPrompt=angleMap[ang]||'front view';
      let currentPerson=personImg;
      let allOk=true;
      for(let gi=0;gi<garmentSlots.length;gi++){
        const g=garmentSlots[gi];
        const gLabel=garmentLabel(g.origIdx);
        const gType=garmentTypeEn(g.origIdx);
        // BFL VTO prompt 简洁：参考官方示例，核心指令+关键控制参数
        let vtoPrompt=`The person of image 1, ${faceInstr}, wearing the ${gType} of image 2. ${fit}, ${shot}, ${pose}, ${angPrompt}`;
        if(userPrompt) vtoPrompt+=', '+userPrompt;
        vtoPrompt+='.';
        try{const r=await BFL_VTO_API(currentPerson,g.data,vtoPrompt,bflKey);
          currentPerson=r.image_data;
          setSystemMsg('OTV ['+modelLabel+'] '+angPrompt+' '+(gi+1)+'/'+garmentSlots.length+' ('+gLabel+'已穿)');
        }catch(e){allOk=false;errors.push(`${gLabel} ${angPrompt}: ${e.message}`);setSystemMsg(gLabel+' '+angPrompt+'失败:'+e.message);break}
      }
      if(allOk){allResults.push({angle:ang,data:currentPerson,modelLabel,pose,bg,fit,shot,light})}
    }
    // 每个角度结果都加入历史
    if(allResults.length){
      const newItems=allResults.map((r,i)=>({id:Date.now()+i,data:r.data,prompt:'OTV',type:'vto',name:'OTV '+r.modelLabel+' '+r.angle+' '+r.pose,modelConfig:{vtoModel:r.modelLabel,vtoPose:r.pose,vtoBg:r.bg,angle:r.angle}}));
      setCurrentImage(allResults[0].data);
      setHistory(prev=>[...newItems,...prev]);
    }
    if(allResults.length>0){
      setSystemMsg('OTV完成：'+allResults.length+'/'+angles.length+'角度（'+modelLabel+'，'+pose+'，'+bg+'，串联'+garmentSlots.length+'件服装）');
    }else{
      setSystemMsg('OTV失败：0/'+angles.length+'角度。错误：'+errors.join(' | '));
    }
    setIsGenerating(false);
  },[refImages,batchParams,prompt,negativePrompt]);
  const handlePhotoEditV2 = useCallback(async () => {
    const key=photoKey||localStorage.getItem("vedaartPhotoroomApiKey");
    if(!key||!currentImage) return setSystemMsg("需要Photoroom Key和当前图片");
    setIsGenerating(true);setSystemMsg("Photoroom沙盒编辑中...");
    try{const r=await PHOTOROOM_EDIT_V2(currentImage,key,{shadowMode:"ai.soft",bgColor:"FFFFFF",padding:0.1});
      const item={id:Date.now(),data:r.image_data,prompt:"沙盒编辑",type:"photoedit",name:"沙盒编辑",modelConfig:{}};
      setCurrentImage(r.image_data);setHistory(prev=>[item,...prev]);setSystemMsg("沙盒编辑完成");
    }catch(e){setSystemMsg("Photoroom:"+e.message)}
    finally{setIsGenerating(false)}
  },[currentImage,photoKey]);

  const handlePhotoScene = useCallback(async (scenePrompt) => {
    const key = photoKey||localStorage.getItem('vedaartPhotoroomApiKey');
    if(!key||!currentImage) return setSystemMsg('需要Photoroom Key和当前图片');
    setIsGenerating(true);setSystemMsg('Photoroom场景生成中...');
    try{const r=await PHOTOROOM_SCENE(currentImage,scenePrompt||prompt,key);
      const item={id:Date.now(),data:r.image_data,prompt:scenePrompt||'AI场景',type:'photoscene',name:'场景',modelConfig:{}};
      setCurrentImage(r.image_data);setHistory(prev=>[item,...prev]);setSystemMsg('场景生成完成');
    }catch(e){setSystemMsg('Photoroom:'+e.message)}
    finally{setIsGenerating(false)}
  },[currentImage,photoKey,prompt]);
  const handleShadowGen = useCallback(async ()=>{
    const key=photoKey||localStorage.getItem('vedaartPhotoroomApiKey');
    if(!key) return setSystemMsg('需要Photoroom Key');
    if(batchImages.length===0) return setSystemMsg('请先上传图片');
    const shadowMode=batchParams?.shadowMode||'ai.soft';
    setIsGenerating(true);setSystemMsg('阴影生成中('+shadowMode+') 0/'+batchImages.length+'...');
    const results=[];
    for(let i=0;i<batchImages.length;i++){
      try{const r=await PHOTOROOM_EDIT_V2(batchImages[i].data,key,{shadowMode,bgColor:'FFFFFF',padding:0.1});
        results.push({...batchImages[i],data:r.image_data,processed:true,shadow:true});
        setSystemMsg('阴影生成 '+(i+1)+'/'+batchImages.length);
      }catch(e){results.push({...batchImages[i],error:true});setSystemMsg('第'+(i+1)+'张失败:'+e.message)}
    }
    setBatchImages(results);
    const ok=results.filter(r=>!r.error);
    if(ok.length){const item={id:Date.now(),data:ok[0].data,prompt:'阴影生成',type:'batch',name:'阴影生成'+ok.length+'张',modelConfig:{}};setCurrentImage(ok[0].data);setHistory(prev=>[item,...prev])}
    setSystemMsg('阴影生成完成：'+ok.length+'/'+batchImages.length+'张');
    setIsGenerating(false);
  },[batchImages,photoKey,batchParams]);
  const handleEnhance = useCallback(async ()=>{
    const key=bflKey||localStorage.getItem('vedaartBflApiKey');
    if(!key) return setSystemMsg('需要BFL Key');
    if(batchImages.length===0) return setSystemMsg('请先上传图片');
    setIsGenerating(true);setSystemMsg('画质增强(去模糊)中 0/'+batchImages.length+'...');
    const results=[];
    for(let i=0;i<batchImages.length;i++){
      try{const r=await BFL_DEBLUR_API(batchImages[i].data,key);
        results.push({...batchImages[i],data:r.image_data,processed:true,enhanced:true});
        setSystemMsg('画质增强 '+(i+1)+'/'+batchImages.length);
      }catch(e){results.push({...batchImages[i],error:true});setSystemMsg('第'+(i+1)+'张失败:'+e.message)}
    }
    setBatchImages(results);
    const ok=results.filter(r=>!r.error);
    if(ok.length){const item={id:Date.now(),data:ok[0].data,prompt:'画质增强',type:'batch',name:'画质增强'+ok.length+'张',modelConfig:{}};setCurrentImage(ok[0].data);setHistory(prev=>[item,...prev])}
    setSystemMsg('画质增强完成：'+ok.length+'/'+batchImages.length+'张');
    setIsGenerating(false);
  },[batchImages,bflKey]);
  const handleMagicErase = useCallback(async ()=>{
    const key=photoKey||localStorage.getItem('vedaartPhotoroomApiKey');
    if(!key) return setSystemMsg('需要Photoroom Key');
    if(batchImages.length===0) return setSystemMsg('请先上传图片');
    const erasePrompt=batchParams?.erasePrompt||'remove unwanted objects, blemishes, watermarks, dust, scratches';
    setIsGenerating(true);setSystemMsg('魔术橡皮擦中 0/'+batchImages.length+'...');
    const results=[];
    for(let i=0;i<batchImages.length;i++){
      try{const r=await PHOTOROOM_SCENE(batchImages[i].data,erasePrompt,key);
        const r2=await PHOTOROOM_EDIT_V2(r.image_data,key,{shadowMode:'ai.soft',bgColor:'FFFFFF',padding:0.05});
        results.push({...batchImages[i],data:r2.image_data,processed:true,erased:true});
        setSystemMsg('魔术橡皮擦 '+(i+1)+'/'+batchImages.length);
      }catch(e){results.push({...batchImages[i],error:true});setSystemMsg('第'+(i+1)+'张失败:'+e.message)}
    }
    setBatchImages(results);
    const ok=results.filter(r=>!r.error);
    if(ok.length){const item={id:Date.now(),data:ok[0].data,prompt:'魔术橡皮擦',type:'batch',name:'魔术橡皮擦'+ok.length+'张',modelConfig:{}};setCurrentImage(ok[0].data);setHistory(prev=>[item,...prev])}
    setSystemMsg('魔术橡皮擦完成：'+ok.length+'/'+batchImages.length+'张');
    setIsGenerating(false);
  },[batchImages,photoKey,batchParams]);
  const handleGlareRemove = useCallback(async ()=>{
    const key=photoKey||localStorage.getItem('vedaartPhotoroomApiKey');
    if(!key) return setSystemMsg('需要Photoroom Key');
    if(batchImages.length===0) return setSystemMsg('请先上传图片');
    const strength=batchParams?.glareStrength||'medium';
    const strengthMap={low:'subtle',medium:'moderate',strong:'aggressive'};
    const glarePrompt=`${strengthMap[strength]} remove reflections and glare, reduce highlights, fix product blemishes, clean product photography, even lighting`;
    setIsGenerating(true);setSystemMsg('反光消除中('+strength+') 0/'+batchImages.length+'...');
    const results=[];
    for(let i=0;i<batchImages.length;i++){
      try{const r=await PHOTOROOM_SCENE(batchImages[i].data,glarePrompt,key);
        results.push({...batchImages[i],data:r.image_data,processed:true,deglared:true});
        setSystemMsg('反光消除 '+(i+1)+'/'+batchImages.length);
      }catch(e){results.push({...batchImages[i],error:true});setSystemMsg('第'+(i+1)+'张失败:'+e.message)}
    }
    setBatchImages(results);
    const ok=results.filter(r=>!r.error);
    if(ok.length){const item={id:Date.now(),data:ok[0].data,prompt:'反光消除',type:'batch',name:'反光消除'+ok.length+'张',modelConfig:{}};setCurrentImage(ok[0].data);setHistory(prev=>[item,...prev])}
    setSystemMsg('反光消除完成：'+ok.length+'/'+batchImages.length+'张');
    setIsGenerating(false);
  },[batchImages,photoKey,batchParams]);
  const handleExpandCanvas = useCallback(async ()=>{
    const bflKey=localStorage.getItem('vedaartBflApiKey');
    if(!bflKey) return setSystemMsg('需要BFL Key');
    if(batchImages.length===0) return setSystemMsg('请先上传图片');
    const w=batchParams?.expandWidth||1024;
    const h=batchParams?.expandHeight||1024;
    const mode=batchParams?.expandMode||'high';
    setIsGenerating(true);setSystemMsg('扩展画布中('+w+'x'+h+','+mode+') 0/'+batchImages.length+'...');
    const results=[];
    for(let i=0;i<batchImages.length;i++){
      try{const r=await BFL_OUTPAINT_API(batchImages[i].data,'expand canvas, fill background naturally',w,h,bflKey,{mode});
        results.push({...batchImages[i],data:r.image_data,processed:true,expanded:true});
        setSystemMsg('扩展画布 '+(i+1)+'/'+batchImages.length);
      }catch(e){results.push({...batchImages[i],error:true});setSystemMsg('第'+(i+1)+'张失败:'+e.message)}
    }
    setBatchImages(results);
    const ok=results.filter(r=>!r.error);
    if(ok.length){const item={id:Date.now(),data:ok[0].data,prompt:'扩展画布',type:'batch',name:'扩展画布'+ok.length+'张('+w+'x'+h+')',modelConfig:{}};setCurrentImage(ok[0].data);setHistory(prev=>[item,...prev])}
    setSystemMsg('扩展画布完成：'+ok.length+'/'+batchImages.length+'张 ('+w+'x'+h+')');
    setIsGenerating(false);
  },[batchImages,batchParams]);
  const handleSaveTemplate = useCallback(()=>{
    const name=window.prompt('模板名称:','品牌模板'+Date.now());
    if(!name||!name.trim()) return;
    const tpl={id:Date.now(),name:name.trim(),savedAt:new Date().toISOString(),
      config:{floralStyle,material,colors,textLighting,textCommercialMaterial,textCamera,textBackground,aspectRatio,selectedStyle}};
    const existing=JSON.parse(localStorage.getItem('vedaartBrandTemplates')||'[]');
    existing.unshift(tpl);
    if(existing.length>20) existing.length=20;
    localStorage.setItem('vedaartBrandTemplates',JSON.stringify(existing));
    setSystemMsg('模板已保存: '+name.trim()+' (共'+existing.length+'个模板)');
  },[floralStyle,material,colors,textLighting,textCommercialMaterial,textCamera,textBackground,aspectRatio,selectedStyle]);
  const handleStyleUnify = useCallback(async ()=>{
    const key=photoKey||localStorage.getItem('vedaartPhotoroomApiKey');
    if(!key) return setSystemMsg('需要Photoroom Key');
    if(batchImages.length===0) return setSystemMsg('请先上传图片');
    const templates=JSON.parse(localStorage.getItem('vedaartBrandTemplates')||'[]');
    if(templates.length===0) return setSystemMsg('请先保存品牌模板');
    const ti=batchParams?.templateIndex||0;
    if(ti<0||ti>=templates.length) return setSystemMsg('无效模板编号');
    const tpl=templates[ti].config;
    const toneMap={'暖色调':'warm lighting, golden tone','冷色调':'cool lighting, blue tone','中性纯白':'clean white background, neutral lighting','莫兰迪低饱和':'morandi muted tones, low saturation','高级黑金':'luxury black and gold tone','ins冷淡风':'minimalist ins style, clean aesthetic','复古胶片色调':'vintage film tone, warm retro'};
    const styleMap=['realistic flat design','geometric luxury design','chinese ink painting style','forest wild style','impressionist light and shadow','ukiyo-e line art','surreal liquid style','deconstructed paper cut','zen brush style','pop art color clash'];
    const matMap=['default material','organza fabric','frosted glass','metallic','velvet','liquid metal','3D clay','silk satin','frost fleece'];
    const sceneParts=[];
    if(tpl.textLighting) sceneParts.push(toneMap[tpl.textLighting]||'professional studio lighting');
    if(tpl.textCamera) sceneParts.push(tpl.textCamera+' view');
    if(tpl.textBackground) sceneParts.push(tpl.textBackground+' composition');
    if(tpl.floralStyle>0) sceneParts.push(styleMap[tpl.floralStyle]||'');
    if(tpl.material>0) sceneParts.push(matMap[tpl.material]||'');
    if(tpl.colors?.length){const hexes=tpl.colors.filter(c=>c.weight>10).map(c=>c.hex).join(', ');if(hexes)sceneParts.push('color palette: '+hexes)}
    const scenePrompt=sceneParts.filter(Boolean).join(', ')||'professional product photography, clean background, studio lighting';
    setIsGenerating(true);setSystemMsg('风格统一中('+templates[ti].name+')... 0/'+batchImages.length);
    const results=[];
    for(let i=0;i<batchImages.length;i++){
      try{const r=await PHOTOROOM_SCENE(batchImages[i].data,scenePrompt,key);
        const r2=await PHOTOROOM_EDIT_V2(r.image_data,key,{shadowMode:'ai.soft',bgColor:'FFFFFF',padding:0.05});
        results.push({...batchImages[i],data:r2.image_data,processed:true,unified:true});
        setSystemMsg('风格统一 '+(i+1)+'/'+batchImages.length);
      }catch(e){results.push({...batchImages[i],error:true});setSystemMsg('第'+(i+1)+'张失败:'+e.message)}
    }
    setBatchImages(results);
    const ok=results.filter(r=>!r.error);
    if(ok.length){const item={id:Date.now(),data:ok[0].data,prompt:'风格统一',type:'batch',name:'风格统一'+ok.length+'张('+templates[ti].name+')',modelConfig:{}};setCurrentImage(ok[0].data);setHistory(prev=>[item,...prev])}
    setSystemMsg('风格统一完成：'+ok.length+'/'+batchImages.length+'张 ('+templates[ti].name+')');
    setIsGenerating(false);
  },[batchImages,photoKey,batchParams]);
  const handlePresetExport = useCallback(()=>{
    if(batchImages.length===0) return setSystemMsg('请先上传图片');
    const platforms=[
      {key:'amazon',label:'亚马逊',w:2000,h:2000},
      {key:'shopify',label:'独立站',w:1200,h:1200},
      {key:'tiktok',label:'TikTok',w:1080,h:1080},
      {key:'facebook',label:'Facebook',w:1200,h:628},
      {key:'xiaohongshu',label:'小红书',w:1080,h:1440},
      {key:'instagram',label:'Instagram',w:1080,h:1350},
    ];
    const pp=batchParams?.presetPlatforms||{};
    const selected=platforms.map((p,i)=>pp[p.key]?i:-1).filter(i=>i>=0);
    if(selected.length===0) return setSystemMsg('请至少勾选一个导出平台');
    const ok=batchImages.filter(img=>!img.error);
    if(ok.length===0) return setSystemMsg('没有可导出的图片');
    const total=ok.length*selected.length;
    setSystemMsg('开始导出 '+total+' 张 (0/'+total+')...');
    let done=0;
    selected.forEach((pi)=>{
      const p=platforms[pi];
      ok.forEach((img,i)=>{
        const canvas=document.createElement('canvas');
        canvas.width=p.w;canvas.height=p.h;
        const ctx=canvas.getContext('2d');
        ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,p.w,p.h);
        const el=new Image();
        el.onload=()=>{
          const r=Math.min(p.w/el.width,p.h/el.height);
          const dw=el.width*r,dh=el.height*r;
          ctx.drawImage(el,(p.w-dw)/2,(p.h-dh)/2,dw,dh);
          canvas.toBlob(blob=>{
            const url=URL.createObjectURL(blob);
            const a=document.createElement('a');
            a.href=url;
            a.download=p.label+'_'+String(i+1).padStart(3,'0')+'_'+p.w+'x'+p.h+'.png';
            a.click();
            URL.revokeObjectURL(url);
            done++;setSystemMsg('导出 '+done+'/'+total+' ('+p.label+' '+p.w+'x'+p.h+')');
            if(done===total) setSystemMsg('预设导出完成：'+total+'张 ('+selected.map(si=>platforms[si].label).join('+')+')');
          },'image/png');
        };
        el.src=img.data;
      });
    });
  },[batchImages,batchParams]);

  // ── Ideogram 图像设计 ──
  // 模块分类中文选项映射为英文 prompt
  const buildModulePrompt = useCallback((mod)=>{
    if(!mod) return '';
    const map={
      theme:{'自然风':'nature theme','咖啡风':'coffee theme','露营风':'camping theme','橄榄风':'olive theme','垂钓风':'fishing theme','健身风':'fitness theme','萌犬':'cute dog theme','猫咪':'cat theme','西部复古':'western vintage theme','万圣节':'halloween theme','圣诞节':'christmas theme'},
      artStyle:{'复古做旧':'vintage distressed style','千禧复古':'millennial retro style','街头潮牌':'streetwear style','植物森系':'botanical forest style','轻奢高级':'luxury premium style','极简简约':'minimalist style','Y2K 千禧辣妹风':'Y2K millennial hot girl style'},
      fontStyle:{'衬线字体':'serif font','无衬线字体':'sans-serif font','毛笔笔触字体':'brush calligraphy font','手写花体':'handwritten script font','哥特粗体':'gothic bold font','模板镂空字体':'stencil font','等宽字体':'monospace font'},
      layout:{'居中构图':'centered composition','徽章式':'badge style layout','拱形环绕':'arched surrounding layout','圆形构图':'circular composition','上下堆叠':'vertical stacked layout','后背印花版式':'back print layout'},
      texture:{'干净平整':'clean flat texture','磨损做旧':'worn distressed texture','裂纹肌理':'cracked texture','复古油墨质感':'vintage ink texture','半色调网点':'halftone dot texture'},
      decoration:{'橄榄枝':'olive branch','花卉':'floral flowers','山峦':'mountains','太阳':'sun','丝带绶带':'ribbon banner','徽章':'badge','星星':'stars'},
      colorScheme:{'大地色系':'earth tone palette','复古色系':'retro color palette','单色系':'monochrome palette','暖色调':'warm tone palette','冷色调':'cool tone palette','低饱和莫兰迪色系':'muted morandi palette'},
    };
    const parts=[];
    Object.keys(mod).forEach(k=>{if(mod[k]&&map[k]&&map[k][mod[k]])parts.push(map[k][mod[k]])});
    return parts.join(', ');
  },[]);

  // 字体设计中文选项映射为英文 prompt
  const buildTypographyPrompt = useCallback((typo)=>{
    if(!typo) return '';
    const map={
      fontStyle:{'复古风':'retro font style','现代简约':'modern minimalist font','西部美式':'western american font','轻奢质感':'luxury font','毛笔手写':'brush handwritten font','花体草书':'cursive script font','植物森系':'botanical font','运动竞技':'sports font','镂空模板':'stencil font','等宽字体':'monospace font'},
      fontWeight:{'超细':'ultra thin weight','细体':'thin weight','常规':'regular weight','中等':'medium weight','半粗':'semi bold weight','粗体':'bold weight','超粗黑':'ultra black weight'},
      fontWidth:{'紧缩窄体':'condensed narrow width','标准常规':'standard width','加宽舒展':'extended wide width'},
      caseFormat:{'全大写':'all uppercase letters','全小写':'all lowercase letters','首字母大写':'title case','小型大写字母':'small caps'},
      alignment:{'左对齐':'left aligned','居中对齐':'center aligned','右对齐':'right aligned','两端对齐':'justified alignment','弧形排布':'arc arrangement','环形环绕':'circular surrounding'},
      typography:{'单行':'single line layout','上下堆叠':'vertical stacked layout','徽章版式':'badge layout','拱形环绕':'arched layout','波浪排布':'wavy layout','圆形版式':'circular layout','盾牌徽章':'shield badge layout'},
      letterSpacing:{'紧凑':'tight letter spacing','标准':'standard letter spacing','宽松':'loose letter spacing'},
      lineHeight:{'紧凑行距':'tight line height','标准行距':'standard line height','宽松行距':'loose line height'},
      stroke:{'无描边':'no stroke','细描边':'thin stroke','粗描边':'thick stroke','双层描边':'double stroke'},
      shadow:{'平面无阴影':'flat no shadow','长投影':'long shadow','下落阴影':'drop shadow','偏移阴影':'offset shadow'},
      texture:{'干净平整':'clean flat texture','磨损做旧':'worn distressed texture','裂纹肌理':'cracked texture','复古油墨':'vintage ink texture','斑驳脏旧':'mottled dirty texture','杂色噪点':'noise grain texture','半色调网点':'halftone dot texture'},
      decoration:{'横幅飘带':'banner ribbon','星星':'stars','枝叶':'leaves branches','花卉':'floral','绳纹':'rope pattern','边框':'border frame','缎带':'ribbon','徽章':'badge'},
      textEffect:{'扭曲变形':'distorted text','外轮廓描边':'outline stroke text','立体挤压':'extruded 3D text','浮雕凸起':'embossed relief text','3D 立体':'3D stereoscopic text','金属镀铬':'chrome plating text','霓虹发光':'neon glow text'},
    };
    const parts=[];
    Object.keys(typo).forEach(k=>{if(typo[k]&&map[k]&&map[k][typo[k]])parts.push(map[k][typo[k]])});
    return parts.join(', ');
  },[]);

  // 文生图设计（精准文字渲染）
  const handleIdeogramGenerate = useCallback(async ()=>{
    const key=ideoKey||localStorage.getItem('vedaartIdeogramApiKey');
    if(!key) return setSystemMsg('需要Ideogram Key');
    if(!prompt.trim()) return setSystemMsg('请先输入提示词');
    setIsGenerating(true);setSystemMsg('Ideogram 设计中...');
    try{
      // 主提示词 = 用户输入的 prompt + 模块分类 + 字体设计
      const modPrompt=buildModulePrompt(batchParams?.ideoModule);
      const typoPrompt=buildTypographyPrompt(batchParams?.ideoTypography);
      const extraParts=[prompt.trim()];
      if(modPrompt)extraParts.push(modPrompt);
      if(typoPrompt)extraParts.push(typoPrompt);
      const finalPrompt=extraParts.join(', ');
      // 负面提示词 = 用户输入的负面提示词
      const negPrompt=negativePrompt||'';
      const r=await IDEOGRAM_GENERATE_API(finalPrompt,key,{
        aspectRatio:batchParams?.ideoAspect||'ASPECT_1_1',
        model:batchParams?.ideoModel||'V_2',
        styleType:batchParams?.ideoStyle||'GENERAL',
        magicPromptOption:batchParams?.ideoMagicPrompt||'AUTO',
        negativePrompt:negPrompt,
      });
      const item={id:Date.now(),data:r.image_data,prompt:finalPrompt,type:'ideogram',name:'文生设计',modelConfig:{model:batchParams?.ideoModel,aspect:batchParams?.ideoAspect}};
      setCurrentImage(r.image_data);
      setHistory(prev=>[item,...prev]);
      setSystemMsg('文生设计完成');
    }catch(e){setSystemMsg('文生设计失败:'+e.message)}
    finally{setIsGenerating(false)}
  },[prompt,negativePrompt,ideoKey,batchParams]);

  // DeepSeek 仅修改产品名称
  const handleEcommerceNameEnhance = useCallback(async ()=>{
    if(!deepKey) return setSystemMsg('请先配置 DeepSeek API Key');
    const productName=batchParams?.ecProductName||'';
    const category=batchParams?.ecCategory||'服装';
    if(!productName.trim()) return setSystemMsg('请先输入产品名称');
    setIsGenerating(true);
    setSystemMsg('DeepSeek 正在优化名称...');
    try{
      const r=await DEEPSEEK_DIRECT_API([{role:'system',content:'你是电商产品命名专家。优化产品名称使其更专业、更吸引人（10-20字）。只返回JSON：{"name":"优化后的产品名称"}'},{role:'user',content:`产品名称：${productName}\n类别：${category}\n请优化产品名称。`}],deepKey);
      const p=JSON.parse(r);
      if(p.name){
        setBatchParams(prev=>({...prev,ecProductName:p.name}));
        setSystemMsg('名称已优化：'+p.name);
      }else{setSystemMsg('未返回有效内容')}
    }catch(e){setSystemMsg('优化失败:'+e.message)}
    finally{setIsGenerating(false)}
  },[deepKey,batchParams,setBatchParams,setSystemMsg]);

  // DeepSeek 生成SKU编码
  const handleEcommerceSkuGenerate = useCallback(async ()=>{
    if(!deepKey) return setSystemMsg('请先配置 DeepSeek API Key');
    const productName=batchParams?.ecProductName||'';
    const category=batchParams?.ecCategory||'服装';
    if(!productName.trim()) return setSystemMsg('请先输入产品名称');
    setIsGenerating(true);
    setSystemMsg('DeepSeek 正在生成SKU...');
    try{
      const r=await DEEPSEEK_DIRECT_API([{role:'system',content:'你是电商SKU编码专家。根据产品名称和类别生成SKU编码（大写字母+数字，8-12位）。只返回JSON：{"sku":"SKU编码"}'},{role:'user',content:`产品名称：${productName}\n类别：${category}\n请生成SKU编码。`}],deepKey);
      const p=JSON.parse(r);
      if(p.sku){
        setBatchParams(prev=>({...prev,ecSku:p.sku}));
        setSystemMsg('SKU已生成：'+p.sku);
      }else{setSystemMsg('未返回有效内容')}
    }catch(e){setSystemMsg('生成失败:'+e.message)}
    finally{setIsGenerating(false)}
  },[deepKey,batchParams,setBatchParams,setSystemMsg]);

  // DeepSeek 仅生成卖点（不修改名称）
  const handleEcommerceSellingPoints = useCallback(async ()=>{
    if(!deepKey) return setSystemMsg('请先配置 DeepSeek API Key');
    const productName=batchParams?.ecProductName||'';
    const category=batchParams?.ecCategory||'服装';
    const raw=batchParams?.ecDescription||'';
    if(!productName.trim()&&!raw.trim()) return setSystemMsg('请先输入产品名称或描述');
    setIsGenerating(true);
    setSystemMsg('DeepSeek 正在生成卖点...');
    try{
      const r=await DEEPSEEK_DIRECT_API([{role:'system',content:'你是电商文案专家。根据产品信息生成5个精炼卖点（每个8-15字）。只返回JSON：{"description":"卖点1, 卖点2, 卖点3, 卖点4, 卖点5"}'},{role:'user',content:`产品名称：${productName||'无'}\n类别：${category}\n描述：${raw||'无'}\n请生成5个卖点。`}],deepKey);
      const p=JSON.parse(r);
      if(p.description){
        setBatchParams(prev=>({...prev,ecDescription:p.description}));
        setSystemMsg('卖点已生成：'+p.description.slice(0,30)+'...');
      }else{
        setSystemMsg('未返回有效内容');
      }
    }catch(e){setSystemMsg('生成失败:'+e.message)}
    finally{setIsGenerating(false)}
  },[deepKey,batchParams,setBatchParams,setSystemMsg]);

  // DeepSeek 优化电商产品名称+卖点
  const handleEcommerceDescEnhance = useCallback(async ()=>{
    if(!deepKey) return setSystemMsg('请先配置 DeepSeek API Key');
    const productName=batchParams?.ecProductName||'';
    const category=batchParams?.ecCategory||'服装';
    const raw=batchParams?.ecDescription||'';
    if(!productName.trim()&&!raw.trim()) return setSystemMsg('请先输入产品名称或描述');
    setIsGenerating(true);
    setSystemMsg('DeepSeek 正在优化名称与卖点...');
    try{
      const r=await DEEPSEEK_DIRECT_API([{role:'system',content:'你是电商文案专家。根据产品信息优化产品名称并生成5个精炼卖点（每个8-15字）。只返回JSON：{"name":"优化后的产品名称","description":"卖点1, 卖点2, 卖点3, 卖点4, 卖点5"}'},{role:'user',content:`产品名称：${productName||'无'}\n类别：${category}\n描述：${raw||'无'}\n请优化产品名称并生成5个卖点。`}],deepKey);
      const p=JSON.parse(r);
      if(p.name||p.description){
        setBatchParams(prev=>({...prev,ecProductName:p.name||prev.ecProductName,ecDescription:p.description||prev.ecDescription}));
        setSystemMsg('已优化：'+(p.name||'')+' / '+(p.description||'').slice(0,30)+'...');
      }else{
        setSystemMsg('未返回有效内容');
      }
    }catch(e){setSystemMsg('优化失败:'+e.message)}
    finally{setIsGenerating(false)}
  },[deepKey,batchParams,setBatchParams,setSystemMsg]);

  // 电商详情页方案生成（调用14个skill引擎，支持图片分析）
  const handleEcommercePlanGenerate = useCallback(async ()=>{
    const productName=batchParams?.ecProductName||archiveTitle||'产品';
    const category=batchParams?.ecCategory||'服装';
    const description=batchParams?.ecDescription||prompt||'';
    const platform=batchParams?.platform||'amazon';
    const style=batchParams?.ecStyle||'modern';
    if(!productName.trim()) return setSystemMsg('请输入产品名称');
    const imgs=ecRefImages.filter(Boolean);
    if(imgs.length===0) return setSystemMsg('请上传1-8张产品图片');
    setIsGenerating(true);
    setSystemMsg('正在分析产品图片...');
    let analysisExtra={};
    // 如果有上传图片，调用Gemini视觉API分析产品
    try{
      const sysPrompt=`你是电商产品分析专家。请分析产品图片，提取以下信息。只返回JSON，不要其他内容：{"material":"材质(金属/塑料/木质/棉麻/皮革/丝绸/玻璃/陶瓷/待识别)","style":"风格(现代/复古/极简/奢华/运动/可爱)","sellingPoints":["卖点1","卖点2","卖点3"],"dimensions":"尺寸规格(如无则空)","useCases":["使用场景1","使用场景2"]}`;
      const messages=[
        {role:'system',content:sysPrompt},
        {role:'user',content:`产品名称：${productName}，类别：${category}，描述：${description}。请分析图片并提取产品属性。`,images:imgs},
      ];
      const text=await GEMINI_CHAT_API(messages,'gemini-2.5-flash');
      if(text){
        const match=text.match(/\{[\s\S]*\}/);
        if(match) analysisExtra=JSON.parse(match[0]);
      }
    }catch(e){console.warn('Image analysis failed',e.message)}
    setSystemMsg('正在生成方案（14个skill引擎）...');
    // 生成方案，合并图片分析结果
    const plan=generateDetailPlan(productName,category,description,[],platform,style);
    // 合并Gemini分析结果到产品分析
    if(analysisExtra.material&&analysisExtra.material!=='待识别') plan.analysis.material=analysisExtra.material;
    if(analysisExtra.style) plan.analysis.style=analysisExtra.style;
    if(analysisExtra.sellingPoints&&analysisExtra.sellingPoints.length>0) plan.analysis.sellingPoints=analysisExtra.sellingPoints;
    if(analysisExtra.dimensions) plan.analysis.dimensions=analysisExtra.dimensions;
    if(analysisExtra.useCases&&analysisExtra.useCases.length>0) plan.analysis.useCases=analysisExtra.useCases;
    // 如果材质/风格变了，重新生成配色和字体
    if(analysisExtra.style){
      plan.colors=generateColorScheme(plan.analysis.style,plan.analysis.category,platform);
      plan.typography=generateTypography(plan.analysis.style,platform,plan.colors);
    }
    setEcPlan(plan);
    setSystemMsg('方案已生成：'+plan.pages.length+'个模块（平台:'+platform+' 风格:'+plan.analysis.style+' 类别:'+category+' 材质:'+plan.analysis.material+'）');
    setIsGenerating(false);
  },[archiveTitle,prompt,batchParams,ecRefImages]);

  // 电商详情页图片生成（基于已生成方案，循环调用Gemini 2.5 Flash Image）
  const handleEcommerceDetailGenerate = useCallback(async ()=>{
    const productName=batchParams?.ecProductName||archiveTitle||'产品';
    const category=batchParams?.ecCategory||'服装';
    const description=batchParams?.ecDescription||prompt||'';
    const platform=batchParams?.platform||'amazon';
    const style=batchParams?.ecStyle||'modern';
    if(!productName.trim()) return setSystemMsg('请输入产品名称');
    // 使用已有方案或重新生成
    const plan=ecPlan||generateDetailPlan(productName,category,description,[],platform,style);
    const pages=plan.pages||[];
    const total=pages.length;
    if(total===0) return setSystemMsg('未生成任何模块');
    // 收集用户上传的产品参考图（作为 AI 生图的视觉参考）
    const productRefs=(refImages||[]).filter(Boolean);
    setSystemMsg('详情页生成中 0/'+total+'（产品:'+productName+' 平台:'+platform+' 模块:'+total+'个）...');
    setIsGenerating(true);
    const specs=plan.specs||getPlatformSpecs(platform);
    const aspectDesc=specs.canvas?(specs.canvas[0]+'x'+specs.canvas[1]+' pixels, aspect ratio '+(specs.canvas[0]/specs.canvas[1]).toFixed(2)):'1:1 square';
    // 循环调用 Gemini 2.5 Flash Image 生成每个模块图片（传入产品参考图）
    const results=[];
    for(let i=0;i<total;i++){
      const mod=pages[i];
      try{
        // 每个模块用高度差异化的提示词 + 产品参考图
        const brandParts=[mod.prompt];
        if(plan.colors){
          const c=plan.colors;
          brandParts.push('color palette: primary '+c.primary+', accent '+c.accent+', background '+c.background);
        }
        // 按模块类型注入差异化文案（来自 copywriting engine）
        if(plan.copy){
          if(mod.type==='hero'&&plan.copy.hero){brandParts.push('headline: "'+plan.copy.hero.headline+'"');brandParts.push('subline: "'+plan.copy.hero.subheadline+'"')}
          if(mod.type==='features'&&plan.copy.features){const top=plan.copy.features.slice(0,3);brandParts.push('key features: '+top.map(f=>f.title+' - '+f.desc).join('; '))}
          if(mod.type==='lifestyle'&&plan.copy.benefits){brandParts.push('benefits: '+plan.copy.benefits.map(b=>b.desc).join(', '))}
          if(plan.copy.cta)brandParts.push('call to action: "'+plan.copy.cta+'"');
        }
        brandParts.push('canvas: '+aspectDesc);
        if(mod.negativePrompt)brandParts.push('avoid: '+mod.negativePrompt);
        const finalPrompt=brandParts.join(', ');
        // 关键：把用户上传的产品图作为参考传入，让 AI 知道产品长什么样
        const r=await GEMINI_DIRECT_API(finalPrompt,productRefs,geminiKey,'gemini-2.5-flash-image');
        results.push({id:Date.now()+i,data:r.image_data,processed:true,scene:true,name:(i+1)+'.'+mod.title,prompt:finalPrompt,moduleType:mod.type});
        setSystemMsg('详情页 '+(i+1)+'/'+total+' ['+mod.title+'] 完成');
      }catch(e){results.push({id:Date.now()+i,error:true,name:(i+1)+'.'+mod.title});setSystemMsg('第'+(i+1)+'张['+mod.title+']失败:'+e.message)}
    }
    // Step 4: 结果显示在画布网格，第一张设为当前图并加入历史栏
    setBatchImages(results);
    const ok=results.filter(r=>!r.error);
    if(ok.length){
      const item={id:Date.now(),data:ok[0].data,prompt:productName+' 详情页 '+total+'模块',type:'ecommerce',name:productName+'详情页',modelConfig:{model:'gemini-2.5-flash-image',platform,category,style}};
      setCurrentImage(ok[0].data);
      setHistory(prev=>[item,...prev]);
    }
    setSystemMsg('详情页生成完成：'+ok.length+'/'+total+'张成功（平台:'+platform+' 风格:'+style+'）');
    setIsGenerating(false);
  },[archiveTitle,prompt,geminiKey,batchParams,ecPlan,refImages]);

  // 图像 Remix 编辑（基于上传图片重新设计）
  const handleIdeogramRemix = useCallback(async ()=>{
    const key=ideoKey||localStorage.getItem('vedaartIdeogramApiKey');
    if(!key) return setSystemMsg('需要Ideogram Key');
    if(batchImages.length===0) return setSystemMsg('请先上传图片');
    setIsGenerating(true);setSystemMsg('Ideogram Remix 中 0/'+batchImages.length+'...');
    const results=[];
    for(let i=0;i<batchImages.length;i++){
      try{
        const p=batchImages[i].name?('redesign with modern aesthetic, enhance visual appeal, professional product photography style: '+batchImages[i].name):'redesign with modern aesthetic, professional layout';
        const modPrompt=buildModulePrompt(batchParams?.ideoModule);
        const typoPrompt=buildTypographyPrompt(batchParams?.ideoTypography);
        const extraParts=[p];
        if(modPrompt)extraParts.push(modPrompt);
        if(typoPrompt)extraParts.push(typoPrompt);
        const finalPrompt=extraParts.join(', ');
        const r=await IDEOGRAM_REMIX_API(batchImages[i].data,finalPrompt,key,{
          aspectRatio:batchParams?.ideoAspect||'ASPECT_1_1',
          model:batchParams?.ideoModel||'V_2',
          imageWeight:batchParams?.ideoImageWeight??50,
          magicPromptOption:batchParams?.ideoMagicPrompt||'AUTO',
          negativePrompt:batchParams?.ideoNegativePrompt||'',
        });
        results.push({...batchImages[i],data:r.image_data,processed:true,remix:true});
        setSystemMsg('Ideogram Remix '+(i+1)+'/'+batchImages.length);
      }catch(e){results.push({...batchImages[i],error:true});setSystemMsg('第'+(i+1)+'张失败:'+e.message)}
    }
    setBatchImages(results);
    const ok=results.filter(r=>!r.error);
    if(ok.length){const item={id:Date.now(),data:ok[0].data,prompt:'Ideogram Remix',type:'batch',name:'Remix'+ok.length+'张',modelConfig:{}};setCurrentImage(ok[0].data);setHistory(prev=>[item,...prev])}
    setSystemMsg('Ideogram Remix 完成：'+ok.length+'/'+batchImages.length+'张');
    setIsGenerating(false);
  },[batchImages,ideoKey,batchParams]);

  // 图像放大高清
  const handleIdeogramUpscale = useCallback(async ()=>{
    const key=ideoKey||localStorage.getItem('vedaartIdeogramApiKey');
    if(!key) return setSystemMsg('需要Ideogram Key');
    if(batchImages.length===0) return setSystemMsg('请先上传图片');
    setIsGenerating(true);setSystemMsg('Ideogram 放大高清中 0/'+batchImages.length+'...');
    const results=[];
    for(let i=0;i<batchImages.length;i++){
      try{
        const r=await IDEOGRAM_UPSCALE_API(batchImages[i].data,key);
        results.push({...batchImages[i],data:r.image_data,processed:true,upscaled:true});
        setSystemMsg('放大高清 '+(i+1)+'/'+batchImages.length);
      }catch(e){results.push({...batchImages[i],error:true});setSystemMsg('第'+(i+1)+'张失败:'+e.message)}
    }
    setBatchImages(results);
    const ok=results.filter(r=>!r.error);
    if(ok.length){const item={id:Date.now(),data:ok[0].data,prompt:'放大高清',type:'batch',name:'放大高清'+ok.length+'张',modelConfig:{}};setCurrentImage(ok[0].data);setHistory(prev=>[item,...prev])}
    setSystemMsg('放大高清完成：'+ok.length+'/'+batchImages.length+'张');
    setIsGenerating(false);
  },[batchImages,ideoKey]);

  const handleBgRemove = useCallback(async () => {
    const key=photoKey||localStorage.getItem('vedaartPhotoroomApiKey');
    if(!key||!currentImage) return setSystemMsg('需要Photoroom Key和当前图片');
    setIsGenerating(true);setSystemMsg('背景移除中...');
    try{const r=await PHOTOROOM_BG_REMOVE(currentImage,key);
      const item={id:Date.now(),data:r.image_data,prompt:'背景移除',type:'bgremove',name:'BG Remove',modelConfig:{}};
      setCurrentImage(r.image_data);setHistory(prev=>[item,...prev]);setSystemMsg('背景移除完成');
    }catch(e){setSystemMsg('背景移除:'+e.message)}finally{setIsGenerating(false)}
  },[currentImage,photoKey]);
  const handleImageEdit = useCallback(async (customPrompt) => {
    const key=geminiKey||localStorage.getItem('vedaartGeminiApiKey');
    if(!key||!currentImage) return setSystemMsg('需要Gemini Key和当前图片');
    const editPrompt=customPrompt||prompt||'edit this image';
    setIsGenerating(true);setSystemMsg('图片编辑中...');
    try{const r=await GEMINI_DIRECT_API(editPrompt,[currentImage],key,geminiModel);
      const item={id:Date.now(),data:r.image_data,prompt:editPrompt,type:'inpaint',name:'Edit',modelConfig:{}};
      setCurrentImage(r.image_data);setHistory(prev=>[item,...prev]);setSystemMsg('图片编辑完成');
    }catch(e){setSystemMsg('图片编辑:'+e.message)}finally{setIsGenerating(false)}
  },[currentImage,prompt,geminiKey,geminiModel]);
  const handleBatchGenerate = useCallback(async () => {
    if(!currentKey||selectedApi!=='gemini') return setSystemMsg('批量生成仅支持Gemini');
    const base=buildFullPrompt();if(!base) return setSystemMsg('请输入提示词');
    setIsGenerating(true);setSystemMsg('批量生成提交中...');
    try{
      const prompts=[base+'。变体1',base+'。变体2',base+'。变体3',base+'。变体4'];
      const result=await GEMINI_BATCH_API(prompts,currentKey,geminiModel);
      const images=[];if(result.responses)for(const r of result.responses){if(r.candidates)for(const p of r.candidates[0]?.content?.parts||[]){if(p.inlineData?.data)images.push('data:image/png;base64,'+p.inlineData.data)}}
      if(images.length){images.forEach(img=>{const item={id:Date.now()+Math.random(),data:img,prompt:base,type:'batch',name:'Batch',modelConfig:{}};setHistory(prev=>[item,...prev])});setCurrentImage(images[0]);setSystemMsg('批量完成:'+images.length+'张')}else setSystemMsg('批量生成:无结果')
    }catch(e){setSystemMsg('批量生成错误:'+e.message)}finally{setIsGenerating(false)}
  },[currentKey,selectedApi,geminiModel,buildFullPrompt]);
  const handleAddRefSlot = () => { if(refSlotCount<8){setRefSlotCount(s=>s+1);setRefImages(p=>[...p,null])} };
  const handleRemoveRefSlot = () => { if(refSlotCount>1){setRefSlotCount(s=>s-1);setRefImages(p=>p.slice(0,-1))} };
  const handleSelectRef = (idx) => { if(idx>=0){setActiveRefIndex(idx);setViewMode('reference');setCurrentImage(refImages[idx]||null)} };

  return (
    <div className="vedaart-shell bg-[#070810] text-slate-300 font-sans studio-compact">
      <TopMenu onMenuAction={handleMenuAction} apiProvider={selectedApi} onToggleApiSettings={()=>setShowApiSettings(!showApiSettings)}/>
      {showApiSettings&&(
        <div className="api-modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setShowApiSettings(false)}>
          <div className="api-modal">
            <div className="h-11 px-4 flex items-center justify-between border-b border-[#343740] bg-[#1c1e27]"><span className="text-xs font-black text-white">API Config</span><button onClick={()=>setShowApiSettings(false)} className="w-7 h-7 text-slate-400 hover:text-white">&times;</button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 panel-scroll">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Provider</label><select value={selectedApi} onChange={e=>setSelectedApi(e.target.value)} className="archive-field mt-1"><option value="gemini">Gemini</option><option value="bfl">BFL FLUX.2</option><option value="doubao">Doubao</option></select></div>
              {selectedApi==='gemini'&&<div><label className="text-[10px] font-bold text-slate-500">Gemini Key</label><input type="password" value={geminiKey} onChange={e=>setGeminiKey(e.target.value)} onBlur={e=>localStorage.setItem('vedaartGeminiApiKey',e.target.value)} className="archive-field mt-1" placeholder="AIza..."/></div>}
              {selectedApi==='bfl'&&<div><label className="text-[10px] font-bold text-slate-500">BFL Key</label><input type="password" value={bflKey} onChange={e=>setBflKey(e.target.value)} onBlur={e=>localStorage.setItem('vedaartBflApiKey',e.target.value)} className="archive-field mt-1" placeholder="pk-..."/></div>}
              <div className="border-t border-[#2b2e34] pt-3 mb-3"><label className="text-[10px] font-bold text-slate-500">Photoroom Key</label><input type="password" value={photoKey} onChange={e=>setPhotoKey(e.target.value)} onBlur={e=>localStorage.setItem('vedaartPhotoroomApiKey',e.target.value)} className="archive-field mt-1" placeholder="pr-..."/><div className="text-[9px] text-slate-500 mt-1">AI抠图 · 场景合成</div></div>

              <div className="border-t border-[#2b2e34] pt-3"><label className="text-[10px] font-bold text-slate-500">Ideogram Key</label><input type="password" value={ideoKey} onChange={e=>setIdeoKey(e.target.value)} onBlur={e=>localStorage.setItem('vedaartIdeogramApiKey',e.target.value)} className="archive-field mt-1" placeholder="..."/><div className="text-[9px] text-slate-500 mt-1">图像设计 · 文字渲染 · Remix · 放大高清</div></div>

              <div className="border-t border-[#2b2e34] pt-3"><label className="text-[10px] font-bold text-slate-500">DeepSeek Key</label><input type="password" value={deepKey} onChange={e=>setDeepKey(e.target.value)} onBlur={e=>localStorage.setItem('vedaartDeepseekApiKey',e.target.value)} className="archive-field mt-1" placeholder="sk-..."/><div className="text-[9px] text-slate-500 mt-1">For product naming &amp; prompt rewrite</div></div>
            </div>
          </div>
        </div>
      )}
      {systemMsg&&<div className="fixed top-8 left-1/2 -translate-x-1/2 bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-3 rounded-2xl text-xs font-bold z-[200] flex items-center gap-4"><span>{systemMsg}</span><button onClick={()=>setSystemMsg('')} className="hover:text-white">&times;</button></div>}
      <div className={`vedaart-workspace ${!leftPanelOpen?'left-collapsed':''} ${!rightPanelOpen?'right-collapsed':''} ${activeTab==='archive'?'center-collapsed':''}`}>
        <div className={`left-workspace-column ${!leftPanelOpen?'panel-collapsed':''}`}>
          <LeftRail activeTab={activeTab} setActiveTab={setActiveTab} onNewArchive={()=>{setArchiveTitle("");setArchiveSku("");setActiveTab("generate")}} onOpenFile={()=>{const i=document.createElement("input");i.type="file";i.accept=".json,image/*";i.onchange=e=>{const f=e.target.files[0];if(!f)return;if(f.name.endsWith(".json")){restoreWorkspaceBackup((c2,e)=>setSystemMsg(e||"Restored "+c2+" items"))}else{const r=new FileReader();r.onload=()=>{setPrompt("Generate floral pattern from reference");setSystemMsg("Image loaded")};r.readAsDataURL(f)}};i.click()}} onSave={()=>exportWorkspaceBackup(history)} onExport={()=>exportWorkspaceBackup(history)}/>
          <LeftPanel activeTab={activeTab} setActiveTab={setActiveTab} isOpen={leftPanelOpen} onClose={()=>setLeftPanelOpen(false)} prompt={prompt} setPrompt={setPrompt} selectedApi={selectedApi} setSelectedApi={setSelectedApi} archiveTitle={archiveTitle} setArchiveTitle={setArchiveTitle} archiveSku={archiveSku} setArchiveSku={setArchiveSku} onDeepseekName={handleDeepseekName} isNaming={isNaming} onGenerate={activeTab==='edit'?handleImg2Img:handleText2Image} isGenerating={isGenerating} hasApiKey={!!currentKey} productArchives={productArchives} onSaveArchive={saveArchive} onDeleteArchive={deleteArchive} ecData={ecData} setEcData={setEcData} ecTab={ecTab} setEcTab={setEcTab} onRefImageChange={handleRefImage} onRefRemove={handleRemoveRef} refImages={refImages} setRefImages={setRefImages} onBatchGenerate={handleBatchGenerate} onBgRemove={handleBgRemove} onImageEdit={handleImageEdit} onVTO={handleVTO} onOutpaint={handleOutpaint} onErase={handleErase} selectedStyle={selectedStyle} setSelectedStyle={setSelectedStyle} generationDetail={generationDetail} setGenerationDetail={setGenerationDetail} textBackground={textBackground} setTextBackground={setTextBackground} cfgScale={cfgScale} setCfgScale={setCfgScale} sampler={sampler} setSampler={setSampler} textLighting={textLighting} setTextLighting={setTextLighting} textCamera={textCamera} setTextCamera={setTextCamera} textCommercialMaterial={textCommercialMaterial} setTextCommercialMaterial={setTextCommercialMaterial} textTone={textTone} setTextTone={setTextTone} onPromptModify={handlePromptModify} onAnalyzeRefImage={handleAnalyzeRefImage} negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt} showNegative={showNegative} setShowNegative={setShowNegative} systemMsg={systemMsg} setSystemMsg={setSystemMsg} photoKey={photoKey} setPhotoKey={setPhotoKey} onPhotoRemove={handlePhotoRemove} onPhotoScene={handlePhotoScene} onPhotoEditV2={handlePhotoEditV2} batchImages={batchImages} onBatchUpload={handleBatchUpload} onBatchRemoveOne={handleBatchRemoveOne} onBatchClear={handleBatchClear} onBatchRemove={handleBatchRemove} onBatchScene={handleBatchScene} onIdeogramGenerate={handleIdeogramGenerate} onEcommerceDetailGenerate={handleEcommerceDetailGenerate} onEcommercePlanGenerate={handleEcommercePlanGenerate} onEcommerceDescEnhance={handleEcommerceDescEnhance} onEcommerceSellingPoints={handleEcommerceSellingPoints} onEcommerceNameEnhance={handleEcommerceNameEnhance} onEcommerceSkuGenerate={handleEcommerceSkuGenerate} ecPlan={ecPlan} setEcPlan={setEcPlan} ecRefImages={ecRefImages} setEcRefImages={setEcRefImages} batchParams={batchParams} setBatchParams={setBatchParams} geminiModel={geminiModel} setGeminiModel={setGeminiModel} bflModel={bflModel} setBflModel={setBflModel}/>
        </div>
        <main className="center-canvas flex flex-col studio-canvas">
          <div className="flex-1 min-h-0 relative">
            <CanvasView canvasGrid={canvasGrid} refImages={refImages} currentImage={currentImage} history={history} activeImageIndex={activeImageIndex} batchImages={[]} onRemoveImage={(id)=>{setHistory(prev=>prev.filter(h=>h.id!==id));if(id==='current')setCurrentImage(null)}} onSelectImage={(data,idx)=>{setCurrentImage(data);setActiveImageIndex(idx);setViewMode('generated')}}/>
            {!leftPanelOpen&&<button onClick={()=>setLeftPanelOpen(true)} className="absolute left-0 top-1/2 -translate-y-1/2 z-50 w-6 h-14 bg-[#20232a] border border-[#2a2d35] rounded-r text-slate-500 hover:text-white">{'>'}</button>}
            {!rightPanelOpen&&<button onClick={()=>setRightPanelOpen(true)} className="absolute right-0 top-1/2 -translate-y-1/2 z-50 w-6 h-14 bg-[#20232a] border border-[#2a2d35] rounded-l text-slate-500 hover:text-white">{'<'}</button>}
            {(currentImage||refImages.filter(Boolean).length>0)&&<div className="absolute top-3 right-3 z-50 flex flex-col gap-1">{viewMode==='generated'&&[1,2,4,6,9].map(n=><button key={n} onClick={()=>handleGridChange(n)} className={`w-7 h-7 rounded text-[10px] font-bold border ${canvasGrid===n?'bg-[#6366f1]/20 text-[#a5b4fc] border-[#6366f1]/50':'bg-[#1a1d24] text-slate-500 border-[#2a2d35] hover:text-white'}`}>{n}</button>)}<button onClick={()=>setChatOpen(!chatOpen)} className={`w-7 h-7 rounded text-[10px] font-bold border ${chatOpen?"bg-[#6366f1]/20 text-[#a5b4fc] border-[#6366f1]/50":"bg-[#1a1d24] text-slate-500 border-[#2a2d35] hover:text-white"}`} title="对话生成">💬</button>{currentImage&&<button onClick={()=>{const a=document.createElement("a");a.href=currentImage;a.download="CoXoF_"+Date.now()+".png";a.click()}} className="w-7 h-7 rounded text-[8px] font-bold border bg-[#1a1d24] text-slate-500 border-[#2a2d35] hover:text-white" title="下载">↓</button>}<button onClick={()=>setHistory([])} className="w-7 h-7 rounded text-[8px] font-bold border bg-[#1a1d24] text-red-400/70 border-[#2a2d35] hover:text-red-300" title="清空历史">×</button></div>}
          </div>
          {chatOpen&&<ChatPanel onChatGenerate={handleChatGenerate} geminiKey={geminiKey} isOpen={chatOpen} onClose={()=>setChatOpen(false)} currentImage={currentImage} onSelectFromHistory={()=>{setViewMode('generated')}}/>}
        {currentImage&&<HistoryBar history={history} currentImage={currentImage} activeIndex={activeImageIndex} setActiveIndex={setActiveImageIndex} onSelectHistory={(data)=>{setCurrentImage(data.data||data);setActiveImageIndex(-1);setViewMode('generated')}} onChatEdit={()=>setChatOpen(true)}/>}
          {viewMode==='reference'&&refImages.filter(Boolean).length>0&&<RefImageBar refImages={refImages} selectedRefIndex={activeRefIndex} onSelectRef={handleSelectRef} onRemoveRef={handleRemoveRef} onAddSlot={handleAddRefSlot} refSlotCount={refSlotCount} maxSlots={8}/>}
        </main>
        {rightPanelOpen&&<RightSidebar activeTab={activeTab} selectedStyle={selectedStyle} setSelectedStyle={setSelectedStyle} aspectRatio={aspectRatio} setAspectRatio={setAspectRatio} generationDetail={generationDetail} setGenerationDetail={setGenerationDetail} generationSteps={generationSteps} setGenerationSteps={setGenerationSteps} textCreativity={textCreativity} setTextCreativity={setTextCreativity} textRealism={textRealism} setTextRealism={setTextRealism} textSharpness={textSharpness} setTextSharpness={setTextSharpness} textBackground={textBackground} setTextBackground={setTextBackground} cfgScale={cfgScale} setCfgScale={setCfgScale} sampler={sampler} setSampler={setSampler} textLighting={textLighting} setTextLighting={setTextLighting} textCamera={textCamera} setTextCamera={setTextCamera} textCommercialMaterial={textCommercialMaterial} setTextCommercialMaterial={setTextCommercialMaterial} textTone={textTone} setTextTone={setTextTone} refWeight={refWeight} setRefWeight={setRefWeight} i2iStrength={i2iStrength} setI2iStrength={setI2iStrength} i2iDetailStrength={i2iDetailStrength} setI2iDetailStrength={setI2iDetailStrength} i2iStyleStrength={i2iStyleStrength} setI2iStyleStrength={setI2iStyleStrength} colorSchemeEnabled={colorSchemeEnabled} setColorSchemeEnabled={setColorSchemeEnabled} structLock={structLock} setStructLock={setStructLock} canvasGrid={canvasGrid} onGridChange={handleGridChange} batchCount={batchCount} setBatchCount={setBatchCount} floralStyle={floralStyle} setFloralStyle={setFloralStyle} material={material} setMaterial={setMaterial} gradientModel={gradientModel} setGradientModel={setGradientModel} colors={colors} setColors={setColors} onClose={()=>setRightPanelOpen(false)} setSystemMsg={setSystemMsg} batchImages={batchImages} onBatchOutfit={handleBatchOutfit} onEnhance={handleEnhance} onMagicErase={handleMagicErase} onGlareRemove={handleGlareRemove} onExpandCanvas={handleExpandCanvas} onSaveTemplate={handleSaveTemplate} onStyleUnify={handleStyleUnify} onPresetExport={handlePresetExport} onShadowGen={handleShadowGen} isGenerating={isGenerating} batchParams={batchParams} setBatchParams={setBatchParams} collapsedSections={collapsedSections} setCollapsedSections={setCollapsedSections} modelPresets={MODEL_PRESETS} onIdeogramGenerate={handleIdeogramGenerate} onIdeogramRemix={handleIdeogramRemix} onIdeogramUpscale={handleIdeogramUpscale} selectedApi={selectedApi} bflPromptOnly={bflPromptOnly} setBflPromptOnly={setBflPromptOnly} seedValue={seedValue} setSeedValue={setSeedValue} editParamEnabled={editParamEnabled} setEditParamEnabled={setEditParamEnabled}/>}
      </div>
    </div>
  );
}