# honoApi
## Cloudflare Workers OpenAPI 3.1

这是一个使用 [chanfana](https://github.com/cloudflare/chanfana) 和 [Hono](https://github.com/honojs/hono) 框架的 Cloudflare Worker，支持 OpenAPI 3.1。

这是一个示例项目，旨在作为快速开始构建符合 OpenAPI 的 Workers 的起点，它可以自动从代码生成 `openapi.json` 模式，并根据定义的参数或请求正文验证传入的请求。

## 开始使用

1. 注册 [Cloudflare Workers](https://workers.dev)。免费层级对大多数用例来说足够了。
2. 克隆此项目并使用 `npm install` 安装依赖项
3. 运行 `wrangler login` 在 wrangler 中登录到您的 Cloudflare 帐户
4. 运行 `wrangler deploy` 将 API 发布到 Cloudflare Workers

## 项目结构

1. 您的主路由器在 `src/index.ts` 中定义。
2. 每个端点在 `src/endpoints/` 中都有自己的文件。
3. 有关更多信息，请阅读 [chanfana 文档](https://chanfana.pages.dev/) 和 [Hono 文档](https://hono.dev/docs)。

## 开发

1. 运行 `wrangler dev` 启动 API 的本地实例。
2. 在浏览器中打开 `http://localhost:8787/` 查看 Swagger 界面，您可以在其中尝试端点。
3. 对 `src/` 文件夹所做的更改将自动触发服务器重新加载，您只需刷新 Swagger 界面即可。
