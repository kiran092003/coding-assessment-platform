FROM node:22-alpine

WORKDIR /app

# Shared logger
COPY shared/package*.json ./shared/
RUN cd shared && npm install --omit=dev

# Service deps
COPY submission-service/package*.json ./submission-service/
RUN cd submission-service && npm install --omit=dev

# Source
COPY shared/ ./shared/
COPY submission-service/ ./submission-service/

WORKDIR /app/submission-service
EXPOSE 4004
CMD ["node", "index.js"]
