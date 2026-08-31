<div align="center">

![词环 · Word Loop](./og.png)

# 词环 · Word Loop

接住前一个单词最后两个字母，把词链接下去，最后绕回起点。

[中文](./README.md) · [English](./README-en.md)

[在线试玩](https://word-chain-loop.pages.dev/word-chain-game) · [游戏规则](#怎么玩) · [本地运行](#本地运行) · [部署到 Cloudflare Pages](#部署到-cloudflare-pages)

[![CI](https://github.com/lin02go/word-chain-loop/actions/workflows/ci.yml/badge.svg)](https://github.com/lin02go/word-chain-loop/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-2f6f55.svg)](./LICENSE)

</div>

词环是一个中英双语的英文接龙游戏。玩法只盯住两个字母：看词尾，找一个能接上的新单词，直到整条词链闭合。单词长度可以变化，也没有唯一的标准答案。

项目没有使用前端运行时框架。游戏、关卡、成就和离线功能都由原生 HTML、CSS 与 JavaScript 完成；账户和云存档运行在 Cloudflare Pages Functions 与 D1 上。

## 怎么玩

每个新单词必须以前一个单词的最后两个字母开头。例如：

~~~text
embrace → cede → deem
   ce       de      em
~~~

<code>embrace</code> 以 <code>em</code> 开头，<code>deem</code> 也以 <code>em</code> 结尾，这条词链就闭合了。

游戏中还要遵守几条规则：

- 单词至少有 3 个字母，并且必须存在于游戏词典中。
- 同一局不能重复使用单词，也不能换个词形重复提交。
- 步数越少，成绩越好；使用提示或查看答案后，该局记为练习。

休闲模式会根据难度随机出题。闯关模式有 100 个固定关卡、最大步数和三星目标，通关后会解锁“百关成书”成就。

## 游戏内容

- 100 个经过自动求解验证的关卡：30 个简单、35 个标准、35 个困难。
- 休闲模式、闯关模式、提示、撤销、最短路线和个人最佳纪录。
- 9 项成就，包括闭环次数、不同起始词、最短通关和百关全通。
- 中文与英文界面，可查询音标、发音、英文解释和中文释义。
- 登录玩家可以报告生僻词、误收词、缺词或释义问题，报告进入人工复核队列。
- 可安装的 PWA；核心游戏资源支持离线访问。
- 游客进度保存在本机，登录后可通过 Cloudflare D1 跨设备同步。

## 本地运行

需要 Node.js 22 或更高版本，以及 pnpm 11。

~~~bash
git clone https://github.com/lin02go/word-chain-loop.git
cd word-chain-loop
pnpm install --frozen-lockfile
pnpm serve
~~~

打开 <http://127.0.0.1:4173/word-chain-game>。

这个启动方式适合调试游戏界面、关卡和 PWA，不会启动登录与云存档 API。

### 运行完整 Cloudflare 环境

先创建本地环境变量文件：

~~~bash
cp .dev.vars.example .dev.vars
~~~

Windows PowerShell：

~~~powershell
Copy-Item .dev.vars.example .dev.vars
~~~

把 <code>.dev.vars</code> 中的 <code>PASSWORD_PEPPER</code> 换成至少 32 个随机字符。这个文件已被 Git 忽略，不要提交。

初始化本地 D1 并启动 Pages：

~~~bash
pnpm exec wrangler d1 migrations apply DB --local
pnpm dev:cloudflare
~~~

本地 D1 与线上数据库互不影响。账户接口位于 <code>/api/*</code>。

## 检查

~~~bash
pnpm check
~~~

这条命令会检查项目文件、词库质量报告、PWA 缓存、100 个关卡的可解性、旧存档迁移、认证与词条反馈逻辑、请求体限制、静态路由、D1 类型以及 Pages Functions 编译。

只验证关卡：

~~~bash
pnpm validate:campaign
~~~

生成可用于新关卡的候选起始词：

~~~bash
node tools/validate-campaign-levels.js --suggest --suggest-only
~~~

## 部署到 Cloudflare Pages

如果你 Fork 了这个项目，需要先创建自己的 D1 数据库：

~~~bash
pnpm exec wrangler d1 create word-chain-loop
~~~

把命令返回的数据库名称和 ID 写入 [wrangler.jsonc](./wrangler.jsonc)，然后执行远程 migration：

~~~bash
pnpm exec wrangler d1 migrations apply DB --remote
~~~

为 Pages 项目设置密码 Pepper：

~~~bash
pnpm exec wrangler pages secret put PASSWORD_PEPPER --project-name word-chain-loop
~~~

最后部署：

~~~bash
pnpm deploy:cloudflare
~~~

也可以在 Cloudflare Pages 中连接 GitHub 仓库：

| 设置 | 值 |
| --- | --- |
| 构建命令 | <code>pnpm build:cloudflare</code> |
| 输出目录 | <code>cloudflare-dist</code> |
| D1 binding | <code>DB</code> |

数据库结构只通过 [migrations](./migrations) 管理。新增 migration 时，先备份线上数据，再执行远程迁移。

## 项目结构

~~~text
assets/                  图标与图片
functions/               Cloudflare Pages Functions
migrations/              D1 数据库迁移
tools/                   构建、检查和本地预览脚本
campaign-levels.js       100 个关卡的配置
campaign.js              闯关流程与进度
achievements.js          成就定义与统计
game.js                  词图和核心游戏逻辑
service-worker.js        离线缓存与版本更新
word-chain-game.html     游戏页面
wrangler.jsonc           Pages 与 D1 配置
~~~

## 数据与第三方服务

游客数据保存在浏览器 <code>localStorage</code> 中。登录用户可以把成就、闯关进度和纪录同步到 D1。密码不会以明文保存；生产环境必须配置 <code>PASSWORD_PEPPER</code>。

英文词义与发音来自 Free Dictionary API 和 Datamuse，中文释义使用 MyMemory。词典来源、许可和回退策略见 [DICTIONARY_SOURCES.md](./DICTIONARY_SOURCES.md) 与 [THIRD_PARTY_NOTICES](./THIRD_PARTY_NOTICES/SCOWL-Copyright.txt)。玩家报告如何转成可追踪的词库改动，见 [WORD_FEEDBACK.md](./WORD_FEEDBACK.md)。

## 参与开发

提交 Pull Request 前请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)，并运行 <code>pnpm check</code>。修改已有闯关关卡时不要重排 ID：关卡编号已经写入玩家存档。

安全问题请使用 GitHub 的私密漏洞报告，不要在公开 Issue 中粘贴账户、Cookie 或数据库信息。具体说明见 [SECURITY.md](./SECURITY.md)。

## 许可证

项目代码采用 [MIT License](./LICENSE)，版权所有 © 2026 [lin02go](https://github.com/lin02go)。

第三方词典材料不包含在项目的 MIT 授权中，仍按各自的许可文件使用。
