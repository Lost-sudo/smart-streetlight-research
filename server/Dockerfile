# Use the official Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (needed for psycopg2, ML libs, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file from the server directory
COPY requirements.txt .

# Install dependencies
# Using --extra-index-url for torch+cpu version compatibility
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Copy the entire server directory content into the container
# This captures both 'web_server' and 'machine_learning' folders
COPY . .

# Set PYTHONPATH to include the /app directory
# This ensures that web_server can import from machine_learning correctly
ENV PYTHONPATH=/app

# Set the working directory to /app
WORKDIR /app

# Copy the entrypoint script and give it permissions
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Use the entrypoint script to start the container
ENTRYPOINT ["./entrypoint.sh"]
