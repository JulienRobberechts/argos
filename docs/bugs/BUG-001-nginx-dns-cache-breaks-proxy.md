# BUG-001 — nginx DNS cache breaks backend proxy on Railway

**Date**: 2026-06-19
**Severity**: medium

## Symptom

After deploying to Railway, the frontend never works on first deployment. The `/api/` proxy returns errors. Manually redeploying only the frontend service fixes it.

## Root Cause

nginx resolves hostnames once at startup and caches the result indefinitely (when no `resolver` directive is set). When both frontend and backend deploy simultaneously, `argos-api.railway.internal` may not yet be registered in Railway's internal DNS at the moment nginx reads its config. The resolution fails silently and the proxy remains broken for the lifetime of the container — even after the backend comes up.

## Fix

Added a `resolver` directive and switched `proxy_pass` to use a nginx variable (`$backend`) in `frontend/nginx.conf` (lines 7–9):

```nginx
resolver 127.0.0.11 valid=10s;
set $backend "${BACKEND_URL}";

location /api/ {
    proxy_pass $backend/api/;
    ...
}
```

`127.0.0.11` is Docker/Railway's internal DNS resolver. `valid=10s` forces re-resolution every 10 seconds. Using a variable for `proxy_pass` activates per-request DNS resolution, which requires an explicit `resolver` to be defined.

## Lessons

- nginx with a literal `proxy_pass` URL resolves DNS once at startup — always add a `resolver` directive when proxying to hostnames that may not be available immediately (internal service networks, Railway, Docker Compose).
- The trio `resolver` + `set $var` + `proxy_pass $var` is required for dynamic DNS resolution in nginx.
- Railway deploys services in parallel; never assume a dependency is reachable when the container first starts.
