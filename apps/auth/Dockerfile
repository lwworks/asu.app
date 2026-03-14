FROM node:22-alpine AS base
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/auth/package.json apps/auth/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY apps/auth/ apps/auth/
COPY packages/shared/ packages/shared/

FROM base AS runtime
WORKDIR /app
COPY --from=build /app ./
WORKDIR /app/apps/auth
EXPOSE 3000
CMD ["pnpm", "tsx", "src/index.ts"]
