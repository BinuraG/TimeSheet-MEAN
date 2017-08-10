# PLATFORMER-TIMESHEET

FROM ubuntu:xenial
MAINTAINER BINURA.G

# EXPOSE 80 443 3000 35729 8080
EXPOSE 80

# Set development environment as default
ENV NODE_ENV production

# Install Utilities
RUN apt-get update -q  \
 && apt-get install -yqq \
 nginx \
 curl \
 git \
 ssh \
 gcc \
 make \
 build-essential \
 libkrb5-dev \
 sudo \
 apt-utils \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Overwrite the default file with the reverse proxy server settings
COPY nginx/default /etc/nginx/sites-available

# OpenSSL certs copy
COPY nginx/nginx.key /etc/nginx/ssl
COPY nginx/nginx.crt /etc/nginx/ssl

# Start ngnix server
CMD sudo service nginx start

# Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
RUN sudo apt-get install -yq nodejs \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install MEAN.JS Prerequisites
RUN npm install --quiet -g gulp bower yo mocha karma-cli pm2 && npm cache clean

RUN mkdir -p /opt/mean.js/public/lib
WORKDIR /opt/mean.js

# Copies the local package.json file to the container
# and utilities docker container cache to not needing to rebuild
# and install node_modules/ everytime we build the docker, but only
# when the local package.json file changes.
# Install npm packages

COPY package.json /opt/mean.js/package.json


RUN npm install --quiet && npm cache clean

COPY . /opt/mean.js

# Run MEAN.JS server
CMD npm install && npm start && service ngnix restart



