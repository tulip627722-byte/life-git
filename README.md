# Life Git

Tulip 的人生版本系统：公开个人主页、私有项目管理台、GitHub 只读同步、代码/图片预览，以及经 Tulip 确认后发布的 AI 自我介绍 README。

## 产品路由

- `/`：概览、贡献图、代表项目和最近提交
- `/timeline`：Life Commit 时间线
- `/projects`：公开项目仓库
- `/projects/:slug`：项目文件树、代码、图片与原始 README
- `/readme`：Tulip 已发布的自我介绍
- `/admin/projects`：GitHub 导入、同步、上传和可见性管理
- `/admin/readme`：README 变化检测、草稿对比、发布与回滚

## 本地预览

`npm run dev -- --host 127.0.0.1 --port 4173 --strictPort`

本地没有云端凭据时，项目数据保存在浏览器。公开 GitHub 仓库可直接通过 GitHub 公开 API 导入；私有仓库、D1/R2 写入和 AI 生成会显示“未配置服务”的安全降级状态。

## Sites 运行时

`.openai/hosting.json` 声明两个逻辑绑定：

- `DB`：D1，使用 `.openai/drizzle/0000_life_git.sql`
- `FILES`：R2，保存代码快照、图片和补充上传

生产环境密钥：

- `SESSION_SECRET`
- `OWNER_GITHUB_ID`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `GITHUB_APP_ID` / `GITHUB_APP_SLUG` / `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- 可选 `OPENAI_MODEL`

GitHub App 只需 Repository metadata 读权限和 Contents 读权限，订阅 `push` 事件。系统不申请 Contents 写权限，不回写项目 README。

## 验证

- `npm run build`
- `npm run test:sites`

上传路径会拦截 `.env`、密钥/证书、依赖目录、构建产物、路径穿越和不可预览的二进制文件。
