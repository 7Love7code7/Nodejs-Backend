const material = require("../controllers/material.controller");
const entityTag = require("../controllers/entityTag.controller");
const policy = require("../helper/policy");
const uid = require("uid-safe");

/* Upload config */

const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");

const multerS3 = require("multer-s3");
var AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");
var s3 = new AWS.S3();

const materialFilesUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "3dfilesdata/materialFiles",
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

const materialImage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "materialFiles",
  //allowedFormats: ["jpg", "png", "jpeg"],
  filename: function(req, file, cb) {
    console.log(req.user._id);
    cb(undefined, req.user._id + uid.sync(9));
  }
});

const equipmentImage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "equipmentFiles",
  allowedFormats: ["jpg", "png", "jpeg"],
  filename: function(req, file, cb) {
    console.log(req.user._id);
    cb(undefined, req.user._id + uid.sync(9));
  }
});

const comboMaterialImage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "comboMaterialFiles",
  allowedFormats: ["jpg", "png", "jpeg"],
  filename: function(req, file, cb) {
    cb(undefined, req.user._id + uid.sync(9));
  }
});

// const materialFilestorage = cloudinaryStorage({
//     cloudinary: cloudinary,
//     folder: 'MaterialExcelFiles',
//     allowedFormats: ['xls','csv','xlsx'],
//     filename: function (req, file,cb) {
//         console.log(req.user._id);
//         cb(undefined, req.user._id);
//     }
// });

const materialImageParser = multer({ storage: materialImage });
const equipmentImageParser = multer({ storage: equipmentImage });
const comboMaterialImageParser = multer({ storage: comboMaterialImage });
//const materialFile = multer({ storage: materialFilestorage });

module.exports = (openRoutes, apiRoutes) => {
  apiRoutes
    .route("/createMaterial")
    .all(materialFilesUpload.any())
    .post(material.createMaterial); // TODO : create material
  apiRoutes
    .route("/createEquipment")
    .all(materialFilesUpload.any())
    .post(material.createEquipment);

  //apiRoutes.route('/updateEquipment/:e_id').put(material.updateEquipment);

  apiRoutes.route("/listAllMaterials").get(material.listAllMaterials); // TODO : list all materials

  apiRoutes.route("/listAllEquipments").get(material.listAllEquipments);

  apiRoutes.route("/listComboMaterials").get(material.listComboMaterials);

  apiRoutes.route("/getMaterialById/:m_id").get(material.getMaterialById); // TODO : Get 1 material by id

  apiRoutes.route("/getEquipmentById/:e_id").get(material.getEquipmentById); // TODO : Get 1 material by id

  apiRoutes
    .route("/createComboMaterial")
    .all(materialFilesUpload.any())
    .post(material.createComboMaterial);

  apiRoutes.route("/getComboMaterialById/:comboId").get(material.getComboMaterialById);

  apiRoutes
    .route("/updateMaterialById/:m_id")
    .all(materialFilesUpload.any())
    .put(material.updateMaterialById);

  apiRoutes.route("/updateSupplierById/:id").put(material.updateSupplierById);

  apiRoutes
    .route("/updateEquipmentById/:e_id")
    .all(materialFilesUpload.any())
    .put(material.updateEquipmentById);

  apiRoutes
    .route("/deleteMaterialById/:h_id")
    .all(policy.isManager)
    .delete(material.deleteMaterialById);

  apiRoutes
    .route("/createBulkMaterial")
    .all(policy.isManager)
    .post(material.createBulkMaterial);

  apiRoutes
    .route("/getComboSystemTag")
    .all(policy.isManager)
    .get(entityTag.getComboSystemTag);

  apiRoutes
    .route("/deleteComboMaterialById/:h_id")
    .all(policy.isManager)
    .delete(material.deleteComboMaterialById);

  apiRoutes
    .route("/updateComboMaterial/:comboId")
    .all(policy.isManager)
    .all(materialFilesUpload.any())
    .put(material.updateComboMaterial);

  apiRoutes
    .route("/updateComboMaterialList/:comboId")
    .all(policy.isManager)
    .put(material.updateComboMaterialList);

  apiRoutes
    .route("/showConversionRate")
    .all(policy.isManager)
    .post(material.showConversionRate);
  // apiRoutes.route('/updateMaterialPic').all(policy.isManager)
  //     .post(material.updateMaterialPic)        // TODO : create material img

  apiRoutes.route("/uploadMaterialData").post(material.saveMaterialFromCsv);

  apiRoutes.route("/uploadComboMaterialData").post(material.saveComboMaterialsFromCsv);

  apiRoutes.route("/uploadEquipmentData").post(material.saveEquimentsFromCsv);

  apiRoutes.route("/downLoadMaterialData").get(material.exportExcel);

  apiRoutes.route("/getInventoryItems").get(material.getInventoryItems);

  apiRoutes.route("/getInventoryandmaterials").get(material.getInventoryAndMaterials);

  apiRoutes.route("/downLoadEquipmentData").get(material.exportExcelEquipment);

  apiRoutes.route("/downLoadDcpData").get(material.exportExcelDcp);

  apiRoutes.route("/getItemsForDCP").get(material.getItemsForDCP);
  apiRoutes.route("/getEquipmentLocations").get(material.getEquipmentLocations);

  apiRoutes.route("/getMaterialBySystemTag/:systemtag").get(material.getMaterialBySystemTag); 
  apiRoutes.route("/getEquipmentBySystemTag/:systemtag").get(material.getEquipmentBySystemTag); 
  apiRoutes.route("/getCmbBySystemTag/:systemtag").get(material.getComboMatBySystemTag); 


};
