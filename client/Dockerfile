FROM node:22.13.1-alpine

# Install pnpm
RUN npm install -g pnpm

# Set pnpm store directory
ENV PNPM_HOME=/app/.pnpm-store

WORKDIR /app

EXPOSE 5173

# Command defined in docker-compose.yml