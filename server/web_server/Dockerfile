# Use official Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
# 1. Prevent Python from writing .pyc files
# 2. Prevent Python from buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies needed for some Python packages (like psycopg2 or ML libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
# We copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install packages
# Note: Since the project uses torch+cpu, we ensure pip can find it
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Copy the rest of the application code
COPY . .

# Expose the port FastAPI runs on
EXPOSE 8000

# Run the FastAPI app with uvicorn
# We use 0.0.0.0 to make it accessible outside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
