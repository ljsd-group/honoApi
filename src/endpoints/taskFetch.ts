import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext, Task } from "../types";
import { error, success } from "../utils/response";
import { ResponseCode } from "../utils/response";

export class TaskFetch extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "根据slug获取单个任务",
		request: {
			params: z.object({
				taskSlug: Str({ description: "任务标识" }),
			}),
		},
		responses: {
			"200": {
				description: "如果找到，则返回单个任务",
				content: {
					"application/json": {
						schema: z.object({
							code: z.number(),
							data: z.object({
								task: Task,
							}),
							message: z.string(),
						}),
					},
				},
			},
			"404": {
				description: "任务未找到",
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
		// 获取验证后的数据
		const data = await this.getValidatedData<typeof this.schema>();

		// 提取验证后的slug
		const { taskSlug } = data.params;

		// 在此实现自己的对象获取逻辑
		// 示例：检查任务是否存在（实际项目中通常会查询数据库）
		const exists = true; // 在实际应用中，这个值可能是false

		// 检查对象是否存在
		if (!exists) {
			return error(c, "任务未找到", ResponseCode.NOT_FOUND, 404);
		}

		// 构建任务对象
		const task = {
			name: "我的任务",
			slug: taskSlug,
			description: "这需要被完成",
			completed: false,
			due_date: new Date().toISOString().slice(0, 10),
		};

		// 使用自定义响应格式
		return success(c, { task }, "获取任务成功");
	}
}
