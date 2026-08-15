# Outbound-Guard

面向中国企业赴越南发展的商标合规审查智能体。项目采用 React + Ant Design 前端、FastAPI 后端、本地法律与商标知识库、OpenCV 视觉分析及结构化审查报告生成。

## 启动后端

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## 启动前端

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

- 前端：<http://127.0.0.1:5173/>
- 后端接口文档：<http://127.0.0.1:8000/docs>
- 健康检查：<http://127.0.0.1:8000/api/health>

## VPS 上线

生产部署、Nginx、systemd、HTTPS、数据持久化和备份清单见 [`deploy/README.md`](deploy/README.md)。
上线前请在 `backend/.env` 配置 GLM Key、管理员密码、生产域名 CORS，并保持 `DEMO_MODE=false`。

## 测试与构建

```powershell
npm test
npm run test:e2e
npm run build

cd backend
.\venv\Scripts\python.exe -m unittest
```

端到端测试会联调真实 Vite 与 FastAPI 服务。视觉规范见 `design-system/MASTER.md`，更多后端配置见 `backend/README.md`。
