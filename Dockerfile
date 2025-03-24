# Use official Python image as base
FROM python:3.9

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

RUN apt-get update && apt-get install -y libgl1 libglib2.0-0

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Run the react-app installations
RUN npm install --prefix ./react-app
RUN npm install --prefix ./node_modules

# Copy the rest of the application code
COPY . .

# Expose the FastAPI default port
EXPOSE 8000

# Run FastAPI app (Change "app.main:app" to your FastAPI entry point if different)
CMD ["bash", "integration_test_script.sh"]