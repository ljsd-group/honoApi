import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Task } from "../types";
import { success } from "../utils/response";

export class TaskCreate extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "创建新任务",
		request: {
			body: {
				content: {
					"application/json": {
						schema: Task,
					},
				},
			},
		},
		responses: {
			"200": {
				description: "返回创建的任务",
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
		},
	};

	async handle(c: AppContext) {
		// 获取验证后的数据
		const data = await this.getValidatedData<typeof this.schema>();

		// 提取验证后的请求体
		const taskToCreate = data.body;

		// 在此实现自己的对象插入逻辑

		// 创建任务对象
		const task = {
			name: taskToCreate.name,
			slug: taskToCreate.slug,
			description: taskToCreate.description,
			completed: taskToCreate.completed,
			due_date: taskToCreate.due_date,
		};

		// 使用自定义响应格式
		return success(c, { task }, "创建任务成功");
	}
}
