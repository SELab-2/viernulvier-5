FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
# might have to change this to npm ci --omit=dev
RUN npm install 

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server.js"]
