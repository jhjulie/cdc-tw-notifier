FROM node:12-slim as builder

WORKDIR /usr/app

COPY ./package.json .

RUN yarn install --production


FROM node:12-slim

WORKDIR /usr/app

COPY --from=builder /usr/app/node_modules ./node_modules
COPY . .

ENV ENV=test

ENV RSS_ADDRESS=
ENV NOTI_WEBHOOK_URL=

CMD ["node", "index.js"]