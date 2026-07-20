/**
 * LandingPage — CoXoF Ai Studio Cyber-Tech Landing
 *
 * Future-tech aesthetic: dark bg, neon glow, particle canvas,
 * gradient text, geometric lines, parallax scroll, animated stats.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import './landing.css';

/* ── Particle Canvas — lightweight WebGL-free particle net ── */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#8b5cf6'];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 18000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMouse);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // mouse attraction
        const dx = mx - p.x, dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          p.x += dx * 0.008; p.y += dy * 0.008;
        }

        // draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.6;
        ctx.fill();

        // draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const ddx = p.x - q.x, ddy = p.y - q.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = p.c;
            ctx.globalAlpha = (1 - d / 130) * 0.15;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className="lp-particle-canvas" />;
};

/* ── Animated counter hook ── */
const useCountUp = (target, visible, duration = 2000) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setVal(target);
    };
    requestAnimationFrame(step);
  }, [target, visible, duration]);
  return val;
};

/* ── Workbench data ── */
const WORKBENCHES = [
  {
    title: '设计与生产工作台',
    badge: 'Beta',
    tab: 'generate',
    desc: '一站式服装设计与生产工作台 —— 智能对话、高清生图、局部编辑、AI 试穿、面料替换、矢量转换等。',
    color: '#6366f1',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: '全渠道营销工作台',
    tab: null,
    comingSoon: true,
    desc: '一站式营销内容创作 —— 快速生成营销图、文案亮点、海报、详情页等。',
    color: '#3b82f6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: 'AI 虚拟试穿',
    tab: 'vto',
    desc: '快速实现服装试穿效果，足不出户完成模特拍摄。',
    color: '#06b6d4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a4 4 0 100 8 4 4 0 000-8z" />
        <path d="M5 21v-2a7 7 0 0114 0v2" />
        <path d="M8 10l-3 6h4l-1 5 7-8h-4l2-5z" />
      </svg>
    ),
  },
  {
    title: '定向修改',
    tab: 'edit',
    desc: '精准实现服装轮廓、结构、颜色及设计元素的修改。',
    color: '#6366f1',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    title: '视频工作台',
    tab: null,
    comingSoon: true,
    desc: '快速生成营销视频 —— 产品展示、宣传短片、特效换装、真人动态等。',
    color: '#3b82f6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
        <path d="M22 17l-4 4H6l-4-4" />
      </svg>
    ),
  },
  {
    title: '模特工作室',
    tab: 'vto',
    desc: '自由定制模特，精准控制面部特征、姿势、体型、肤色、身高、尺寸及背景。',
    color: '#06b6d4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="6" r="4" />
        <path d="M4 22c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        <rect x="8" y="12" width="8" height="10" rx="1" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    title: '风格融合',
    tab: 'edit',
    desc: '自由混搭服装、场景、配饰及元素，智能融合创作各种原创方案。',
    color: '#6366f1',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h6l2 4H4z" fill="currentColor" fillOpacity="0.15" />
        <path d="M10 4h6l2 4H10z" fill="currentColor" fillOpacity="0.1" />
        <path d="M4 12h8l2 4H4z" fill="currentColor" fillOpacity="0.08" />
        <path d="M12 12h8l2 4H12z" />
        <path d="M4 20h16l-2 4H6z" />
      </svg>
    ),
  },
  {
    title: '灵感方案',
    tab: 'generate',
    desc: '智能捕捉时尚灵感与趋势，将创意转化为设计方案，包含时装设计与图案/印花设计。',
    color: '#3b82f6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l3 6 6.5 1-4.7 4.6 1.1 6.4L12 18l-5.9 3 1.1-6.4L2.5 10l6.5-1z" />
        <path d="M12 3v15" stroke="#06b6d4" strokeWidth="1" opacity="0.4" />
      </svg>
    ),
  },
];

/* ── Stats data ── */
const STATS = [
  { value: 6, suffix: '', label: 'AI 引擎', sub: '多模型并行' },
  { value: 17, suffix: '+', label: '设计操作', sub: '覆盖全流程' },
  { value: 8, suffix: '', label: '专业工作台', sub: '持续扩展中' },
  { value: 99.9, suffix: '%', label: '服务可用率', sub: '云端稳定运行', isFloat: true },
];

/* ── Market preview data (TeePublic-style showcase) ── */
const MARKET_TAGS = ['全部', '潮流', '复古', '动漫', '科幻', '音乐', '运动', '极简', '宠物'];
const TAG_COLORS = { '科幻':'#6366f1','复古':'#8b5cf6','动漫':'#06b6d4','音乐':'#3b82f6','潮流':'#d946ef','极简':'#6366f1','运动':'#06b6d4','宠物':'#8b5cf6' };
const _PAL = ['#6366f1','#8b5cf6','#06b6d4','#3b82f6','#d946ef'];
/* fallback mock（API 不可用时兜底） */
const MARKET_DESIGNS = [
  { name: 'Neon City Dreams', author: 'AI Studio · Kira', old: 24, now: 16, tag: '科幻', color: '#6366f1' },
  { name: 'Retro Wave 80s', author: 'AI Studio · Neo', old: 24, now: 16, tag: '复古', color: '#8b5cf6' },
  { name: 'Cyber Koi', author: 'AI Studio · Lumen', old: 24, now: 16, tag: '动漫', color: '#06b6d4' },
  { name: 'Lo-Fi Beats', author: 'AI Studio · Miku', old: 24, now: 16, tag: '音乐', color: '#3b82f6' },
  { name: 'Street Glitch', author: 'AI Studio · Vex', old: 24, now: 16, tag: '潮流', color: '#d946ef' },
  { name: 'Minimal Mono', author: 'AI Studio · Sol', old: 24, now: 16, tag: '极简', color: '#6366f1' },
  { name: 'Sport Pulse', author: 'AI Studio · Ace', old: 24, now: 16, tag: '运动', color: '#06b6d4' },
  { name: 'Cat Nebula', author: 'AI Studio · Nya', old: 24, now: 16, tag: '宠物', color: '#8b5cf6' },
];

/* ── Logo SVG — neon hexagon ── */
const LogoSVG = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lpLogoGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1" />
        <stop offset="0.5" stopColor="#3b82f6" />
        <stop offset="1" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    <path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z" stroke="url(#lpLogoGrad)" strokeWidth="2" fill="none" />
    <path d="M16 8 L22 11.5 L22 20.5 L16 24 L10 20.5 L10 11.5 Z" stroke="url(#lpLogoGrad)" strokeWidth="1.5" fill="none" opacity="0.5" />
    <circle cx="16" cy="16" r="3" fill="url(#lpLogoGrad)" />
  </svg>
);

/* ── Card with mouse-tracking neon glow ── */
const WorkbenchCard = ({ wb, delay, onClick }) => {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mx', x + '%');
    card.style.setProperty('--my', y + '%');
  }, []);

  const clickable = !wb.comingSoon;

  return (
    <div
      ref={cardRef}
      className={`lp-card lp-section-reveal ${clickable ? 'lp-card-clickable' : 'lp-card-coming'}`}
      style={{ transitionDelay: `${delay}ms`, '--card-color': wb.color }}
      onMouseMove={handleMouseMove}
      onClick={clickable ? onClick : undefined}
    >
      <div className="lp-card-glow" />
      <div className="lp-card-icon" style={{ '--icon-color': wb.color }}>{wb.icon}</div>
      <div className="lp-card-header">
        <span className="lp-card-title">{wb.title}</span>
        {wb.badge && <span className="lp-card-badge">{wb.badge}</span>}
        {wb.comingSoon && <span className="lp-card-badge lp-badge-soon">即将上线</span>}
      </div>
      <p className="lp-card-desc">{wb.desc}</p>
      {clickable && (
        <span className="lp-card-enter">
          进入工作台
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      )}
    </div>
  );
};

/* ── Market card (TeePublic-style product tile) ── */
const MarketCard = ({ item, delay, countdown, onClick }) => {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mx', x + '%');
    card.style.setProperty('--my', y + '%');
  }, []);

  return (
    <div
      ref={cardRef}
      className={`lp-card lp-market-card lp-section-reveal`}
      style={{ transitionDelay: `${delay}ms`, '--card-color': item.color }}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      <div className="lp-card-glow" />
      <div className="lp-market-thumb">
        {item.imageUrl ? (
          <img className="lp-market-thumb-img" src={item.imageUrl} alt={item.name} loading="lazy" />
        ) : (
          <span className="lp-market-thumb-name">{item.name}</span>
        )}
        <span className="lp-market-thumb-tag">{item.tag}</span>
      </div>
      <div className="lp-market-info">
        <div className="lp-market-author">{item.author}</div>
        <div className="lp-market-row">
          <div className="lp-market-price">
            <span className="lp-price-now">${item.now}</span>
            <span className="lp-price-old">${item.old}</span>
          </div>
          <span className="lp-market-cd">
            <span className="lp-market-cd-dot" /> {countdown}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ── Stat counter ── */
const StatItem = ({ stat, visible, delay }) => {
  const val = useCountUp(stat.value, visible, 1800);
  const display = stat.isFloat ? val.toFixed(1) : val;
  return (
    <div className="lp-stat-item lp-section-reveal" style={{ transitionDelay: `${delay}ms` }}>
      <div className="lp-stat-value">
        {display}<span className="lp-stat-suffix">{stat.suffix}</span>
      </div>
      <div className="lp-stat-label">{stat.label}</div>
      <div className="lp-stat-sub">{stat.sub}</div>
    </div>
  );
};

/* ── Main component ── */
export default function LandingPage() {
  const { navigate, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const heroRef = useRef(null);
  const [parallaxY, setParallaxY] = useState(0);
  const [activeTag, setActiveTag] = useState('全部');
  const [countdown, setCountdown] = useState({ h: 15, m: 45, s: 30 });
  const [marketItems, setMarketItems] = useState([]);
  const [marketLoading, setMarketLoading] = useState(true);

  // Global promo countdown (TeePublic-style urgency)
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        let { h, m, s } = c;
        s -= 1;
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // 拉取真实市场商品（失败回退 mock）
  useEffect(() => {
    let cancelled = false;
    fetch('/api/marketplace?limit=24')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.success && Array.isArray(data.items) && data.items.length) {
          setMarketItems(data.items.map((p, i) => ({
            id: p.id,
            name: p.title,
            author: p.authorName,
            tag: p.tag,
            now: p.price,
            old: p.oldPrice,
            color: TAG_COLORS[p.tag] || _PAL[i % _PAL.length],
            imageUrl: p.imageUrl || '',
          })));
        } else {
          setMarketItems(MARKET_DESIGNS);
        }
      })
      .catch(() => { if (!cancelled) setMarketItems(MARKET_DESIGNS); })
      .finally(() => { if (!cancelled) setMarketLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Scroll — navbar + parallax
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      if (heroRef.current) {
        setParallaxY(window.scrollY * 0.3);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // IntersectionObserver — direct class toggle (robust, no index matching)
  useEffect(() => {
    const revealEls = document.querySelectorAll('.landing-page .lp-section-reveal');
    if (!('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('lp-visible'));
      setStatsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lp-visible');
            if (entry.target.dataset.reveal === 'stats') setStatsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const goToLogin = () => navigate('/login');
  const goToStudio = () => navigate(user ? '/studio' : '/login');
  const goToPricing = () => navigate('/pricing');
  const goToWorkbench = (wb) => {
    if (wb.comingSoon || !wb.tab) return;
    navigate(user ? `/studio?tab=${wb.tab}` : '/login');
  };
  const scrollToFeatures = (e) => {
    e.preventDefault();
    document.getElementById('lp-features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToCTA = (e) => {
    e.preventDefault();
    document.getElementById('lp-cta')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToStats = (e) => {
    e.preventDefault();
    document.getElementById('lp-stats')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToMarket = (e) => {
    e.preventDefault();
    document.getElementById('lp-market')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const cdStr = `${String(countdown.h).padStart(2, '0')}:${String(countdown.m).padStart(2, '0')}:${String(countdown.s).padStart(2, '0')}`;
  const filteredDesigns = activeTag === '全部'
    ? marketItems
    : marketItems.filter((d) => d.tag === activeTag);

  return (
    <div className="landing-page">
      {/* Particle background */}
      <ParticleCanvas />
      <div className="lp-bg-orbs">
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
      </div>
      {/* Geometric grid overlay */}
      <div className="lp-bg-grid" />

      {/* Navigation */}
      <nav className={`lp-nav ${scrolled ? 'lp-scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <button className="lp-nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <LogoSVG />
            <span className="lp-nav-brand">CoXoF Ai</span>
          </button>
          <button className="lp-nav-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span /><span /><span />
          </button>
          <ul className={`lp-nav-links ${mobileMenuOpen ? 'lp-open' : ''}`}>
            <li><a href="#lp-features" onClick={(e) => { scrollToFeatures(e); setMobileMenuOpen(false); }}>工作台</a></li>
            <li><a href="#lp-stats" onClick={(e) => { scrollToStats(e); setMobileMenuOpen(false); }}>数据</a></li>
            <li><a href="#lp-market" onClick={(e) => { scrollToMarket(e); setMobileMenuOpen(false); }}>市场</a></li>
            <li><a href="#lp-cta" onClick={(e) => { scrollToCTA(e); setMobileMenuOpen(false); }}>定价</a></li>
            <li><button className="lp-btn lp-btn-ghost" onClick={() => { goToLogin(); setMobileMenuOpen(false); }}>登录</button></li>
            <li><button className="lp-btn lp-btn-primary lp-btn-neon" onClick={() => { goToStudio(); setMobileMenuOpen(false); }}>免费试用</button></li>
          </ul>
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero-bg-lines" style={{ transform: `translateY(${parallaxY}px)` }}>
          <div className="lp-line lp-line-1" />
          <div className="lp-line lp-line-2" />
          <div className="lp-line lp-line-3" />
        </div>
        <div className="lp-container lp-hero-content" style={{ transform: `translateY(${parallaxY * -0.15}px)` }}>
          <div className="lp-hero-badge">
            <span className="dot" />
            由 CoXoF Ai 引擎驱动
          </div>
          <h1 className="lp-hero-title">
            <span className="lp-hero-title-line">COXOF AI DIY</span>
            <span className="lp-hero-title-sub">AI Personalized Product Design</span>
            <span className="lp-hero-title-accent">& Custom Marketplace</span>
          </h1>
          <p className="lp-hero-desc">
            用 AI 驱动的工具革新你的时尚设计流程 —— 从概念草图到可生产的设计方案，
            全部在一个智能工作空间中完成。
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn lp-btn-primary lp-btn-xl lp-btn-neon" onClick={goToStudio}>
              免费试用
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <button className="lp-btn lp-btn-ghost lp-btn-xl" onClick={scrollToFeatures}>探索工作台</button>
          </div>
          <div className="lp-hero-scroll-hint">
            <span>向下滚动探索</span>
            <div className="lp-scroll-arrow" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="lp-section lp-stats-section" id="lp-stats">
        <div className="lp-container">
          <div className="lp-stats-grid" data-reveal="stats">
            {STATS.map((stat, i) => (
              <StatItem key={i} stat={stat} visible={statsVisible} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="lp-section" id="lp-features">
        <div className="lp-container">
          <div className="lp-section-header lp-section-reveal">
            <span className="lp-section-tag">AI 工作台</span>
            <h2 className="lp-section-title">强大的设计与营销工具</h2>
            <p className="lp-section-subtitle">
              八大专业 AI 工作台，专为服装与时尚行业打造。
            </p>
          </div>
          <div className="lp-features-grid">
            {WORKBENCHES.map((wb, i) => (
              <WorkbenchCard
                key={i}
                wb={wb}
                delay={i * 60}
                onClick={() => goToWorkbench(wb)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Demo / Visual Showcase */}
      <section className="lp-section lp-demo-section" id="lp-demo">
        <div className="lp-container">
          <div className="lp-section-header lp-section-reveal">
            <span className="lp-section-tag">产品演示</span>
            <h2 className="lp-section-title">从灵感到成品，一键直达</h2>
            <p className="lp-section-subtitle">
              智能 AI 工作流将设计效率提升 10 倍以上。
            </p>
          </div>
          <div className="lp-demo-showcase lp-section-reveal">
            <div className="lp-demo-flow">
              <div className="lp-demo-step">
                <div className="lp-demo-step-num">01</div>
                <div className="lp-demo-step-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3>输入设计需求</h3>
                <p>中文描述设计意图，AI 自动解析风格、面料、结构。</p>
              </div>
              <div className="lp-demo-arrow" />
              <div className="lp-demo-step">
                <div className="lp-demo-step-num">02</div>
                <div className="lp-demo-step-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m17.07-5.07l-4.24 4.24m-5.66 5.66l-4.24 4.24m0-14.14l4.24 4.24m5.66 5.66l4.24 4.24" />
                  </svg>
                </div>
                <h3>AI 引擎并行生成</h3>
                <p>6 个 AI 引擎同步工作，秒级输出多套设计方案。</p>
              </div>
              <div className="lp-demo-arrow" />
              <div className="lp-demo-step">
                <div className="lp-demo-step-num">03</div>
                <div className="lp-demo-step-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                </div>
                <h3>定制修改与产出</h3>
                <p>局部编辑、试穿预览、风格融合，一键导出成品。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Preview (TeePublic-style product showcase) */}
      <section className="lp-section lp-market-section" id="lp-market">
        <div className="lp-container">
          <div className="lp-section-header lp-section-reveal">
            <span className="lp-section-tag">AI 设计市场</span>
            <h2 className="lp-section-title">热门 AI 设计 · 一键定制</h2>
            <p className="lp-section-subtitle">由 CoXoF Ai 引擎生成的可商用设计，限时优惠进行中。</p>
          </div>
          <div className="lp-market-tags">
            {MARKET_TAGS.map((tag) => (
              <button key={tag} className={`lp-market-tag ${activeTag === tag ? 'lp-active' : ''}`} onClick={() => setActiveTag(tag)}>{tag}</button>
            ))}
          </div>
          <div className="lp-market-grid">
            {marketLoading ? (
              <div className="lp-market-empty">加载市场中…</div>
            ) : filteredDesigns.length === 0 ? (
              <div className="lp-market-empty">暂无该分类的设计</div>
            ) : filteredDesigns.map((item, i) => (
              <MarketCard
                key={item.id || item.name}
                item={item}
                delay={i * 60}
                countdown={cdStr}
                onClick={() => goToStudio()}
              />
            ))}
          </div>
          <div className="lp-market-footer">
            <button className="lp-btn lp-btn-ghost lp-btn-lg" onClick={goToStudio}>查看完整市场</button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta lp-section" id="lp-cta">
        <div className="lp-container">
          <div className="lp-cta-inner">
            <div className="lp-cta-glow" />
            <div className="lp-cta-grid-deco" />
            <h2>准备好革新你的设计流程了吗？</h2>
            <p>
              加入数千名已经在使用 CoXoF Ai 加速创意过程的时尚设计师和品牌。
            </p>
            <div className="lp-cta-actions">
              <button className="lp-btn lp-btn-primary lp-btn-lg lp-btn-neon" onClick={goToStudio}>免费试用</button>
              <button className="lp-btn lp-btn-ghost lp-btn-lg" onClick={goToLogin}>登录</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-inner">
            <ul className="lp-footer-links">
              <li><a onClick={goToPricing}>定价方案</a></li>
              <li><a onClick={goToLogin}>登录</a></li>
              <li><a onClick={goToStudio}>免费试用</a></li>
            </ul>
            <p className="lp-footer-copy">&copy; 2026 CoXoF Ai Studio</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
