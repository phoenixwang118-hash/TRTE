/**
 * CoXoF Ai SaaS — 配置管理模块
 * 统一读取环境变量，提供默认值
 */
import dotenv from 'dotenv';
dotenv.config();

const config = {
  // 服务器
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()),

  // SaaS 配置
  saas: {
    jwtSecret: process.env.JWT_SECRET || 'coxof-ai-saas-secret-2026',
    appName: process.env.APP_NAME || 'CoXoF Ai Studio',
    registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
  },

  // API Keys（平台级，从环境变量统一读取）
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY || '',
    bfl: process.env.BFL_API_KEY || '',
    photoroom: process.env.PHOTOROOM_API_KEY || '',
    deepseek: process.env.DEEPSEEK_API_KEY || '',
    doubao: process.env.DOUBAO_API_KEY || '',
    ideogram: process.env.IDEOGRAM_API_KEY || '',
  },

  // Google Cloud Vertex AI 配置
  vertexai: {
    enabled: (process.env.GOOGLE_GENAI_USE_VERTEXAI || '').toLowerCase() === 'true',
    project: process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_PROJECT_ID || '',
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    apiKey: process.env.GOOGLE_CLOUD_API_KEY || '',
  },

  // 限流
  rateLimit: {
    perMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '60', 10),
    aiPerMinute: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '20', 10),
  },

  // 缓存
  cache: {
    useRedis: process.env.USE_REDIS === 'true',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
  },

  // 日志
  logLevel: process.env.LOG_LEVEL || 'dev',
};

export default config;
