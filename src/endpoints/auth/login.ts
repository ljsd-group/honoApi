import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { sign } from "hono/jwt";
import { type AppContext } from "@/types";
import { LoginRequest, LoginResponse } from "@/types/auth";
import { validateUser } from "@/services/userService";
import { ResponseCode, error, success } from "@/utils/response";
import { JWT_CONFIG } from "@/config/auth";

export class LoginHandler extends OpenAPIRoute {
  schema = {
    tags: ["认证"],
    summary: "用户登录",
    request: {
      body: {
        content: {
          "application/json": {
            schema: LoginRequest,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "登录成功",
        content: {
          "application/json": {
            schema: z.object({
              code: z.number(),
              data: LoginResponse,
              message: z.string(),
            }),
          },
        },
      },
      "401": {
        description: "用户名或密码错误",
        content: {
          "application/json": {
            schema: z.object({
              code: z.number(),
              message: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      // 直接从请求中获取数据，以防chanfana处理有问题
      const body = await c.req.json();
      console.log('登录请求数据:', body);
      
      const { username, password } = body;
      
      // 检查用户名和密码是否为空
      if (!username || !password) {
        return error(c, "用户名和密码不能为空", ResponseCode.BAD_REQUEST, 400);
      }

      // 验证用户
      const user = await validateUser(username, password);
      console.log('验证结果:', user ? '验证成功' : '验证失败');

      if (!user) {
        return error(c, "用户名或密码错误", ResponseCode.UNAUTHORIZED, 401);
      }

      // 生成JWT令牌
      const token = await sign({
        sub: user.id,
        username: user.username, 
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24小时后过期
      }, JWT_CONFIG.SECRET);

      // 使用自定义响应格式
      return success(
        c,
        {
          token,
          user,
        },
        "登录成功"
      );
    } catch (err) {
      console.error('登录处理发生错误:', err);
      return error(c, "登录处理发生错误", ResponseCode.INTERNAL_ERROR, 500);
    }
  }
} 