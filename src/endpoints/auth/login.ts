import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { sign } from "hono/jwt";
import { JWT_CONFIG } from "../../config/auth";
import { UserService } from "../../services/userService";
import { Handler } from "hono";
import { success, error, ResponseCode } from "../../utils/response";

// 环境类型定义
type Env = {
  Bindings: any;
};

// 创建登录端点和用户服务实例
const app = new OpenAPIHono<Env>();
const userService = new UserService();

// 登录请求模式
const loginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(1, "密码不能为空")
});

// 响应类型
const loginResponseSchema = z.object({
  code: z.number(),
  data: z.object({
    token: z.string(),
    user: z.object({
      id: z.number(),
      username: z.string(),
      email: z.string(),
    })
  }),
  message: z.string()
});

const errorResponseSchema = z.object({
  code: z.number(),
  message: z.string()
});

// 登录处理函数
const loginHandler: Handler<Env> = async (c) => {
  try {
    // 获取请求数据
    const data = await c.req.json();
    const { username, password } = data;
    
    // 验证用户
    const { valid, user } = await userService.validateUser(username, password);
    
    // 如果验证失败
    if (!valid || !user) {
      return error(c, "用户名或密码错误", ResponseCode.UNAUTHORIZED, 401);
    }
    
    // 生成JWT令牌
    const token = await sign({
      sub: String(user.id),
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24小时后过期
    }, JWT_CONFIG.SECRET || 'default_secret');
    
    // 返回成功响应
    return success(c, {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }, "登录成功", ResponseCode.SUCCESS);
  } catch (err) {
    console.error("登录处理发生错误:", err);
    return error(c, "登录处理发生错误", ResponseCode.INTERNAL_ERROR, 500);
  }
};

// 定义登录API
app.openapi(
  {
    method: "post",
    path: "/",
    request: {
      body: {
        content: {
          "application/json": {
            schema: loginSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: "登录成功",
        content: {
          "application/json": {
            schema: loginResponseSchema
          }
        }
      },
      401: {
        description: "用户名或密码错误",
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
    tags: ["认证"]
  },
  loginHandler as any
);

export default app; 