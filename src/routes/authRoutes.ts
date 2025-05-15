import { Hono } from "hono";
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

// 添加请求监控中间件
authRouter.use('/verify/*', async (c, next) => {
  console.log('======= 收到 /api/auth/verify 请求 =======');
  console.log('请求方法:', c.req.method);
  console.log('请求路径:', c.req.path);
  console.log('Content-Type:', c.req.header('Content-Type'));
  
  // 尝试读取和记录原始请求体
  try {
    // 直接尝试读取原始请求体
    const rawBody = await c.req.text();
    console.log('原始请求体:', rawBody);
    
    // 尝试解析JSON
    try {
      const jsonBody = JSON.parse(rawBody);
      console.log('解析后的JSON:', jsonBody);
    } catch (e) {
      // 确保e是Error类型
      const error = e instanceof Error ? e : new Error(String(e));
      console.log('请求体不是有效的JSON:', error.message);
    }
  } catch (err) {
    // 确保err是Error类型
    const error = err instanceof Error ? err : new Error(String(err));
    console.log('无法读取请求体:', error.message);
  }
  
  return next();
});

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