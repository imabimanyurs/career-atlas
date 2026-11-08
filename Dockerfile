FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY prisma ./prisma
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate
COPY backend ./backend
COPY web ./web
COPY vite.config.mjs ./
RUN npm test && npm run build
FROM node:24-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/web-dist ./web-dist
COPY --from=build /app/backend ./backend
COPY --from=build /app/prisma ./prisma
COPY package.json companies.json sources.v2.json ./
COPY server/default-state.json ./server/default-state.json
EXPOSE 3000
CMD ["node", "backend/start.mjs"]
