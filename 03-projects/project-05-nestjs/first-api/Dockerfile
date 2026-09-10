# ---------- Builder ----------
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@11.6.2
RUN npm ci

COPY . .

RUN npm run build


# ---------- Production ----------
FROM node:24-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@11.6.2
RUN npm ci --omit=dev
RUN npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["npm", "run", "start:prod"]