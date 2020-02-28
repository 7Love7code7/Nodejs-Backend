const issue = require("../controllers/issues.controller");
const entityTag = require("../controllers/entityTag.controller");
const policy = require("../helper/policy");
const uid = require("uid-safe");
const async = require("async");

/* Upload config */

const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");
const multerS3 = require("multer-s3");
var AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");
var s3 = new AWS.S3();

const IssuefileUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "3dfilesdata/issueFiles",
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

const issueImage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "issueFiles",
  filename: function(req, file, cb) {
    const originalname = file.originalname.split("."),
      extension = originalname.pop();
    originalname.push(`-${uid.sync(9)}`);
    const newName = [...originalname].join("");
    cb(undefined, newName);

    // cloudinary: cloudinary,
    // folder: 'issueFiles',
    // allowedFormats: ['jpg', 'png', 'jpeg'],
    // filename: function (req, file, cb) {
    //     console.log(file);
    //     var foo = undefined;
    //     cb(undefined, foo);
  }
});

const issuesImageParser = multer({ storage: issueImage });
module.exports = (openRoutes, apiRoutes) => {
  apiRoutes
    .route("/issueImage")
    .all(issuesImageParser.any())
    .post(issue.issueImage);

  //apiRoutes.route('/createIssue').all(issuesImageParser.any()).post(issue.createIssue);
  apiRoutes
    .route("/createIssue")
    .all(issuesImageParser.any())
    .post(issue.createIssue);

  apiRoutes.route("/listAllIssues").get(issue.listAllissues);

  apiRoutes.route("/allIssues").get(issue.getAllIssues); // list all issues without any file and Id's

  apiRoutes.route("/listIssuesFromFilter").get(issue.listIssuesFromFilter);

  apiRoutes
    .route("/updateIssue/:id")
    .all(issuesImageParser.any())
    .put(issue.updateIssue);

  apiRoutes.route("/getIssueById/:id").get(issue.getIssueById);

  apiRoutes.route("/getadminusers").get(issue.listAllAdminUsers);

  apiRoutes.route("/updateAssetIds").put(issue.updateAssetIds);

  apiRoutes
    .route("/addcomment/:id")
    .all(issuesImageParser.any())
    .put(issue.updateComment);

  apiRoutes.route("/reopenStatus/:id").put(issue.reopenStatus);

  apiRoutes
    .route("/saveLocalIssueAsset")
    .all(issuesImageParser.any())
    .post(issue.saveLocalIssueAsset);

  apiRoutes
    .route("/postmarkings")
    .all(issuesImageParser.any())
    .post(issue.MarkIssues);

  apiRoutes
    .route("/markissueascomplete/:id")
    .all(issuesImageParser.any())
    .put(issue.markIssueAsComplete);

  apiRoutes
    .route("/editIssueMarkings")
    .all(issuesImageParser.any())
    .put(issue.editIssueMarkings);

  apiRoutes.route("/resetMarkings").put(issue.resetMarkings);

  apiRoutes
    .route("/generateAssetUrlForIssue")
    .all(issuesImageParser.any())
    .post(issue.generateAssetUrlForIssue);

  apiRoutes
    .route("/addDrawingAssetForIssue/:id")
    .all(issuesImageParser.any())
    .put(issue.addDrawingAssetForIssue);

  apiRoutes
    .route("/rejectissue/:id")
    .all(issuesImageParser.any())
    .put(issue.rejectIssue);
};
