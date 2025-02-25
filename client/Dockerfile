#Client Dockerfile
FROM node:22.13.1-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]
