import { Hono } from 'hono'
import { errorHandler, logger, responseMiddleware } from './middlewares'
import { registerApiRoutes } from './routes/api'
import { createEnvConfig } from './config/env'
import { authMiddleware } from './middlewares/authMiddleware'
import { cors } from 'hono/cors'

// 创建Cloudflare Workers环境类型
export interface Env {
  // 环境变量和绑定会在此处定义
  DATABASE_URL: string
  AUTH0_DOMAIN: string
  AUTH0_CLIENT_ID?: string
  AUTH0_CLIENT_SECRET?: string
  JWT_SECRET?: string
  ENVIRONMENT?: string
}

// 创建Hono应用
const app = new Hono<{ Bindings: Env }>()

// apple-app-site-association 文件内容
const appleAppSiteAssociation = {
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "HV7PRLH23M.com.example.app",
        "paths": [ "*" ]
      }
    ]
  },
  "webcredentials": {
    "apps": [
      "HV7PRLH23M.com.example.app"
    ]
  }
}

// 配置CORS中间件
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'Auth', 'X-Requested-With', 'Accept'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400,
  credentials: true
}))

// 全局中间件注册
app.use('*', logger)
app.use('*', responseMiddleware)

// 注册认证中间件 - 确保在API路由之前注册
app.use('*', authMiddleware)

// 手动添加 apple-app-site-association 路由
app.get('/.well-known/apple-app-site-association', (c) => {
  c.header('Content-Type', 'application/json')
  return c.json(appleAppSiteAssociation)
})

// 健康检查端点
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// 数据库状态端点
app.get('/db-status', async (c) => {
  return c.json({
    database: {
      host: c.env.DATABASE_URL.split('@')[1]?.split(':')[0] || '未知',
      name: c.env.DATABASE_URL.split('/').pop() || '未知',
    },
    environment: c.env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString()
  })
})

// 简单的首页
app.get('/', (c) => {
  return c.json({
    message: '欢迎使用API服务',
    version: '1.0.0',
    documentation: '/api/doc',
    dbTest: '/api/db-test/connection'
  })
})

// 注册API路由
registerApiRoutes(app)

// 全局错误处理
app.onError(errorHandler)

// 导出Hono应用供Cloudflare Workers使用
export default app
