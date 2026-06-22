FROM node:22
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npm ci
COPY . .
RUN npx prisma generate && npx tsc -p tsconfig.build.json && ls dist/main.js
EXPOSE 3000
CMD ["node", "dist/main"]
