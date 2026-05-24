# Use official Node.js LTS image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (use package-lock when available)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Ensure environment variables are read
ENV NODE_ENV=production

# Expose a default port (Render will set PORT) - your app reads process.env.PORT
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
