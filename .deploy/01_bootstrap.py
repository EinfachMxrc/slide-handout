"""Stage 1 — install Node 20, pnpm, nginx, certbot, ufw. Idempotent."""
import sys
sys.path.insert(0, ".deploy")
from ssh_helper import sh

# Non-interactive apt
sh("export DEBIAN_FRONTEND=noninteractive; "
   "apt-get update -qq && "
   "apt-get install -y -qq curl ca-certificates gnupg lsb-release "
   "ufw nginx git build-essential python3-certbot-nginx",
   label="apt install base packages")

# NodeSource for Node 20 (current LTS)
sh("if ! command -v node >/dev/null || [ \"$(node -v | cut -d. -f1)\" != 'v20' ]; then "
   "  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null && "
   "  apt-get install -y -qq nodejs; "
   "fi; "
   "node -v && npm -v",
   label="install Node 20 via NodeSource")

# pnpm via corepack (ships with Node 20)
sh("corepack enable && corepack prepare pnpm@9.12.0 --activate && pnpm -v",
   label="enable pnpm via corepack")

# Firewall: allow ssh, http, https
sh("ufw --force reset >/dev/null && "
   "ufw default deny incoming && "
   "ufw default allow outgoing && "
   "ufw allow OpenSSH && "
   "ufw allow 'Nginx Full' && "
   "ufw --force enable && "
   "ufw status",
   label="configure ufw firewall")

# Create unprivileged service user
sh("id handout >/dev/null 2>&1 || useradd -m -s /bin/bash handout; "
   "id handout",
   label="create handout user")

# Confirm versions
sh("node -v; pnpm -v; nginx -v; certbot --version", label="version check")
print("\n[✓] bootstrap complete")
