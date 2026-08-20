# Architecture So Far (Phases 1-5)

Current state: NGINX acts as a **reverse proxy** in front of a single backend.
Load balancing comes in Phase 6.

```text
Client
  |
  | http://localhost:80
  v
NGINX
  |
  | proxy_pass http://api-1:3000
  v
api-1 (Express, INSTANCE_ID=api-1)
```

## What exists today

| Component | Details |
| --- | --- |
| Express app | `app.js` + `server.js` — `GET /` identifies the instance, `GET /health`, request logging `[api-1] GET / 200`. Port and instance ID come from env vars. |
| Docker image | `Dockerfile` (node:20-alpine). One image, reused by all instances. |
| 3 backend containers | `api-1`, `api-2`, `api-3` in `docker-compose.yml`, identical except `INSTANCE_ID`. Published on host ports 3001/3002/3003 for direct access. |
| Docker network | `backend` (bridge). Containers reach each other by service name (`api-2:3000`), never `localhost`. See `docs/networking.md`. |
| NGINX | `nginx/nginx.conf` published on port 80. Proxies all requests to `http://api-1:3000`. Single backend — no `upstream` block yet. |
| Config values | `.env` (read by docker compose): `IMAGE_NAME`, `NGINX_PORT`, `HOST_PORT_1/2/3`. |

## Key concepts demonstrated so far

- **One image, many instances** — containers differ only by `INSTANCE_ID`.
- **Service DNS** — `api-1:3000` inside the network, not `localhost`.
- **Reverse proxy** — clients reach one endpoint (`localhost`), NGINX forwards to the backend; the backend is invisible to clients.

## Coming next

Phase 6 replaces the single `proxy_pass` target with an `upstream` block so NGINX
distributes traffic across all three instances.