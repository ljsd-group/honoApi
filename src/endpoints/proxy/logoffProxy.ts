import { OpenAPIHono } from "@hono/zod-openapi"
import { z } from "zod"
import { Context } from "hono"
import { ENV } from "../../config/env"
// 引入账户服务
import { AccountService } from "../../services/accountService"


// 环境类型定义
type Env = {
	Bindings: any
}

// 创建代理端点
const app = new OpenAPIHono<Env>()
// 初始化账户服务
const accountService = new AccountService()

// 定义应用名称常量
const APP_NAMES = {
	ALGENIUS_NEXT: 'AlgeniusNext',
	PICCHAT_BOX: 'PicchatBox',
	TRADE_TUTOR_VIDEO: 'TradeTutorVideo',
	AI_META_AID: 'AIMetaAid',
	WALLET_BACKSTAGE: 'Wallet-Backstage'
}

// 定义应用对应的API路径
const APP_API_PATHS = {
	[APP_NAMES.ALGENIUS_NEXT]: {
		dev: 'http://192.168.31.103:8080/adware/subscribe/delete',
		prod: 'https://ljsdstage.com/adware/subscribe/delete'
	},
	[APP_NAMES.PICCHAT_BOX]: {
		dev: 'http://192.168.31.103:8081/system/image/subscribe/delete',
		prod: 'https://ljsdstage.com/api/system/image/subscribe/delete'
	},
	[APP_NAMES.TRADE_TUTOR_VIDEO]: {
		dev: 'http://192.168.31.103:8083/system/image/subscribe/delete',
		prod: 'https://ljsdstage.com/video/system/image/subscribe/delete'
	},
	[APP_NAMES.AI_META_AID]: {
		dev: 'http://192.168.31.103:8084/system/image/subscribe/delete',
		prod: 'https://ljsdstage.com/aiMetaMid/system/image/subscribe/delete'
	},
	[APP_NAMES.WALLET_BACKSTAGE]: {
		dev: 'http://192.168.31.103:8085/system/image/subscribe/delete',
		prod: 'https://ljsdstage.com/wallet/system/image/subscribe/delete'
	}
}

app.openapi(
	{
		method: "get",
		path: "/",
		request: {
			query: z
				.object({
					appName: z.string().optional()
				})
				.passthrough(),
		},
		responses: {
			200: {
				description: "成功代理第三方API响应",
			},
			400: {
				description: "请求错误",
			},
			500: {
				description: "服务器错误",
			},
		},
		tags: ["代理服务"],
		summary: "退出登录代理",
		description: "代理iOS客户端请求到第三方API的退出登录接口，根据应用名称选择不同的代理路径",
	},
	async (c: Context<Env>) => {
		try {
			// 获取请求头
			const deviceNumber = c.req.header("deviceNumber")
			const phoneModel = c.req.header("phoneModel")
			const version = c.req.header("version")
			const appName = c.req.header("appName") || APP_NAMES.ALGENIUS_NEXT

			// 检查必要的参数
			if (!deviceNumber) {
				return c.json({
					code: 500,
					message: "缺少设备号"
				}, 200);
			}

			// 检查授权 - 从中间件获取用户信息
			const user = (c as any).get("user")
			
			// 确保有用户信息和auth0_sub
			if (!user || !user.auth0_sub) {
				return c.json({
					success: false,
					message: "用户信息获取失败，请确保授权有效"
				}, 401);
			}

			// 根据应用名称和环境选择API路径
			const isProduction = ENV.NODE_ENV === 'production'
			const appPaths = APP_API_PATHS[appName] || APP_API_PATHS[APP_NAMES.ALGENIUS_NEXT]
			const apiUrl = isProduction ? appPaths.prod : appPaths.dev

			// 构建请求URL
			const url = new URL(apiUrl)
			// 转发请求到第三方API
			const response = await fetch(url.toString(), {
				method: "get",
				headers: {
					deviceNumber: deviceNumber,
					phoneModel: phoneModel || "ios", // 默认为ios
					version: version || "",
				},
			})

			// 获取响应数据
			const responseData = await response.json() as Record<string, any>;
			const responMessage = {
				code: responseData.code,
				message: responseData.msg,
			}
			// 如果代理请求成功，解除设备与账户的关联
			if (response.ok) {
				try {
					// 使用auth0_sub解除设备关联
					console.log(`使用auth0_sub=${user.auth0_sub}解除设备=${deviceNumber}的关联`);
					const unbindResult = await accountService.unBindDeviceByAuth0Sub(user.auth0_sub, deviceNumber);
				} catch (dbError) {
					console.error(`解除设备关联失败:`, dbError);
					// 数据库操作失败不影响API响应，但记录错误信息
				}
			}

			// 获取状态码
			const statusCode = response.status >= 200 && response.status < 600 ? (response.status as 200 | 400 | 500) : 500
			// 创建新的响应对象
			return c.json(responMessage, statusCode)
		} catch (err) {
			console.error("代理请求失败:", err)
			// 确保只返回一次响应
			return c.json(
				{
					success: false,
					error: "代理请求失败",
				},
				500
			)
		}
	}
)

export default app 