# syntax=docker/dockerfile:1.7
# Multi-stage Next.js standalone build.
#
# Build steps (all in one image to keep _generated/ consistent):
#   1. Install all workspace deps (root + apps/web + convex).
#   2. `convex deploy` — pushes schema, generates convex/_generated/.
#   3. `next build` — produces .next/standalone.
#
# Runtime image is a slim node:20-alpine that runs the standalone server.

############################ deps ############################
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY convex/package.json convex/
RUN pnpm install --shamefully-hoist

########################### builder ##########################
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# Bring deps from the previous stage to avoid re-resolving.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/convex/node_modules ./convex/node_modules
COPY . .

ARG CONVEX_DEPLOY_KEY
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_S3_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ENV CONVEX_DEPLOY_KEY=$CONVEX_DEPLOY_KEY \
    NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_S3_PUBLIC_BASE_URL=$NEXT_PUBLIC_S3_PUBLIC_BASE_URL \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_SENTRY_ENVIRONMENT=$NEXT_PUBLIC_SENTRY_ENVIRONMENT \
    SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
    SENTRY_ORG=$SENTRY_ORG \
    SENTRY_PROJECT=$SENTRY_PROJECT \
    NEXT_TELEMETRY_DISABLED=1 \
    SKIP_ENV_VALIDATION=1

# 1. Push Convex schema and generate convex/_generated/ inside the build context.
#    Run from /app/convex (where `convex` is a real dep) — convex.json there
#    sets functions:"." so the CLI looks at the same dir for schema/functions.
RUN --mount=type=cache,target=/root/.convex \
    cd /app/convex && /app/convex/node_modules/.bin/convex deploy -y

# 2. Build Next.js (standalone output).
RUN cd apps/web && pnpm run build

############################ runner ##########################
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat tini
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nextjs

# Standalone bundle: contains its own minimal node_modules + server.js.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
