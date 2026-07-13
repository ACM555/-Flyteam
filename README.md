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

更多后端配置、数据刷新和测试方式见 `backend/README.md`。
