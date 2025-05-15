import { OpenAPIHono } from "@hono/zod-openapi"
import { z } from "zod"
import { Context } from "hono"
import { ENV } from "../../config/env"

// 环境类型定义
type Env = {
	Bindings: any
}

// 创建代理端点
const app = new OpenAPIHono<Env>()

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
		dev: 'http://192.168.31.103:8080/adware/subscribe/find',
		prod: 'https://ljsdstage.com/adware/subscribe/find'
	},
	[APP_NAMES.PICCHAT_BOX]: {
		dev: 'http://192.168.31.103:8081/system/image/subscribe/find',
		prod: 'https://ljsdstage.com/api/system/image/subscribe/find'
	},
	[APP_NAMES.TRADE_TUTOR_VIDEO]: {
		dev: 'http://192.168.31.103:8083/system/image/subscribe/find',
		prod: 'https://ljsdstage.com/video/system/image/subscribe/find'
	},
	[APP_NAMES.AI_META_AID]: {
		dev: 'http://192.168.31.103:8084/system/image/subscribe/find',
		prod: 'https://ljsdstage.com/aiMetaMid/system/image/subscribe/find'
	},
	[APP_NAMES.WALLET_BACKSTAGE]: {
		dev: 'http://192.168.31.103:8085/system/image/subscribe/find',
		prod: 'https://ljsdstage.com/wallet/system/image/subscribe/find'
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
		summary: "订阅查询代理",
		description: "代理iOS客户端请求到第三方API的订阅查询接口，根据应用名称选择不同的代理路径",
	},
	async (c: Context<Env>) => {
		try {
			// 获取请求头
			const deviceNumber = c.req.header("deviceNumber")
			const phoneModel = c.req.header("phoneModel")
			const version = c.req.header("version")

			// 获取查询参数
			const queryParams = c.req.query()
			const appName = queryParams.appName || APP_NAMES.ALGENIUS_NEXT // 默认为AlgeniusNext

			// 根据应用名称和环境选择API路径
			const isProduction = ENV.NODE_ENV === 'production'
			const appPaths = APP_API_PATHS[appName] || APP_API_PATHS[APP_NAMES.ALGENIUS_NEXT]
			const apiUrl = isProduction ? appPaths.prod : appPaths.dev

			// 构建请求URL
			const url = new URL(apiUrl)

			// 转发请求到第三方API
			const response = await fetch(url.toString(), {
				method: "GET",
				headers: {
					deviceNumber: deviceNumber || "",
					phoneModel: phoneModel || "ios", // 默认为ios
					version: version || "",
				},
			})

			// 只获取一次并使用响应数据，避免多次读取流
			const responseData = await response.json()

			// 获取状态码
			const statusCode = response.status >= 200 && response.status < 600 ? (response.status as 200 | 400 | 500) : 500

			// 创建新的响应对象，而不是修改现有流
			return c.json(responseData, statusCode)
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
