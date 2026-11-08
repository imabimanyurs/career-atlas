FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY collector-sources.json ./
COPY server ./server
COPY frontend ./frontend
COPY docs/jobs.json ./docs/jobs.json
EXPOSE 3000
CMD ["node", "server/app.mjs"]
