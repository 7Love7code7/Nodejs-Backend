const registrationController = require("../controllers/reportRegistration.controller")
const uid = require("uid-safe");
const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");
const multerS3 = require("multer-s3");

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
        .route("/createRegistration")
        // .all(reportsImageParser.any())
        .post(registrationController.createRegistration);
    apiRoutes.route("/getAllRegistration").get(registrationController.getAllRegistration);

    apiRoutes.route("/getRegistration/:id").get(registrationController.getRegistrationById);

    apiRoutes.route("/addReportRegistrationComment/:id").all(reportsImageParser.any())
    .put(registrationController.addReportRegistrationComment);

    
}