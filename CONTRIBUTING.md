# 开发与维护约定

## 开始修改

1. 阅读 [README](README.md) 和 [架构说明](docs/architecture.md)。
2. 从最新 `main` 创建短期分支，例如 `feat/undo-move`、`fix/touch-swipe`、`docs/deployment`。
3. 一次 PR 只处理一个目标；避免同时改规则、重做样式和升级依赖。
4. 在规则或存档有变动时，先写能复现问题的失败测试，再修改实现。

```bash
git switch main
git pull --ff-only
git switch -c feat/your-feature
npm ci
npm test
npm run dev
```

Windows PowerShell 如果阻止 `npm.ps1`，将示例中的 `npm` 换成 `npm.cmd`，不用修改执行策略。

## 文件职责

- 规则只放在 `src/game.js`，不依赖 DOM、浏览器存储和界面颜色。
- 存档验证只放在 `src/storage.js`。改变存档格式时必须定义迁移方式或版本回退。
- 操作、动画和渲染放在 `src/main.js`。所有输入共享同一个移动入口。
- 样式放在 `src/style.css`。避免把规则判断写进 CSS 或界面事件处理器。
- 本机端口、路径和测试浏览器差异放在工具配置或环境变量中。

## 提交与 PR

提交信息使用 `feat:`、`fix:`、`docs:`、`test:`、`chore:`、`ci:` 前缀，后面描述具体变化。保留小而完整的提交，推送自己的功能分支后创建 PR。

```bash
npm test
npm run test:e2e
npm run build
git add src tests
git commit -m "fix: prevent repeated merges in one move"
git push -u origin fix/your-fix
```

提交具体文件，确认 `git diff --cached` 的内容。不要提交依赖目录、缓存、密钥、个人配置或测试报告。PR 描述写清问题、结果和验证；界面改动附截图。

GitHub Actions 会在 Windows 和 Ubuntu 验证规则与构建，并在 Ubuntu 验证 Chromium 桌面、手机交互。合并前检查 CI 结果。当前没有配置强制分支保护；仓库维护者需按此约定检查后再合并。

## 版本与发布

在 `CHANGELOG.md` 的 Unreleased 部分记录用户可见变化。准备发布时更新版本、锁文件和变更日志，通过验收后再创建对应版本标签。不要给已有标签强制改指向。

仓库当前未添加开源许可证。维护约定本身不构成对代码的开源授权。
