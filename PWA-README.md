# 词环 PWA

这个版本可以从支持 PWA 的浏览器安装，并在首次完整加载后离线运行游戏。

## 本地预览

Service Worker 不能从 `file://` 地址运行。请通过本地 HTTP 服务或 HTTPS 网站访问项目目录，然后打开：

```bash
npm run serve
```

默认地址为 `http://127.0.0.1:4173`。也可以使用任意本地静态文件服务器，然后打开：

- `/index.html`
- 或 `/word-chain-game.html`

在 Chrome 或 Edge 中，满足安装条件后，开始页会出现“安装应用”按钮；也可以使用地址栏的安装图标。

## 发布要求

- 正式环境必须使用 HTTPS。
- 网站根目录需要保留 `manifest.webmanifest`、`service-worker.js` 和 `assets/icons/`。
- 每次修改离线资源后，应同步更新 `service-worker.js` 中的 `SHELL_CACHE` 版本号，以便已安装用户收到更新。
- 可以运行 `npm run validate:pwa` 检查清单、图标、离线资源和脚本语法。

## 离线范围

游戏、词库、关卡、成就和本地纪录可以离线使用。在线词义、翻译及发音依赖第三方服务；已经查过并保存在浏览器中的部分词义仍可离线查看。
