# Logging and Observability (Phase 8)

## Node.js application logs

Each instance logs requests in the format:

```text
[api-1] GET / 200
[api-2] GET / 200
[api-3] GET / 200
```

The `[instance]` prefix makes it easy to see which backend handled each request.

## NGINX access logs

NGINX logs show which upstream address served the request:

```text
172.18.0.1 - [172.18.0.2:3000] GET / 200
172.18.0.1 - [172.18.0.3:3000] GET / 200
172.18.0.1 - [172.18.0.4:3000] GET / 200
```

The `[$upstream_addr]` field shows the backend container's IP and port.

## How to view logs

### All services combined

```bash
docker compose logs
```

### Follow logs in real time

```bash
docker compose logs -f
```

### Filter by service

```bash
docker compose logs api-1
docker compose logs nginx
```

### Count requests per instance

```bash
docker compose logs | grep -oP '\[api-\d\]' | sort | uniq -c
```

## Why observability matters

Without logs:
- You can't tell if traffic is being distributed
- You can't identify which instance failed
- You can't debug production issues
- The system is a black box

With logs:
- You can see the round-robin pattern in action
- You can verify load balancing works
- You can identify problems quickly
- The system is transparent