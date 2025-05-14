# Use Node.js base image
FROM node:23-slim

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the app
COPY . .

# ⚠️ Compile smart contracts
RUN npx hardhat compile

# ⚠️ THEN build Vite app (this will now find the JSON files)
RUN npm run build

# Expose the Express server port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
