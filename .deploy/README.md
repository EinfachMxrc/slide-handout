# Deployment helper scripts

Plain Python (paramiko) wrapper around SSH, SCP and `docker compose` for
rolling the app onto any Debian/Ubuntu VPS that already has Caddy as a
reverse proxy on ports 80/443.

## Required environment variables

```bash
export DEPLOY_HOST=1.2.3.4                         # VServer IP or hostname
export DEPLOY_USER=root                            # SSH user
export DEPLOY_PASS='…'                             # password (or set DEPLOY_USE_KEY=1)
export CONVEX_URL=https://<slug>.convex.cloud      # NEXT_PUBLIC_CONVEX_URL
export CONVEX_DEPLOY_KEY='dev:…|…'                 # from `npx convex dashboard`
export SITE_URL=https://handout.example.com        # public URL (HTTPS)
export SITE_DOMAIN=handout.example.com             # same, without protocol
export S3_PUBLIC_BASE_URL=                         # optional, blank = no image uploads

# Optional — non-defaults if your Caddy setup differs:
# export CADDYFILE_PATH=/opt/your/caddy/Caddyfile
# export CADDY_CONTAINER=your-caddy
# export WEB_CONTAINER=handout-web
# export WEB_PORT=3000
```

For SSH-key auth, set `DEPLOY_USE_KEY=1` and the scripts will pick up your
default agent / key files (paramiko defaults).

## Usage

```bash
# 1. First time: install Node 20 + pnpm + certbot + ufw on a fresh box.
python .deploy/01_bootstrap.py

# 2. Upload repo + write remote .env. Re-run for every code change.
python .deploy/02_upload.py

# 3. docker compose up + extend Caddyfile + reload Caddy + probe.
python .deploy/03_run.py
```

## What each step does

- **01_bootstrap.py** — `apt install` base packages, NodeSource Node 20, pnpm
  via corepack, UFW firewall (allow SSH + HTTP/HTTPS), create an unprivileged
  `handout` user. Idempotent — safe to re-run.
- **02_upload.py** — tars the repo in memory (excluding `node_modules`,
  `.next`, `.convex`, etc.), streams to `/opt/handout/` on the remote, writes
  the remote `.env` with mode `0600`.
- **03_run.py** — `docker compose up -d web`, appends a site block for
  `SITE_DOMAIN` to the Caddyfile (if not already present), validates + reloads
  Caddy gracefully, waits for the container to become healthy, and probes
  through the Caddy network.

## Safety notes

- Scripts never hardcode secrets. If you see a hardcoded key in a diff, reject
  the PR.
- `AutoAddPolicy` is used on first SSH connect. Pin the fingerprint in
  `~/.ssh/known_hosts` after the first successful run.
- The Convex build step runs inside the Docker builder stage with the deploy
  key passed as a build arg. Those build args don't end up in the final image
  layers because only `.next/standalone` is copied forward.
