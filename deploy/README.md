# VPS 部署清单

下面按 Ubuntu 22.04/24.04、Nginx 和 systemd 编写。将 `/opt/outbound-guard` 替换为你的实际部署目录，并把 `example.com` 替换为域名。

## 1. 系统依赖

```bash
sudo apt update
sudo apt install -y python3 python3-venv nginx git
sudo useradd --system --home /opt/outbound-guard --shell /usr/sbin/nologin outbound-guard
sudo mkdir -p /opt/outbound-guard
sudo chown -R outbound-guard:outbound-guard /opt/outbound-guard
```

## 2. 后端

```bash
cd /opt/outbound-guard
git clone <你的仓库地址> .
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
```

编辑 `backend/.env`，至少设置：

```dotenv
APP_ENV=production
DEBUG=false
HOST=127.0.0.1
PORT=8000
CORS_ORIGINS=https://example.com
SUPERADMIN_USERNAME=admin
SUPERADMIN_PASSWORD=替换成随机强密码
GLM_API_KEY=替换成智谱真实密钥
GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
GLM_MODEL=glm-4-flash
DEMO_MODE=false
DATABASE_PATH=data/outbound_guard.sqlite3
```

不要把 `.env` 提交到 Git。`data/outbound_guard.sqlite3`、`uploads/`、`reports/` 和 `data/assistant_knowledge/` 都是运行时数据，需要持久化和备份。

## 3. 前端静态文件

```bash
cd /opt/outbound-guard
npm ci
npm run build
```

构建产物默认在 `/opt/outbound-guard/dist`，同源部署时前端会通过 `/api` 访问后端，不需要在前端写死 VPS IP。

## 4. systemd 与 Nginx

```bash
sudo cp deploy/outbound-guard-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now outbound-guard-api
sudo cp deploy/nginx.conf /etc/nginx/sites-available/outbound-guard
sudo sed -i 's/example.com/你的域名/g' /etc/nginx/sites-available/outbound-guard
sudo ln -s /etc/nginx/sites-available/outbound-guard /etc/nginx/sites-enabled/outbound-guard
sudo nginx -t
sudo systemctl reload nginx
```

确认服务：

```bash
curl http://127.0.0.1:8000/api/health
sudo systemctl status outbound-guard-api
sudo journalctl -u outbound-guard-api -n 100 --no-pager
```

## 5. HTTPS 与防火墙

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

证书配置完成后，把 `CORS_ORIGINS` 保持为 HTTPS 域名。只开放 80/443 和 SSH，不要把 8000 暴露到公网。

## 6. 数据备份

至少每天备份 SQLite 数据库、用户知识库、上传图样和报告目录；备份文件应放到 VPS 之外并限制权限：

```bash
sudo tar -czf /var/backups/outbound-guard-$(date +%F).tgz \
  /opt/outbound-guard/backend/data \
  /opt/outbound-guard/backend/uploads \
  /opt/outbound-guard/backend/reports
sudo chmod 600 /var/backups/outbound-guard-*.tgz
```

GLM Key、超级管理员密码和 Demo 密码必须通过服务器 `.env` 管理。比赛演示入口只有在 `DEMO_MODE=true` 且设置了 `DEMO_PASSWORD` 时才会出现；正式上线建议关闭。
