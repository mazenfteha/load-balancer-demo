# NGINX Load Balancer Demo — Development Phases

This document is the **source of truth for the implementation order** of the project.

The project is an educational system-design demo showing how NGINX can act as a reverse proxy and load balancer for multiple Node.js/Express instances running in Docker.

---

# Phase 1 — Basic Express Server

## Objective

Create the smallest possible Express application.

At this point there should be:

```text
Client
  |
  v
Express
```

No Docker.

No NGINX.

No load balancing.

## Build

Create a Node.js + Express application with:

* HTTP server
* Basic root endpoint
* Health endpoint
* Request logging
* Configurable port
* Configurable instance ID

Example:

```text
GET /
GET /health
```

The response from `/` should identify the current instance.

Example:

```json
{
  "message": "Hello from Node.js",
  "instance": "api-1"
}
```

## Verification

Run the application locally.

Verify:

```text
GET /
GET /health
```

Confirm that the instance identifier is visible.

## System Design Concept

Understand what a single backend server looks like before introducing a load balancer.

---

# Phase 2 — Containerize the Application

## Objective

Run the Express application inside Docker.

Architecture:

```text
Client
  |
  v
Docker Container
  |
  v
Express
```

## Build

Create:

```text
Dockerfile
.dockerignore
```

Add the required Docker configuration.

The container should run the Express application.

## Verification

Build the image.

Run the container.

Verify:

```text
GET /
GET /health
```

Confirm the application works inside Docker.

## System Design Concept

Understand that an application server can be packaged into a portable container.

---

# Phase 3 — Multiple Node.js Instances

## Objective

Run multiple instances of the same Node.js application.

Architecture:

```text
             +---------+
             | api-1   |
             +---------+

             +---------+
             | api-2   |
             +---------+

             +---------+
             | api-3   |
             +---------+
```

All instances must use the same Docker image.

Each instance must have a different `INSTANCE_ID`.

Example:

```text
api-1
api-2
api-3
```

## Build

Introduce Docker Compose.

Create:

```text
docker-compose.yml
```

Run three backend containers.

## Verification

Start the services.

Verify each instance is running.

Confirm each instance returns its own identifier.

## System Design Concept

Understand horizontal scaling:

```text
One application
      ↓
Multiple instances
```

There is now a problem:

> How does a client know which instance to contact?

This problem leads to the load balancer.

---

# Phase 4 — Docker Networking

## Objective

Understand how containers communicate with each other.

Architecture:

```text
Docker Network
   |
   +--- api-1
   |
   +--- api-2
   |
   +--- api-3
```

## Build

Configure the Docker Compose network.

The backend containers should communicate using Docker service/container DNS names rather than relying on localhost.

For example:

```text
api-1:3000
api-2:3000
api-3:3000
```

## Verification

Verify that containers can reach the appropriate services through the Docker network.

Document why:

```text
localhost
```

inside a container is different from:

```text
api-1
```

## System Design Concept

Understand service-to-service communication inside a containerized environment.

---

# Phase 5 — NGINX as a Reverse Proxy

## Objective

Introduce NGINX without load balancing yet.

Architecture:

```text
Client
  |
  v
NGINX
  |
  v
api-1
```

## Build

Add:

```text
nginx/
└── nginx.conf
```

Configure NGINX to forward incoming requests to one backend instance.

The client should access:

```text
http://localhost
```

instead of directly accessing the Node.js application.

## Verification

Send requests through NGINX.

Confirm that NGINX forwards them to the backend.

Compare:

```text
Direct backend access
```

with:

```text
Access through NGINX
```

## System Design Concept

Understand **reverse proxying**.

A reverse proxy sits between clients and backend servers and forwards requests on their behalf.

---

# Phase 6 — NGINX as a Load Balancer

## Objective

Configure NGINX to communicate with all backend instances.

Architecture:

```text
                 NGINX
                   |
        +----------+----------+
        |          |          |
        v          v          v
      api-1      api-2      api-3
```

## Build

Create an NGINX upstream:

```nginx
upstream backend {
    server api-1:3000;
    server api-2:3000;
    server api-3:3000;
}
```

Configure NGINX to proxy requests to this upstream.

## Verification

Send many requests through:

```text
http://localhost
```

Observe which backend instances respond.

## System Design Concept

Understand the difference between:

```text
Reverse Proxy
```

and:

```text
Load Balancer
```

A load balancer is distributing traffic across multiple backend instances.

---

# Phase 7 — Round-Robin Load Balancing

## Objective

Understand NGINX's default round-robin behavior.

Expected conceptual behavior:

```text
Request 1 → api-1
Request 2 → api-2
Request 3 → api-3
Request 4 → api-1
Request 5 → api-2
Request 6 → api-3
```

The exact sequence should not be treated as a strict guarantee under every connection/client configuration. The goal is to observe NGINX distributing requests among the available upstream servers.

## Build

Keep the configuration simple.

Do not introduce:

* least connections
* IP hash
* weighted balancing
* advanced algorithms

Those are outside the scope of this demo.

## Verification

Send repeated requests.

Record the returned instance.

Use logs to observe the distribution.

## System Design Concept

Understand:

* round-robin
* traffic distribution
* horizontal scaling
* why a load balancer is useful

---

# Phase 8 — Request Logging and Observability

## Objective

Make traffic distribution easy to see.

## Build

Ensure the Node.js application logs:

```text
[api-1] GET / 200
[api-2] GET / 200
[api-3] GET / 200
```

Configure useful NGINX access logging if appropriate.

Keep logging simple.

## Verification

Send multiple requests.

Inspect Docker logs:

```bash
docker compose logs
```

Identify which instance processed each request.

## System Design Concept

Understand why observability is important in distributed systems.

Without logs, it becomes difficult to know:

* where requests went
* which instance failed
* whether traffic is being distributed
* what the system is actually doing

---

# Phase 9 — Backend Failure Experiment

## Objective

Observe what happens when one backend instance becomes unavailable.

Start with:

```text
api-1
api-2
api-3
```

Then stop one:

```bash
docker compose stop api-2
```

Architecture becomes:

```text
                 NGINX
                   |
            +------+------+
            |             |
            v             v
          api-1         api-3

          api-2 ❌
```

## Verification

Continue sending requests through NGINX.

Observe:

* whether requests continue succeeding
* which instances receive traffic
* what happens when NGINX attempts to contact an unavailable backend
* what appears in the logs

Then restore the backend:

```bash
docker compose start api-2
```

Observe what changes.

## Important Learning Point

Document the distinction between:

### Passive failure behavior

NGINX discovers that an upstream server is unavailable when attempting to communicate with it.

### Active health checks

A load balancer proactively checks backend health before routing traffic.

Do not claim the demo implements active health checks unless they are explicitly configured.

## System Design Concept

Understand failure handling and why load balancers improve availability.

---

# Phase 10 — Direct Access vs Load-Balanced Access

## Objective

Clearly understand the difference between accessing a backend directly and accessing it through NGINX.

Compare:

```text
Direct:

Client → api-1
```

with:

```text
Load balanced:

Client → NGINX → api-1/api-2/api-3
```

## Verification

Access a backend instance directly where the Docker configuration allows it.

Then access:

```text
http://localhost
```

through NGINX.

Observe the difference.

## Questions to Answer

The documentation should answer:

1. Who decides which backend receives the request?
2. What happens if the client connects directly to `api-1`?
3. What happens when the client connects through NGINX?
4. Why can multiple backend instances be hidden behind one public endpoint?
5. What happens when one backend becomes unavailable?

## System Design Concept

Understand the architectural role of the load balancer.

---

# Phase 11 — Documentation and Architecture

## Objective

Make the repository understandable to another developer.

Create/update:

```text
README.md
docs/architecture.md
```

## README Requirements

Document:

* Project purpose
* Learning objectives
* Technologies
* Architecture
* Project structure
* Prerequisites
* How to start
* How to stop
* How to view logs
* How to test round-robin behavior
* How to simulate backend failure
* How to restore a backend
* Direct backend access
* NGINX access
* Important concepts
* Limitations

## Architecture Documentation

Include the final architecture:

```text
                         Client
                           |
                           | HTTP
                           v
                    +-------------+
                    |    NGINX    |
                    | Reverse     |
                    | Proxy / LB   |
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
       +---------+    +---------+    +---------+
```

Explain each component.

---

# Phase 12 — Final Verification

## Objective

Verify that the complete learning demo works from a clean environment.

## Verification Checklist

* [ ] Repository starts successfully
* [ ] Docker Compose starts all required services
* [ ] All Node.js instances start
* [ ] Each instance identifies itself
* [ ] NGINX starts successfully
* [ ] NGINX acts as a reverse proxy
* [ ] NGINX distributes requests across backend instances
* [ ] Round-robin behavior can be observed
* [ ] Logs show request distribution
* [ ] Direct backend access can be demonstrated
* [ ] NGINX access can be demonstrated
* [ ] One backend can be stopped
* [ ] Failure behavior can be observed
* [ ] Backend can be restored
* [ ] Documentation is complete
* [ ] Architecture diagram matches the implementation

## Final Learning Questions

Before considering the project complete, I should be able to explain:

1. What is a reverse proxy?
2. What is a load balancer?
3. Why do we need a load balancer?
4. What is horizontal scaling?
5. What is round-robin load balancing?
6. How does NGINX discover the backend containers?
7. How does Docker networking allow the services to communicate?
8. What happens when one backend goes down?
9. What is the difference between passive failure detection and active health checks?
10. What is the difference between accessing a backend directly and accessing it through NGINX?
11. Why can users have a single endpoint while the system has multiple backend instances?
12. What problems would appear if we scaled this architecture to a much larger production system?

---

# Development Rule

**Never skip phases.**

**Never implement future phases early.**

Each phase exists because it introduces a new concept.

The purpose of this project is not merely to produce working code.

The purpose is to understand how the architecture evolves:

```text
Single Express Server
        ↓
Dockerized Server
        ↓
Multiple Instances
        ↓
Docker Network
        ↓
NGINX Reverse Proxy
        ↓
NGINX Load Balancer
        ↓
Round-Robin Distribution
        ↓
Observability
        ↓
Failure Handling
```

The final result should be small enough to understand completely.
