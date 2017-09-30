# Set nginx base image
FROM nginx

MAINTAINER Binura Gunasekara

# Copy custom configuration file from the current directory
COPY nginx.conf /etc/nginx/nginx.conf
COPY cert.pem /etc/nginx/cert.pem
COPY privkey.pem /etc/nginx/privkey.pem
