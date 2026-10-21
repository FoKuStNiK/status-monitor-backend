# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS frontend-build
WORKDIR /frontend
COPY status-monitor-frontend/package*.json ./
RUN npm install
COPY status-monitor-frontend/ ./
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
COPY status-monitor-backend/package*.json ./
RUN npm install --omit=dev
COPY status-monitor-backend/ ./
COPY --from=frontend-build /frontend/build ./frontend-build

EXPOSE 5000
CMD ["npm", "start"]
