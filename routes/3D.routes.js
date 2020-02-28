const d3APiRoute = require("../controllers/3D.controller");
const policy = require("../helper/policy");
const uid = require("uid-safe");

/* Upload config */

const multer = require("multer");
const multerS3 = require("multer-s3");
var AWS = require("aws-sdk");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");
AWS.config.loadFromPath("./helper/awsconfig.json");

var s3 = new AWS.S3();

const fileUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "3dfilesdata/3DFolder",
    // acl: 'public-read',
    key: function(req, file, cb) {
      console.log(file);
      cb(null, file.originalname);
    }
  })
});

module.exports = (openRoutes, apiRoutes) => {
  openRoutes.route("/authenticate3D").get(d3APiRoute.get3DTest);

  apiRoutes.route("/listFiles3D").get(d3APiRoute.list3dFiles);

  apiRoutes
    .route("/uploadFile3D/:projectId")
    .all(fileUpload.single("file"))
    .post(d3APiRoute.uploadprojectFile);

  apiRoutes
    .route("/updateFile3D/:assetId")
    .all(fileUpload.single("file"))
    .put(d3APiRoute.updateAssetData);

  apiRoutes.route("/deleteFile3D/:assetId").delete(d3APiRoute.deleteAsset);
};
