# ================= Production Image =================
FROM node:22-slim

WORKDIR /app

# Créer un utilisateur non-root
RUN groupadd -r nodejs && useradd -r -g nodejs nestjs

# Copier package.json et installer uniquement les dépendances prod
COPY --chown=nestjs:nodejs package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copier le dossier dist déjà compilé par GitHub Actions
COPY --chown=nestjs:nodejs ./dist ./dist

# Créer le dossier uploads avec les permissions pour l'utilisateur nestjs
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

# Passer à l'utilisateur non-root
USER nestjs

# Ports et variables d'environnement
EXPOSE 8040
ENV NODE_ENV=production
ENV PORT=8040

# Lancer l'application
CMD ["node", "dist/main"]
