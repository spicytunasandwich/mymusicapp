# Stage 1: Build React App with Vite
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve Production Assets via NGINX
FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./nginx-web.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
