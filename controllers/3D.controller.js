var clientIp = require("client-ip");
const cloudinary = require("cloudinary");
const getClientAddress = require("client-address");
const jwt = require("jsonwebtoken");
const superSecret = "xyz";
const User = require("../models/user.model");
const Asset = require("../models/asset.model");
const Project = require("../models/project.model");
let serverIp = "94.231.109.54";
var AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");
var s3 = new AWS.S3();

module.exports = {
  get3DTest: (req, res) => {
    console.log("3d controller calling");
    let token = req.headers["x-access-token"];
    let key = req.headers["key"];
    console.log("token", token);
    console.log("key", key);
    try {
      if (token && key) {
        jwt.verify(token, superSecret, (err, decoded) => {
          if (err) {
            return res.status(401).json({
              errorTag: 103,
              message: "Token expired"
            });
          } else {
            User.findById(decoded._id, (err, user) => {
              if (user) {
                //user.mobileToken = user.webtoken = user.salt = user.password = undefined;
                req.user = user;
                if (user.webToken == token || user.mobileToken == token) {
                  if (key == "favy@123") {
                    res.send("true");
                  } else {
                    res.send("false");
                  }
                  //   var clientIpAddress = clientIp(req);
                  //   console.log("ip",clientIpAddress);
                  //   if(clientIpAddress == serverIp){
                  //       res.send("true");
                  //   }else{
                  //       res.send("false");
                  //   }
                } else {
                  res.send("false");
                }
              } else res.send("false");
            });
          }
        });
      } else {
        res.send("false");
      }

      //after this
    } catch (e) {
      console.log(e);
      res.send("false");
    }
  },

  uploadprojectFile: async (req, res) => {
    try {
      let id = req.params.projectId;
      let key = req.headers["key"];
      if (key == "favy@123") {
        if (req.file) {
          let asset = {
            companyId: req.user.companyId,
            projectId: id,
            assetName: req.body.name,
            assetDescription: req.body.description,
            originalname: req.file.originalname,
            resource_type: req.body.file_type,
            etag: req.file.etag,
            mimetype: req.file.mimetype,
            encoding: req.file.encoding,
            format: req.file.mimetype,
            bytes: req.file.size,
            url: req.file.location,
            secure_url: req.file.location
          };
          let newAsset = new Asset(asset);
          console.log("NEWASSET", newAsset);
          await newAsset.save();
          return res.status(200).json({
            message: "File has been saved successfully"
          });
        } else {
          return res.status(500).json({
            message: "Couldn't find File."
          });
        }
      } else {
        return res.status(500).json({
          message: "Failed saving File."
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  list3dFiles: async (req, res) => {
    let key = req.headers["key"];
    try {
      if (key == "favy@123") {
        if (req.query.projectId && req.query.filetype) {
          Asset.find(
            {
              projectId: req.query.projectId,
              resource_type: req.query.filetype
            },
            function(err, assets) {
              if (err) {
                return res.status(500).json({
                  message: "error finding data."
                });
              } else {
                res.send(assets);
              }
            }
          );
        } else {
          //res.send("NO..");
          Asset.find(
            {
              projectId: req.query.projectId,
              resource_type: { $in: ["3d_ifc", "3d_bcf", "3d_bvf", "3d_jszip"] }
            },
            function(err, allAssets) {
              if (err) {
                return res.status(500).json({
                  message: "error finding data."
                });
              } else {
                res.send(allAssets);
              }
            }
          );
        }
      } else {
        return res.status(500).json({
          message: "Failed getting data.Please check headers."
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateAssetData: async (req, res) => {
    let assetId = req.params.assetId;
    console.log("req.body", req.body);
    let key = req.headers["key"];
    try {
      let key = req.headers["key"];
      if (key == "favy@123") {
        if (req.file) {
          Asset.findById(assetId, function(err, assetObj) {
            if (err) {
              return res.status(500).json({
                message: "couldent find such File."
              });
            } else {
              if (req.body.name) {
                assetObj.assetName = req.body.name;
              }
              if (req.body.description) {
                assetObj.assetDescription = req.body.description;
              }
              let fileName = assetObj.originalname;
              var params = {
                Bucket: "3dfilesdata/3DFolder",
                Key: fileName
              };
              s3.deleteObject(params, function(err, data) {
                if (data) {
                  console.log("previous object deleted");

                  (assetObj.originalname = req.file.originalname),
                    (assetObj.resource_type = req.body.file_type),
                    (assetObj.etag = req.file.etag),
                    (assetObj.mimetype = req.file.mimetype),
                    (assetObj.encoding = req.file.encoding),
                    (assetObj.format = req.file.mimetype),
                    (assetObj.bytes = req.file.size),
                    (assetObj.url = req.file.location),
                    (assetObj.secure_url = req.file.location);
                  assetObj.save();

                  return res.status(200).json({
                    message: "File has been updated successfully."
                  });
                } else {
                  return res.status(500).json({
                    message: "Failure..Couldn't replace File"
                  });
                }
              });
            }
          });
        } else {
          Asset.findById(assetId, function(err, assetObj) {
            if (err) {
              return res.status(500).json({
                message: "Failed getting object."
              });
            } else {
              console.log("assetObj", assetObj);
              (assetObj.assetName = req.body.name),
                (assetObj.assetDescription = req.body.description);
              assetObj.save();
              res.send(assetObj);
            }
          });
        }
      } else {
        return res.status(500).json({
          message: "Failed getting data.Please check headers."
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  deleteAsset: async (req, res) => {
    try {
      let assetId = req.params.assetId;
      let key = req.headers["key"];
      if (key == "favy@123") {
        var assetObject = Asset.findById(assetId, function(err, assetObj) {
          if (err) {
            return res.status(500).json({
              message: "Operation failed ,No such file found"
            });
          } else {
            let fileName = assetObj.originalname;
            var params = {
              Bucket: "3dfilesdata/3DFolder",
              Key: fileName
            };

            s3.deleteObject(params, function(err, data) {
              if (data) {
                console.log("File deleted successfully");
                Asset.remove({ _id: assetObj._id }, function(err, result) {
                  if (err) {
                    return res.status(500).json({
                      message: "Operation failed."
                    });
                  } else {
                    return res.status(500).json({
                      message: "File successfully deleted."
                    });
                  }
                });
              } else {
                return res.status(500).json({
                  message: "Failed deleting File fro server."
                });
              }
            });
          }
        });
      } else {
        return res.status(500).json({
          message: "Failed to Remove File."
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  }
};
