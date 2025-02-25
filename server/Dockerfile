FROM node:22.13.1-alpine

# Install pnpm
RUN npm install -g pnpm

# Set pnpm store directory
ENV PNPM_HOME=/app/.pnpm-store

WORKDIR /app

# We're not copying or installing anything in the Dockerfile
# Everything will be done at runtime via the command in docker-compose.yml

EXPOSE 3000

