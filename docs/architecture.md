# Architecture So Far (Phases 1-6)

Current state: NGINX acts as a **load balancer** in front of three backend instances.

```text
                 NGINX
                   |
        +----------+----------+
        |          |          |
        v          v          v
      api-1      api-2      api-3
```

## What exists today

| Component | Details |
| --- | --- |
| Express app | `app.js` + `server.js` — `GET /` identifies the instance, `GET /health`, request logging `[api-1] GET / 200`. Port and instance ID come from env vars. |
| Docker image | `Dockerfile` (node:20-alpine). One image, reused by all instances. |
| 3 backend containers | `api-1`, `api-2`, `api-3` in `docker-compose.yml`, identical except `INSTANCE_ID`. Published on host ports 3001/3002/3003 for direct access. |
| Docker network | `backend` (bridge). Containers reach each other by service name (`api-2:3000`), never `localhost`. See `docs/networking.md`. |
| NGINX | `nginx/nginx.conf` published on port 80. Uses `upstream backend` block to proxy requests across all three instances. |
| Config values | `.env` (read by docker compose): `IMAGE_NAME`, `NGINX_PORT`, `HOST_PORT_1/2/3`. |

## Key concepts demonstrated so far

- **One image, many instances** — containers differ only by `INSTANCE_ID`.
- **Service DNS** — `api-1:3000` inside the network, not `localhost`.
- **Reverse proxy** — clients reach one endpoint (`localhost`), NGINX forwards to the backend; the backend is invisible to clients.
- **Load balancer** — NGINX distributes traffic across all instances using default round-robin.

## Coming next

Phase 7 will explore NGINX's round-robin behavior in more detail, observing how requests are distributed across the three backends.