import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { Context } from "hono";
import { ENV } from "../../config/env";

// 环境类型定义
type Env = {
  Bindings: any;
};

// 创建代理端点
const app = new OpenAPIHono<Env>();

app.openapi(
  {
    method: "get",
    path: "/",
    request: {
      query: z.object({
        receipt: z.string().optional()
      }).passthrough()
    },
    responses: {
      200: {
        description: "成功代理第三方API响应",
      },
      400: {
        description: "请求错误",
      },
      500: {
        description: "服务器错误"
      }
    },
    tags: ["代理服务"],
    summary: "订阅查询代理",
    description: "代理iOS客户端请求到第三方API的订阅查询接口"
  },
  async (c: Context<Env>) => {
    try {
      // 获取请求头
      const deviceNumber = c.req.header('deviceNumber');
      const phoneModel = c.req.header('phoneModel');
      const version = c.req.header('version');
      
      // 获取查询参数
      const queryParams = c.req.query();
      const receipt = queryParams.receipt || "";
      
      // 构建第三方API URL
      const apiUrl = `${ENV.THIRD_PARTY_API}/adware/subscribe/find`;
      
      // 构建请求URL（带查询参数）
      const url = new URL(apiUrl);
      if (receipt) {
        url.searchParams.append('receipt', receipt);
      }
      
      // 转发请求到第三方API
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'deviceNumber': deviceNumber || '',
          'phoneModel': phoneModel || 'ios', // 默认为ios
          'version': version || ''
        }
      });
      
      // 获取第三方API响应
      const responseData = await response.json();
      
      // 原封不动地返回第三方API的响应
      // 处理状态码，确保返回Hono支持的状态码
      const statusCode = response.status >= 200 && response.status < 600 ? 
                         response.status as 200 | 400 | 500 : 
                         500; // 默认为500
      
      return c.json(responseData, statusCode);
    } catch (err) {
      console.error("代理请求失败:", err);
      return c.json({ 
        success: false, 
        error: "代理请求失败" 
      }, 500);
    }
  }
);

export default app; 