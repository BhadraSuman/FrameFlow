# 🛠️ FrameFlow Operational & Debugging Cheat Sheet

A comprehensive reference of all useful commands for both **Local Development** (Windows PowerShell) and **Production / Cloud** (AWS EC2 / Linux VPS Docker).

---

## 💻 1. Local Development (Windows / PowerShell)

### Running the App
| Command | What it Does |
| :--- | :--- |
| `pnpm dev` | Starts all 3 services concurrently (`API:4000`, `Worker:4001`, `Web:5173`) |
| `pnpm --filter @frameflow/api dev` | Runs **API server only** |
| `pnpm --filter @frameflow/image-worker dev` | Runs **Image Worker microservice only** |
| `pnpm --filter @frameflow/web dev` | Runs **React/Vite frontend only** |
| `pnpm build` | Compiles TypeScript across all workspace packages |

### Database & Prisma (Local SQLite)
| Command | What it Does |
| :--- | :--- |
| `pnpm --filter @frameflow/db exec prisma studio` | Opens **Prisma Studio browser GUI** at `http://localhost:5555` to view/edit database records |
| `pnpm --filter @frameflow/db exec prisma db push` | Pushes local SQLite schema changes without creating migration files |
| `pnpm --filter @frameflow/db run prisma:generate` | Regenerates Prisma Client types after modifying `schema.prisma` |

---

## ☁️ 2. Production / AWS EC2 (SSH & Docker)

### Connecting to Your EC2 Server
```powershell
# From your Windows PowerShell (replace with your key path and public IP):
ssh -i C:\Users\suman\Downloads\frameflow-key.pem ubuntu@YOUR_PUBLIC_IP
```

---

### Container Status & System Health
| Command | What it Does |
| :--- | :--- |
| `docker compose ps` | Shows running status, container names, health, and open ports |
| `docker stats` | Live real-time stream of **CPU & RAM usage** for each container |
| `free -h` | Displays total system RAM and active Swap memory usage |
| `df -h` | Checks SSD disk space usage (ensures disk is not full) |

---

### Live Logs & Real-Time Debugging
| Command | What it Does |
| :--- | :--- |
| `docker compose logs -f` | Streams logs from **all services** simultaneously |
| `docker compose logs -f api` | Live API logs (auth requests, upload presigns, gallery queries) |
| `docker compose logs -f image-worker` | Live Sharp processing logs (image resizing, WebP variants, ZIP export) |
| `docker compose logs -f web` | Nginx web server access & proxy logs |
| `docker compose logs -f postgres` | PostgreSQL database connection logs & queries |
| `docker compose logs -f redis` | Redis queue and connection logs |
| `docker compose logs --tail 50 -f api` | Views only the last 50 lines of API logs and follows live |

---

### Managing Container Lifecycles
| Command | What it Does |
| :--- | :--- |
| `docker compose up -d --build` | Rebuilds and launches all updated containers in background |
| `docker compose up -d --build api` | Rebuilds and restarts **only the API** without interrupting other services |
| `docker compose up -d --build image-worker` | Rebuilds and restarts **only the Image Worker** |
| `docker compose restart api` | Restarts the API container without rebuilding |
| `docker compose restart image-worker` | Restarts the Image Worker container |
| `docker compose down` | Stops and removes all containers (volumes/data preserved) |
| `docker compose down -v` | ⚠️ **DANGER:** Stops containers and **deletes all database data** |

---

### Shelling Inside Containers (Direct Inspection)
| Command | What it Does |
| :--- | :--- |
| `docker compose exec api sh` | Opens an interactive Linux shell inside the running **API container** |
| `docker compose exec image-worker sh` | Opens an interactive Linux shell inside the **Image Worker container** |
| `docker compose exec -it postgres psql -U postgres -d frameflow` | Launches interactive **PostgreSQL CLI** to run raw SQL queries |
| `docker compose exec -it redis redis-cli` | Launches interactive **Redis CLI** to inspect queues (`KEYS *`, `INFO`) |

---

### PostgreSQL Database Backup & Restore
```bash
# 1. Create a complete SQL backup dump:
docker compose exec -t postgres pg_dump -U postgres frameflow > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Restore database from a SQL backup file:
cat backup_20261002.sql | docker compose exec -T postgres psql -U postgres frameflow

# 3. Force database schema push inside running API container:
docker compose exec api pnpm --filter @frameflow/db run prisma:push:pg
```

---

### Disk Maintenance & Housekeeping (Small VPS Optimization)
Run these periodically or if disk usage gets high:
```bash
# Remove dangling/untagged Docker images from previous builds (Safe):
docker image prune -f

# Clean up all unused build cache and stopped containers:
docker system prune -f
```

---

## 🔄 3. CI/CD & GitHub Workflow

Whenever you make changes to the code locally:

```powershell
# 1. Stage and commit changes
git add .
git commit -m "feat: description of change"

# 2. Push to GitHub (Triggers automated build & EC2 deployment)
git push origin master
```

### Checking Deployment Status:
* View live build & deployment progress in your browser:
  👉 **[https://github.com/BhadraSuman/FrameFlow/actions](https://github.com/BhadraSuman/FrameFlow/actions)**
