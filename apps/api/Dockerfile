FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN npm ci
RUN npm run build -w @hirematch/types && npm run build -w @hirematch/validation && npm run build -w @hirematch/shared && npm run build -w @hirematch/api
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api/dist ./apps/api/dist
USER node
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
