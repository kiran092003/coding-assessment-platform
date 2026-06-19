FROM node:22-alpine

WORKDIR /app

# Shared logger
COPY shared/package*.json ./shared/
RUN cd shared && npm install --omit=dev

# Service deps
COPY api-gateway/package*.json ./api-gateway/
RUN cd api-gateway && npm install --omit=dev

# Source
COPY shared/ ./shared/
COPY api-gateway/ ./api-gateway/

WORKDIR /app/api-gateway
EXPOSE 4000
CMD ["node", "index.js"]
