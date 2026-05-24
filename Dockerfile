# Use a lightweight official Python runtime base image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=7860

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for OpenCV, EasyOCR, and building libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first to take advantage of Docker layer caching
COPY requirements.txt /app/

# Install the Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application files
COPY . /app/

# Change working directory to the Django project folder
WORKDIR /app/agrotrust_django

# Create the media, staticfiles, and static directories
RUN mkdir -p media staticfiles static

# Run collectstatic to prepare all static assets (served cleanly via WhiteNoise)
RUN python manage.py collectstatic --noinput

# Expose port 7860
EXPOSE 7860

# Start Gunicorn with a 180-second timeout to allow the YOLOv8 and EasyOCR models
# to fully load into Django RAM on server startup without Gunicorn killing the process.
CMD ["gunicorn", "agrotrust_django.wsgi:application", "--bind", "0.0.0.0:7860", "--timeout", "180", "--workers", "1"]
