"""Upload the repo as a tarball and write remote .env.

All secrets are read from the local environment — nothing hardcoded:

    DEPLOY_HOST       — VServer IP or hostname
    DEPLOY_USER       — SSH user
    DEPLOY_PASS       — SSH password (or use an agent — see ssh_helper.py)
    CONVEX_DEPLOY_KEY — Convex CLI deploy key (from `npx convex dashboard`)
    CONVEX_URL        — NEXT_PUBLIC_CONVEX_URL of the deployment
    SITE_URL          — public HTTPS URL the app is served at
    S3_PUBLIC_BASE_URL — optional, public S3/CDN base for handout assets
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, ".deploy")
from ssh_helper import sh, put_str, upload_tar

REMOTE_DIR = os.environ.get("REMOTE_DIR", "/opt/handout")
REPO = Path(".").resolve()


def env(name: str, required: bool = True, default: str = "") -> str:
    val = os.environ.get(name, default)
    if required and not val:
        raise SystemExit(f"[!] required env var missing: {name}")
    return val


CONVEX_URL = env("CONVEX_URL")
CONVEX_KEY = env("CONVEX_DEPLOY_KEY")
SITE_URL = env("SITE_URL")
S3_PUBLIC = env("S3_PUBLIC_BASE_URL", required=False)
AUTH_SECRET = env("AUTH_SECRET")  # `openssl rand -base64 32`

# 1. Wipe and recreate the remote dir.
sh(f"rm -rf {REMOTE_DIR} && mkdir -p {REMOTE_DIR}", label=f"reset {REMOTE_DIR}")

# 2. Upload via tar pipe (fast, single round-trip).
upload_tar(REPO, REMOTE_DIR)

# 3. Write the .env (used both for build args via docker-compose and runtime).
env_content = f"""CONVEX_DEPLOY_KEY={CONVEX_KEY}
NEXT_PUBLIC_CONVEX_URL={CONVEX_URL}
NEXT_PUBLIC_SITE_URL={SITE_URL}
NEXT_PUBLIC_S3_PUBLIC_BASE_URL={S3_PUBLIC}
AUTH_SECRET={AUTH_SECRET}
AUTH_TRUST_HOST=1
NODE_ENV=production
"""
put_str(f"{REMOTE_DIR}/.env", env_content, mode=0o600)

# 4. Confirm tree.
sh(
    f"ls -la {REMOTE_DIR} && cat {REMOTE_DIR}/docker-compose.yml | head -20",
    label="verify upload",
)
print("\n[✓] upload complete")
