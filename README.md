<div align="center">

![词环 · Word Loop](./og.png)

# 词环 · Word Loop

看住词尾的两个字母，把单词一节一节接回起点。

[中文](./README.md) · [English](./README-en.md)

[在线试玩](https://word-chain-loop.pages.dev/word-chain-game) · [游戏规则](#怎么玩) · [本地运行](#本地运行) · [部署](#部署到-cloudflare-pages)

[![CI](https://github.com/lin02go/word-chain-loop/actions/workflows/ci.yml/badge.svg)](https://github.com/lin02go/word-chain-loop/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-2f6f55.svg)](./LICENSE)

</div>

作者高中时想出了这个接龙游戏，那时它还只写在纸上。规则很简单，但一条链快要闭合时，常常会卡在最后两个字母上。后来借助 AI 工具，我把它做成了网页游戏。

项目没有前端框架。游戏界面用原生 HTML、CSS 和 JavaScript 编写，账户、云存档和玩家投稿放在 Cloudflare Pages Functions 与 D1 上。

## 怎么玩

新单词必须以前一个单词的最后两个字母开头：

~~~text
embrace → cede → deem
   ce       de      em
~~~

<code>embrace</code> 以 <code>em</code> 开头，最后一个词 <code>deem</code> 又以 <code>em</code> 结尾，词环就闭合了。

一局里还有几条限制：

- 单词至少有 3 个字母。
- 同一个词不能用两次，换成它的其他词形也不行。
- 使用提示或查看答案后，本局会记为练习，不计最佳纪录。

休闲模式会按难度随机挑选起始词。闯关模式有 100 个固定关卡，每关都有步数上限和三星目标。

## 关卡工坊

登录后可以自己做关卡。填写起始词，系统会算出闭环路线和最短步数；亲自玩通一次，才能送去审核。

起始词不必预先收录在内置词库中，只要能通过在线英文词典检查即可。提交时，服务器还会重新检查试玩路线里的每个单词。审核通过的关卡会出现在社区列表，未通过的投稿会保留审核意见。

审核台只对管理员账户开放。首次部署后如何设置管理员，见 [Cloudflare 账户配置](./CLOUDFLARE_AUTH_SETUP.md)。

## 现在有哪些内容

- 休闲模式和 100 关闯关模式。
- 提示、撤销、最短路线与个人最佳纪录。
- 关卡制作、试玩、投稿、审核和社区关卡。
- 9 项成就，以及中英文界面。
- 单词音标、发音、英文解释和中文释义。
- 词条问题反馈、PWA 安装与核心资源离线缓存。
- 游客本地存档，以及登录后的 D1 跨设备同步。

## 本地运行

需要 Node.js 22 或更高版本，以及 pnpm 11。

~~~bash
git clone https://github.com/lin02go/word-chain-loop.git
cd word-chain-loop
pnpm install --frozen-lockfile
pnpm serve
~~~

浏览器打开 <http://127.0.0.1:4173/word-chain-game>。

这个静态预览可以调试游戏、关卡和 PWA，但不包含登录、云存档和投稿 API。

### 运行完整的 Cloudflare 环境

先复制本地环境变量示例：

~~~bash
cp .dev.vars.example .dev.vars
~~~

Windows PowerShell：

~~~powershell
Copy-Item .dev.vars.example .dev.vars
~~~

把 <code>.dev.vars</code> 中的 <code>PASSWORD_PEPPER</code> 换成至少 32 个随机字符。这个文件已被 Git 忽略，不要提交。

初始化本地 D1，再启动 Pages：

~~~bash
pnpm exec wrangler d1 migrations apply DB --local
pnpm dev:cloudflare
~~~

本地数据库和线上数据库互不相通。账户及投稿接口都在 <code>/api/*</code> 下。

## 检查

提交代码前运行：

~~~bash
pnpm check
~~~

它会检查项目文件和 README 链接、词库报告、离线缓存、100 个固定关卡、工坊目录、投稿规则、认证逻辑、请求体限制、D1 类型与 Pages Functions 编译。

只检查固定关卡：

~~~bash
pnpm validate:campaign
~~~

生成新关卡的候选起始词：

~~~bash
node tools/validate-campaign-levels.js --suggest --suggest-only
~~~

## 部署到 Cloudflare Pages

Fork 本项目后，请创建自己的 D1 数据库：

~~~bash
pnpm exec wrangler d1 create word-chain-loop
~~~

把返回的数据库名称和 ID 写入 [wrangler.jsonc](./wrangler.jsonc)，然后执行远程 migration：

~~~bash
pnpm exec wrangler d1 migrations apply DB --remote
~~~

为 Pages 项目设置密码 Pepper：

~~~bash
pnpm exec wrangler pages secret put PASSWORD_PEPPER --project-name word-chain-loop
~~~

部署生产版本：

~~~bash
pnpm deploy:cloudflare
~~~

如果 Pages 直接连接 GitHub，构建设置如下：

| 设置 | 值 |
| --- | --- |
| 构建命令 | <code>pnpm build:cloudflare</code> |
| 输出目录 | <code>cloudflare-dist</code> |
| D1 binding | <code>DB</code> |

数据库结构只通过 [migrations](./migrations) 修改。线上执行新 migration 前，先导出一份 D1 备份。

## 文件地图

~~~text
assets/                  图标与图片
functions/               Cloudflare Pages Functions
migrations/              D1 数据库迁移
tools/                   构建、检查和本地预览脚本
campaign-levels.js       100 个固定关卡
campaign.js              闯关流程与进度
achievements.js          成就与统计
workshop.js              关卡制作、试玩、投稿和审核
game.js                  词图与核心游戏逻辑
service-worker.js        离线缓存与版本更新
word-chain-game.html     游戏主页面
wrangler.jsonc           Pages 与 D1 配置
~~~

## 数据和词典

游客进度存在浏览器 <code>localStorage</code> 中。登录玩家可以把成就、闯关进度和纪录同步到 D1。密码不会明文保存，生产环境必须设置 <code>PASSWORD_PEPPER</code>。忘记密码时，管理员可以签发限时、一次性的重置链接；重置完成后，旧登录会话会全部注销。

英文词义与发音来自 Free Dictionary API 和 Datamuse，中文释义使用 MyMemory。词库的来源、许可和回退方式写在 [DICTIONARY_SOURCES.md](./DICTIONARY_SOURCES.md) 与 [THIRD_PARTY_NOTICES](./THIRD_PARTY_NOTICES/SCOWL-Copyright.txt) 中。玩家提交的词条问题如何进入词库维护流程，见 [WORD_FEEDBACK.md](./WORD_FEEDBACK.md)。

## 参与开发

提交 Pull Request 前，请先读 [CONTRIBUTING.md](./CONTRIBUTING.md) 并运行 <code>pnpm check</code>。不要重排已有的闯关 ID，它们已经写进玩家存档。

安全问题请使用 GitHub 的私密漏洞报告，不要在公开 Issue 中粘贴账户、Cookie 或数据库信息。细节见 [SECURITY.md](./SECURITY.md)。

## 许可证

项目代码使用 [MIT License](./LICENSE)，版权所有 © 2026 [lin02go](https://github.com/lin02go)。

第三方词典材料仍按各自的许可文件使用，不包含在项目的 MIT 授权中。
