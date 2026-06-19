FROM node:22-alpine

WORKDIR /app

# Shared logger
COPY shared/package*.json ./shared/
RUN cd shared && npm install --omit=dev

# Service deps
COPY auth-service/package*.json ./auth-service/
RUN cd auth-service && npm install --omit=dev

# Source
COPY shared/ ./shared/
COPY auth-service/ ./auth-service/

WORKDIR /app/auth-service
EXPOSE 4001
CMD ["node", "index.js"]
