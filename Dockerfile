# Use a lightweight official Python runtime base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for OpenCV, EasyOCR, and building libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first to take advantage of Docker layer caching
COPY requirements.txt /app/

# Install the Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application files
COPY . /app/

# Create the media directory and staticfiles directory inside Django folder
RUN mkdir -p /app/agrotrust_django/media /app/agrotrust_django/staticfiles

# Run collectstatic to prepare all static assets (served cleanly via WhiteNoise)
RUN python /app/agrotrust_django/manage.py collectstatic --noinput

# Expose port 8000
EXPOSE 8000

# Start Gunicorn with a 180-second timeout to allow the YOLOv8 and EasyOCR models
# to fully load into Django RAM on server startup without Gunicorn killing the process.
CMD ["gunicorn", "--chdir", "agrotrust_django", "agrotrust_django.wsgi:application", "--bind", "0.0.0.0:8000", "--timeout", "180", "--workers", "1"]
