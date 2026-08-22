# Architecture — Final (Phases 1-10)

## Overview

NGINX acts as a **load balancer** distributing traffic across three Node.js/Express instances using **round-robin**.

```text
                         Client
                           |
                           | HTTP :80
                           v
                    +-------------+
                    |    NGINX    |
                    | Reverse     |
                    | Proxy / LB  |
                    +------+------+
                           |
                 Docker Network
                           |
            +--------------+--------------+
            |              |              |
            v              v              v
       +---------+    +---------+    +---------+
       |  api-1  |    |  api-2  |    |  api-3  |
       | Express |    | Express |    | Express |
       |  :3000  |    |  :3000  |    |  :3000  |
       +---------+    +---------+    +---------+
```

## Components

### Express Application (`app.js`, `server.js`)

- `GET /` — returns instance ID, hostname, and message
- `GET /health` — returns status OK
- Request logging: `[api-1] GET / 200`
- Port and instance ID configurable via environment variables

### Docker Image (`Dockerfile`)

- Node.js 20 Alpine base
- One image, reused by all instances
- Instances differ only by `INSTANCE_ID` env var

### Docker Compose (`docker-compose.yml`)

- Three backend services: `api-1`, `api-2`, `api-3`
- One NGINX service
- Custom bridge network `backend`
- Backend ports exposed for direct access (3001/3002/3003)

### NGINX (`nginx/nginx.conf`)

- Listens on port 80
- `upstream backend` block with three servers
- Round-robin distribution (default)
- Custom access log showing upstream address

## Logging

| Source | Format | Example |
| --- | --- | --- |
| App | `[instance] METHOD PATH STATUS` | `[api-1] GET / 200` |
| NGINX | `addr - [upstream] request status` | `172.18.0.1 - [172.18.0.2:3000] GET / 200` |

## Key Concepts

| Concept | What it means |
| --- | --- |
| Reverse proxy | NGINX sits between clients and backends |
| Load balancer | NGINX distributes traffic across instances |
| Round-robin | Each request goes to the next backend in sequence |
| Service DNS | Containers reach each other by name (`api-1:3000`) |
| Passive failure detection | NGINX discovers failures when they happen |
| Horizontal scaling | One app, multiple instances |

## Directories

| Directory | Purpose |
| --- | --- |
| `nginx/` | NGINX configuration |
| `k6/` | Load testing scripts |
| `docs/` | Architecture and learning docs |

## See also

- `docs/networking.md` — Docker networking
- `docs/round-robin.md` — Round-robin explanation
- `docs/logging.md` — Log viewing and filtering
- `docs/failure-experiment.md` — Backend failure experiment
- `docs/direct-vs-lb.md` — Direct vs load-balanced access