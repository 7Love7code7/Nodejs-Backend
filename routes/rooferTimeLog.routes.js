const rooferTimeLog   = require('../controllers/rooferTimeLog.controller')
const policy    = require('../helper/policy');
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

const receiptImages = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "receipts",
  allowedFormats: ['jpg', 'png'],
  filename: function (req, file, cb) {
    console.log("file: ",file);
    const originalname = file.originalname.split("."),
    extension = originalname.pop();
  originalname.push(`-${uid.sync(9)}`);
  const newName = [...originalname].join("");
  console.log("newName: ",newName);
  cb(undefined, newName);
  }
});

const ImageParser = multer({ storage: receiptImages });

module.exports  = (openRoutes,apiRoutes) =>  {

    apiRoutes.route('/createRooferTimeLogForProject/:p_id')
    .all(ImageParser.any())
    .post(rooferTimeLog.createRooferTimeLogForProject) // TODO : create rooferTimeLog

    apiRoutes.route('/listAllRooferTimeLogs')
        .get(rooferTimeLog.listAllRooferTimeLogs)       // TODO : list all rooferTimeLog  

    apiRoutes.route('/getRooferTimeLogById/:t_id')
        .get(rooferTimeLog.getRooferTimeLogById)        // TODO : Get 1 rooferTimeLog by id 

    apiRoutes.route('/listRooferTimeLogByProjectId/:p_id')
        .get(rooferTimeLog.listRooferTimeLogByProjectId)        // TODO : Get 1 rooferTimeLog by id    

    apiRoutes.route('/updateRooferTimeLogById/:t_id')
    //.all(policy.isManager)
    .all(ImageParser.any())
    .put(rooferTimeLog.updateRooferTimeLogById)     // TODO : update 1 rooferTimeLog by id

    apiRoutes.route('/deleteRooferTimeLogById/:t_id')
        .delete(rooferTimeLog.deleteRooferTimeLogById)     // TODO : update 1 rooferTimeLog by id          
}