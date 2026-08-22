# Direct Access vs Load-Balanced Access (Phase 10)

## Objective

Clearly understand the difference between accessing a backend directly and accessing it through NGINX.

## Two ways to access the backends

### Direct access

```text
Client → api-1:3001
Client → api-2:3002
Client → api-3:3003
```

The client knows exactly which instance it's talking to.

### Load-balanced access

```text
Client → NGINX:80 → api-1:3000
                   → api-2:3000
                   → api-3:3000
```

The client only knows NGINX. NGINX decides which backend handles the request.

## Try it

### Direct access (one instance at a time)

```bash
curl http://localhost:3001/    # always api-1
curl http://localhost:3002/    # always api-2
curl http://localhost:3003/    # always api-3
```

### Load-balanced access (round-robin)

```bash
curl http://localhost/         # api-1
curl http://localhost/         # api-2
curl http://localhost/         # api-3
curl http://localhost/         # api-1 (cycles)
```

## Questions to answer

### 1. Who decides which backend receives the request?

- **Direct access:** The client decides (it connects to a specific instance).
- **Load-balanced access:** NGINX decides (it routes to the next available backend).

### 2. What happens if the client connects directly to `api-1`?

- The client always talks to api-1.
- If api-1 fails, the client gets an error.
- No failover, no distribution.

### 3. What happens when the client connects through NGINX?

- NGINX routes the request to the next backend in the upstream block.
- If one backend fails, NGINX skips it and tries the next.
- The client doesn't know which backend handled the request.

### 4. Why can multiple backend instances be hidden behind one public endpoint?

- NGINX is the single entry point (port 80).
- Clients only need to know `http://localhost`.
- The backend architecture can change (add/remove instances) without clients knowing.

### 5. What happens when one backend becomes unavailable?

- **Direct access:** If that backend is the one the client connected to, the request fails.
- **Load-balanced access:** NGINX routes to a healthy backend. The client may not notice.

## Why this matters

The load balancer provides:

- **Abstraction** — clients don't need to know about multiple backends
- **Flexibility** — backends can be added/removed without client changes
- **Resilience** — failures are handled transparently
- **Scalability** — more instances can be added behind the same endpoint