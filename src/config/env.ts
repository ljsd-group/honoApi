/**
 * 环境变量配置
 * 适用于Cloudflare Workers环境
 */

/**
 * 获取绑定变量(Binding)或默认值
 * 这个方法用于安全地从Cloudflare Workers环境获取绑定值
 */
export function getBinding(env: any, key: string, defaultValue: string = ''): string {
  if (env && env[key]) {
    return env[key];
  }
  return defaultValue;
}

/**
 * 创建环境配置对象
 * @param env Cloudflare Workers环境对象
 */
export function createEnvConfig(env: any) {
  return {
    // Auth0 配置
    AUTH0: {
      DOMAIN: getBinding(env, 'AUTH0_DOMAIN', 'dev-example.us.auth0.com'),
      CLIENT_ID: getBinding(env, 'AUTH0_CLIENT_ID', ''),
      CLIENT_SECRET: getBinding(env, 'AUTH0_CLIENT_SECRET', ''),
      REDIRECT_URI: getBinding(env, 'AUTH0_REDIRECT_URI', 'http://localhost:8787/api/auth/callback'),
    },
    
    // 数据库配置
    DATABASE_URL: getBinding(env, 'DATABASE_URL', ''),
    
    // JWT 配置
    JWT: {
      SECRET: getBinding(env, 'JWT_SECRET', '3b97c48f7766afb388807f6c28f72342e0d9701c3ba73ef84efb8e50dd50b696c1b1e75894f4a3e0449b0c950669591788d04e5da38551f995b5c0ccf34864c9'),
      EXPIRES_IN: getBinding(env, 'JWT_EXPIRES_IN', '24h'),
    },
    
    // 是否为开发环境
    IS_DEV: getBinding(env, 'ENVIRONMENT', 'development') === 'development',
  };
} 