# Build stage
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts

# Build-time environment variables (must begin with VITE_ to be injected by Vite)
ARG VITE_BACKEND_API_URL
ARG VITE_WEBHOOK_URL
ARG VITE_CDP_PROJECT_ID
ARG VITE_JWT_EXP_GRACE=30

# Generate .env file for Vite build using passed args
RUN echo "VITE_BACKEND_API_URL=${VITE_BACKEND_API_URL}" > .env \
 && echo "VITE_WEBHOOK_URL=${VITE_WEBHOOK_URL}" >> .env \
 && echo "VITE_CDP_PROJECT_ID=${VITE_CDP_PROJECT_ID}" >> .env \
 && echo "VITE_JWT_EXP_GRACE=${VITE_JWT_EXP_GRACE}" >> .env

# Copy source
COPY . .

# Build static assets
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=base /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
