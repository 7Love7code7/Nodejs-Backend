const events = require("../controllers/events.controller");
const multer = require("multer");

const uid = require("uid-safe");

const multerS3 = require("multer-s3");
var AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");
var s3 = new AWS.S3();

const eventManagerFileParser = multer({
  storage: multerS3({
    s3: s3,
    bucket: "3dfilesdata/eventFiles",
    // acl: 'public-read',
    key: function(req, file, cb) {
      console.log(file);
      cb(null, uid.sync(9) + "_" + file.originalname);
    }
  })
});

module.exports = (openRoutes, apiRoutes) => {
  apiRoutes
    .route("/createEvent")
    .all(eventManagerFileParser.any())
    .post(events.createNewEvent); // Events : create Events

  apiRoutes.route("/getAllEvents").get(events.getAllEvents);

  apiRoutes.route("/updateEvent/:eventId").put(events.updateMyEvent);
};
