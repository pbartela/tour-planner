# Dockerfile for running the Astro dev server
# This container runs the application that Playwright tests will interact with

FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install dependencies needed for Astro
RUN apk add --no-cache libc6-compat wget

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose dev server port
EXPOSE 3000

# Run dev server on all interfaces (0.0.0.0) so it's accessible from other containers
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
