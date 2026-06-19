FROM node:22-alpine

WORKDIR /app

# Shared logger
COPY shared/package*.json ./shared/
RUN cd shared && npm install --omit=dev

# Service deps
COPY leaderboard-service/package*.json ./leaderboard-service/
RUN cd leaderboard-service && npm install --omit=dev

# Source
COPY shared/ ./shared/
COPY leaderboard-service/ ./leaderboard-service/

WORKDIR /app/leaderboard-service
EXPOSE 4006
CMD ["node", "index.js"]
