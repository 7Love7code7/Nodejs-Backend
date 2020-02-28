const reportsController = require("../controllers/reports.controller");
const uid = require("uid-safe");
const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");
const multerS3 = require("multer-s3");

/* Upload config */

var AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");
var s3 = new AWS.S3();

const ReportsfileUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "3dfilesdata/reportsFiles",
    // acl: 'public-read',
    key: function(req, file, cb) {
      console.log(file);
      cb(null, uid.sync(9) + "_" + file.originalname);
    }
  })
});

cloudinary.config({
  cloud_name: "dktnhmsjx",
  api_key: "792293689156324",
  api_secret: "VYxx8McbtBw5hFQiC2u6NVTfcyU"
});

const reportsImage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "reportsFiles",
  filename: function(req, file, cb) {
    // console.log(req);
    // console.log(file);
    const originalname = file.originalname.split("."),
      extension = originalname.pop();
    originalname.push(`-${uid.sync(9)}`);
    const newName = [...originalname].join("");
    cb(undefined, newName);
  }
});

const reportsImageParser = multer({ storage: reportsImage });

module.exports = (openRoutes, apiRoutes) => {
  apiRoutes
    .route("/createReports")
    .all(reportsImageParser.any())
    .post(reportsController.createReports);

  apiRoutes.route("/getAllReports").get(reportsController.getAllReports);

  apiRoutes.route("/getReports/:id").get(reportsController.getReportsById);

  apiRoutes.route("/updateReports/:id").put(reportsController.updateReportsById);

  apiRoutes.route("/deleteReports/:id").delete(reportsController.deleteReportsById);

  apiRoutes
    .route("/generateAssetUrlForReport")
    .all(reportsImageParser.any())
    .post(reportsController.generateAssetUrlForReport);

  apiRoutes
    .route("/addDrawingAssetForReport/:id")
    .all(reportsImageParser.any())
    .put(reportsController.addDrawingAssetForReport);

  apiRoutes
    .route("/addReportRegistration/:id")
    .all(reportsImageParser.any())
    .put(reportsController.addReportRegistration);

  apiRoutes
    .route("/addReportOtherDoc/:reportId")
    .all(reportsImageParser.any())
    .put(reportsController.addReportOtherDoc);

  apiRoutes
    .route("/addReportComment/:id")
    .all(reportsImageParser.any())
    .put(reportsController.updateReportComment);

  apiRoutes
    .route("/updateReportEntityComment/:id")
    .all(reportsImageParser.any())
    .put(reportsController.updateReportEntityComment);

  apiRoutes
    .route("/addReportSiteDoc/:id")
    .all(reportsImageParser.any())
    .put(reportsController.addReportSiteDoc);

  apiRoutes.route("/exportReportData/:reportId").put(reportsController.exportReportData);

  apiRoutes.route("/addReportControlPlan").put(reportsController.addReportControlPlan);

  apiRoutes
    .route("/updateReportRegistration/:regId")
    .put(reportsController.updateReportRegistration);

  apiRoutes.route("/updateReportSiteDoc/:id").put(reportsController.updateReportSiteDoc);

  apiRoutes.route("/mobile/getReports/:id").get(reportsController.getReportsByIdMobile);

  //Mobile Api 
  apiRoutes
    .route("/updateReportMobileRegistration/:regId")
    .put(reportsController.updateReportMobileRegistration);

    
};
