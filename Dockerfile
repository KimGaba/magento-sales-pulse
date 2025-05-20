FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install \
    && npx update-browserslist-db@latest || true
COPY . .
RUN npm run build
RUN npm install -g serve

EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:$PORT"]

