import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { AUTH0_CONFIG } from "../../config/auth";
import { error, ResponseCode } from "../../utils/response";

// 环境类型定义
type Env = {
  Bindings: any;
};

// 创建 Auth0 登录端点
const app = new OpenAPIHono<Env>();

// Auth0 授权 URL 构建
const buildAuth0AuthorizationUrl = () => {
  const queryParams = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH0_CONFIG.CLIENT_ID,
    redirect_uri: AUTH0_CONFIG.REDIRECT_URI,
    scope: 'openid profile email',
    state: Math.random().toString(36).substring(2)  // 随机状态值，防止CSRF
  });
  
  return `https://${AUTH0_CONFIG.DOMAIN}/authorize?${queryParams.toString()}`;
};

// 定义响应
app.openapi(
  {
    method: "get",
    path: "/",
    responses: {
      302: {
        description: "重定向到 Auth0 授权页面"
      },
      500: {
        description: "服务器错误"
      }
    },
    tags: ["认证"],
    summary: "Auth0 登录",
    description: "引导用户前往 Auth0 进行身份验证"
  },
  (async (c: any) => {
    try {
      // 构建 Auth0 授权 URL
      const authorizationUrl = buildAuth0AuthorizationUrl();
      
      // 重定向到 Auth0
      return c.redirect(authorizationUrl);
    } catch (err) {
      console.error("Auth0 登录错误:", err);
      return error(c, "启动 Auth0 登录流程时出错", ResponseCode.INTERNAL_ERROR, 500);
    }
  }) as any
);

export default app; 