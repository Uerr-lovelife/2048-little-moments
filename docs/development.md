# 开发环境与测试

## 环境

- Node.js 22.12 或更新；推荐 Node.js 24 LTS，`.nvmrc` 已指定 24。
- npm 与 Git。
- 现代浏览器。Windows 测试默认复用 Microsoft Edge；Linux / macOS 使用 Playwright Chromium。

```bash
git clone https://github.com/Uerr-lovelife/2048-little-moments.git
cd 2048-little-moments
npm ci
npm run dev
```

打开终端显示的地址。Windows PowerShell 若提示不允许执行 `npm.ps1`，使用 `npm.cmd` 替代 `npm`。npm 缓存在项目的 `.npm-cache`，无需管理员权限。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 开发预览和自动刷新 |
| `npm test` | 规则与存档单元测试 |
| `npm run test:e2e` | 桌面和手机模拟浏览器交互测试 |
| `npm run build` | 输出可部署的 `dist/` |
| `npm run preview` | 检查构建后的站点 |

## 浏览器测试

Windows 已安装 Edge 时可直接运行 `npm run test:e2e`。其他系统首次执行：

```bash
npx playwright install chromium
npm run test:e2e
```

Linux CI 还需要浏览器系统库，使用 `npx playwright install --with-deps chromium`。测试自动启动 Vite；现有本地 5173 服务会被复用，CI 会启动自己的服务。测试使用独立浏览器上下文，不修改日常浏览器存档。

可用 `PLAYWRIGHT_CHANNEL` 显式选择浏览器。Windows PowerShell 使用打包 Chromium 的示例：

```powershell
npx.cmd playwright install chromium
$env:PLAYWRIGHT_CHANNEL = 'chromium'
npm.cmd run test:e2e
Remove-Item Env:\PLAYWRIGHT_CHANNEL
```

桌面与手机环境运行相同游戏行为检查；原生触摸只在手机环境执行，笔记本布局只在桌面环境执行。当前测试不是 iPhone 真机 Safari 验收。

## 生成截图

启动开发服务后，在另一个终端运行：

```bash
node scripts/capture-preview.mjs
```

生成 `docs/images/desktop.png`、`laptop.png`、`mobile.png`。脚本使用独立上下文和固定示例棋盘，不会修改你的游玩进度。通过 `PREVIEW_URL` 可以指定其他预览地址；默认 `http://127.0.0.1:5173`。

## 排查

- 端口占用：以 Vite 输出的地址为准，或通过 `--port` 选择端口。
- 测试找不到浏览器：执行上述浏览器安装命令，或指定已安装的通道。
- 存档不同：主机、端口、浏览器或浏览模式不同会使用不同存储空间。
- 代理影响局域网：让本地地址直连；先确认设备在同一局域网，再排查路由隔离和入站连接。
