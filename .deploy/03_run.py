"""Start the container, extend the host's Caddyfile, reload Caddy, probe.

Env contract:
    DEPLOY_HOST / DEPLOY_USER / DEPLOY_PASS  — SSH creds (see ssh_helper.py)
    SITE_DOMAIN       — public domain (e.g. handout.example.com) to wire in
    CADDYFILE_PATH    — path to the host Caddyfile to extend
                        (default: /opt/handout/caddy/Caddyfile)
    CADDY_CONTAINER   — name of the Caddy container to reload
                        (default: handout-caddy)
    WEB_CONTAINER     — upstream container name Caddy should proxy to
                        (default: handout-web). Must be on the same Docker
                        network as the Caddy container.
    WEB_PORT          — upstream port (default: 3000)
    REMOTE_DIR        — where the repo was uploaded (default: /opt/handout)
"""
import os
import sys

sys.path.insert(0, ".deploy")
from ssh_helper import sh, put_str


SITE_DOMAIN = os.environ.get("SITE_DOMAIN") or sys.exit(
    "[!] SITE_DOMAIN env var required (e.g. handout.example.com)"
)
CADDYFILE_PATH = os.environ.get("CADDYFILE_PATH", "/opt/handout/caddy/Caddyfile")
CADDY_CONTAINER = os.environ.get("CADDY_CONTAINER", "handout-caddy")
WEB_CONTAINER = os.environ.get("WEB_CONTAINER", "handout-web")
WEB_PORT = os.environ.get("WEB_PORT", "3000")
REMOTE_DIR = os.environ.get("REMOTE_DIR", "/opt/handout")


HANDOUT_BLOCK_TEMPLATE = """
{domain} {{
    reverse_proxy {upstream}:{port}

    encode gzip

    header {{
        -Server
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }}

    log {{
        output stdout
        format console
    }}
}}
"""


# 1. Bring up the handout-web container.
sh(f"cd {REMOTE_DIR} && docker compose up -d", label="docker compose up")
sh(
    f"docker ps --filter name={WEB_CONTAINER} "
    "--format '{{.Names}} {{.Status}} {{.Ports}}'",
    label="container status",
)

# 2. Read Caddyfile, append handout block if not present.
existing = sh(f"cat {CADDYFILE_PATH}", label="read existing Caddyfile")
block = HANDOUT_BLOCK_TEMPLATE.format(
    domain=SITE_DOMAIN, upstream=WEB_CONTAINER, port=WEB_PORT
)

if SITE_DOMAIN in existing:
    print(f"[i] {SITE_DOMAIN} already present in Caddyfile, leaving untouched")
else:
    sh(
        f"cp {CADDYFILE_PATH} {CADDYFILE_PATH}.bak.$(date +%s)",
        label="backup Caddyfile",
    )
    put_str(CADDYFILE_PATH, existing.rstrip() + "\n" + block)

# 3. Validate and gracefully reload Caddy.
sh(
    f"docker exec {CADDY_CONTAINER} caddy validate --config /etc/caddy/Caddyfile",
    label="caddy validate",
)
sh(
    f"docker exec {CADDY_CONTAINER} caddy reload --config /etc/caddy/Caddyfile",
    label="caddy reload (graceful, no downtime)",
)

# 4. Wait for the web container to become healthy, then probe from within
# the Caddy network (bypasses DNS and TLS cert issues).
sh(
    "for i in $(seq 1 20); do "
    f"  s=$(docker inspect --format '{{{{.State.Health.Status}}}}' {WEB_CONTAINER} "
    "2>/dev/null || echo unknown); "
    '  echo "attempt $i: $s"; '
    '  [ "$s" = healthy ] && break; '
    "  sleep 2; "
    "done",
    label="wait for healthy",
    strict=False,
)

sh(
    f"docker exec {CADDY_CONTAINER} wget -qO- "
    f"http://{WEB_CONTAINER}:{WEB_PORT}/ | head -3",
    label="container-internal probe",
    strict=False,
)

print(f"\n[✓] container running and Caddy reloaded for {SITE_DOMAIN}")
