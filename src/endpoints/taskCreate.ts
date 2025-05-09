import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { TaskService, Task } from "../services/taskService";

const taskService = new TaskService();
const app = new OpenAPIHono();

const taskSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().max(1000).optional(),
	status: z.string().max(50).optional(),
});

app.openapi(
	{
		method: "post",
		path: "/",
		request: {
			body: {
				content: {
					"application/json": {
						schema: taskSchema,
					},
				},
			},
		},
		responses: {
			201: {
				description: "Task created successfully",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							task: z.object({
								id: z.number(),
								title: z.string(),
								description: z.string().optional(),
								status: z.string().optional(),
							}).optional(),
						}),
					},
				},
			},
			400: {
				description: "Invalid input",
			},
			500: {
				description: "Server error",
			},
		},
		tags: ["Tasks"],
	},
	async (c) => {
		try {
			const taskData = await c.req.json();
			
			// 验证请求数据
			const result = taskSchema.safeParse(taskData);
			if (!result.success) {
				return c.json({ 
					success: false, 
					error: "Invalid task data" 
				}, 400);
			}
			
			// 确保title属性存在
			const validatedTask: Task = {
				title: result.data.title,
				description: result.data.description,
				status: result.data.status
			};
			
			const createdTask = await taskService.createTask(validatedTask);
			
			return c.json({
				success: true,
				task: createdTask
			}, 201);
		} catch (error) {
			console.error("Error creating task:", error);
			return c.json({ 
				success: false, 
				error: "Failed to create task" 
			}, 500);
		}
	}
);

export default app;


