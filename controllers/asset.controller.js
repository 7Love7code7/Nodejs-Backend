const Company = require("../models/company.model");
const TaskProgress = require("../models/taskProgress.model");
const RooferConcern = require("../models/rooferConcern.model");
const Project = require("../models/project.model");
const Asset = require("../models/asset.model");
const Issue = require("../models/issues.model");
const RoofPlan = require("../models/roofPlan.model");
const __ = require("../helper/globals");
const mime = require("mime-types");
const fs = require("fs");
const fetch = require("node-fetch");
const path = require("path");
const util = require("util");
const rimraf = util.promisify(require("rimraf"));
const PDFImage = require("pdf-image").PDFImage;
var AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");
var s3 = new AWS.S3();
const cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "dktnhmsjx",
  api_key: "792293689156324",
  api_secret: "VYxx8McbtBw5hFQiC2u6NVTfcyU"
});

module.exports = {
  getAssetById: (req, res) => {
    let a_id = req.params.a_id;
    Asset.findById(a_id, (err, asset) => {
      if (!err) {
        return res.json(asset);
      } else {
        return res.status(500).json({ errorTag: 500, message: err.message });
      }
    });
  },

  getFileManagerAssets: async (req, res) => {
    const companyId = req.user.companyId;
    try {
      let assets = await Asset.find({ companyId: companyId }).lean();

      return res.status(200).json({
        message: "Assets loaded successfully",
        data: assets
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  addAssetProjectImageById: (req, res) => {
    let file = req.file;
    if (req.query.t) file.assetName = req.query.t;
    if (req.query.d) file.assetDescription = req.query.d;
    file.companyId = req.user.companyId;
    file.assetCategory = "Images";
    let pid = req.params.p_id;
    file.projectId = pid;
    if (file && pid) {
      Asset(file).save((err, file) => {
        if (file) {
          Project.findByIdAndUpdate(
            pid,
            { $push: { "projectFiles.images": file } },
            { safe: true, upsert: true },
            function(err, model) {
              if (!err) return res.json(file);
              else return res.status(500).json({ errorTag: 500, message: err.message });
            }
          );
        } else {
          return res.status(500).json({ errorTag: 500, message: err.message });
        }
      });
    } else {
      return res.json({ status: 500 });
    }
  },

  addAssetProjectOtherFileById: (req, res) => {
    let file = req.file;
    if (req.query.t) file.assetName = req.query.t;
    if (req.query.d) file.assetDescription = req.query.d;
    file.companyId = req.user.companyId;
    let pid = req.params.p_id;
    file.projectId = pid;
    file.assetCategory = "others";
    if (file && pid) {
      Asset(file).save((err, file) => {
        if (file) {
          Project.findByIdAndUpdate(
            pid,
            { $push: { "projectFiles.others": file } },
            { safe: true, upsert: true },
            function(err, model) {
              if (!err) return res.json(file);
              else return res.status(500).json({ errorTag: 500, message: err.message });
            }
          );
        } else {
          return res.status(500).json({ errorTag: 500, message: err.message });
        }
      });
    } else {
      return res.json({ status: 500 });
    }
  },

  addAssetProjectRoofPlanById: (req, res) => {
    let file = req.file;
    if (req.query.t) file.assetName = req.query.t;
    if (req.query.d) file.assetDescription = req.query.d;
    console.log(file);
    file.companyId = req.user.companyId;
    let pid = req.params.p_id;
    file.projectId = pid;
    file.assetCategory = "roofPlan";
    if (file && pid) {
      Asset(file).save((err, file) => {
        if (file) {
          Project.findByIdAndUpdate(
            pid,
            { $push: { "projectFiles.roofPlans": file } },
            { safe: true, upsert: true },
            function(err, model) {
              if (!err) return res.json(file);
              else return res.status(500).json({ errorTag: 500, message: err.message });
            }
          );
        } else {
          return res.status(500).json({ errorTag: 500, message: err.message });
        }
      });
    } else {
      return res.json({ status: 500 });
    }
  },

  addAssetTaskProgressById: (req, res) => {
    let files = req.files;
    files.forEach(function(element) {
      element.companyId = req.user.companyId;
    }, this);
    let id = req.params.t_id;
    if (files && id) {
      Asset.insertMany(files, (err, assets) => {
        if (err) {
          return res.status(500).json({ errorTag: 100, message: err.message });
        } else {
          console.log(assets);
          TaskProgress.findByIdAndUpdate(
            id,
            { $push: { assetsList: assets } },
            { safe: true, upsert: true, new: true },
            function(err, model) {
              if (!err) {
                console.log(model);
                return res.json(model);
              } else {
                console.log("Error");
                return res.status(500).json({ errorTag: 100, message: err.message });
              }
            }
          );
        }
      });
    } else {
      return res.json({ errorTag: 100 });
    }
  },

  addAssetRooferConcernById: (req, res) => {
    let files = req.files;
    files.forEach(function(element) {
      element.companyId = req.user.companyId;
    }, this);
    let id = req.params.rf_id;
    if (files && id) {
      Asset.insertMany(files, (err, assets) => {
        if (err) {
          return res.status(500).json({ errorTag: 100, message: err.message });
        } else {
          RooferConcern.findByIdAndUpdate(
            id,
            { $push: { assetsList: { $each: assets } } },
            { safe: true, upsert: true },
            function(err, model) {
              if (!err) return res.json(model);
              else return res.status(500).json({ errorTag: 100, message: err.message });
            }
          );
        }
      });
    } else {
      return res.json({ errorTag: 100 });
    }
  },

  addGenralImageFile: (req, res) => {
    let file = req.file;
    file.companyId = req.user.companyId;
    file.projectId = req.query.projectId ? req.query.projectId : "";
    file.assetName = req.query.assetName ? req.query.assetName : "Genral Image";
    file.assetDescription = req.query.assetDescription
      ? req.query.assetDescription
      : "Genral Asset Description";
    Asset(file).save((err, sFile) => {
      if (!sFile) {
        return res.status(500).json({ errorTag: 100, message: err.message });
      } else {
        return res.json(sFile);
      }
    });
  },

  // Roofplan for Project Mob
  // addAssetProjectMobRoofFileById : (req,res) => {
  //     // console.log("IN addAssetProjectMobById");
  //     // console.log(req.user);
  //     console.log(req.body);
  //     console.log("req body");
  //     console.log(req.body.assetDescription);
  //     console.log(req.body.assetDescription[0]);
  //     let file = req.files;
  //      for (var i=0; i<req.body.assetDescription.length;i++){
  //          console.log("in for");
  //          file[i].assetName = req.body.assetName[i];
  //          file[i].assetDescription = req.body.assetDescription[i];
  //      }
  //     file.companyId = req.user.companyId;
  //     let pid = req.params.p_id;
  //     file.projectId = pid;
  //     if(file && pid){
  //         Asset.insertMany(file, (err, assets) => {
  //             console.log("Asset LIst");
  //             console.log(assets);
  //             if(assets){
  //                 // console.log(assets);
  //                 Project.findByIdAndUpdate(
  //                         pid,
  //                         {$push: {"projectFiles.roofPlans": {$each: assets}}},
  //                         {safe: true, upsert: true},
  //                         function(err, model) {
  //                             if(!err){
  //                                 console.log(model);
  //                                 return res.json(model)
  //                             }
  //                             else{
  //                                 console.log("Error");
  //                                 return res.status(500).json({errorTag : 500, message : err.message})
  //                             }
  //                         }
  //                 )
  //             }
  //             else{
  //                 return res.status(500).json({errorTag : 500, message : err.message})
  //             }
  //         })
  //     }
  //     else{
  //         return res.json({status : 500})
  //     }
  // },

  createProjectMobAddOtherFiles: (req, res) => {
    let pid = req.params.p_id;

    if (!req.files) {
      return res.status(400).json({
        message: "Files are missing"
      });
    }

    let file = req.files;
    for (var i = 0; i < req.body.assetDescription.length; i++) {
      file[i].assetName = req.body.assetName[i];
      file[i].assetDescription = req.body.assetDescription[i];
    }
    let updatedFiles = file.map(x => {
      x.companyId = req.user.companyId;
      x.projectId = pid;
      return x;
    });

    if (updatedFiles && pid) {
      Asset.insertMany(updatedFiles, (err, assets) => {
        console.log("Asset LIst");
        console.log(assets);
        if (assets) {
          // console.log(assets);
          Project.findByIdAndUpdate(
            pid,
            { $push: { "projectFiles.others": assets } },
            { safe: true, upsert: true, new: true },
            function(err, model) {
              if (!err) {
                console.log(model);
                return res.json(model);
              } else {
                console.log("Error");
                return res.status(500).json({ errorTag: 500, message: err.message });
              }
            }
          );
        } else {
          return res.status(500).json({ errorTag: 500, message: err.message });
        }
      });
    } else {
      return res.json({ status: 500 });
    }
  },

  createProjectMobAddImages: (req, res) => {
    let pid = req.params.p_id;

    if (!req.files) {
      return res.status(400).json({
        message: "Files are missing"
      });
    }

    let file = req.files;

    let updatedFiles = file.map(x => {
      x.companyId = req.user.companyId;
      x.projectId = pid;
      return x;
    });

    if (updatedFiles && pid) {
      Asset.insertMany(updatedFiles, (err, assets) => {
        console.log("Asset LIst");
        console.log(assets);
        if (assets) {
          // console.log(assets);
          Project.findByIdAndUpdate(
            pid,
            { $push: { "projectFiles.images": assets } },
            { safe: true, upsert: true, new: true },
            function(err, model) {
              if (!err) {
                console.log(model);
                return res.json(model);
              } else {
                console.log("Error");
                return res.status(500).json({ errorTag: 500, message: err.message });
              }
            }
          );
        } else {
          return res.status(500).json({ errorTag: 500, message: err.message });
        }
      });
    } else {
      return res.json({ status: 500 });
    }
  },

  createProjectMobAddRoofplans: (req, res) => {
    let pid = req.params.p_id;

    if (!req.files) {
      return res.status(400).json({
        message: "Files are missing"
      });
    }

    let file = req.files;

    let updatedFiles = file.map(x => {
      x.companyId = req.user.companyId;
      x.projectId = pid;
      return x;
    });

    if (updatedFiles && pid) {
      Asset.insertMany(updatedFiles, (err, assets) => {
        console.log("Asset LIst");
        console.log(assets);
        if (assets) {
          // console.log(assets);
          Project.findByIdAndUpdate(
            pid,
            { $push: { "projectFiles.roofPlans": assets } },
            { safe: true, upsert: true, new: true },
            function(err, model) {
              if (!err) {
                console.log(model);
                return res.json(model);
              } else {
                console.log("Error");
                return res.status(500).json({ errorTag: 500, message: err.message });
              }
            }
          );
        } else {
          return res.status(500).json({ errorTag: 500, message: err.message });
        }
      });
    } else {
      return res.json({ status: 500 });
    }
  },

  newFileUpload: async (req, res) => {
    try {
      let requiredFields = ["projectId", "folderId", "assetData"];
      /* Validate request */
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }
      const { assetData } = req.body;
      let url = `https://s3-ap-south-1.amazonaws.com/${assetData.bucket}/${assetData.key}`;

      let assetObj = {
        assetName: assetData.assetName,
        projectId: req.body.projectId,
        companyId: req.user.companyId,
        hierarchies: [req.body.folderId],
        mimetype: assetData.mimetype,
        bytes: assetData.bytes,
        format: mime.extension(assetData.mimetype),
        url: url,
        secure_url: url,
        providerData: {
          name: req.user.displayName
        },
        planDocument: assetData.planDocument || false
      };

      if (mime.extension(assetData.mimetype) === "pdf") {
        const pdfName = assetData.key.split("/").pop();

        if (assetData.planDocument) {
          let result = await __.generateImages(
            url,
            pdfName,
            `temp_thumbnail_${req.user._id}`,
            false
          );
          if (!result) {
            throw "Error in generating images";
          }
          assetObj.thumbnail = result[0];
          assetObj.planImages = result;
          let newAsset = new Asset(assetObj);
          newAsset = await newAsset.save();
          return res.status(200).json({
            message: "Asset saved successfully",
            data: newAsset
          });
        } else {
          /* Generate thumbnail */
          let result = await __.generateImages(
            url,
            pdfName,
            `temp_thumbnail_${req.user._id}`,
            true
          );
          if (!result) {
            throw "Error in generating thumbnail";
          }
          assetObj.thumbnail = result.secure_url;
          let newAsset = new Asset(assetObj);
          newAsset = await newAsset.save();
          return res.status(200).json({
            message: "Asset saved successfully",
            data: newAsset
          });
        }
      } else {
        /* Update asset */
        let newAsset = new Asset(assetObj);
        newAsset = await newAsset.save();
        return res.status(200).json({
          message: "Asset saved successfully",
          data: newAsset
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  generateRoofPlans: async (req, res) => {
    try {
      // asset id , object with indices
      let requiredFields = ["pdfUrl", "pages", "assetId", "projectId"];
      /* Validate request */
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }
      let pages = req.body.pages,
        pdfName = req.body.pdfUrl.split("/").pop();
      const fileResponse = await fetch(req.body.pdfUrl);

      /* Create a folder to store temp files */
      const makeDir = util.promisify(fs.mkdir),
        readFile = util.promisify(fs.readFile);
      tempDirPath = path.join(__dirname, "../Files", `temp_pdf_${req.user._id}`);

      if (fs.existsSync(tempDirPath)) {
        await rimraf(tempDirPath);
      }

      await makeDir(tempDirPath);

      const fileStream = fs.createWriteStream(path.join(tempDirPath, pdfName));

      fileResponse.body.pipe(fileStream);

      fileResponse.body.on("error", err => {
        throw err;
      });

      fileStream.on("error", err => {
        throw err;
      });

      fileStream.on("finish", async () => {
        /* Image generation */
        try {
          let pdfImage = new PDFImage(path.join(tempDirPath, pdfName));
          const imagePaths = await Promise.all(pages.map(x => pdfImage.convertPage(x.pageNo)));

          /* Attach image URL to pages */

          pages = pages.map((x, i) => {
            x.tempImagePath = imagePaths[i];
            return x;
          });

          /* Upload generated images to s3 bucket */
          for (let image of pages) {
            const cloudinaryUploader = util.promisify(cloudinary.v2.uploader.upload);
            let uploadData = await cloudinaryUploader(image.tempImagePath, {
              folder: "projectRoofPlan"
            });

            image.url = uploadData.secure_url;

            let newRoofPlan = new RoofPlan({
              projectId: req.body.projectId,
              parentAsset: req.body.assetId,
              assetObj: image,
              providerData: {
                name: req.user.displayName
              }
            });
            newRoofPlan.save();
          }

          await rimraf(tempDirPath);

          return res.status(200).json({
            message: "Roof plan added successfully",
            pages
          });
        } catch (e) {
          console.log(e);
          await rimraf(tempDirPath);
          return res.status(500).json({
            message: "Internal server error"
          });
        }
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  addRoofPlansFromAsset: async (req, res) => {
    try {
      let requiredFields = ["pages", "assetId", "projectId"];
      /* Validate request */
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }

      let plans = req.body.pages.map(x => {
        let obj = {
          projectId: req.body.projectId,
          parentAsset: req.body.assetId,
          assetObj: x,
          providerData: {
            name: req.user.displayName
          }
        };
        return obj;
      });

      await RoofPlan.insertMany(plans);

      return res.status(200).json({
        message: "Roof plans added successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  newIssues3FileUpload: async (req, res) => {
    console.log("S3 DATA: ", req.body);
    try {
      const { assetData } = req.body;
      let url = `https://s3-ap-south-1.amazonaws.com/${assetData.bucket}/${assetData.key}`,
        assetObj = {
          assetName: assetData.assetName,
          assetDescription: assetData.assetdescription,
          companyId: req.user.companyId,
          providerData: {
            name: req.user.displayName
          }
        };
      /* 1 - s3 , 2 - cloudinary  */
      if (req.body.type === 1) {
        assetObj = {
          ...assetObj,
          ...{
            mimetype: assetData.mimetype,
            bytes: assetData.bytes,
            format: mime.extension(assetData.mimetype),
            url: url,
            secure_url: url,
            providerData: {
              name: req.user.displayName
            }
          }
        };
      } else {
        console.log("s33 --> cloudinary block");
        const cloudinaryUploader = util.promisify(cloudinary.v2.uploader.upload);
        let uploadData = await cloudinaryUploader(url);

        console.log("data from cloudinary", uploadData);
        assetObj = {
          ...assetObj,
          ...uploadData
        };
      }

      let newAsset = new Asset(assetObj);
      newAsset = await newAsset.save();

      let updateAsset = await Issue.findById({ _id: assetData.issueId }, function(err, object) {
        if (err) {
        } else {
          object.listAssets = object.listAssets.concat([newAsset._id]);
          object.save();
          return res.status(200).json({
            message: "Asset saved successfully"
          });
        }
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  }
};
