# Dockerfile (root)

# ---------- BASE ----------
FROM node:20-alpine AS base
WORKDIR /app

# ---------- BACKEND BUILD ----------
FROM base AS backend-build
WORKDIR /app/backend

# Instalar dependencias de backend
COPY backend/package*.json ./
RUN npm install

# Copiar código fuente del backend
COPY backend ./

# Build NestJS
RUN npm run build

# ---------- BACKEND RUNTIME ----------
FROM node:20-alpine AS backend
WORKDIR /app/backend

# Instalar postgresql-client para pg_isready (health de DB)
RUN apk add --no-cache postgresql-client

# Copiar dist ya compilado desde backend-build
COPY --from=backend-build /app/backend/dist ./dist

# Copiar package.json / package-lock.json para instalar solo deps de producción
COPY backend/package*.json ./
RUN npm install --omit=dev

ENV NODE_ENV=production
EXPOSE 3000

# Esperar a que PostgreSQL esté listo antes de arrancar Nest
CMD ["sh", "-c", "until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do echo 'Esperando PostgreSQL...'; sleep 2; done && node dist/main.js"]

# ---------- CONTRACTS (Hardhat JS) ----------
FROM base AS contracts
WORKDIR /app/contracts

# Instalar dependencias de contracts
COPY contracts/package*.json ./
RUN npm install

# Copiar código de contratos (Hardhat)
COPY contracts ./

# Sin CMD aquí: se define en contracts/docker-compose.yml

# ---------- FRONTEND BUILD ----------
FROM base AS frontend-build
WORKDIR /app/frontend

# Instalar dependencias de frontend
COPY frontend/package*.json ./
RUN npm install

# Copiar código fuente del frontend
COPY frontend ./

# Build Vite (output en /app/frontend/dist)
RUN npm run build

# ---------- FRONTEND RUNTIME ----------
FROM nginx:alpine AS frontend
# Limpiar contenido default
RUN rm -rf /usr/share/nginx/html/*
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copiar opcionalmente configuración custom de nginx si existiera
# (Si más adelante agregas un nginx.conf personalizado, descomentar la línea siguiente)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
