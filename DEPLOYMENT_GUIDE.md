# 🚀 FrameFlow Production Deployment Guide

This guide covers deploying **FrameFlow** on any **Linux VPS** (DigitalOcean Droplet, Hetzner, AWS EC2, Linode, Hostinger) or self-hosted PaaS (**Coolify**, **Dokploy**) using **Docker Compose**.

---

## 🏗️ Architecture Overview

The production deployment runs 5 high-performance isolated containers connected via an internal bridge network:

1. **`frameflow_web`**: React 19 + Vite SPA compiled into static assets and served by **Nginx** on port 80. Nginx automatically reverse-proxies `/api` calls directly to the API container.
2. **`frameflow_api`**: Node.js Express REST API handling auth, event metadata, selection workflows, and presigning storage URLs. Automatically synchronizes PostgreSQL tables on startup.
3. **`frameflow_worker`**: Dedicated **Sharp** image processing & background ZIP archiver microservice.
4. **`frameflow_postgres`**: PostgreSQL 16 database storing users, events, photos, and selection records with persistent volume data.
5. **`frameflow_redis`**: Redis 7 message broker and cache for BullMQ queue orchestration.
6. *(Optional)* **`frameflow_caddy`**: Reverse proxy that automatically provisions and renews free **Let's Encrypt SSL certificates (HTTPS)**.

---

## 📋 Prerequisites

- A VPS running Ubuntu 22.04 / 24.04 or Debian (Minimum recommended: **2 GB RAM**, 1-2 vCPUs).
- Docker and Docker Compose installed:
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  ```
- A domain name pointed to your VPS IP address (e.g. `photos.yourstudio.com` -> `A` record to `VPS_IP`).

---

## ⚡ Quick 5-Minute Deployment

### 1. Clone the Repository to your VPS
```bash
git clone https://github.com/<your-username>/FrameFlow.git
cd FrameFlow
```

### 2. Configure Environment Variables
Copy the template configuration:
```bash
cp .env.example .env
```
Edit `.env` with `nano .env` or `vim .env`:
```env
# Enter your domain for automatic SSL (or leave as localhost if testing with direct IP)
DOMAIN=photos.yourstudio.com

# Choose secure passwords
POSTGRES_PASSWORD=my_strong_production_password_2026
JWT_SECRET=generate_with_openssl_rand_base64_32

# Storage Driver: 'local' (zero setup, stored on VPS disk) or 'r2' (Cloudflare R2)
STORAGE_DRIVER=local
```

### 3. Build & Launch Containers

#### Option A: With Automatic HTTPS / SSL (Using your Domain)
Run with the production Caddy overlay:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
> Caddy will automatically detect your domain, contact Let's Encrypt, obtain a trusted HTTPS certificate, and activate HTTP/2 + HTTP/3.

#### Option B: Direct HTTP (Testing with IP or Existing Reverse Proxy)
```bash
docker compose up -d --build
```
> FrameFlow will be available directly on `http://<your-vps-ip>`.

---

## ☁️ Connecting Cloudflare R2 (Zero Egress Storage)

To avoid consuming VPS disk space with client photo batches and to benefit from **zero egress bandwidth fees**:

1. Go to **Cloudflare Dashboard** -> **R2** -> **Create bucket** (name it e.g. `frameflow-prod`).
2. Go to **Manage R2 API Tokens** -> **Create API Token** with **Object Read & Write** permissions.
3. In your `.env` file on the VPS, set:
   ```env
   STORAGE_DRIVER=r2
   R2_ACCOUNT_ID=your_cloudflare_account_id
   R2_ACCESS_KEY_ID=your_r2_access_key
   R2_SECRET_ACCESS_KEY=your_r2_secret_key
   R2_BUCKET_NAME=frameflow-prod
   R2_PUBLIC_DOMAIN=https://media.yourstudio.com
   ```
4. Restart the containers:
   ```bash
   docker compose up -d
   ```

---

## 🛠️ Management & Maintenance Commands

### Check Container Status
```bash
docker compose ps
```

### View Live Logs
```bash
# All services
docker compose logs -f

# API logs
docker compose logs -f api

# Image processing worker logs
docker compose logs -f image-worker
```

### Database Backup
```bash
docker compose exec -t postgres pg_dump -U postgres frameflow > backup_$(date +%Y%m%d).sql
```

### Database Restore
```bash
cat backup.sql | docker compose exec -T postgres psql -U postgres frameflow
```

### Updating to the Latest Code
```bash
git pull
docker compose up -d --build
```

---

## 🌟 Verifying Your Deployment
1. Visit `https://your-domain.com` (or `http://your-ip`).
2. Log in using the **⚡ 1-Click Instant Demo Login** button or create your official studio account.
3. Create an event, upload a photo batch, and test opening the gallery on your mobile phone with PIN `0000`.
