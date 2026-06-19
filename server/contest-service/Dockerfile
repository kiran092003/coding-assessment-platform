FROM node:22-alpine

WORKDIR /app

# Shared logger
COPY shared/package*.json ./shared/
RUN cd shared && npm install --omit=dev

# Service deps
COPY contest-service/package*.json ./contest-service/
RUN cd contest-service && npm install --omit=dev

# Source
COPY shared/ ./shared/
COPY contest-service/ ./contest-service/

WORKDIR /app/contest-service
EXPOSE 4003
CMD ["node", "index.js"]
