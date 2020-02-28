const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: "dktnhmsjx",
  api_key: "792293689156324",
  api_secret: "VYxx8McbtBw5hFQiC2u6NVTfcyU"
});

const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "employeeProfilePhoto",
  allowedFormats: ["jpg", "png"],
  filename: function(req, file, cb) {
    cb(undefined, req.user.companyId);
  }
});
const employeeLogoParser = multer({ storage: storage });

const employee = require("../controllers/employees.controller");
const policy = require("../helper/policy");

module.exports = (openRoutes, apiRoutes) => {

  apiRoutes
    .route("/addnewEmployee").all(employeeLogoParser.any()).post(employee.saveEmployee);
    
   apiRoutes
     .route("/getallEmployees").get(employee.getAllEmployees);
    
     apiRoutes
     .route("/getemployeedetails/:id").get(employee.getEmployeeById);

     apiRoutes
     .route("/updateemployee/:id").all(employeeLogoParser.any()).put(employee.updateEmployee);

     apiRoutes
       .route("/deleteemployee/:id").delete(employee.deleteEmployee);

      
};