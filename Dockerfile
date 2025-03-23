# Use official Python image as base
FROM python:3.8

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

RUN apt-get update && apt-get install -y libgl1 libglib2.0-0

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the FastAPI default port
EXPOSE 8000

# Run FastAPI app (Change "app.main:app" to your FastAPI entry point if different)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]