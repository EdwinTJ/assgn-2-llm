# assgn-2-llm

## Client

I need to create for the client

- Need dockerfile
- Better UI
- Option in table file to anonymize from there

## Server

- Create a docker file
- connect to llm
- Get the pdf to txt
- Send the pdfTxt to the llm
- send back the pdf

## Global

- Create global docfile

## Run Docker

```bash
# Rund the commnad from thsi directory:
# cs-4610-WebDev/assigments/assgn2-play/
docker-compose up

# After starting containers
docker-compose exec server npm run prisma-generate
docker-compose exec server npm run prisma-migrate

# Run this after making changes
docker-compose down
docker-compose up



#Probelm with database
docker-compose down
docker-compose run --rm server sh -c "cd /app && npx prisma generate"
docker-compose run --rm server sh -c "cd /app && npx prisma db push && pnpm install"
docker-compose up


docker builder prune

docker-compose down -v  # This removes volumes too, for a clean start

docker-compose up --build


# Run to rebuild the images with the new configurations
docker-compose build --no-cache

sudo rm -rf server/node_modules client/node_modules
```
