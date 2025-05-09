import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext, Task } from "../types";
import { success } from "../utils/response";

export class TaskDelete extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "删除任务",
		request: {
			params: z.object({
				taskSlug: Str({ description: "任务标识" }),
			}),
		},
		responses: {
			"200": {
				description: "返回任务是否成功删除",
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

		// 提取验证后的slug
		const { taskSlug } = data.params;

		// 在此实现自己的对象删除逻辑

		// 构建被删除的任务对象（用于确认）
		const task = {
			name: "使用Cloudflare Workers构建一些很棒的东西",
			slug: taskSlug,
			description: "示例描述",
			completed: true,
			due_date: "2022-12-24",
		};

		// 使用自定义响应格式
		return success(c, { task }, "删除任务成功");
	}
}
