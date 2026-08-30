# 词环 · Word Loop

一个中英双语的英文单词接环 PWA。玩家使用前一个单词末尾两个字母作为下一个单词的开头，在限定步数内让词链回到起始字母组合。

[在线体验](https://word-chain-loop.pages.dev/word-chain-game)

![词环社交预览](./og.png)

## 功能

- 休闲模式与 100 关闯关模式。
- 30 个简单、35 个标准、35 个困难关卡；每关经过词图自动验证。
- 三星评价、最大步数、撤销、提示与最佳纪录。
- “百关成书”全通关成就，以及闭环数、不同起始词、最短路线等长期成就。
- 中英文界面、双语词义、音标与发音。
- 离线 PWA、安装更新提示和本地进度。
- Cloudflare Pages Functions、D1 邮箱账户和跨设备云存档。

## 技术结构

| 部分 | 实现 |
| --- | --- |
| 前端 | 原生 HTML、CSS、JavaScript，无前端运行时框架 |
| 词图 | 浏览器内构建两字母有向图并计算最短闭环路线 |
| PWA | Web App Manifest、Service Worker、离线资源缓存 |
| API | Cloudflare Pages Functions |
| 数据库 | Cloudflare D1 |
| 认证 | PBKDF2-SHA-256、服务端 Pepper、HttpOnly 会话 Cookie |
| 构建与部署 | Node.js、pnpm、Wrangler |

## 快速开始

环境要求：Node.js 22 或更高版本、pnpm 11。

```bash
pnpm install --frozen-lockfile
pnpm serve
```

浏览器打开 `http://127.0.0.1:4173/word-chain-game`。这个静态预览支持游戏和 PWA 页面，但不启动账户 API。

## 本地运行 Cloudflare 全栈版本

1. 复制 `.dev.vars.example` 为 `.dev.vars`，替换 `PASSWORD_PEPPER`。不要提交 `.dev.vars`。
2. 初始化本地 D1：

```bash
pnpm exec wrangler d1 migrations apply DB --local
```

3. 启动 Pages 本地环境：

```bash
pnpm dev:cloudflare
```

本地 D1 与线上 D1 相互隔离。`functions/` 通过文件路径映射 `/api/*` 路由。

## 验证

```bash
pnpm check
```

完整检查包括：

- PWA 清单、图标、离线资源和脚本语法。
- 100 个关卡的编号、起始词唯一性、最短距离、路线数量、常用收尾词、提示与失败路径。
- 原 12 关存档自动续接到第 13 关。
- 密码记录、旧密码升级和有界 JSON 请求体。
- 静态资源、账户 API 与 Pages Functions 编译。
- Wrangler D1 绑定类型是否与配置一致。

生成候选关卡词：

```bash
node tools/validate-campaign-levels.js --suggest --suggest-only
```

## 部署到 Cloudflare Pages

### 新建自己的项目

1. Fork 或克隆仓库。
2. 创建 D1 数据库，并把 `wrangler.jsonc` 中的 `database_name`、`database_id` 替换成自己的值。
3. 应用远程 migration：

```bash
pnpm exec wrangler d1 migrations apply DB --remote
```

4. 给 Pages 项目设置至少 32 个随机字符的加密 Secret：

```bash
pnpm exec wrangler pages secret put PASSWORD_PEPPER --project-name word-chain-loop
```

5. 部署：

```bash
pnpm deploy:cloudflare
```

也可以把 GitHub 仓库连接到 Cloudflare Pages。构建命令使用 `pnpm build:cloudflare`，输出目录为 `cloudflare-dist`；D1 binding 名必须为 `DB`。

### 更新现有项目

普通静态资源和 Functions 更新运行 `pnpm deploy:cloudflare` 即可。新增 migration 时，应先备份并执行 `wrangler d1 migrations apply DB --remote`。不要把 Secret 写进源码、GitHub Actions 文件或 `wrangler.jsonc`。

## 项目目录

```text
assets/                  PWA 图标
functions/               Cloudflare Pages Functions
  _lib/                  认证与响应工具
  api/                   账户和进度 API
migrations/              D1 migrations
tools/                   构建、验证与本地预览脚本
campaign-levels.js       100 关配置
campaign.js              闯关状态与界面
achievements.js          成就统计与解锁
game.js                  核心词图与游戏逻辑
service-worker.js        PWA 离线缓存
wrangler.jsonc           Cloudflare Pages 与 D1 配置
```

## 数据与隐私

- 未登录进度保存在浏览器 `localStorage`。
- 登录后可把成就、闯关进度和纪录同步到 D1。
- 密码明文不会写入数据库；生产环境必须配置 `PASSWORD_PEPPER`。
- 词典来源与许可说明见 [DICTIONARY_SOURCES.md](./DICTIONARY_SOURCES.md) 和 [THIRD_PARTY_NOTICES](./THIRD_PARTY_NOTICES/SCOWL-Copyright.txt)。

## 贡献与安全

提交代码前请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。安全问题请按 [SECURITY.md](./SECURITY.md) 使用 GitHub 私密漏洞报告，不要公开包含账户或会话数据的 Issue。

## 许可证

本仓库目前未附带项目级开源许可证。公开发布前，仓库所有者应根据期望的使用和分发方式选择许可证；第三方词典材料仍受各自通知文件约束。
