
import { OpenAPIHono } from "@hono/zod-openapi";
import loginApp from "../endpoints/auth/login";
import auth0CallbackApp from "../endpoints/auth/auth0Callback";
import auth0LoginApp from "../endpoints/auth/auth0Login";
import auth0VerifyApp from "../endpoints/auth/auth0Verify";

// 定义环境类型
type Env = {
  Bindings: any;
};

// 创建认证路由器
export const authRouter = new OpenAPIHono<Env>();


// 挂载登录端点
authRouter.route('/login', loginApp);

// 挂载 Auth0 相关端点
authRouter.route('/callback', auth0CallbackApp);
authRouter.route('/auth0', auth0LoginApp);
authRouter.route('/verify', auth0VerifyApp);

/**
 * 注册认证相关路由
 * @param app Hono应用实例
 */
export function registerAuthRoutes(app: any) {
  // 挂载认证路由
  app.route('/api/auth', authRouter);
} 