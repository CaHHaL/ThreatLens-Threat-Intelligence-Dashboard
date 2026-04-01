FROM node:20-alpine

WORKDIR /app

# Copy package info and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy everything else
COPY . .

# Expose port and start dev server
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
