const billingController = require("../controllers/billing.controller");
const multer = require("multer");
const uid = require("uid-safe");
const multerS3 = require("multer-s3");

var AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");
var s3 = new AWS.S3();

const billingFileUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "3dfilesdata/billingFiles",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    // acl: 'public-read',
    key: function(req, file, cb) {
      console.log(file);
      cb(null, uid.sync(9) + "_" + file.originalname);
    }
  })
});

module.exports = (openRoutes, apiRoutes) => {
  apiRoutes
    .route("/createBilling")
    .all(billingFileUpload.single("file"))
    .post(billingController.createNewBilling);

  apiRoutes.route("/getAllBillings").get(billingController.getAllBillings);

  apiRoutes.route("/approveBill").put(billingController.approveBill);

  apiRoutes.route("/getBillDetails/:billId").get(billingController.getBillDetails);

  apiRoutes
    .route("/addCustomBillSupplierInfo/:billId")
    .put(billingController.addCustomBillSupplierInfo);

  openRoutes.route("/newBillEmail").post((req, res) => {
    console.log("mail APIII", req.body);
    res.status(200).json(req.body);
  });
};
