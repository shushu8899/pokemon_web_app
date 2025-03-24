# Use Node.js for building the React app
FROM node:18 AS node-builder

# Set working directory
WORKDIR /react-app

# Copy react-app files
COPY ./react-app ./

# Clean npm cache and remove node_modules to avoid conflicts
RUN rm -rf node_modules package-lock.json /root/.npm && npm cache clean --force

# Install React app dependencies
RUN npm install

# Build the React app
RUN npm run build

# Use Python for the FastAPI backend
FROM python:3.9

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Copy the built React app from the node-builder stage
COPY --from=node-builder /react-app/build ./react-app/build

# Expose the FastAPI port
EXPOSE 8000

# Run the FastAPI app
CMD ["bash", "integration_test_script.sh"]
