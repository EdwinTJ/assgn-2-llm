FROM node:22.13.1-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install

RUN pnpm prisma generate

COPY . .

EXPOSE 3000

CMD ["pnpm", "run", "dev"]