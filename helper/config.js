"use strict";
require("dotenv").config();
const express = require("express");
// call express
const app = express(); // define our app using express
const bodyParser = require("body-parser"); // get body-parser
const morgan = require("morgan"); // used to see requests
const mongoose = require("mongoose");
const helmet = require("helmet");
const glob = require("glob");
const auth = require("./auth.controller");
const db = require("mongoose");
const CORS = require("cors");
const path = require("path");
const User = require("../models/user.model");
const mongoSanitize = require("express-mongo-sanitize");
// //Added by Bharat
// var ngrok = require('ngrok');
// ngrok.connect(function (err, url) {}); // https://757c1652.ngrok.io -> http://localhost:80
// ngrok.connect(4200, function (err, url) {});
// //End
//DB CONFIGURATION
let options = {
  server: {
    socketOptions: {
      keepAlive: 300000,
      connectTimeoutMS: 30000
    }
  },
  replset: {
    socketOptions: {
      keepAlive: 300000,
      connectTimeoutMS: 30000
    }
  }
};
//const dbUri = "mongodb://admin:clouds123@ds133260.mlab.com:33260/clouds"
//const dbUri = "mongodb://localhost:27017/cloudes-staging"
// const dbUri = "mongodb://localhost:27017/clouds"
//const dbUri = "mongodb://bharat:bharat@ds247178.mlab.com:47178/cloudes";
//const dbUri = "mongodb://cloudesStaging:cloudes@ds163711.mlab.com:63711/cloudes-staging";
// staging uri
const dbUri = process.env.DBuri;

//const sendGRIDAPI = "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";
//db.connect('mongodb://localhost/clouds')
db.connect(
  dbUri,
  err => {
    if (err) {
      console.log(err);
    } else {
      console.log("DB connected!");
    }
  }
);

mongoose.Promise = Promise;
app.enable("trust proxy");

// APP CONFIGURATION ---------------------
// use body parser so we can grab information from POST requests
app.use(helmet());
app.use(bodyParser.json({
  limit: "50mb"
}));
app.use(function (error, req, res, next) {
  if (error instanceof SyntaxError) {
    res.json({
      errorTag: error.status,
      message: "invalid syntax"
    });
  } else {
    next();
  }
});

app.use(express.static(path.join(__dirname, "../public")));
app.use(bodyParser.urlencoded({
  limit: "50mb",
  extended: true
}));
// configure our app to handle CORS requests
const domain = "https://cloudes.eu"; //our domain
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); //use *.domainName.domain for prod
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Expose-Headers", "ETag");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  next();
});
app.use(CORS());

app.use(mongoSanitize());

// ROUTES FOR OUR API
// ======================================

app.get("/test", (req, res) => {
  res.json({
    msg: "no token required here"
  });
});

// get an instance of the express for protected api
const apiRouter = express.Router();
// get an instance of the express for open api
const openRouter = express.Router();

// log all requests to the console
app.use(morgan("dev"));

//glob user routes
glob("./routes/*.routes.js", null, (err, files) => {
  files.map(path => {
    require("." + path)(openRouter, apiRouter);
  });
});
apiRouter.use(auth.verifyToken);

// REGISTER OUR ROUTES -------------------------------
app.use("/api", apiRouter);
app.use(openRouter);

//require("./billAggregation")();
module.exports = cache => {
  auth.setCache(cache);
  return app;
};