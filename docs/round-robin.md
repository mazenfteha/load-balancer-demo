# Round-Robin Load Balancing (Phase 7)

NGINX uses **round-robin** by default when multiple servers are listed in an `upstream` block. No special configuration is needed.

## Expected behavior

```text
Request 1 → api-1
Request 2 → api-2
Request 3 → api-3
Request 4 → api-1
Request 5 → api-2
Request 6 → api-3
```

**Note:** The exact sequence is not guaranteed under every connection/client configuration. NGINX may reuse keep-alive connections, which can cause uneven distribution. The goal is to observe NGINX distributing requests among available upstream servers.

## How to observe round-robin

### Method 1: Individual requests

```bash
curl http://localhost/
curl http://localhost/
curl http://localhost/
```

Each response contains `"instance": "api-X"` — watch the instance ID change.

### Method 2: Watch logs in real time

```bash
docker compose logs -f
```

Send requests in another terminal:

```bash
for i in {1..6}; do curl -s http://localhost/ | grep instance; done
```

### Method 3: Extract instance IDs

```bash
for i in {1..6}; do
  curl -s http://localhost/ | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).instance))"
done
```

## Why round-robin is simple and effective

- No state tracking needed
- Even distribution across healthy instances
- Easy to understand and debug
- Works well when all backends have similar capacity

## What to observe

- Requests are distributed across all three instances
- Each instance responds with its own identifier
- The client never knows which backend handled the request

## k6 load testing

A k6 script is included in `k6/` for automated load testing:

```bash
# Run the simple test (12 requests)
k6 run k6/load-test.js

# Run the distribution test (30 requests with summary)
k6 run k6/distribution-test.js
```

The distribution test shows a summary of how many requests each instance handled.