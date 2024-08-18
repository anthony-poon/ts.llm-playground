FROM node:18 AS build

WORKDIR /app
COPY ../../ .
RUN ls -la /app
RUN npm install
RUN npm run build


FROM node:18 AS production

WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
RUN npm install --only=production

EXPOSE 8080

CMD ["node", "dist/bin/www"]