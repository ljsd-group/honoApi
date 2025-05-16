import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { success, error, ResponseCode } from "../../utils/response";
import { AUTH0_CONFIG, JWT_CONFIG } from "../../config/auth";
import { Context } from "hono";
import { AccountService } from "../../services/accountService";
import { DeviceService } from "../../services/deviceService";
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
  GOOGLE: 2,  // 谷歌登录
};

// 创建 Auth0 Token 验证端点
const app = new OpenAPIHono<Env>();
const accountService = new AccountService();
const deviceService = new DeviceService();

// 定义请求验证模式
const auth0VerifySchema = z.object({
  access_token: z.string(),
  loginType: z.union([
    z.number(),
    z.string().transform(val => Number(val))
  ]).default(LOGIN_TYPE.APPLE)
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
    }).optional(),
    device: z.object({
      id: z.number().optional(),
      device_number: z.string(),
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
      try {
        const body = await c.req.json();
        
        // 确保loginType是数字类型
        let { access_token, loginType } = body;
        
        // 如果没有提供loginType，使用默认值
        if (loginType === undefined || loginType === null) {
          loginType = LOGIN_TYPE.APPLE;
        } else {
          // 将loginType转换为数字
          loginType = Number(loginType);
        }
        
        // 检查loginType是否为有效的值
        if (loginType !== LOGIN_TYPE.APPLE && loginType !== LOGIN_TYPE.GOOGLE) {
          return error(c, `不支持的登录类型：${loginType}，目前只支持1(Apple)和2(Google)`, ResponseCode.INTERNAL_ERROR, 200);
        }
        
        // 从请求头获取设备相关信息
        const device_number = c.req.header("deviceNumber");
        const phone_model = c.req.header("phoneModel");
        const country_code = c.req.header("countryCode");
        const version = c.req.header("version");
        
        
        if (!access_token) {
          return error(c, "访问令牌不能为空", ResponseCode.INTERNAL_ERROR, 200);
        }

        // 使用访问令牌获取用户信息
        const userInfoResponse = await fetch(`https://${AUTH0_CONFIG.DOMAIN}/userinfo`, {
          headers: { Authorization: `Bearer ${access_token}` }
        });

        if (!userInfoResponse.ok) {
          const errorText = await userInfoResponse.text().catch(() => '未知错误');
          return error(c, `无效的访问令牌: ${errorText}`, ResponseCode.INTERNAL_ERROR, 200);
        }

        const userInfo = await userInfoResponse.json() as Auth0UserInfo;
        
        // 先查找或创建Auth0账户
        let account = await accountService.findAccountByAuth0Sub(userInfo.sub);
        
        if (!account) {
          // 如果账户不存在，创建新账户
          console.log('未找到Auth0账户，创建新账户');
          account = await accountService.createAccount({
            auth0_sub: userInfo.sub,
            name: userInfo.name,
            nickname: userInfo.nickname,
            email: userInfo.email,
            email_verified: userInfo.email_verified,
            picture: userInfo.picture
          });
        } else {
          // 如果账户已存在，更新账户信息
          console.log('找到已存在的Auth0账户，更新账户信息');
          if (account && account.id) {
            const updatedAccount = await accountService.updateAccount({
              id: account.id,
              auth0_sub: userInfo.sub,
              name: userInfo.name,
              nickname: userInfo.nickname,
              email: userInfo.email,
              email_verified: userInfo.email_verified,
              picture: userInfo.picture
            });
            // 使用类型断言解决类型问题
            account = updatedAccount as any;
          }
        }
        
        // 处理设备和账户关联
        let device;
        if (device_number) {
          // 查找或创建设备，同时传入loginType
          device = await deviceService.findOrCreateDevice(
            device_number,
            phone_model,
            country_code,
            version,
            loginType // 将loginType存储在设备表中
          );
          
          if (device && account && account.id && device.id) {
            await deviceService.linkDeviceToAccount(device.id, account.id);
            console.log(`已关联设备 ${device_number} 到账户 ${account.id}`);
          }
        }

        // 生成JWT令牌
        const token = await sign({
          sub: String(account.id), // 使用我们自己数据库中的ID，而不是Auth0的sub
          auth0_sub: userInfo.sub, // 保存Auth0的sub以便后续关联
          name: userInfo.name || '',
          email: userInfo.email || '',
          device_number: device_number || '', // 保留设备号在token中
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 *30, // 30天后过期
        }, JWT_CONFIG.SECRET || 'default_secret');

        // 处理账户中的null值，替换为空字符串
        const processedAccount = replaceNullWithEmptyString(account);
        // 如果有设备信息，也处理设备信息中的null值
        const processedDevice = device ? replaceNullWithEmptyString(device) : null;
        
        // 返回用户信息、账户信息、设备信息和JWT令牌
        return success(c, {
          token, // JWT令牌
          account: processedAccount,
          device: processedDevice // 返回设备信息，包含loginType
        }, "令牌验证成功");
      } catch (jsonErr) {
        console.error("解析请求体失败:", jsonErr);
        return error(c, "无效的请求格式，请确保发送正确的JSON格式", ResponseCode.BAD_REQUEST, 400);
      }
    } catch (err) {
      console.error("令牌验证错误:", err);
      
      // 区分不同类型的错误
      if (err instanceof Error) {
        // 检查是否为数据库约束错误
        if (err.message && err.message.includes('duplicate key value violates unique constraint')) {
          console.log('处理数据库唯一约束冲突错误');
          return error(c, "账户已存在，但处理过程中出现问题，请重试", ResponseCode.BAD_REQUEST, 400);
        }
      }
      
      return error(c, "验证访问令牌时发生错误", ResponseCode.INTERNAL_ERROR, 500);
    }
  }) as any
);

export default app; 