import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { success, error, ResponseCode } from "../../utils/response";
import { AUTH0_CONFIG, JWT_CONFIG } from "../../config/auth";
import { Context } from "hono";
import { AccountService } from "../../services/accountService";
import { sign } from "hono/jwt";

// 环境类型定义
type Env = {
  Bindings: any;
};

// Auth0用户信息类型定义
interface Auth0UserInfo {
  sub: string;
  name?: string;
  nickname?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  [key: string]: any; // 其他可能的字段
}

// 创建 Auth0 Token 验证端点
const app = new OpenAPIHono<Env>();
const accountService = new AccountService();

// 定义请求验证模式
const auth0VerifySchema = z.object({
  access_token: z.string().min(1, "访问令牌不能为空"),
  device_number: z.string().optional() // 可选设备号
});

// 定义响应类型
const auth0VerifyResponseSchema = z.object({
  code: z.number(),
  data: z.object({
    token: z.string(), // JWT令牌
    user: z.object({
      sub: z.string(),
      name: z.string().optional(),
      email: z.string().optional(),
      picture: z.string().optional(),
    }),
    account: z.object({
      id: z.number().optional(),
      auth0_sub: z.string(),
      device_number: z.string().optional()
    }).optional()
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
    description: "验证iOS应用传来的Auth0访问令牌并获取用户信息，同时创建或更新账户信息"
  },
  // 使用 any 类型避免类型错误
  (async (c: any) => {
    try {
      // 获取请求体中的访问令牌和设备号
      const body = await c.req.json();
      const { access_token, device_number } = body;
      
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

      const userInfo = await userInfoResponse.json() as Auth0UserInfo;
      // let userInfo: Auth0UserInfo = {
      //   sub: `auth0|${Date.now()}`, // 生成一个唯一标识符
      //   name: "测试用户",
      //   nickname: "测试用户",
      //   email: "test@example.com",
      //   email_verified: true,
      //   picture: "https://example.com/default-avatar.png"
      // };
      let account;
      
      // 先检查是否有传入device_number
      if (device_number) {
        // 通过device_number查找账户
        const existingAccount = await accountService.findAccountByDeviceNumber(device_number);
        
        if (existingAccount) {
          // 如果找到现有账户，则更新信息
          console.log('找到已存在的设备号，更新账户信息');
          account = await accountService.updateAccount({
            ...existingAccount,
            auth0_sub: userInfo.sub,
            name: userInfo.name,
            nickname: userInfo.nickname,
            email: userInfo.email,
            email_verified: userInfo.email_verified,
            picture: userInfo.picture
          });
        } else {
          // 如果没找到，创建新账户
          console.log('设备号未关联账户，创建新账户');
          account = await accountService.createAccount({
            auth0_sub: userInfo.sub,
            name: userInfo.name,
            nickname: userInfo.nickname,
            email: userInfo.email,
            email_verified: userInfo.email_verified,
            picture: userInfo.picture,
            device_number: device_number
          });
        }
      } else {
        // 如果没有传入device_number，则通过auth0_sub查找/创建账户
        console.log('未提供设备号，通过Auth0 ID查找/创建账户');
        account = await accountService.createOrUpdateAccount({
          auth0_sub: userInfo.sub,
          name: userInfo.name,
          nickname: userInfo.nickname,
          email: userInfo.email,
          email_verified: userInfo.email_verified,
          picture: userInfo.picture
        });
      }

      // 生成JWT令牌
      const token = await sign({
        sub: String(account.id), // 使用我们自己数据库中的ID，而不是Auth0的sub
        auth0_sub: userInfo.sub, // 保存Auth0的sub以便后续关联
        name: userInfo.name || '',
        email: userInfo.email || '',
        device_number: account.device_number || '',
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24小时后过期
      }, JWT_CONFIG.SECRET || 'default_secret');

      // 返回用户信息、账户信息和JWT令牌
      return success(c, {
        token, // 新增JWT令牌
        account: account
      }, "令牌验证成功");
    } catch (err) {
      console.error("令牌验证错误:", err);
      return error(c, "验证访问令牌时发生错误", ResponseCode.INTERNAL_ERROR, 500);
    }
  }) as any
);

export default app; 