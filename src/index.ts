import { Hono } from "hono";
import { errorHandler, logger } from "./middlewares";
import { authJwtMiddleware, userMiddleware } from "./middlewares/authMiddleware";
import { registerApiRoutes } from "./routes/api";
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";

// 定义环境类型
type Env = {
  Bindings: any;
};

// 创建Hono应用
const app = new Hono<Env>();

// 创建OpenAPI应用
const openApiApp = new OpenAPIHono<Env>();

// 注册全局中间件
app.use('*', logger);

// 注册JWT身份验证中间件
app.use('*', authJwtMiddleware);

// 注册用户信息中间件
app.use('*', userMiddleware);

// 注册全局错误处理中间件
app.onError(errorHandler);

// 注册API路由
registerApiRoutes(app);

// 添加API文档UI
app.get('/', (c) => {
  return swaggerUI({
    url: '/api/doc'
  })(c);
});

// 导出Hono应用
export default app;
