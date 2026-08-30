# Cloudflare Pages 邮箱账户配置

本项目的邮箱账户 API 位于 `functions/api`，使用 Cloudflare Pages Functions 和 D1。线上启用前需要完成以下配置：

1. 在 Cloudflare 控制台创建一个 D1 数据库。
2. 打开 `word-chain-loop` Pages 项目，在 **Settings → Bindings** 中添加 D1 binding，变量名必须是 `DB`。
3. 在 **Settings → Variables and Secrets** 中添加加密 Secret `PASSWORD_PEPPER`，使用至少 32 个随机字符；不要把值写入仓库。
4. 运行 `pnpm exec wrangler d1 migrations apply DB --remote` 应用 `migrations/`。Functions 不会在请求期间自动建表。
5. 重新部署 Pages 项目。Pages 会从仓库根目录识别 `functions`，`_routes.json` 只把 `/api/*` 交给 Functions。

账户采用邮箱与密码登录。密码先使用服务器端 `PASSWORD_PEPPER` 处理，再经 PBKDF2-SHA-256 加盐派生后保存；登录会话使用 `HttpOnly`、`Secure`、`SameSite=Lax` Cookie，有效期 30 天。连续失败登录会按邮箱与来源地址限流。
