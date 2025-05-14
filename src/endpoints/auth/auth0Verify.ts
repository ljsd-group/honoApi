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

// 登录类型枚举
const LOGIN_TYPE = {
  APPLE: 1,   // 苹果登录
  GOOGLE: 2   // 谷歌登录
};

// 创建 Auth0 Token 验证端点
const app = new OpenAPIHono<Env>();
const accountService = new AccountService();

// 定义请求验证模式
const auth0VerifySchema = z.object({
  access_token: z.string().min(1, "访问令牌不能为空"),
  loginType: z.number().refine(val => val === LOGIN_TYPE.APPLE || val === LOGIN_TYPE.GOOGLE, {
    message: "登录类型必须是1(Apple)或2(Google)"
  }).default(LOGIN_TYPE.APPLE)
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
      device_number: z.string().optional(),
      loginType: z.number().optional()
    }).optional()
  }),
  message: z.string()
});

const errorResponseSchema = z.object({
  code: z.number(),
  message: z.string()
});

/**
 * 检查字符串是否为ISO日期格式
 * @param str 要检查的字符串
 * @returns 是否为ISO日期格式
 */
function isISODateString(str: string): boolean {
  if (typeof str !== 'string') return false;
  
  // ISO 8601日期格式的正则表达式
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[\+\-]\d{2}:\d{2})?$/;
  return isoDatePattern.test(str);
}

/**
 * 将UTC时间字符串转换为东八区(UTC+8)时间字符串
 * @param utcDateString UTC时间字符串
 * @returns 东八区时间字符串
 */
function convertToUTC8(utcDateString: string): string {
  try {
    // 创建日期对象
    const date = new Date(utcDateString);
    
    // 获取UTC时间戳
    const utcTimestamp = date.getTime();
    
    // 转换为东八区时间 (UTC+8，增加8小时)
    const beijingTimestamp = utcTimestamp + (8 * 60 * 60 * 1000);
    
    // 创建新的日期对象（东八区时间）
    const beijingDate = new Date(beijingTimestamp);
    
    // 返回ISO格式的东八区时间字符串
    return beijingDate.toISOString();
  } catch (err) {
    console.error("时间转换错误:", err);
    // 转换出错时返回原字符串
    return utcDateString;
  }
}

/**
 * 处理对象中的null值，将它们替换为空字符串，并调整日期时区
 * @param obj 需要处理的对象
 * @returns 处理后的对象
 */
function replaceNullWithEmptyString(obj: any): any {
  // 非对象直接返回
  if (obj === null) return '';
  if (typeof obj !== 'object' || obj === undefined) return obj;
  
  // 如果是日期对象，转换为东八区时间
  if (obj instanceof Date) {
    return convertToUTC8(obj.toISOString());
  }
  
  // 如果是数组，处理每个元素
  if (Array.isArray(obj)) {
    return obj.map(item => replaceNullWithEmptyString(item));
  }
  
  const result: any = {};
  
  for (const key in obj) {
    if (obj[key] === null) {
      // null值替换为空字符串
      result[key] = '';
    } else if (typeof obj[key] === 'string' && isISODateString(obj[key])) {
      // ISO日期字符串转换为东八区时间
      result[key] = convertToUTC8(obj[key]);
    } else if (typeof obj[key] === 'object') {
      // 递归处理嵌套对象
      result[key] = replaceNullWithEmptyString(obj[key]);
    } else {
      // 其他值保持不变
      result[key] = obj[key];
    }
  }
  
  return result;
}

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
      // 获取请求体中的访问令牌和登录类型
      const body = await c.req.json();
      const { access_token, loginType = LOGIN_TYPE.APPLE } = body;
      
      // 从请求头获取设备号
      const device_number = c.req.header("deviceNumber");
      
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
        // 通过device_number和auth0_sub查找账户
        const existingAccount = await accountService.findAccountByDeviceAndAuth0Sub(device_number, userInfo.sub);
        
        if (existingAccount) {
          // 如果找到现有账户，则更新信息
          console.log('找到已存在的设备号和Auth0账户，更新账户信息');
          account = await accountService.updateAccount({
            ...existingAccount,
            auth0_sub: userInfo.sub,
            name: userInfo.name,
            nickname: userInfo.nickname,
            email: userInfo.email,
            email_verified: userInfo.email_verified,
            picture: userInfo.picture,
            loginType: loginType // 保存登录类型
          });
        } else {
          // 如果没找到匹配的设备号和Auth0账户组合，创建新账户
          console.log('设备号和Auth0账户组合不存在，创建新账户');
          account = await accountService.createAccount({
            auth0_sub: userInfo.sub,
            name: userInfo.name,
            nickname: userInfo.nickname,
            email: userInfo.email,
            email_verified: userInfo.email_verified,
            picture: userInfo.picture,
            device_number: device_number,
            loginType: loginType // 保存登录类型
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
          picture: userInfo.picture,
          loginType: loginType // 保存登录类型
        });
      }

      // 生成JWT令牌
      const token = await sign({
        sub: String(account.id), // 使用我们自己数据库中的ID，而不是Auth0的sub
        auth0_sub: userInfo.sub, // 保存Auth0的sub以便后续关联
        name: userInfo.name || '',
        email: userInfo.email || '',
        device_number: account.device_number || '',
        loginType: loginType, // 包含登录类型
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24小时后过期
      }, JWT_CONFIG.SECRET || 'default_secret');

      // 处理账户中的null值，替换为空字符串
      const processedAccount = replaceNullWithEmptyString(account);

      // 返回用户信息、账户信息和JWT令牌
      return success(c, {
        token, // 新增JWT令牌
        account: processedAccount
      }, "令牌验证成功");
    } catch (err) {
      console.error("令牌验证错误:", err);
      return error(c, "验证访问令牌时发生错误", ResponseCode.INTERNAL_ERROR, 500);
    }
  }) as any
);

export default app; 