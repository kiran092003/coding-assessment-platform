FROM node:22-alpine

WORKDIR /app

# Shared logger
COPY shared/package*.json ./shared/
RUN cd shared && npm install --omit=dev

# Service deps
COPY question-service/package*.json ./question-service/
RUN cd question-service && npm install --omit=dev

# Source
COPY shared/ ./shared/
COPY question-service/ ./question-service/

WORKDIR /app/question-service
EXPOSE 4002
CMD ["node", "index.js"]
