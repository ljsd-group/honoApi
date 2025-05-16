import { Hono } from "hono";
import { errorHandler, logger, responseMiddleware, requestMonitor } from "./middlewares";
import { authMiddleware } from "./middlewares/authMiddleware";
import { registerApiRoutes } from "./routes/api";
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from 'hono/cors';
import { CORS_CONFIG } from './config/cors';

// apple-app-site-association 文件内容
const appleAppSiteAssociation = {
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "HV7PRLH23M.com.lanjin.AIgenius.app",
        "paths": [ "*" ]
      }
    ]
  },
  "webcredentials": {
    "apps": [
      "HV7PRLH23M.com.lanjin.AIgenius.app"
    ]
  }
};

// 定义环境类型
type Env = {
  Bindings: any;
};

// 创建OpenAPIHono应用作为主应用
const app = new OpenAPIHono<Env>();

// ========================= 重要 =============================
// 配置CORS中间件（放在最前面，确保所有请求都能正确处理CORS）
app.use('*', cors(CORS_CONFIG));

// 注册全局请求监控中间件（默认关闭，需通过环境变量启用）
app.use('*', requestMonitor);

// 注册全局中间件
app.use('*', logger);

// 注册组合的身份验证中间件（同时处理JWT验证和用户信息）
app.use('*', authMiddleware);

// 注册响应格式化中间件
app.use('*', responseMiddleware);

// 手动添加 apple-app-site-association 路由
app.get('/.well-known/apple-app-site-association', (c) => {
  c.header('Content-Type', 'application/json');
  return c.json(appleAppSiteAssociation);
});

// 注册API路由（在中间件之后注册，确保中间件能拦截所有API路由）
registerApiRoutes(app);

// 添加API文档UI到根路径
app.get('/', async (c) => {
  try {
    // 获取OpenAPI规范
    const response = await fetch(`http://localhost:8080/api/doc`);
    if (!response.ok) {
      return c.text('无法加载API文档', 500);
    }
    
    const data = await response.json() as { code: number, data: any, message: string };
    const apiSpec = data.data; // 获取返回的data字段中的规范内容
    
    // 返回 Swagger UI 界面
    return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="SwaggerUI" />
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.1.0/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.1.0/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(apiSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        validatorUrl: null,
        defaultModelsExpandDepth: -1,
        presets: [
          SwaggerUIBundle.presets.apis
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>
    `);
  } catch (error) {
    console.error('加载API文档出错:', error);
    return c.text('加载API文档时出错', 500);
  }
});

// 提供自动生成的OpenAPI规范文档
app.doc('/api/doc', {
  openapi: '3.1.0',
  info: {
    title: 'Hono 任务管理 API',
    version: '1.0.0',
    description: '使用Hono框架开发的任务管理API'
  },
  tags: []
});
// ========================= 重要 =============================

// 注册全局错误处理中间件
app.onError(errorHandler);

// 导出Hono应用
export default app;
