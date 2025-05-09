import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Task } from "../types";
import { success } from "../utils/response";

export class TaskList extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "获取任务列表",
		request: {
			query: z.object({
				page: Num({
					description: "页码",
					default: 0,
				}),
				isCompleted: Bool({
					description: "根据完成状态筛选",
					required: false,
				}),
			}),
		},
		responses: {
			"200": {
				description: "返回任务列表",
				content: {
					"application/json": {
						schema: z.object({
							code: z.number(),
							data: z.object({
								tasks: Task.array(),
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

		// 提取验证后的参数
		const { page, isCompleted } = data.query;

		// 在此实现自己的对象列表逻辑
		const tasks = [
			{
				name: "打扫我的房间",
				slug: "clean-room",
				description: null,
				completed: false,
				due_date: "2025-01-05",
			},
			{
				name: "使用Cloudflare Workers构建一些很棒的东西",
				slug: "cloudflare-workers",
				description: "示例描述",
				completed: true,
				due_date: "2022-12-24",
			},
		];

		// 使用自定义响应格式
		return success(c, { tasks }, "获取任务列表成功");
	}
}
