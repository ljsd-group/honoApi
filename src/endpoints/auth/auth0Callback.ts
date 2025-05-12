import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { success, error, ResponseCode } from "../../utils/response";
import { AUTH0_CONFIG } from "../../config/auth";
import { Context } from "hono";

// 环境类型定义
type Env = {
  Bindings: any;
};

// 创建 Auth0 回调端点
const app = new OpenAPIHono<Env>();

// 定义请求验证模式
const auth0CallbackSchema = z.object({
  code: z.string().min(1, "授权码不能为空")
});

// 定义响应类型
const auth0ResponseSchema = z.object({
  code: z.number(),
  data: z.object({
    access_token: z.string(),
    id_token: z.string().optional(),
    user: z.object({
      sub: z.string(),
      name: z.string().optional(),
      email: z.string().optional(),
      picture: z.string().optional(),
    }).optional()
  }),
  message: z.string()
});

const errorResponseSchema = z.object({
  code: z.number(),
  message: z.string()
});

// 处理函数类型使用 any 来避免类型错误
app.openapi(
  {
    method: "get",
    path: "/",
    request: {
      query: auth0CallbackSchema
    },
    responses: {
      200: {
        description: "Auth0 授权成功",
        content: {
          "application/json": {
            schema: auth0ResponseSchema
          }
        }
      },
      400: {
        description: "请求参数错误",
        content: {
          "application/json": {
            schema: errorResponseSchema
          }
        }
      },
      500: {
        description: "服务器错误",
        content: {
          "application/json": {
            schema: errorResponseSchema
          }
        }
      }
    },
    tags: ["认证"],
    summary: "处理 Auth0 授权回调",
    description: "接收 Auth0 授权码并交换获取用户身份信息"
  },
  // 使用 any 类型避免类型错误
  (async (c: any) => {
    try {
      // 获取授权码
      const { code } = c.req.query();
      
      if (!code) {
        return error(c, "授权码不能为空", ResponseCode.BAD_REQUEST, 400);
      }

      // 与 Auth0 交换令牌
      const tokenResponse = await fetch(`https://${AUTH0_CONFIG.DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: AUTH0_CONFIG.CLIENT_ID,
          client_secret: AUTH0_CONFIG.CLIENT_SECRET,
          code,
          redirect_uri: AUTH0_CONFIG.REDIRECT_URI
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("Auth0 令牌交换错误:", errorData);
        return error(c, "授权码验证失败", ResponseCode.UNAUTHORIZED, 401);
      }

      const tokenData = await tokenResponse.json() as {
        access_token: string;
        id_token?: string;
        token_type: string;
        expires_in: number;
      };
      
      const { access_token, id_token } = tokenData;

      // 使用访问令牌获取用户信息
      const userInfoResponse = await fetch(`https://${AUTH0_CONFIG.DOMAIN}/userinfo`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      if (!userInfoResponse.ok) {
        console.error("获取用户信息失败");
        return error(c, "获取用户信息失败", ResponseCode.INTERNAL_ERROR, 500);
      }

      const userInfo = await userInfoResponse.json();

      // 返回访问令牌和用户信息
      return success(c, {
        access_token,
        id_token,
        user: userInfo
      }, "Auth0 授权成功");
    } catch (err) {
      console.error("Auth0 回调处理错误:", err);
      return error(c, "处理授权回调时发生错误", ResponseCode.INTERNAL_ERROR, 500);
    }
  }) as any
);

export default app; 