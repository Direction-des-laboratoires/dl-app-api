# ================= Stage 1: Build =================
FROM node:22-slim AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Installer toutes les dépendances (dev + prod)
RUN npm ci

# Copier le code source
COPY src ./src

# Compiler NestJS
RUN npm run build

# ================= Stage 2: Production =================
FROM node:22-slim

WORKDIR /app

# Créer un utilisateur non-root en avance
RUN groupadd -r nodejs && useradd -r -g nodejs nestjs

# Copier package.json et installer uniquement les dépendances prod
# On utilise --chown ici pour éviter un chown -R lent plus tard
COPY --chown=nestjs:nodejs package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copier le build compilé depuis le builder avec les bonnes permissions
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist

# Passer à l'utilisateur non-root
USER nestjs

# Ports et variables d'environnement
EXPOSE 8040
ENV NODE_ENV=production
ENV PORT=8040

# Lancer l'application
CMD ["node", "dist/main"]
