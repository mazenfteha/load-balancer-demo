# NGINX Load Balancer Demo

An educational system-design demo showing how NGINX can act as a reverse proxy and load balancer for multiple Node.js/Express instances running in Docker.

## Learning Objectives

This demo teaches:

1. NGINX as a reverse proxy
2. NGINX as a load balancer
3. Multiple Node.js application instances
4. Docker networking
5. Docker Compose
6. Round-robin load balancing
7. Backend health/failure behavior
8. Request logging and observability
9. Direct access vs load-balanced access

## Technologies

- Node.js
- Express.js
- NGINX
- Docker
- Docker Compose

## Architecture

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

All backend instances use the same Docker image. They differ only by the `INSTANCE_ID` environment variable.

## Project Structure

```text
load-balancing-demo/
├── app.js                  # Express application (routes, logging)
├── server.js               # HTTP server startup
├── package.json            # Node.js dependencies
├── Dockerfile              # Container image for Express app
├── .dockerignore           # Docker build exclusions
├── docker-compose.yml      # Service orchestration (NGINX + 3 backends)
├── .env                    # Docker Compose config values
├── nginx/
│   └── nginx.conf          # NGINX load balancer configuration
├── k6/
│   ├── load-test.js        # Simple k6 load test
│   └── distribution-test.js # k6 test with distribution summary
├── docs/
│   ├── architecture.md     # Current architecture state
│   ├── networking.md       # Docker networking explanation
│   ├── round-robin.md      # Round-robin load balancing
│   ├── logging.md          # Log viewing and filtering
│   ├── failure-experiment.md # Backend failure experiment
│   └── direct-vs-lb.md     # Direct vs load-balanced access
├── prd.md                  # Product requirements
├── PHASES.md               # Implementation phases
└── README.md               # This file
```

## Prerequisites

- Docker
- Docker Compose
- Node.js (for local development, optional)
- k6 (optional, for load testing)

## How to Start

```bash
docker compose up --build -d
```

This starts:
- NGINX on port 80 (configurable via `NGINX_PORT` in `.env`)
- Three Express instances on ports 3001, 3002, 3003 (for direct access)

## How to Stop

```bash
docker compose down
```

## How to View Logs

```bash
# All services
docker compose logs

# Follow logs in real time
docker compose logs -f

# Filter by service
docker compose logs api-1
docker compose logs nginx

# Count requests per instance
docker compose logs | grep -oP '\[api-\d\]' | sort | uniq -c
```

## How to Test Round-Robin Behavior

```bash
# Send multiple requests and watch the instance IDs change
for i in {1..6}; do
  curl -s http://localhost/ | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).instance))"
done
```

Or use k6:

```bash
k6 run k6/distribution-test.js
```

## How to Simulate Backend Failure

```bash
# Stop one backend
docker compose stop api-2

# Continue sending requests - only api-1 and api-3 respond
curl http://localhost/

# Check logs for errors
docker compose logs nginx | grep -i error
```

## How to Restore a Backend

```bash
docker compose start api-2

# Verify all three instances respond again
for i in {1..6}; do
  curl -s http://localhost/ | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).instance))"
done
```

## Direct Backend Access

Backend ports are exposed for learning purposes (to compare direct vs load-balanced access):

```bash
curl http://localhost:3001/    # always api-1
curl http://localhost:3002/    # always api-2
curl http://localhost:3003/    # always api-3
```

## NGINX Access

```bash
curl http://localhost/    # round-robin: api-1, api-2, api-3, ...
```

## Important Concepts

### Reverse Proxy

NGINX sits between clients and backend servers. Clients only know NGINX; the backend is invisible.

### Load Balancer

NGINX distributes traffic across multiple backend instances using round-robin.

### Round-Robin

Each request goes to the next backend in sequence (api-1, api-2, api-3, api-1, ...).

### Passive Failure Detection

NGINX discovers an unavailable backend when it tries to connect. This demo does **not** implement active health checks.

### Horizontal Scaling

One application runs as multiple instances. Adding more instances increases capacity.

## Limitations

- **No active health checks** — NGINX only discovers failures when they happen
- **No session affinity** — requests may go to different instances
- **No advanced load balancing** — only round-robin (no least-connections, IP hash, weighted)
- **Educational only** — not production-ready

## Configuration

Environment variables in `.env`:

| Variable | Default | Description |
| --- | --- | --- |
| `IMAGE_NAME` | `load-balancing-demo` | Docker image name |
| `NGINX_PORT` | `80` | NGINX port on host |
| `HOST_PORT_1` | `3001` | api-1 port on host |
| `HOST_PORT_2` | `3002` | api-2 port on host |
| `HOST_PORT_3` | `3003` | api-3 port on host |