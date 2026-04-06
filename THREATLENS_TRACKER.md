# ThreatLens Tracker & Documentation 🚀

This document is used to track the progress, architecture, and structural decisions made for the **ThreatLens** cybersecurity threat intelligence platform.

## Phase 1: Foundation (Current)
- [x] Defined Containerization & Infrastructure (`docker-compose.yml`, `nginx`, `postgres`, `redis`)
- [x] Environment configuration (`.env.example`)
- [x] Backend setup (FastAPI)
  - [x] App structure
  - [x] Config & Security settings
  - [x] DB & Models (User, AuditLog)
  - [x] Authentication Schema & Routes
  - [x] Dependencies
- [x] Frontend setup (React + Vite + Tailwind)
  - [x] Store configuration (`zustand`)
  - [x] Axios interconnects
  - [x] Auth & Protected Routes
  - [x] Basic pages (Login, Dashboard)

## Security Decisions Tracked
1. **JWT Storage Rules**: 
   - Access tokens have very short lifetimes (e.g., 15 minutes) to contain the damage of token leak.
   - Refresh tokens (7 days) will be placed in `httpOnly` cookies so that they are completely inaccessible to frontend JS preventing XSS attacks from easily extracting the refresh token.
2. **Audit Logging**: We track user actions including IPs right from the start.
3. **Password Hashing**: We utilize robust `bcrypt` via Passlib for any DB passwords.
4. **Roles Implementation**: Built-in Enum roles strictly partition functionality for Defense-in-Depth.

---
*Maintained by AI Assistant.*
