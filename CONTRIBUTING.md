# 贡献指南

感谢参与词环项目。

## 开发流程

1. 从最新主分支创建功能分支。
2. 使用 Node.js 22+ 与 pnpm 11 安装依赖：`pnpm install --frozen-lockfile`。
3. 保持原生 HTML、CSS、JavaScript 架构；除非能显著减少总代码和维护成本，不引入新的运行时框架。
4. 修改后运行 `pnpm check`。
5. Pull Request 应说明用户可见变化、测试结果和数据迁移影响。

## 关卡变更

- 关卡 ID 必须从 1 开始连续排列，起始词不能重复。
- 原有关卡的 ID 与起始词视为持久化数据，不能随意重排。
- 新关卡必须通过 `pnpm validate:campaign`。
- 修改词典后必须重新验证全部关卡。

## Cloudflare 变更

- D1 binding 固定命名为 `DB`。
- 数据库结构只通过 `migrations/` 变更，不在请求处理过程中执行 DDL。
- Secret 只能通过 Cloudflare 或本地 `.dev.vars` 配置。
- 所有异步操作必须被 `await`、`return` 或交给平台执行上下文管理。

## 代码风格

- 优先小函数、早返回和数据驱动配置。
- 避免内联事件处理器、重复常量和隐式全局变量。
- 用户界面文案同时维护中文和英文版本。
- 修改 PWA 离线资源时递增 `service-worker.js` 的缓存版本。

