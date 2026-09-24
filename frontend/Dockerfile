FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# Dev server, not a production nginx build: this is a local-only take-home
# demo (docker-compose, not a public deploy), so the extra Dockerfile
# complexity of a multi-stage prod build isn't worth it here -- see
# docs/TRADEOFFS.md.
CMD ["npm", "run", "dev", "--", "--host"]
