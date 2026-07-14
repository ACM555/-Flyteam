# Outbound-Guard

面向中国企业赴越南发展的商标合规审查智能体。项目采用 React + Ant Design 前端、FastAPI 后端、SQLite 任务状态、本地法律与商标知识库、OpenCV 视觉分析及 PDF 文书生成。

## 启动后端

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## 启动前端

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

- 前端：<http://127.0.0.1:5173/>
- 后端接口文档：<http://127.0.0.1:8000/docs>
- 健康检查：<http://127.0.0.1:8000/api/health>

## 测试与构建

```powershell
npm test
npm run test:e2e
npm run build

cd backend
.\.venv\Scripts\python.exe -m pytest
```

端到端测试会联调真实 Vite 与 FastAPI 服务，覆盖高危/低危审查、非法文件、PDF、四档响应式和无障碍扫描。视觉规范见 `design-system/MASTER.md`，更多后端配置与数据刷新方式见 `backend/README.md`。
