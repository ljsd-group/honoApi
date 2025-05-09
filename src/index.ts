import { fromHono } from "chanfana";
import { Hono } from "hono";
import { errorHandler, logger } from "./middlewares";
import { authJwtMiddleware, userMiddleware } from "./middlewares/authMiddleware";
import { registerApiRoutes } from "./routes/api";

// 创建Hono应用
const app = new Hono<{ Bindings: Env }>();

// 注册全局中间件
app.use('*', logger);

// 注册JWT身份验证中间件
app.use('*', authJwtMiddleware);

// 注册用户信息中间件
app.use('*', userMiddleware);

// 注册全局错误处理中间件
app.onError(errorHandler);

// 设置OpenAPI注册表
const openapi = fromHono(app, {
	docs_url: "/",
});

// 注册所有API路由
registerApiRoutes(openapi);

// 你也可以直接在Hono上注册非OpenAPI路由
// app.get('/test', (c) => c.text('Hono!'))

// 导出Hono应用
export default app;
