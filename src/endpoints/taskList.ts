import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { TaskService } from "../services/taskService";
import { getPaginationParams } from "../utils/pagination";
import { success, error, ResponseCode } from "../utils/response";
import { Context } from "hono";

// 环境类型定义
type Env = {
	Bindings: any;
};

const taskService = new TaskService();

const app = new OpenAPIHono<Env>();

// 定义分页响应模式
const taskSchema = z.object({
	id: z.number(),
	title: z.string(),
	description: z.string().nullable().optional(),
	status: z.string(),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime()
});

const paginatedResponseSchema = z.object({
	code: z.number(),
	data: z.object({
		list: z.array(taskSchema),
		total: z.number(),
		pageNum: z.number(),
		pageSize: z.number(),
		totalPages: z.number()
	}),
	message: z.string()
});

const errorSchema = z.object({
	code: z.number(),
	message: z.string()
});

app.openapi(
	{
		method: "get",
		path: "/",
		request: {
			query: z.object({
				pageNum: z.string().optional(),
				pageSize: z.string().optional(),
				status: z.string().optional()
			})
		},
		responses: {
			200: {
				description: "返回分页任务列表",
				content: {
					"application/json": {
						schema: paginatedResponseSchema
					},
				},
			},
			500: {
				description: "服务器错误",
				content: {
					"application/json": {
						schema: errorSchema
					}
				}
			},
		},
		tags: ["任务管理"],
	},
	// 使用类型断言解决类型不匹配问题
	(async (c: Context<Env>) => {
		try {
			// 获取分页参数
			const paginationParams = getPaginationParams(c);
			
			// 获取过滤状态（如果有）
			const status = c.req.query('status');
			
			// 根据是否有状态过滤条件调用不同的服务方法
			const result = status 
				? await taskService.getTasksByStatus(status, paginationParams)
				: await taskService.getTasksWithPagination(paginationParams);
			
			// 返回成功响应
			return success(c, result, '获取任务列表成功');
		} catch (err) {
			console.error("获取任务列表失败:", err);
			return error(c, "获取任务列表失败", ResponseCode.INTERNAL_ERROR, 500);
		}
	}) as any
);

export default app;
