const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");
const uid = require("uid-safe");
const crypto = require("crypto");
cloudinary.config({
  cloud_name: "dktnhmsjx",
  api_key: "792293689156324",
  api_secret: "VYxx8McbtBw5hFQiC2u6NVTfcyU"
});

const projectOtherFile = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "projectOtherFile",
  allowedFormats: ["pdf", "png", "jpg"],
  filename: function(req, file, cb) {
    cb(undefined, req.params.p_id + "/" + uid.sync(9));
  }
});

const projectRoofPlan = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "projectRoofPlan",
  allowedFormats: ["pdf", "png", "jpg"],
  filename: function(req, file, cb) {
    console.log(file);
    cb(undefined, req.params.p_id + "/" + uid.sync(9));
  }
});

const projectImageFile = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "projectImageFile",
  allowedFormats: ["jpg", "png"],
  filename: function(req, file, cb) {
    cb(undefined, req.params.p_id + "/" + uid.sync(9));
  }
});

const taskProgressImageFile = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "taskProgressImageFile",
  allowedFormats: ["jpg", "png"],
  filename: function(req, files, cb) {
    cb(undefined, req.params.t_id + "/" + uid.sync(9));
  }
});

const rooferConcernImageFile = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "taskProgressImageFile",
  allowedFormats: ["jpg", "png"],
  filename: function(req, file, cb) {
    cb(undefined, req.params.t_id + "/" + uid.sync(9));
  }
});

const GenralImageFile = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "GenralImageFile",
  allowedFormats: ["jpg", "png"],
  filename: function(req, file, cb) {
    cb(undefined, req.user._id + "/" + uid.sync(9));
  }
});

const thumbnailStorage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "pdfThumbs",
  filename: function(req, file, cb) {
    cb(undefined, file.originalname);
  }
});

const projectImageFileParser = multer({ storage: projectImageFile });
const projectRoofPlanParser = multer({ storage: projectRoofPlan });
const projectOtherFileParser = multer({ storage: projectOtherFile });
const taskProgressImageFileParser = multer({ storage: taskProgressImageFile });
const rooferConcernImageFileParser = multer({
  storage: rooferConcernImageFile
});
const genralImageFileParser = multer({ storage: GenralImageFile });
const thumbnailParser = multer({ storage: thumbnailStorage });

const asset = require("../controllers/asset.controller");
const policy = require("../helper/policy");

var AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");
var s3 = new AWS.S3();

const multerS3 = require("multer-s3");
const fileUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "3dfilesdata/test",
    // acl: 'public-read',
    key: function(req, file, cb) {
      console.log(file);
      cb(null, file.originalname);
    }
  })
}).any();
module.exports = (openRoutes, apiRoutes) => {
  /**
   *      <ProjectAssetsMobile>
   */
  // apiRoutes.route('/createProjectMobAddRoofplans/:p_id')
  // .all(projectRoofPlanParser.array('file',5))
  // .post(asset.createProjectMobAddRoofplans);
  /**
   *      </ProjectAssetsMobile>
   */

  /**
   *      <ProjectAssetsMobile>
   */
  apiRoutes
    .route("/createProjectMobAddOtherFiles/:p_id")
    .all(projectOtherFileParser.array("files", 5))
    .post(asset.createProjectMobAddOtherFiles);

  apiRoutes
    .route("/createProjectMobAddImages/:p_id")
    .all(projectOtherFileParser.array("files", 5))
    .post(asset.createProjectMobAddImages);

  // apiRoutes.route('/createProjectMobAddRoofplans/:p_id')
  // .all(projectRoofPlanParser.array('files',5))
  // .post(asset.createProjectMobAddRoofplans);
  /**
   *      </ProjectAssetsMobile>
   */

  /**
   *      <GenralAssetsAPIs>
   */

  apiRoutes.route("/getAssetById/:a_id").get(asset.getAssetById);

  apiRoutes
    .route("/addGenralImageFile")
    .all(genralImageFileParser.single("file"))
    .post(asset.addGenralImageFile);

  /**
   *      </GenralAssetsAPIs>
   */
  /**
   *      <ProjectAssets>
   */
  apiRoutes
    .route("/addAssetProjectImageById/:p_id")
    .all(projectImageFileParser.single("file"))
    .post(asset.addAssetProjectImageById);

  apiRoutes
    .route("/addAssetProjectOtherFileById/:p_id")
    .all(projectOtherFileParser.single("file"))
    .post(asset.addAssetProjectOtherFileById);

  apiRoutes
    .route("/addAssetProjectRoofPlanById/:p_id")
    .all(policy.isManager)
    .all(projectRoofPlanParser.single("file"))
    .post(asset.addAssetProjectRoofPlanById);

  /**
   *      </ProjectAssets>
   */

  /**
   *      <TaskProgress>
   */
  apiRoutes
    .route("/addAssetTaskProgressById/:t_id")
    .all(taskProgressImageFileParser.array("files", 5))
    .post(asset.addAssetTaskProgressById);
  /**
   *      </TaskProgress>
   */

  /**
   *      <RooferConcern>
   */
  apiRoutes
    .route("/addAssetRooferConcernById/:rf_id")
    .all(rooferConcernImageFileParser.array("files", 5))
    .post(asset.addAssetRooferConcernById);
  /**
   *      </RooferConcern>
   */

  /**
   *      <RooferConcern>
   */
  apiRoutes
    .route("/getFileManagerAssets")
    .all(policy.checkPrivilege("fileManager", "basicAccess"))
    .get(asset.getFileManagerAssets);

  apiRoutes.route("/newFileUpload").post(asset.newFileUpload);

  apiRoutes.route("/generateRoofPlans").post(asset.generateRoofPlans);

  apiRoutes.route("/addRoofPlansFromAsset").post(asset.addRoofPlansFromAsset);
  apiRoutes.route("/newIssues3FileUpload").post(asset.newIssues3FileUpload);

  /**
   *      </RooferConcern>
   */
  /* Sign url for evaporate JS */

  function hmac(key, value) {
    return crypto
      .createHmac("sha256", key)
      .update(value)
      .digest();
  }

  function hexhmac(key, value) {
    return crypto
      .createHmac("sha256", key)
      .update(value)
      .digest("hex");
  }

  /* Open route to sign upload requests */
  openRoutes.use("/signv4_auth", (req, res) => {
    const timestamp = req.query.datetime.substr(0, 8);

    const date = hmac(
      "AWS4" + "dC3K12enLGh6IndHLwZjpmgpdqmsKmoiI7Z1qtEv",
      timestamp
    );
    const region = hmac(date, "ap-south-1");
    const service = hmac(region, "s3");
    const signing = hmac(service, "aws4_request");

    res.send(hexhmac(signing, req.query.to_sign));
  });

  openRoutes.get("/pdff", async (req, res) => {
    const path = require("path");
    const fs = require("fs");
    const fetch = require("node-fetch");
    const scissors = require("scissors");
    try {
      let url =
        "https://s3.ap-south-1.amazonaws.com/3dfilesdata/3DFolder/529-2712-1-PB.pdf";

      const tempDirPath = path.join(__dirname, "../Files/tesst");
      const fileResponse = await fetch(url);

      const fileStream = fs.createWriteStream(
        path.join(tempDirPath, "test.pdf")
      );

      fileResponse.body.pipe(fileStream);

      fileResponse.body.on("error", err => {
        throw err;
      });

      fileStream.on("finish", () => {
        try {
          console.log("startng to converrrrrt");
          let ourStream = fs.createWriteStream(
            path.join(tempDirPath, "out.pdf")
          );
          const pdf = scissors(path.join(tempDirPath, "test.pdf"))
            .range(1, 20)
            .pdfStream()
            .pipe(ourStream)
            .on("finish", function() {
              return res.status(200).json({
                message: "stream done"
              });
            })
            .on("error", function(err) {
              console.log(err);
              throw err;
            });
        } catch (e) {
          console.log(e);
          return res.status(500).json({ errr: "asdad" });
        }
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({ errr: "asdad" });
    }
  });
};
