# Outbound-Guard FastAPI 后端

## 功能

- `POST /api/audit`：创建异步商标审查任务
- `GET /api/audit/result/{taskId}`：查询进度与完整结果
- `GET /api/audit/report/{taskId}/pdf`：下载中文 PDF 合规规划书
- `GET /api/statistics`：获取审查统计
- `GET /api/health`：健康检查与视觉分析模式
- 越南《知识产权法》第 74.2(a)、74.2(i) 条硬规则
- OpenCV 图形特征、四向对称、重心和线条密度分析
- 可选 OpenAI 风格多模态接口辅助，失败时自动使用本地分析
- SQLite 任务状态持久化，上传图片完成分析后立即删除
- IP Viet Nam 官方公开列表采集器，不访问或绕过验证码详情页

## 启动

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

接口文档：<http://127.0.0.1:8000/docs>

## 更新官方商标库

官方站点在部分 Windows 环境存在证书链问题。默认严格校验证书；只有确认访问的是官方域名时，才显式使用 `--insecure`。

```powershell
.\.venv\Scripts\python.exe scripts\refresh_trademark_db.py --download-images
# 证书链失败时：
.\.venv\Scripts\python.exe scripts\refresh_trademark_db.py --download-images --insecure
```

脚本仅检索公开列表和缩略图，按权利人精确过滤并限速，不访问受人机验证保护的详情页。

## 测试

```powershell
.\.venv\Scripts\python.exe -m pytest
```
