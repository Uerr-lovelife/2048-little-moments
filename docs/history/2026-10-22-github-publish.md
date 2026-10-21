# GitHub 仓库整理记录

用户要求上传到本人 GitHub 账号，结构清楚，方便维护和移植。已选择公开仓库、暂不添加开源许可证。

## 执行方案

- [x] 保留 `src`、`tests`、`e2e` 分层；截图归档到 `docs/images`，早期设计归档到 `docs/history`。
- [x] 用 README 概览项目；新增架构、开发、部署文档、维护规范和变更日志。
- [x] 移除浏览器测试启动命令和截图脚本对 Windows / Edge 的强制依赖，保留 Windows 默认复用 Edge 的便利。
- [x] 添加 Node 版本提示、换行与编辑器约定、GitHub 问题与 PR 模板。
- [x] 配置 Windows / Ubuntu 单元测试与构建，以及 Ubuntu Chromium 的桌面和手机测试。
- [x] 本地运行单元测试、浏览器测试和生产构建，检查待发布文件。
- [x] 创建 `Uerr-lovelife/2048-little-moments` 公开空仓库，推送原有提交及整理提交，核对远端 HEAD 与 CI。

仓库目录保持单个游戏独立，不将其他项目合并进来，不上传依赖、缓存、构建输出、测试结果或本机认证信息。

## 验收记录

- 本地：18 项单元测试、22 项浏览器交互检查通过；2 项按平台跳过；构建通过。
- 首次上传的代码提交：`cf34377677fdff4eb307e1e9a820eafd04f82500`，本地与远端 `main` 一致。
- [GitHub CI 首轮验收](https://github.com/Uerr-lovelife/2048-little-moments/actions/runs/39639569010)：Windows 与 Ubuntu 均成功；Ubuntu 桌面、手机 Chromium 交互通过，静态构建附件上传成功。
- `v1.0.0` 标记首轮 CI 已通过的代码，方便按版本克隆、回退和移植。
