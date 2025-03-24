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

# Use Python for the FastAPI backend
FROM python:3.9

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    lsb-release \
    ca-certificates

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean

# Set working directory for the backend
WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Copy the React app from node-builder stage (but not built)
COPY --from=node-builder /react-app /react-app

# Expose the FastAPI port
EXPOSE 8000
EXPOSE 5173

# Run the FastAPI app and serve React app (skip the build)
CMD ["bash", "integration_test_script.sh"]
