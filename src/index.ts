import { Hono } from "hono";
import { errorHandler, logger, responseMiddleware } from "./middlewares";
import { authJwtMiddleware, userMiddleware } from "./middlewares/authMiddleware";
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

// 手动添加 apple-app-site-association 路由
app.get('/.well-known/apple-app-site-association', (c) => {
  c.header('Content-Type', 'application/json');
  return c.json(appleAppSiteAssociation);
});

// 将 API 文档相关的路由放在所有中间件注册之前，这样它们不会受到中间件的影响

// 注册API路由（在添加文档路由之前注册，确保所有API定义被收集）
registerApiRoutes(app);

// 添加API文档UI到根路径
app.get('/', (c) => {
  // 返回 Swagger UI 界面
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="SwaggerUI" />
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@latest/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@latest/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/doc',
        dom_id: '#swagger-ui',
      });
    };
  </script>
</body>
</html>
  `);
});

// 提供自动生成的OpenAPI规范文档
app.doc('/api/doc', {
  openapi: '3.0.0',
  info: {
    title: 'Hono 任务管理 API',
    version: '1.0.0',
    description: '使用Hono框架开发的任务管理API'
  },
  tags: []
});
// ========================= 重要 =============================

// 注册全局中间件
app.use('*', logger);

// 注册JWT身份验证中间件
app.use('*', authJwtMiddleware);

// 注册用户信息中间件
app.use('*', userMiddleware);

// 注册响应格式化中间件（在其他中间件之后注册，但在路由注册之前）
app.use('*', responseMiddleware);

// 注册全局错误处理中间件
app.onError(errorHandler);

// 导出Hono应用
export default app;
