FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "node src/db/migrate.js && node src/db/seed.js && node src/server.js"]
