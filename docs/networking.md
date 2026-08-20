# Docker Networking Notes (Phase 4)

## Why `localhost` inside a container is different from `api-1`

Inside a container, `localhost` refers to **that container itself**, not the host
machine and not the other containers. So `api-1` cannot reach `api-2` by writing
`localhost:3000` — on `api-1`'s localhost there is no server listening.

Containers attached to the same Docker network reach each other through the
**service name**, which Docker Compose registers as a DNS entry:

```text
api-1:3000
api-2:3000
api-3:3000
```

This is what NGINX will use later to address the backend instances.

## Verify with

```bash
# from api-1, reach api-2 by its DNS name
docker compose exec api-1 node -e "fetch('http://api-2:3000/').then(r=>r.json()).then(j=>console.log(j.instance))"

# try the same with localhost and see it fail (connection refused)
docker compose exec api-1 node -e "fetch('http://localhost:3000/').catch(e=>console.log('failed:', e.cause ? e.cause.code : e.message))"
```