# Backend Failure Experiment (Phase 9)

## Objective

Observe what happens when one backend instance becomes unavailable while NGINX is load balancing.

## Experiment

### Step 1: Start with all three instances

```bash
docker compose up -d
```

Send a few requests to see normal distribution:

```bash
for i in {1..6}; do curl -s http://localhost/ | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).instance))"; done
```

### Step 2: Stop one backend

```bash
docker compose stop api-2
```

Architecture becomes:

```text
                 NGINX
                   |
             +-----+-----+
             |           |
             v           v
           api-1       api-3

           api-2 ❌
```

### Step 3: Continue sending requests

```bash
for i in {1..6}; do curl -s http://localhost/ | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).instance))"; done
```

### What to observe

1. **Requests continue succeeding** — NGINX skips the unavailable backend and routes to the remaining instances.

2. **Only two instances receive traffic** — api-1 and api-3 respond, api-2 is skipped.

3. **NGINX logs show the failure** — look for connection errors or timeouts when NGINX tries to reach api-2.

4. **App logs show only active instances** — no `[api-2]` entries appear.

### Step 4: Check logs

```bash
# See which instances handled requests
docker compose logs | grep -oP '\[api-\d\]' | sort | uniq -c

# See NGINX errors (look for "connect() failed" or "upstream timed out")
docker compose logs nginx | grep -i error
```

### Step 5: Restore the backend

```bash
docker compose start api-2
```

### Step 6: Verify restoration

```bash
for i in {1..6}; do curl -s http://localhost/ | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).instance))"; done
```

All three instances should respond again.

## Important Learning Point

### Passive failure behavior (what this demo shows)

NGINX discovers that an upstream server is unavailable **when attempting to communicate with it**. If api-2 is down, the next request routed to api-2 will fail, and NGINX will try the next server in the upstream block.

### Active health checks (not implemented here)

A load balancer **proactively checks** backend health before routing traffic. For example, NGINX could periodically ping `/health` on each backend and remove unhealthy instances from the upstream block before any client request fails.

**Do not claim this demo implements active health checks.** This demo only shows passive failure detection.

## Why this matters

Load balancers improve **availability**:
- If one backend fails, traffic routes to healthy backends
- Clients don't experience downtime (usually)
- The system is more resilient than a single server