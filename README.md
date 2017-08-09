platformer™   <b>timesheet</b>
===================
platformer-timesheet web-app
<b>Documentation</b>
___________________

##Contents

[TOC]

----------


Introduction
-------------

The platformer™ timesheet is a customized port of the Open-Source<i>timesheet web application from Mifort.

>**Features:**

 >- Easy time-tracking process 
 >- Easy roles separation 
 >- Multiple Project assignments 
 >- Well-designed report period configuration 
 >- Fast report generation with smart filtering and validation 
 >- E-mail notification
 >- Authoriza.tion by Google

----------


Application Framework
-------------------
This application is a MEAN Stack:
 - Mongodb
 - ExpressJS
 - Angular2+
 - NodeJS

###Dependencies
<i>package.json:</i>

```
 {
  "name": "platformer-timesheet",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "postinstall": "grunt build",
    "start": "node app.js"
  },
  "license": "Apache-2.0",
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
  },
  "devDependencies": {
    "nightwatch": "^0.8.18"
  }
}
```
###Installing Dependencies
// TBD

Deployment
-----------------
###Local
###Standard MEAN Deployment
###Google Cloud Platform
####VM Instance
####Container



