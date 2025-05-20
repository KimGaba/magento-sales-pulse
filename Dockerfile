FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install \
    && npx update-browserslist-db@latest || true
COPY . .
RUN npm run build

ENV PORT 8080
EXPOSE $PORT
CMD ["sh", "-c", "npx serve -s dist -l $PORT"]

