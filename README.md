# Inyo GraphQL API

## Requirements

- Docker
- Node v10
- PM2 (if you want auto-restart, auto-scaling...)

## Installation

```
sudo docker-compose up -d
```

You should see two containers running, `prismagraphql/prisma:1.x.x` and `postgres`.

```
export PRISMA_ENDPOINT="http://localhost:4466"

yarn # or npm install
yarn deploy

yarn generate-client
```

## Running the app

```
pm2 start --name inyo-api index.js # or node index.js
```
