import { Hono } from 'hono';
import { Env } from '../../types';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// 创建通用代理应用
const app = new Hono<{ Bindings: Env }>();

// 定义应用名称常量
const APP_NAMES = {
  ALGENIUS_NEXT: 'AlgeniusNext',
  PICCHAT_BOX: 'PicchatBox',
  TRADE_TUTOR_VIDEO: 'TradeTutorVideo',
  AI_META_AID: 'AIMetaAid',
  WALLET_BACKSTAGE: 'Wallet-Backstage'
};

// 根据环境和应用名称定义基础URL
const BASE_URLS = {
  [APP_NAMES.ALGENIUS_NEXT]: {
    dev: 'http://192.168.31.100:8080',
    prod: 'https://ljsdstage.com'
  },
  [APP_NAMES.PICCHAT_BOX]: {
    dev: 'http://192.168.31.100:8081',
    prod: 'https://ljsdstage.com'
  },
  [APP_NAMES.TRADE_TUTOR_VIDEO]: {
    dev: 'http://192.168.31.100:8083',
    prod: 'https://ljsdstage.com'
  },
  [APP_NAMES.AI_META_AID]: {
    dev: 'http://192.168.31.100:8084',
    prod: 'https://ljsdstage.com'
  },
  [APP_NAMES.WALLET_BACKSTAGE]: {
    dev: 'http://localhost:8085',
    prod: 'https://ljsdstage.com'
  }
};

// 定义请求验证模式
const comProxySchema = z.object({
  method: z.enum(["get", "post"]),
  url: z.string(),
  proxyData: z.record(z.string(), z.any()).optional()
});

// 通用代理端点
app.post('/', zValidator('json', comProxySchema), async (c) => {
  try {
    // 获取请求体
    const { method, url, proxyData } = c.req.valid('json');
    
    // 获取请求头
    const deviceNumber = c.req.header("deviceNumber");
    const phoneModel = c.req.header("phoneModel");
    const version = c.req.header("version");
    const auth = c.req.header("Auth");
    const appName = c.req.header("appName") || APP_NAMES.ALGENIUS_NEXT;

    // 检查必要的参数
    if (!deviceNumber) {
      return c.json({
        code: 500,
        message: "缺少设备号"
      }, 200 as any);
    }

    if (!url) {
      return c.json({
        code: 500,
        message: "缺少请求URL"
      }, 200 as any);
    }

    // 方法检查
    const requestMethod = method.toLowerCase();
    if (requestMethod !== "get" && requestMethod !== "post") {
      return c.json({
        code: 500,
        message: "无效的请求方法，method必须为get或post"
      }, 200 as any);
    }

    // 尝试获取用户信息（如果中间件已设置）
    const user = c.get("user") as any;
    
    // 根据环境和应用名称获取基础URL
    const isProduction = c.env.ENVIRONMENT === 'production';
    const baseUrls = BASE_URLS[appName] || BASE_URLS[APP_NAMES.ALGENIUS_NEXT];
    const baseUrl = isProduction ? baseUrls.prod : baseUrls.dev;
    
    // 构建完整的请求URL
    // 确保url是一个相对路径 (删除开头的斜杠以避免重复)
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const fullUrl = `${baseUrl}/${cleanUrl}`;
    
    // 准备请求配置
    const fetchOptions: RequestInit = {
      method: requestMethod.toUpperCase(),
      headers: {
        deviceNumber: deviceNumber,
        phoneModel: phoneModel || "ios",
        version: version || ""
      } as HeadersInit
    };
    
    // 如果有Auth头，添加到请求中
    if (auth) {
      (fetchOptions.headers as Record<string, string>).Auth = auth;
    }

    // 根据请求方法处理请求数据
    if (requestMethod === "post" && proxyData) {
      fetchOptions.body = JSON.stringify(proxyData);
      (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
    } else if (requestMethod === "get" && proxyData) {
      // 对于GET请求，将proxyData添加为查询参数
      const targetUrl = new URL(fullUrl);
      Object.entries(proxyData).forEach(([key, value]) => {
        targetUrl.searchParams.append(key, String(value));
      });
      // 更新fullUrl为添加了查询参数的URL
      const fullUrlWithParams = targetUrl.toString();
      // 转发请求到第三方API
      const response = await fetch(fullUrlWithParams, fetchOptions);
      
      // 获取响应数据
      const responseData = await response.json() as Record<string, any>;
      
      // 格式化响应
      const formattedResponse = {
        code: responseData.code || response.status,
        message: responseData.msg || responseData.message || "操作完成",
        data: responseData.data || responseData
      };

      return c.json(formattedResponse, 200 as any);
    }

    // 对于POST请求或没有查询参数的GET请求直接发送请求
    const response = await fetch(fullUrl, fetchOptions);
    
    // 获取响应数据
    const responseData = await response.json() as Record<string, any>;
    
    // 格式化响应
    const formattedResponse = {
      code: responseData.code || response.status,
      message: responseData.msg || responseData.message || "操作完成",
      data: responseData.data || responseData
    };

    // 创建新的响应对象
    return c.json(formattedResponse, 200 as any);
  } catch (err) {
    console.error("通用代理请求失败:", err);
    // 确保只返回一次响应
    return c.json(
      {
        code: 500,
        message: "代理请求失败"
      },
      200 as any
    );
  }
});

export default app; 