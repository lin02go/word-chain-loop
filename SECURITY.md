# 安全政策

## 报告漏洞

请优先使用 GitHub 仓库的 **Private vulnerability reporting** 提交安全问题。不要在公开 Issue 中粘贴以下内容：

- Cloudflare API Token、账户 ID 或 Secret 值。
- D1 导出数据、邮箱、密码散列或会话 Token。
- 可以直接复现账户接管或数据读取的完整利用代码。

报告应包含受影响版本、复现条件、预期影响和建议修复方向。维护者确认并发布修复前，请避免公开披露细节。

## 支持范围

安全修复以主分支最新版本为准。旧部署应升级到最新提交，并确认 D1 migrations 与 Pages Secrets 已同步配置。

