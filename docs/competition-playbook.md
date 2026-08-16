# Outbound-Guard 比赛演示说明

## 项目定位

Outbound-Guard 面向中国企业赴越南与东盟市场，提供“注册前预检、注册中导航、注册后风控”的商标合规智能体。

核心差异化不是普通同类近似检索，而是把以下三层组合成可解释风险模型：

- 同类/类似类别近似检索
- 跨类驰名保护扫描
- 驳回前科红牌与公共纹样私有化边界

## 评审前配置

比赛演示需要配置 GLM API。先在 `backend` 目录创建本地环境文件：

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

在 `backend/.env` 至少填写以下配置。密码和 API Key 只保存在本地 `.env`，不要提交到 Git：

```dotenv
APP_ENV=development
DEBUG=true
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=设置一个至少 6 位的密码
GLM_API_KEY=填写智谱 GLM API Key
GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
GLM_MODEL=glm-4-flash
DEMO_MODE=true
DEMO_USERNAME=demo
DEMO_PASSWORD=设置一个至少 6 位的演示密码
```

后端首次启动会根据这些配置初始化超级管理员和比赛演示账号。演示结束或正式部署时，将 `DEMO_MODE` 改为 `false`。

## 启动方式

终端一：

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

终端二：

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

访问前端 `http://127.0.0.1:5173/`。登录页会显示“进入比赛演示”按钮，使用配置中的 `DEMO_USERNAME` 和 `DEMO_PASSWORD` 自动进入演示流程；超级管理员使用 `SUPERADMIN_USERNAME` 和 `SUPERADMIN_PASSWORD` 登录。

## 推荐演示路径

1. 打开首页能力驾驶舱，展示 M1-M6 全链路矩阵。
2. 点击“进入比赛演示”，进入品牌审查页。
3. 点击“填入比赛演示案例”，检查文字、类别和目标国家信息。
4. 上传一个四叶花或花瓣式 Logo。
5. 提交审查，等待进入报告页。
6. 重点讲解报告中的风险结论、法律依据、注册策略和“参赛亮点”页签。
7. 下载 PDF，展示系统生成的防御性合规规划书。
8. 使用超级管理员账号打开 `/admin`，展示审查任务管理、风险分布和任务详情。
9. 打开 AI 助手，上传知识资料并提问，展示 GLM 驱动的 RAG 链路。

## 账号体系

- 登录页：`/login`
- 注册页：`/register`
- 后台入口：`/admin`
- 超级管理员：由 `SUPERADMIN_USERNAME` 和 `SUPERADMIN_PASSWORD` 配置
- 比赛演示账号：由 `DEMO_USERNAME` 和 `DEMO_PASSWORD` 配置，并要求 `DEMO_MODE=true`
- 普通用户：通过注册页创建，只能查看自己的审查任务

## 已跑通能力

- M1 智能预检：文字近似、图形近似、类别输入、绝对驳回规则。
- M2 侵权检索：同类近似与跨类驰名保护红牌。
- M3 文化禁忌：越南与东盟目标国规则雷达。
- M4 注册策略：单国、马德里、混合路径建议。
- M5 风控维权：NOIP 周公告、TMview/WIPO、法规则变化监控计划。
- M6 文书生成：PDF 合规规划书与证据链建议。
- AI 助手：GLM 对话、知识资料上传、检索增强回答和流式输出。

## 真实生产边界

当前版本是比赛演示增强版。NOIP、TMview、WIPO、CNIPA 等外部数据源以本地知识库和规则引擎模拟闭环，适合展示产品逻辑、技术架构和端到端流程。生产版应补充稳定 API、爬虫限速、OCR 队列、检索缓存、权限系统和审计日志。
