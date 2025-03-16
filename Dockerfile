# Use Node.js as the base image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all source files
COPY . .

# Build the React app with Vite
RUN npm run build

# Expose the port where Express will run
EXPOSE 3000

# Start the Express.js server
CMD ["npm", "start"]
