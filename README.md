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
```
