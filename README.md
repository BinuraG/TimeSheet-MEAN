platformer™   <b>timesheet</b>
===============================
### platformer-timesheet web-app
### <b>Documentation</b>
#### @Author [Binura Gunasekara](mailto:binura.g@platformer.com)
#### @LastModified: 30.09.2017

Introduction
-------------

The platformer timesheet is a customized port of the Open-Source<i>timesheet web application from Mifort.

>**Features:**

 >- Easy time-tracking process 
 >- Easy roles separation 
 >- Multiple Project assignments 
 >- Well-designed report period configuration 
 >- Fast report generation with smart filtering and validation 
 >- E-mail notification
 >- Authorization by Google

Application Framework
-------------------

- Dockerized and build-able using Docker-compose
- 3 Containers (web, mongo, nginx)
- MEAN Stack

### Dependencies 
<i>package.json:</i>

```
  "dependencies": {
    "async": "^2.3.0",
    "body-parser": "^1.14.2",
    "bower": "^1.3.1",
    "compression": "^1.6.0",
    "connect-mongo": "^1.0.0",
    "cookie-parser": "^1.3.5",
    "csv-stringify": "^1.0.0",
    "ejs": "^2.3.4",
    "express": "^4.13.3",
    "express-session": "^1.11.3",
    "express-validator": "^2.19.1",
    "grunt": "^0.4.5",
    "grunt-angular-templates": "1.0.2",
    "grunt-cache-breaker": "~2.0.1",
    "grunt-cli": "^0.1.13",
    "grunt-contrib-clean": "~0.7.0",
    "grunt-contrib-concat": "~0.5.1",
    "grunt-contrib-copy": "~0.8.2",
    "grunt-contrib-cssmin": "~0.14.0",
    "grunt-contrib-uglify": "^0.11.1",
    "grunt-contrib-watch": "~0.6.1",
    "grunt-mkdir": "^0.1.2",
    "grunt-ng-annotate": "^1.0.1",
    "grunt-notify": "^0.4.3",
    "grunt-remove": "^0.1.0",
    "grunt-string-replace": "^1.3.1",
    "grunt-usemin": "~3.1.1",
    "html-pdf": "^2.1.0",
    "moment": "^2.11.2",
    "mongodb": "^2.0.34",
    "passport": "^0.3.0",
    "passport-google-oauth": "^1.0.0",
    "request": "^2.67.0",
    "shortid": "^2.2.4",
    "underscore": "^1.8.3",
    "validator": "^4.5.0",
    "winston": "^2.1.1"
  }
  
  "devDependencies": 
    "nightwatch": "^0.8.18"
  }

```


Deployment (Ubuntu 16 LTS)
-------

1. Install npm, nodejs and nodejs-legacy through apt-get install
2. Install Docker (link)[https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-16-04]
3. Install Docker-Compose (link)[https://www.digitalocean.com/community/tutorials/how-to-install-docker-compose-on-ubuntu-16-04]
4. Navigate to the project root and build 3 docker images using `docker-compose build`
5. Run the containers using `docker-compose up`


### To-Do

1. Add SSL Certification for https. 
> Add certs to ./nginx directory.
> edit ./nginx.conf to use the certs.
> edit ./backend/libs/authentication.js --> Callback URI to https from http (current).
2. Some dependencies are under deprecation. Identify and update.





