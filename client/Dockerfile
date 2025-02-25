FROM node:22.13.1-alpine
WORKDIR /app
COPY ./package.json .
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
COPY . .

EXPOSE 5173

# the program we want to run!
CMD ["pnpm", "run", "dev"]