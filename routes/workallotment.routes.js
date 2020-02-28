const Work = require("../controllers/workallotment.controller");
const multer = require("multer");

const uid = require("uid-safe");

const multerS3 = require("multer-s3");
var AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");
var s3 = new AWS.S3();

// const eventManagerFileParser = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: "3dfilesdata/eventFiles",
//     // acl: 'public-read',
//     key: function(req, file, cb) {
//       console.log(file);
//       cb(null, uid.sync(9) + "_" + file.originalname);
//     }
//   })
// });

module.exports = (openRoutes, apiRoutes) => {
  apiRoutes
    .route("/createWorkAllotmentEvent")
      .post(Work.createWorkEvent); // Events : create Events

   apiRoutes.route("/getAllWorkerEvents").get(Work.getAllWorkerEvents);

   apiRoutes.route("/getworkeventById/:id").get(Work.getWorkEventById);

   apiRoutes.route("/deleteworkevents/:id").delete(Work.deleteWorkAllotment);

   apiRoutes.route("/updateworkevent/:id").put(Work.updateWorkEvent);

   apiRoutes.route("/getWorkerswithin").get(Work.getWorkersWithinDates);


// apiRoutes.route("/updateEvent/:eventId").put(events.updateMyEvent);
};
