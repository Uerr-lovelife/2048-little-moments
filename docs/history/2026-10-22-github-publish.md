# GitHub 仓库整理记录

用户要求上传到本人 GitHub 账号，结构清楚，方便维护和移植。已选择公开仓库、暂不添加开源许可证。

## 执行方案

- [x] 保留 `src`、`tests`、`e2e` 分层；截图归档到 `docs/images`，早期设计归档到 `docs/history`。
- [x] 用 README 概览项目；新增架构、开发、部署文档、维护规范和变更日志。
- [x] 移除浏览器测试启动命令和截图脚本对 Windows / Edge 的强制依赖，保留 Windows 默认复用 Edge 的便利。
- [x] 添加 Node 版本提示、换行与编辑器约定、GitHub 问题与 PR 模板。
- [x] 配置 Windows / Ubuntu 单元测试与构建，以及 Ubuntu Chromium 的桌面和手机测试。
- [x] 本地运行单元测试、浏览器测试和生产构建，检查待发布文件。
- [ ] 创建 `Uerr-lovelife/2048-little-moments` 公开空仓库，推送原有提交及整理提交，核对远端 HEAD 与 CI。

仓库目录保持单个游戏独立，不将其他项目合并进来，不上传依赖、缓存、构建输出、测试结果或本机认证信息。
