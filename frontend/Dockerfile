# Stage 1: Build step
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve step
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy our custom reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf 
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
