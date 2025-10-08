FROM node:18-slim

WORKDIR /app

# Install dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev)
RUN npm install

# Copy prisma files (will be mounted from volume in dev)
COPY prisma ./prisma/

# Generate Prisma client (will regenerate when schema changes via volume)
RUN npx prisma generate || echo "Prisma schema not found yet, will generate on startup"

# Copy source code
COPY . .

# Expose port
EXPOSE 7000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start development server with hot-reload
CMD ["npm", "run", "dev"]
