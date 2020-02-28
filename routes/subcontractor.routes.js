const subcontractor = require("../controllers/subcontractor.controller");
const policy = require("../helper/policy");
const uid = require("uid-safe");
const async = require("async");

const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: "dktnhmsjx",
  api_key: "792293689156324",
  api_secret: "VYxx8McbtBw5hFQiC2u6NVTfcyU"
});

const profileImage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "profilePics",
  filename: function(req, file, cb) {
    const originalname = file.originalname.split("."),
      extension = originalname.pop();
    originalname.push(`-${uid.sync(9)}`);
    const newName = [...originalname].join("");
    cb(undefined, newName);
  }
});

const ImageParser = multer({ storage: profileImage });

module.exports = (openRoutes, apiRoutes) => {
  apiRoutes.route("/listallsubcontractor").get(subcontractor.getAllSubcontractors);

  apiRoutes.route("/getsubcontractor/:id").get(subcontractor.getSubcontractor);

  apiRoutes
    .route("/addsubcontractor")
    .all(ImageParser.any())
    .post(subcontractor.saveSubcontractor);

  apiRoutes
    .route("/updatesubcontractor/:id")
    .all(ImageParser.any())
    .put(subcontractor.updateSubcontractor);

  apiRoutes
    .route("/editSubContractorProfile/:id")
    .all(ImageParser.any())
    .put(subcontractor.editSubContractorProfile);

  apiRoutes.route("/deletesubcontractor/:id").delete(subcontractor.deleteSubcontractor);

  apiRoutes.route("/setpassword/:id").put(subcontractor.setPassword);

  apiRoutes.route("/addStaffToSubContractor/:id").put(subcontractor.addStaffToSubContractor);

  apiRoutes
    .route("/updateSubContractorPaymentTerms/:id")
    .put(subcontractor.updateSubContractorPaymentTerms);
};
