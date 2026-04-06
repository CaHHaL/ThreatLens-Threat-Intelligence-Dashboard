# 🛡️ ThreatLens — Cyber Threat Intelligence Platform

<div align="center">

![ThreatLens](https://img.shields.io/badge/ThreatLens-v1.0-0ea5e9?style=for-the-badge&logo=shield&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-dc382d?style=flat-square&logo=redis)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=flat-square&logo=docker)

**ThreatLens** is a production-grade, self-hosted Cybersecurity Threat Intelligence Platform. It continuously ingests, enriches, and correlates threat data through multiple intelligence feeds, maps behaviors to the MITRE ATT&CK framework, and provides real-time visibility to security analysts via a modern operator dashboard.

</div>

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔄 **Automated Threat Collection** | Periodic ingestion of NVD CVEs, CISA KEVs, and AlienVault OTX pulses via Celery Beat |
| 🧠 **IOC Enrichment Pipeline** | Async enrichment of Indicators of Compromise via VirusTotal, AbuseIPDB, and Shodan |
| 🎯 **MITRE ATT&CK Mapping** | Auto-seeded MITRE Enterprise matrix with daily frequency scoring |
| 🚨 **Alert Evaluation Engine** | Rule-based alert conditions evaluated every 15 minutes across all ingested IOCs |
| 📡 **Real-time WebSocket Feed** | Live threat events pushed to dashboards via Redis pub/sub channels |
| 🔐 **Hardened Authentication** | JWT Access Tokens (15 min) + HttpOnly Refresh Token Cookies (7 days) |
| 👤 **Role-Based Access Control** | `ADMIN` / `ANALYST` / `VIEWER` roles with route and operation-level enforcement |
| 📄 **Strategic Reports** | Intelligence synthesis exportable via WeasyPrint PDF engine (24h/7d/30d) |
| 📋 **Immutable Audit Log** | High-fidelity administrative observation deck for system-wide compliance |
| 🗺️ **Live Attack Map** | Geographic visualization of attack sources with real-time arc animations |
| 🎨 **Cyber-HUD UI** | High-fidelity, premium dark-mode design system with glassmorphism effects |

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                         Docker Compose Network                      │
│                                                                     │
│  ┌──────────┐   :80   ┌───────────┐        ┌────────────────────┐  │
│  │  Browser │ ──────► │   Nginx   │──/api/─►│   FastAPI :8000    │  │
│  └──────────┘         │  (Proxy)  │         │  (Uvicorn/async)   │  │
│                       └─────┬─────┘         └────────┬───────────┘  │
│                             │/               ┌────────▼───────────┐  │
│                       ┌─────▼─────┐         │   PostgreSQL :5432  │  │
│                       │  Vite/    │         └────────────────────┘  │
│                       │  React    │                                  │
│                       │  :3000    │         ┌────────────────────┐  │
│                       └───────────┘         │    Redis :6379      │  │
│                                             │  (Broker+Cache)     │  │
│  ┌─────────────────────────────────────┐    └────────┬───────────┘  │
│  │        Celery Workers               │◄────────────┘              │
│  │  ├─ celery_worker (task executor)   │                            │
│  │  └─ celery_beat   (scheduler)       │                            │
│  └─────────────────────────────────────┘                            │
└────────────────────────────────────────────────────────────────────┘
```

### Data Flow Pipeline

```
Celery Beat (scheduler)
  └─► Collector Tasks (every 15 min):
        ├─ fetch_nvd_cves     → NVD API → PostgreSQL (cves table)
        ├─ fetch_cisa_kev     → CISA API → marks CVEs as KEV
        └─ fetch_otx_pulses   → AlienVault → PostgreSQL (iocs table)

  └─► Enrichment Task (every 30 min):
        └─ enrich_iocs → VirusTotal / AbuseIPDB / Shodan → enrich IOC records

  └─► Analysis Tasks:
        ├─ score_mitre_techniques   (daily 01:00 UTC)
        └─ run_alert_evaluation     (every 15 min) → AlertEvent → Redis pub/sub → WS → UI
        └─ generate_pdf_report      (on demand) → WeasyPrint → PDF Binary
```

---

## 🛠️ Tech Stack

### Backend
| Component | Technology |
|---|---|
| API Framework | FastAPI 0.109 (async) |
| Language | Python 3.11 |
| ORM | SQLAlchemy 2.0 (AsyncPG) |
| Migrations | Alembic |
| Task Queue | Celery 5.3 + Redis broker |
| Auth | `python-jose` (JWT) + `passlib[bcrypt]` (pinned 4.0.1) |
| Validation | Pydantic v2 |
| PDF Reports | WeasyPrint |
| MITRE Data | stix2 + MITRE CTI GitHub |

### Frontend
| Component | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Styling | TailwindCSS 3 + Cyber-HUD Design System |
| State | Zustand |
| Data Fetching | React Query v5 + Axios |
| Routing | React Router v6 |
| Maps | React-Leaflet 4 |
| Icons | Lucide React |

### Infrastructure
| Component | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx Alpine (Proxied API) |
| Database | PostgreSQL 15 |
| Cache/Broker | Redis 7 |

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- No other processes claiming ports `80`, `3000`, `5432`, `6379`, `8000`

### 1. Clone and Configure

```bash
git clone https://github.com/yourusername/ThreatLens.git
cd ThreatLens

# Copy environment template
cp .env.example .env
```

Open `.env` and fill in your values:

```bash
# Generate a secure SECRET_KEY:
openssl rand -hex 32
```

**Required API Keys** (get these from external providers):
| Variable | Provider | URL |
|---|---|---|
| `OTX_API_KEY` | AlienVault OTX | https://otx.alienvault.com/api |
| `ABUSEIPDB_API_KEY` | AbuseIPDB | https://www.abuseipdb.com/api |
| `VT_API_KEY` | VirusTotal | https://www.virustotal.com/gui/my-apikey |
| `SHODAN_API_KEY` | Shodan | https://account.shodan.io |

### 2. Start the Platform

```bash
# Build all images and start all containers in background
docker-compose up -d --build
```

This starts: PostgreSQL, Redis, FastAPI, Celery Worker, Celery Beat, React Frontend, Nginx.

### 3. Initialize Database

```bash
# Apply all Alembic migrations to create database schema
docker-compose exec fastapi alembic upgrade head
```

### 4. Create Your First Account

```bash
# Register the initial admin account (via API)
curl -X POST http://localhost/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","username":"admin","password":"YourPassword123!"}'
```

> ⚠️ New accounts default to `VIEWER` role. Promote to `ADMIN` via the database or promote script.

### 5. Access the Platform

| URL | Description |
|---|---|
| http://localhost | **React Dashboard** (via Nginx) |
| http://localhost/api/docs | **Swagger API Docs** (interactive) |
| http://localhost/api/redoc | **ReDoc API Docs** |
| http://localhost:8000 | FastAPI direct (dev only) |
| http://localhost:3000 | Vite dev server (dev only) |

---

## 🔒 Security Model

### Authentication Flow
```
1. POST /api/v1/auth/login
   → Returns: { access_token } in JSON body (15 min lifetime)
   → Sets: refresh_token HttpOnly cookie (7 day lifetime)

2. All API requests include: Authorization: Bearer <access_token>

3. On 401 (token expired):
   → Axios interceptor auto-POSTs /api/v1/auth/refresh
   → New access_token issued using the HttpOnly cookie
   → Original request is retried transparently

4. POST /api/v1/auth/logout
   → Clears the HttpOnly refresh cookie
   → Client drops access token from memory
```

### Security Decisions
| Decision | Rationale |
|---|---|
| Access token in memory only | Prevents XSS from stealing long-lived tokens |
| Refresh token in HttpOnly cookie | JavaScript cannot access it — immune to XSS |
| bcrypt password hashing | Adaptive work factor, built-in salting (pinned v4.0.1) |
| Pydantic v2 validation | All inputs strictly validated, ORM prevents SQL injection |
| CORS configured explicitly | Only whitelisted origins allowed |
| Audit logging | All login events and admin actions are tracked with IP |

### Role Permissions
| Feature | VIEWER | ANALYST | ADMIN |
|---|---|---|---|
| View IOCs / CVEs | ✅ | ✅ | ✅ |
| View Threat Actors | ✅ | ✅ | ✅ |
| IOC Workbench | ❌ | ✅ | ✅ |
| ATT&CK Matrix | ❌ | ✅ | ✅ |
| Alert Rule Management | ❌ | ✅ | ✅ |
| Strategic Reports | ❌ | ✅ | ✅ |
| Data Feed Management | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | ✅ |
| Trigger Manual Fetch | ❌ | ❌ | ✅ |

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1/`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create new user account |
| POST | `/auth/login` | Login and get tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Clear refresh cookie |
| GET | `/auth/me` | Get current user profile |

### IOCs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/iocs` | List IOCs (paginated, filterable) |
| POST | `/iocs` | Submit new IOC |
| GET | `/iocs/{id}` | Get single IOC |
| POST | `/enrich/{ioc_id}` | Trigger manual enrichment |

### CVEs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/cves` | List CVEs (filter by CVSS, KEV status) |
| GET | `/cves/{cve_id}` | Get CVE details |

### Alerts
| Method | Endpoint | Description |
|---|---|---|
| GET | `/alerts/rules` | List alert rules |
| POST | `/alerts/rules` | Create alert rule |
| PUT | `/alerts/rules/{id}` | Update rule |
| DELETE | `/alerts/rules/{id}` | Delete rule |
| GET | `/alerts/events` | List triggered alert events |
| PATCH | `/alerts/events/{id}/{action}` | Acknowledge / Dismiss event |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| POST | `/reports/generate` | Generate PDF situational report |

### MITRE ATT&CK
| Method | Endpoint | Description |
|---|---|---|
| GET | `/mitre/tactics` | List all tactics |
| GET | `/mitre/techniques` | List techniques |
| GET | `/mitre/groups` | List threat groups |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/trigger-fetch` | Manually trigger all collectors |
| GET | `/admin/audit-logs` | View audit log (filterable) |

### WebSocket
| Endpoint | Description |
|---|---|
| `WS /api/v1/ws/feed?token=<access_token>` | Real-time threat event stream |

---

## 🐳 Docker Commands Reference

```bash
# Start all services
docker-compose up -d

# Start with rebuild (after code changes)
docker-compose up -d --build

# Stop all services
docker-compose down

# View all container status
docker-compose ps

# View logs for a specific service
docker-compose logs -f fastapi
docker-compose logs -f celery_worker
docker-compose logs -f frontend

# Run DB migrations
docker-compose exec fastapi alembic upgrade head

# Create new migration
docker-compose exec fastapi alembic revision --autogenerate -m "description"

# Open PostgreSQL shell
docker-compose exec postgres psql -U threatlens -d threatlens_db

# Open Python shell in backend container
docker-compose exec fastapi python -c "from app.core.config import settings; print(settings.ENVIRONMENT)"

# Restart a single service (e.g. after code change)
docker-compose restart fastapi

# Full teardown including volumes (DELETES ALL DATA)
docker-compose down -v
```

---

## 📁 Project Structure

```
ThreatLens/
├── 📄 docker-compose.yml          # Orchestrates all services
├── 📄 .env                        # Environment secrets (not in git)
├── 📄 .env.example                # Template for .env
├── 📄 .gitignore
│
├── 📂 backend/
│   ├── 📄 Dockerfile
│   ├── 📄 requirements.txt
│   ├── 📄 alembic.ini
│   ├── 📂 alembic/                # Database migrations
│   └── 📂 app/
│       ├── 📄 main.py             # FastAPI app factory + middleware
│       ├── 📂 api/
│       │   ├── 📄 deps.py         # Auth dependencies (get_current_user, RBAC)
│       │   ├── 📄 websockets.py   # WebSocket endpoint + Redis pub/sub
│       │   └── 📂 routes/         # Feature route handlers
│       │       ├── auth.py
│       │       ├── iocs.py
│       │       ├── cves.py
│       │       ├── enrich.py
│       │       ├── mitre.py
│       │       ├── alerts.py
│       │       ├── feeds.py
│       │       ├── reports.py
│       │       └── admin.py
│       ├── 📂 core/
│       │   ├── config.py          # Pydantic Settings (env var loading)
│       │   ├── database.py        # SQLAlchemy async engine + session
│       │   └── security.py        # JWT creation/verification + bcrypt
│       ├── 📂 models/             # SQLAlchemy ORM models
│       ├── 📂 schemas/            # Pydantic request/response schemas
│       ├── 📂 services/           # Business logic layer
│       └── 📂 worker/
│           ├── celery_app.py      # Celery app + beat schedule
│           ├── normalizer.py      # IOC enrichment orchestrator
│           ├── 📂 collectors/     # External API collectors
│           │   ├── nvd_collector.py
│           │   ├── cisa_kev_collector.py
│           │   ├── otx_collector.py
│           │   └── mitre_collector.py
│           └── 📂 tasks/
│               ├── mitre_scorer.py
│               └── alert_evaluator.py
│
├── 📂 frontend/
│   ├── 📄 Dockerfile
│   ├── 📄 package.json
│   ├── 📄 vite.config.js
│   ├── 📄 tailwind.config.js
│   ├── 📄 postcss.config.js
│   ├── 📄 index.html
│   └── 📂 src/
│       ├── 📄 App.jsx             # Routes + auth bootstrap
│       ├── 📄 main.jsx
│       ├── 📄 index.css           # Design system + Tailwind
│       ├── 📂 api/
│       │   └── axios.js           # Axios instance + token interceptors
│       ├── 📂 store/
│       │   └── authStore.js       # Zustand auth state
│       ├── 📂 components/
│       │   ├── ProtectedRoute.jsx
│       │   ├── LiveFeed.jsx
│       │   └── TechniqueDrawer.jsx
│       ├── 📂 hooks/
│       │   └── useWebSocket.js
│       └── 📂 pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx
│           ├── IOCWorkbench.jsx
│           ├── CVEExplorer.jsx
│           ├── ATTACKMatrix.jsx
│           ├── AttackMap.jsx
│           ├── ThreatActors.jsx
│           ├── ThreatActorProfile.jsx
│           ├── Reports.jsx
│           ├── Alerts.jsx
│           ├── AuditLog.jsx
│           └── FeedStatus.jsx
│
└── 📂 nginx/
    └── nginx.conf                 # Reverse proxy config
```

---

## 🔧 Configuration Reference

All config is read from environment variables loaded into `backend/app/core/config.py` via Pydantic Settings.

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | ✅ | — | 64-char hex string for JWT signing |
| `POSTGRES_USER` | ✅ | `threatlens` | PostgreSQL username |
| `POSTGRES_PASSWORD` | ✅ | — | PostgreSQL password |
| `POSTGRES_DB` | ✅ | `threatlens_db` | PostgreSQL database name |
| `REDIS_URL` | ✅ (auto) | `redis://redis:6379/0` | Set in docker-compose |
| `DATABASE_URL` | ✅ (auto) | assembled in compose | Set in docker-compose |
| `OTX_API_KEY` | ⚡ | `""` | AlienVault OTX |
| `ABUSEIPDB_API_KEY` | ⚡ | `""` | AbuseIPDB enrichment |
| `VT_API_KEY` | ⚡ | `""` | VirusTotal enrichment |
| `SHODAN_API_KEY` | ⚡ | `None` | Shodan enrichment |
| `ALGORITHM` | ❌ | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ | `15` | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | ❌ | `7` | Refresh token TTL |
| `ENVIRONMENT` | ❌ | `development` | `production` enables secure cookies |
| `CORS_ORIGINS` | ❌ | `http://localhost:3000` | Comma-separated allowed origins |
| `TELEGRAM_BOT_TOKEN` | ❌ | `None` | Telegram bot for alerts |
| `TELEGRAM_CHAT_ID` | ❌ | `None` | Telegram chat to notify |
| `SMTP_USER` | ❌ | `None` | Email notifications |
| `SMTP_PASSWORD` | ❌ | `None` | Email password |
| `ALERT_EMAIL_TO` | ❌ | `None` | Alert email recipient |

> ⚡ = Optional but required for full threat intelligence pipeline functionality

---

## 🧪 Development Notes

- The FastAPI backend uses `--reload` in development so code changes auto-reload
- Vite in Docker uses `--host 0.0.0.0` for HMR over Docker networking
- All Celery tasks are visible in the worker logs: `docker-compose logs -f celery_worker`
- The MITRE ATT&CK database is auto-seeded on first startup (takes ~30 seconds)
- Websocket events require a valid access token as query param: `ws://localhost/api/v1/ws/feed?token=<jwt>`

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
Built with ❤️ and a lot of ☕ &nbsp;|&nbsp; ThreatLens © 2024
</div>
