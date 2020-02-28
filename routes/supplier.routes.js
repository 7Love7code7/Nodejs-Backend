const supplier = require("../controllers/supplier.controller");
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
  apiRoutes.route("/listallsuppliers").get(supplier.getAllSuppliers);

  apiRoutes.route("/getsupplier/:id").get(supplier.getSupplier);

  apiRoutes
    .route("/addsupplier")
    .all(ImageParser.any())
    .post(supplier.saveSupplier);

  apiRoutes
    .route("/updatesupplier/:id")
    .all(ImageParser.any())
    .put(supplier.updateSupplier);

  apiRoutes
    .route("/editSupplierProfile/:id")
    .all(ImageParser.any())
    .put(supplier.editSupplierProfile);

  apiRoutes.route("/deletesupplier/:id").delete(supplier.deleteSupplier);

  apiRoutes.route("/addSupplierStaffMember/:id").put(supplier.addSupplierStaffMember);

  apiRoutes.route("/updateSupplierPaymentTerms/:id").put(supplier.updateSupplierPaymentTerms);
};
