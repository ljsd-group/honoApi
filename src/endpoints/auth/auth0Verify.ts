import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { success, error, ResponseCode } from "../../utils/response";
import { AUTH0_CONFIG } from "../../config/auth";
import { Context } from "hono";

// 环境类型定义
type Env = {
  Bindings: any;
};

// 创建 Auth0 Token 验证端点
const app = new OpenAPIHono<Env>();

// 定义请求验证模式
const auth0VerifySchema = z.object({
  access_token: z.string().min(1, "访问令牌不能为空")
});

// 定义响应类型
const auth0VerifyResponseSchema = z.object({
  code: z.number(),
  data: z.object({
    user: z.object({
      sub: z.string(),
      name: z.string().optional(),
      email: z.string().optional(),
      picture: z.string().optional(),
    })
  }),
  message: z.string()
});

const errorResponseSchema = z.object({
  code: z.number(),
  message: z.string()
});

app.openapi(
  {
    method: "post",
    path: "/",
    request: {
      body: {
        content: {
          "application/json": {
            schema: auth0VerifySchema
          }
        }
      }
    },
    responses: {
      200: {
        description: "令牌验证成功",
        content: {
          "application/json": {
            schema: auth0VerifyResponseSchema
          }
        }
      },
      401: {
        description: "无效的令牌",
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
    summary: "验证 Auth0 访问令牌",
    description: "验证iOS应用传来的Auth0访问令牌并获取用户信息"
  },
  // 使用 any 类型避免类型错误
  (async (c: any) => {
    try {
      // 获取请求体中的访问令牌
      const body = await c.req.json();
      const { access_token } = body;
      
      if (!access_token) {
        return error(c, "访问令牌不能为空", ResponseCode.BAD_REQUEST, 400);
      }

      // 使用访问令牌获取用户信息
      const userInfoResponse = await fetch(`https://${AUTH0_CONFIG.DOMAIN}/userinfo`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      if (!userInfoResponse.ok) {
        console.error("无效的访问令牌");
        return error(c, "无效的访问令牌", ResponseCode.UNAUTHORIZED, 401);
      }

      const userInfo = await userInfoResponse.json();

      // 返回用户信息
      return success(c, {
        user: userInfo
      }, "令牌验证成功");
    } catch (err) {
      console.error("令牌验证错误:", err);
      return error(c, "验证访问令牌时发生错误", ResponseCode.INTERNAL_ERROR, 500);
    }
  }) as any
);

export default app; 