FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN chmod +x /usr/src/app/docker/scraper-cron-entrypoint.sh \
    && cp /usr/src/app/docker/scraper-cron-entrypoint.sh /usr/local/bin/scraper-cron-entrypoint.sh
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/src/server.js"]
