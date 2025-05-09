import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { TaskService } from "../services/taskService";

const taskService = new TaskService();
const app = new OpenAPIHono();

app.openapi(
	{
		method: "get",
		path: "/:id",
		request: {
			params: z.object({
				id: z.string().transform((val) => parseInt(val, 10))
			})
		},
		responses: {
			200: {
				description: "Returns a single task",
				content: {
					"application/json": {
						schema: z.object({
							id: z.number(),
							title: z.string(),
							description: z.string().optional(),
							status: z.string().optional(),
							created_at: z.string(),
							updated_at: z.string()
						})
					}
				}
			},
			404: {
				description: "Task not found",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							error: z.string()
						})
					}
				}
			},
			500: {
				description: "Server error"
			}
		},
		tags: ["Tasks"]
	},
	async (c) => {
		try {
			const { id } = c.req.valid('param');
			
			// 获取任务
			const task = await taskService.getTaskById(id);
			
			if (!task) {
				return c.json({
					success: false,
					error: "Task not found"
				}, 404);
			}
			
			return c.json(task);
		} catch (error) {
			console.error(`Error fetching task:`, error);
			return c.json({
				success: false,
				error: "Failed to fetch task"
			}, 500);
		}
	}
);

export default app;
