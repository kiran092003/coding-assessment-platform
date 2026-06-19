FROM node:22-alpine

# Docker CLI needed to spawn sandboxed execution containers (DooD via socket mount)
RUN apk add --no-cache docker-cli

WORKDIR /app

# Shared logger
COPY shared/package*.json ./shared/
RUN cd shared && npm install --omit=dev

# Service deps
COPY judge-service/package*.json ./judge-service/
RUN cd judge-service && npm install --omit=dev

# Source
COPY shared/ ./shared/
COPY judge-service/ ./judge-service/

WORKDIR /app/judge-service
EXPOSE 4005
CMD ["node", "index.js"]
