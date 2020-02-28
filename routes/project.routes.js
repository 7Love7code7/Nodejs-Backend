const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");
const uid = require("uid-safe");

cloudinary.config({
  cloud_name: "dktnhmsjx",
  api_key: "792293689156324",
  api_secret: "VYxx8McbtBw5hFQiC2u6NVTfcyU"
});

const projectImage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "projectImage",
  allowedFormats: ["jpg", "png"],
  // filename: function (req, file, cb) {
  filename: function (req, file, cb) {
    console.log(req.user._id);
    cb(undefined, req.user._id);
  }
});

const projectDoc = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "projectDoc",
  allowedFormats: ["pdf", "png", "jpg"],
  filename: function (req, file, cb) {
    console.log(req.user._id);
    cb(undefined, req.user._id);
  }
})

const fileManagerFiles = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "projectFiles",
  filename: function (req, file, cb) {
    console.log("inside", file)
    const originalname = file.originalname.split("."),
      extension = originalname.pop();
    originalname.push(`-${uid.sync(9)}`);
    const newName = [...originalname].join("");
    console.log(newName);
    cb(undefined, newName);
  }
});

const projectRoof = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "projectRoofPlan",
  allowedFormats: ["pdf", "png", "jpg"],
  filename: function (req, projectrf, cb) {
    cb(undefined, projectrf.originalname);
  }
});

const projectImageParser = multer({
  storage: projectImage
});

const projectDocParser = multer({
  storage: projectDoc
});
const projectRoofPlan = multer({
  storage: projectRoof
});

const fileManagerParser = multer({
  storage: fileManagerFiles
});

const project = require("../controllers/project.controller");
const policy = require("../helper/policy");

module.exports = (openRoutes, apiRoutes) => {
  apiRoutes
    .route("/createProject")
    .all(policy.checkPrivilege("project", "createProject"))
    .post(project.createProject); // TODO : create project

  apiRoutes
    .route("/listAllProjects")
    //.all(policy.isManager)
    .get(project.listAllProjects); // TODO : list all projects

  apiRoutes
    .route("/listAllOngoingProjects")
    .all(policy.isManager)
    .get(project.listAllOngoingProjects); // TODO : list all Ongoing projects

  apiRoutes
    .route("/createProjectManager/:p_id")
    .all(policy.isAdmin)
    .post(project.createProjectManager); // TODO : create manager

  apiRoutes.route("/getProjectById/:p_id").get(project.getProjectById); // TODO : Get 1 project by id

  apiRoutes
    .route("/updateProjectById/:p_id")
    .put(project.updateProjectById); // TODO : update 1 project by id

  apiRoutes
    .route("/updateProjectImageById/:p_id")
    .all(projectImageParser.array("files", 12))
    .put(project.updateProjectImageById); // TODO : update 1 project by id

  //Create New Service through Mobile (07-02-2018 - Bharat)
  apiRoutes
    .route("/createProjectMob")
    .all(projectDocParser.array("files"))
    .post(project.createProjectMob); // TODO : Create New Service through Mobile

  // apiRoutes.route('/changeProjectCurrency/:projectId').all(policy.isManager)
  //     .put(project.changeProjectCurrency)

  apiRoutes
    .route("/acceptProjectCurrency")
    .all(policy.isAdmin)
    .put(project.acceptProjectCurrency);

  apiRoutes
    .route("/getCurrencyBasedOnCalculationDate")
    .all(policy.isAdmin)
    .post(project.getCurrencyBasedOnCalculationDate);

  apiRoutes
    .route("/addProjectRoofPlan")
    .all(policy.isManager)
    .post(project.addProjectRoofPlan);

  apiRoutes
    .route("/addAutoProjectRoofPlan")
    .all(policy.isManager)
    .post(project.addAutoProjectRoofPlan);

  apiRoutes
    .route("/saveRoofPlan/:roofPlanId")
    .all(policy.isManager)
    .put(project.saveRoofPlan);

  apiRoutes
    .route("/getProjectRoofPlans/:projectId")
    .all(policy.isManager)
    .get(project.getProjectRoofPlans);

  apiRoutes.route("/getRoofPlan/:roofPlanId").get(project.getRoofPlan);

  /* Hierarchy routes */

  apiRoutes.route("/addHierarchy").post(project.addHierarchy);

  apiRoutes.route("/getHierarchy/:projectId").get(project.getHierarchy);

  apiRoutes.route("/getHierarchyChildren/:hierarchyId").get(project.getHierarchyChildren);

  apiRoutes.route("/addFileToHierarchy").put(project.addFileToHierarchy);

  apiRoutes.route("/viewHierarchy/:hierarchyId").get(project.viewHierarchy);
  apiRoutes.route("/deleteHierarchy/:hierarchyId").delete(project.deleteHierarchy);
  apiRoutes.route("/saveHierarchyTree/:projectId").put(project.saveHierarchyTree);

  apiRoutes.route("/loadHierarchyTree").post(project.loadHierarchyTree);

  apiRoutes.route("/viewProjectAssets/:projectId").get(project.viewProjectAssets);

  apiRoutes
    .route("/uploadFileInFileManager")
    .all(fileManagerParser.any())
    .post(project.uploadFileInFileManager);

  apiRoutes.route("/dragMoveNodes").put(project.dragMoveNodes);

  apiRoutes.route("/moveAssets").put(project.moveAssets);

  apiRoutes.route("/cloneAssets").put(project.cloneAssets);

  apiRoutes.route("/deleteAssets").put(project.deleteAssets);

  apiRoutes.route("/getHierarchyTemplate").get(project.getHierarchyTemplate);

  apiRoutes.route("/changeProjectTemplate").post(project.changeProjectTemplate);

  apiRoutes.route("/showProjectFiles/:projectId").get(project.showProjectFiles);

  apiRoutes.route("/checkAssetDuplicate").post(project.checkAssetDuplicate);

  apiRoutes.route("/getProject3dArFiles/:projectId").get(project.getProject3dArFiles);

  apiRoutes.route("/saveProj2dData").post(project.saveProj2dData);

  apiRoutes.route("/saveProjVpData").post(project.saveProjVpData);

  apiRoutes.route("/getProj2dData/:projectId").get(project.getProj2dData);

  apiRoutes.route("/getProjVpData/:projectId").get(project.getProjVpData);

  //.all(projectRoofPlan.single('projectrf')) -> For inserting RoofPlan pdf

  //   openRoutes.route("/projectTag").get(async (req, res) => {
  //     const entityTag = require("../models/entityTag.model");
  //     const Project = require("../models/project.model");

  //     let allProjects = await Project.find();

  //     for (let project of allProjects) {
  //       let currentTag = await entityTag.findOne({ prefix: "PRJCT" });
  //       let tag = "PRJCT" + currentTag.count;
  //       project.systemTag = tag;
  //       currentTag.count = currentTag.count + 1;
  //       await project.save();
  //       await currentTag.save();

  //       console.log({ tag: tag });
  //     }

  //     return res.status(200).json({
  //       message: "updated"
  //     });
  //   });

  apiRoutes.route("/fileManagerAssignTags").put(project.fileManagerAssignTags);
  apiRoutes.route("/listInventoryForDrawing/:drawingId").get(project.listOfInventoryForDrawing);

  //create mobile api for creating service project Invoice
  apiRoutes.route("/createServiceProjectInvoice").post(project.createServiceProjectInvoice);

  apiRoutes
    .route("/projectRoofPlans/:id")
    .all(policy.isManager)
    .delete(project.deleteProjectRoofPlans);

  apiRoutes
    .route("/add2DPlan")
    .all(projectRoofPlan.any())
    .post(project.add2DPlan);

  apiRoutes
    .route("/updateProjectMob/:p_id")
    .all(projectDocParser.array("files"))
    .put(project.updateProjectMob); // TODO : Create New Service through Mobile


};