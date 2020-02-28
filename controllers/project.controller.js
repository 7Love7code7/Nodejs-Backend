const request = require("request");
const Company = require("../models/company.model");
const User = require("../models/user.model");
const Project = require("../models/project.model");
const EntityTag = require("../models/entityTag.model");
const RooferAllotment = require("../models/rooferAllotment.model");
const weather = require("../helper/weather.controller");
const RoofPlan = require("../models/roofPlan.model");
const Asset = require("../models/asset.model");
const Hierarchy = require("../models/hierarchy.model");
const HierarchyTemplate = require("../models/hierarchyTemplate.model");
const Proj2d = require("../models/proj2d.model");
const ProjVp = require("../models/projVp.model");
const projectserviceinvoice = require("../models/ServiceProjectInvoice.model");
const mongoose = require("mongoose");
const _ = require("lodash");
const Joi = require("joi");
const __ = require("../helper/globals"),
  moment = require("moment");

const assign = (project, ra) => {
  if (!project.rooferAllotment) project.rooferAllotment = {};
  if (!project.teamLeaderAllotment) project.teamLeaderAllotment = {};

  if (ra.isLeader) {
    project.rooferAllotment[ra.rooferId] = ra.rooferName;
    project.teamLeaderAllotment[ra.rooferId] = ra.rooferName;
  } else project.rooferAllotment[ra.rooferId] = ra.rooferName;

  return project;
};
let projectController = {
  createProject: async (req, res) => {
    let user = req.user;
    let project = req.body;
    console.log(project);
    if (project) {
      project.companyId = user.companyId;
      project.providerData = {
        createdBy: user.displayName
      };

      /* Project currency setup */
      // let currencyData = {
      //     date: moment().format(),
      //     conversionFactor: req.body.currency.conversionFactor,
      //     currencyCode: req.body.currency.currencyCode
      // }

      // project.projectCurrencyLog = [currencyData];
      // project.currentCurrency = currencyData;

      if (req.files && req.files.length > 0) {
        let files = req.files;
        files = files.map((element, i) => {
          element.providerData = {
            _id: req.user["_id"],
            email: req.user["email"],
            name: req.user["firstName"] + " " + req.user["lastName"]
          };
          element.assetName = element.originalname;
          element.secure_url = element.url = element.location;
          element.bytes = element.size.toString();
          element.format = mime.extension(element.mimetype);
          element.companyId = req.user.companyId;
          /* To attach element with props such as title and description */
          element = {
            ...element,
            ...req.body.assetObj[i]
          };
          return element;
        });

        let projectAssets = await Asset.insertMany(files);
        project.serviceProjectData.files = projectAssets.reduce(
          (acc, x) => {
            /* Split docs and images */
            if (/png|jpg|jpeg|gif/.test(x.format)) {
              acc.images.push(x._id);
            } else {
              acc.docs.push(x._id);
            }
            return acc;
          }, {
            images: [],
            docs: []
          }
        );
      }

      /* Updating system tag */
      let currentTag = await EntityTag.findOne({
        prefix: "PRJCT"
      });

      project.systemTag = "PRJCT" + currentTag.count;
      currentTag.count = currentTag.count + 1;

      currentTag.save();

      Project(project).save((err, project) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            err: 500,
            message: err.message
          });
        } else {
          console.log(project);
          return res.json(project);
        }
      });
    } else {
      return res.json({
        errorTag: 102,
        message: "No project found in body"
      });
    }
  },

  listAllProjects: (req, res) => {
    let user = req.user;
    let chunk = null,
      page = null,
      active = null;
    let lat = (lng = 0);
    let opts = {};
    opts.companyId = user.companyId;
    let minDate = new Date(-8640000000000000);
    let maxDate = new Date(8640000000000000);
    if (req.query.chunk && req.query.page) {
      chunk = parseInt(req.query.chunk);
      page = parseInt(req.query.page);
    }
    switch (req.query.active) {
      case "true":
        active = true;
        break;
      case "false":
        active = false;
        break;
      default:
        active = null;
        break;
    }
    let search = "";
    let regex = null;
    if (req.query.search) {
      regex = new RegExp(req.query.search, "gi");
    } else {
      regex = new RegExp();
    }
    if (req.query.lat && req.query.lng) {
      lat = parseFloat(req.query.lat);
      lng = parseFloat(req.query.lng);
      opts["address.loc"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lat, lng]
          }
        }
      };
    }
    if (req.query.minDate && req.query.maxDate) {
      minDate = new Date(req.query.minDate);
      maxDate = new Date(req.query.maxDate);
      if (minDate > maxDate) {
        //handle invalid date
        return res.json({
          errorTag: 106,
          message: "invalid date query"
        });
      }
    }

    /* Sort handling */
    let sortObj = {};
    if (req.query.sort && req.query.sortType) {
      sortObj[req.query.sort] = req.query.sortType === "true" ? 1 : -1;
    } else {
      sortObj = null;
    }

    let s = (page - 1) * chunk;
    Project.find({
        $or: [{
            projectName: regex
          },
          {
            projectDescription: regex
          },
          {
            systemTag: regex
          },
          {
            "client.clientName": regex
          },
          {
            "address.line1": regex
          },
          {
            "address.line2": regex
          },
          {
            "address.line3": regex
          },
          {
            "address.city": regex
          }
        ]
      })
      .where(opts)
      // .where("startDate")
      // .gte(minDate)
      // .where("endDate")
      // .lte(maxDate)
      .skip(s)
      .limit(chunk)
      .sort(sortObj)
      .populate([{
          path: "backupFolders.hierarchies"
        },
        {
          path: "client",
          select: "clientName clientLogo"
        }
      ])
      .exec((err, list) => {
        if (err) {
          return res.status(500).json({
            errorTag: 100,
            message: err.message
          });
        }
        Project.count({
            companyId: req.user.companyId
          },
          (err, count) => {
            return res.status(200).json({
              total: count,
              list: list
            });
          }
        );
      });
  },

  listAllOngoingProjects: (req, res) => {
    let user = req.user;
    let chunk = null,
      page = null,
      active = null;
    if (req.query.chunk && req.query.page) {
      chunk = parseInt(req.query.chunk);
      page = parseInt(req.query.page);
    }
    switch (req.query.active) {
      case "true":
        active = true;
        break;
      case "false":
        active = false;
        break;
      default:
        active = null;
        break;
    }
    let search = "";
    let regex = null;
    if (req.query.search) {
      regex = new RegExp(req.query.search, "gi");
    } else {
      regex = new RegExp();
    }
    let s = (page - 1) * chunk;
    Project.find({
        projectName: regex
      })
      .where({
        companyId: user.companyId
      })
      .where("projectStatus")
      .gt(0)
      .lt(100)
      .skip(s)
      .limit(chunk)
      .sort(active)
      .select("_id projectName startDate endDate address projectStatus isServiceProject")
      .exec((err, list) => {
        if (err) {
          return res.status(500).json({
            errorTag: 100,
            message: err.message
          });
        }
        Project.count({
            companyId: req.user.companyId
          },
          (err, count) => {
            return res.status(200).json({
              total: count,
              list: list
            });
          }
        );
      });
  },

  updateProjectImageById: (req, res) => {
    let file = req.file;
    console.log(req.file);
    console.log(req.body);
    if (file) {
      Project.findByIdAndUpdate(
        req.params.p_id, {
          $set: {
            projectImage: file.secure_url
          }
        },
        (err, result) => {
          return res.json(result);
        }
      );
    } else {
      return res.json({
        status: 500
      });
    }
  },

  createProjectManager: (req, res) => {},

  getProjectById: (req, res) => {
    let id = req.params.p_id;
    console.log(id);
    if (id) {
      Project.findById(id)
        .populate([{
            path: "roofPlans backupFolders.hierarchies"
          },
          {
            path: "client",
            select: "clientName clientLogo"
          }, {
            path: 'serviceProjectData.files.docs',
            select: 'id secure_url'
          },
          {
            path: 'serviceProjectData.files.images',
            select: 'id secure_url'
          }, {
            path: 'serviceProjectData.assignedTo',
            select: 'id firstName lastName'
          }
        ])
        .exec((err, project) => {
          if (project) {
            let coordinates = project.address.loc.coordinates;
            console.log(coordinates);
            //projectData.project=project;
            let url =
              "http://api.openweathermap.org/data/2.5/weather?lat=" +
              coordinates[0] +
              "&lon=" +
              coordinates[1] +
              "&APPID=" +
              "c9e375aa67f3039b2f28ad01e47b3d4d";
            request(url, function (error, response, body) {
              if (body) {
                project.weatherData = body;
                //projectData.weatherData=body;
              } else {
                project.weatherData = error;
                console.log("Error in saving weather data");
              }

              console.log(project);
              return res.json(project);
            });
          } else {
            console.log(err);
            return res.status(500).json({
              err: 100,
              message: "error fetching list"
            });
          }
        });
    } else {
      return res.status(401).json({
        errorTag: 101,
        message: "parameter error"
      });
    }
  },

  updateProjectById: async (req, res) => {
    let id = req.params.p_id;
    let project = req.body;
    console.log("UPDATE");
    console.log(id);
    console.log(project);
    if (id) {
      /* Check if currency code changed */
      try {
        let projectData;
        if (project.currentCurrency) {
          projectData = await Project.findOne({
            _id: id,
            "currentCurrency.currencyCode": project.currentCurrency.currencyCode,
            "currentCurrency.conversionFactor": project.currentCurrency.conversionFactor
          }).lean();
        }

        if (!projectData && project.currentCurrency) {
          project.currentCurrency.date = moment().format();
        }

        let updatedData = await Project.findOneAndUpdate({
            _id: id
          },
          {
            $set: project
          },
          {
            new: true
          }
        );

        if (!projectData && project.currentCurrency) {
          /* currency code updated in this case */
          updatedData.projectCurrencyLog.push(project.currentCurrency);
          await updatedData.save();
        }

        return res.status(200).json({
          message: "Project updated successfully"
        });
      } catch (e) {
        console.log(e);
        res.status(500).json({
          message: "Internal server error"
        });
      }
    } else {
      return res.status(401).json({
        errorTag: 101,
        message: "parameter error"
      });
    }
  },

  //Create New Project through Mobile (07-02-2018)
  createProjectMob: async (req, res) => {
    console.log("hkjfhkjsdf");
    let user = req.user;

    console.log(user);
    let project = req.body;
    let rooferallot = {};


    if (project) {
      project.companyId = user.companyId;
      project.providerData = {
        createdBy: user.displayName
      };
      // if (!req.body.isServiceProject) {
      project.isServiceProject = true;
      // }


      if (req.files && req.files.length > 0) {
        let files = req.files;
        files = files.map((element, i) => {
          console.log("element: ", element);
          element.providerData = {
            _id: req.user["_id"],
            email: req.user["email"],
            name: req.user["firstName"] + " " + req.user["lastName"]
          };
          element.assetName = element.originalname;
          element.secure_url = element.url;
          // element.bytes = element.size.toString();
          // element.format = mime.extension(element.mimetype);
          element.companyId = req.user.companyId;
          /* To attach element with props such as title and description */

          return element;
        });

        let projectAssets = await Asset.insertMany(files);
        project.serviceProjectData = {};
        project.serviceProjectData.assignedTo = req.body.assignedTo;
        project.serviceProjectData.files = projectAssets.reduce(
          (acc, x) => {
            /* Split docs and images */
            if (/png|jpg|jpeg|gif/.test(x.format)) {
              acc.images.push(x._id);
            } else {
              acc.docs.push(x._id);
            }
            return acc;
          }, {
            images: [],
            docs: []
          }
        );
      }
      /* Project currency setup */
      if (req.body.currency) {
        let currencyData = {
          date: moment().format(),
          conversionFactor: req.body.currency.conversionFactor,
          currencyCode: req.body.currency.currencyCode
        };

        project.projectCurrencyLog = [currencyData];
        project.currentCurrency = currencyData;
      }
      /* Updating system tag */
      let currentTag = await EntityTag.findOne({
        prefix: "PRJCT"
      });

      project.systemTag = "PRJCT" + currentTag.count;
      currentTag.count = currentTag.count + 1;
      project.companyId = user.companyId;
      project.providerData = {
        createdBy: user.displayName,
        id: user._id
      };
      currentTag.save();
      let project1 = new Project(project);
      var projectdata = await project1.save();

      rooferallot.rooferId = user._id;
      rooferallot.rooferName = user.displayName;
      rooferallot.projectId = projectdata._id;
      rooferallot.projectId = rooferallot.projectId;
      rooferallot.companyId = user.companyId;
      rooferallot.from = req.body.startDate;
      rooferallot.to = req.body.endDate;
      RooferAllotment(rooferallot).save((err, ra) => {
        if (err) {
          console.log("eroroe: ", err);
          return res.status(500).json({
            errorTag: 100,
            message: "error adding rooferAllotment"
          });
        } else {
          // console.log(ra);
          //insert record in project
          if (ra.projectId) {
            Project.findById(ra.projectId, (err, rooferA) => {
              rooferA = assign(rooferA, ra);
              Project.findByIdAndUpdate(ra.projectId, rooferA).populate([{
                  path: 'serviceProjectData.files.docs',
                  select: 'id secure_url'
                },
                {
                  path: 'serviceProjectData.files.images',
                  select: 'id secure_url'
                }, {
                  path: 'serviceProjectData.assignedTo',
                  select: 'id firstName lastName'
                }
              ]).exec(function (err, result) {
                if (err) {
                  // ...
                } else {
                  res.json(result);
                }
              });

            })
          } else {
            return res.json(ra)
          }
        }
      })

    } else {
      return res.json({
        errorTag: 102,
        message: "No project found in body"
      });
    }
  },

  /* Change project currency */

  // changeProjectCurrency: async (req, res) => {
  //     let requiredFields = ["currency"];
  //     /* Validate request */
  //     if (!__.requiredFields(req, requiredFields)) {
  //         return res.status(400).json({
  //             message: 'Required fields missing'
  //         });
  //     }
  //     if (!req.params.projectId) {
  //         return res.status(400).json({
  //             message: 'ProjectId param missing'
  //         });
  //     }

  //     try {
  //         /* Set the currency directly if admin */
  //         if (req.user.designation === 'admin') {
  //             await Project.update({
  //                 _id: req.params.projectId
  //             }, {
  //                 $set: {
  //                     currencyCode: req.body.currency
  //                 }
  //             })
  //             return res.status(200).json({
  //                 message: "Currency updated successfully"
  //             })
  //         } else if (req.user.designation === 'manager') { /* Initiate a change request for manager */
  //             await Project.update({
  //                 _id: req.params.projectId
  //             }, {
  //                 $set: {
  //                     currencyChangeRequest: {
  //                         currencyCode: req.body.currency,
  //                         status: true
  //                     }
  //                 }
  //             })
  //             return res.status(200).json({
  //                 message: "Currency change request has been sent to the admin"
  //             })
  //         }
  //         /* Create a currency change request for manager */
  //     } catch (e) {
  //         console.log(e)
  //         return res.status(500).json({
  //             message: "Internal server error"
  //         })
  //     }
  // },

  acceptProjectCurrency: async (req, res) => {
    let requiredFields = ["accepted"];
    /* Validate request */
    if (!__.requiredFields(req, requiredFields)) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }
    if (!req.params.projectId) {
      return res.status(400).json({
        message: "ProjectId param missing"
      });
    }

    try {
      let {
        currencyChangeRequest
      } = await Project.findOne({
        _id: req.params.projectId
      }).lean();

      if (currencyChangeRequest && currencyChangeRequest.status) {
        if (req.body.accepted == 1) {
          /* If admin accepts the request */

          await Project.update({
            _id: req.params.projectId
          }, {
            $set: {
              currencyCode: currencyChangeRequest.currencyCode,
              currencyChangeRequest: {
                currencyCode: "",
                status: false
              }
            }
          });
          return res.status(200).json({
            message: "Currency change has been accepted successfully!"
          });
        } else {
          /* If admin rejects the request */
          await Project.update({
            _id: req.params.projectId
          }, {
            $set: {
              currencyChangeRequest: {
                currencyCode: "",
                status: false
              }
            }
          });
          return res.status(200).json({
            message: "Currency change has been rejected successfully!"
          });
        }
      } else {
        return res.status(400).json({
          message: "Invalid currency change request!"
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getCurrencyBasedOnCalculationDate: async (req, res) => {
    if (!req.body.date) {
      return res.status(400).json({
        message: "Date field required"
      });
    }
    try {
      let {
        currencyLog
      } = await Company.findOne({
        _id: req.user.companyId
      }).lean();
      let requiredCurrency = currencyLog.filter(x => {
        return moment(req.body.date).isAfter(x.date);
      });

      // TODO : This works fine, but need to write to sort function just to be safe

      return res.status(200).json({
        data: requiredCurrency[requiredCurrency.length - 1]
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  addProjectRoofPlan: async (req, res) => {
    try {
      let requiredFields = ["pages", "assetId", "projectId"];
      /* Validate request */
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }

      let insertData = req.body.pages.reduce((acc, x) => {
        let data = {
          projectId: req.body.projectId,
          parentAsset: req.body.assetId,
          assetObj: x,
          providerData: {
            name: req.user.displayName
          }
        };
        acc.push(data);
        return acc;
      }, []);

      let newRoofPlans = await RoofPlan.insertMany(insertData);

      return res.status(200).json({
        message: "Roof plan added successfully",
        data: newRoofPlans
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  addAutoProjectRoofPlan: async (req, res) => {
    try {
      let requiredFields = ["pages", "assetId", "projectId"];
      /* Validate request */
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }

      let data = {
        projectId: req.body.projectId,
        parentAsset: req.body.assetId,
        assetObj: req.body.pages[0],
        model3D: req.body.model3D,
        guid: req.body.guid,
        isActive: 1
      };

      let query = {
        model3D: req.body.model3D,
        guid: req.body.guid
      };

      RoofPlan.findOneAndUpdate(query,
        data,
        {
          new: true,
          upsert: true
        }, (err, result) => {
          if (result) {
            return res.status(200).json({
              message: "Roof plan added successfully",
              data: result
            });
          } else {
            return res.status(500).json({
              message: "Couldn't update plan"
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

  getProjectRoofPlans: async (req, res) => {
    if (!req.params.projectId) {
      return res.status(400).json({
        message: "Project ID missing"
      });
    }

    try {
      let roofPlans = await RoofPlan.find({
        projectId: req.params.projectId,
        isActive: 1
      }).lean();

      return res.status(200).json({
        message: "Roofplan Data loaded",
        data: roofPlans
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  /* Save json from visual planner to roofplan */
  saveRoofPlan: async (req, res) => {
    if (!req.params.roofPlanId) {
      return res.status(400).json({
        message: "Roof plan ID missing"
      });
    }

    try {
      if (!req.body.jsonString) {
        return res.status(400).json({
          message: "Json String missing"
        });
      }

      let updateQuery = {
        plannerData: {
          jsonString: req.body.jsonString,
          initialized: true
        }
      };

      /* Parse associations */

      if (req.body.associations && req.body.associations.length) {
        updateQuery.plannerData.shapeAssociation = req.body.associations;
      }

      if (req.body.calibration) {
        updateQuery.plannerData.calibration = req.body.calibration;
      }

      if (req.body.countData) {
        updateQuery.plannerData.countData = req.body.countData;
      }

      await RoofPlan.update({
        _id: req.params.roofPlanId
      }, {
        $set: updateQuery
      });

      return res.status(200).json({
        message: "Roof plan updated successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getRoofPlan: async (req, res) => {
    if (!req.params.roofPlanId) {
      return res.status(400).json({
        message: "RoofPlan ID missing"
      });
    }

    try {
      let roofPlan = await RoofPlan.findOne({_id: req.params.roofPlanId, isActive: 1});
      if (roofPlan) {
        return res.status(200).json({
          message: "Roofplan Data loaded.",
          data: roofPlan
        });
      } else {
        return res.status(400).json({
          message: "RoofPlan not found."
        });
      }
    } catch (e) {
      console.error(e);
      return res.status(500).json({
        message: "Internal server error",
        data: e
      });
    }
  },

  /* Heirarchy functions */
  addHierarchy: async (req, res) => {
    try {
      let requiredFields = ["isParent", "name"];

      /* Either get companyId or parentId */
      /* isParent is true for the base node of that hierarchy and it is referenced in the project collection */

      req.body.isParent ? requiredFields.push("projectId") : requiredFields.push("parent");

      /* Validate request */
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }

      let hierarchyData = new Hierarchy(req.body);

      let newHierarchy = await hierarchyData.save();

      /* Push to parent hierarchy */

      if (req.body.parent) {
        let parentHierarchy = await Hierarchy.findOneAndUpdate({
          _id: req.body.parent
        }, {
          $push: {
            children: newHierarchy._id
          }
        });
      }

      /* Push into project if it's a parent */
      if (req.body.isParent) {
        await Project.update({
          _id: req.body.projectId
        }, {
          $push: {
            hierarchies: newHierarchy._id
          }
        });
      }

      return res.status(200).json({
        message: "Hierarchy saved successfully",
        data: newHierarchy
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  deleteNodes: async (req, res) => {
    try {
      let requiredFields = ["hierarchyId"];

      /* Validate request */
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }

      await Hierarchy.update({
        _id: {
          $in: req.body.hierarchyId
        }
      }, {
        $set: {
          isDeleted: true
        }
      }, {
        multi: true
      });
      return res.status(200).json({
        message: "Folders have been deleted"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getHierarchy: async (req, res) => {
    try {
      if (!req.params.projectId) {
        return res.status(400).json({
          message: "ProjectId is missing"
        });
      }

      let hierarchyData = await Project.findOne({
          _id: req.params.projectId
        })
        .select("hierarchies backupFolders")
        .populate([{
          path: "hierarchies"
        }, {
          path: "backupFolders.hierarchies"
        }])
        .lean();
      return res.status(200).json({
        message: "Hierarchy loaded successfully",
        data: hierarchyData
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getHierarchyChildren: async (req, res) => {
    try {
      if (!req.params.hierarchyId) {
        return res.status(400).json({
          message: "hierarchyId is missing"
        });
      }

      let hierarchyData = await Hierarchy.findOne({
          _id: req.params.hierarchyId
        })
        .populate({
          path: "children",
          populate: {
            path: "children",
            select: "name"
          }
        })
        .lean();

      return res.status(200).json({
        message: "Hierarchy loaded successfully",
        data: hierarchyData
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  addFileToHierarchy: async (req, res) => {
    try {
      let requiredFields = ["hierarchyId", "assetId"];

      /* Validate request */
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }

      await Asset.update({
        _id: {
          $in: req.body.assetId
        }
      }, {
        $set: {
          hierarchies: [req.body.hierarchyId]
        }
      }, {
        multi: true
      });

      return res.status(200).json({
        message: "File added to hierarchy"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  viewProjectAssets: async (req, res) => {
    try {
      if (!req.params.projectId) {
        return res.status(400).json({
          message: "projectId fields missing"
        });
      }

      let files = await Asset.find({
        projectId: req.params.projectId
      }).lean();

      return res.status(200).json({
        message: "Success",
        data: files
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  dragMoveNodes: async (req, res) => {
    try {
      let requiredFields = ["type", "hierarchyId"];

      switch (req.body.type) {
        case 1:
          requiredFields.push("parentId", "projectId");
          break;
        case 2:
          requiredFields.push("projectId", "destId");
          break;
        case 3:
          requiredFields.push("parentId", "destId");
          break;
      }

      /* Validate request */
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }
      const type = req.body.type;

      if (type === 1) {
        /* Dragging to root */

        await Hierarchy.update({
          _id: req.body.parentId
        }, {
          $pull: {
            children: req.body.hierarchyId
          }
        });

        await Project.update({
          _id: req.body.projectId
        }, {
          $push: {
            hierarchies: req.body.hierarchyId
          }
        });
      } else if (type === 2) {
        await Project.update({
          _id: req.body.projectId
        }, {
          $pull: {
            hierarchies: req.body.hierarchyId
          }
        });

        await Hierarchy.update({
          _id: req.body.destId
        }, {
          $push: {
            children: req.body.hierarchyId
          }
        });
      } else {
        await Hierarchy.update({
          _id: req.body.parentId
        }, {
          $pull: {
            children: req.body.hierarchyId
          }
        });

        await Hierarchy.update({
          _id: req.body.destId
        }, {
          $push: {
            children: req.body.hierarchyId
          }
        });
      }

      return res.status(200).json({
        message: "Nodes modified successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  checkAssetDuplicate: async (req, res) => {
    let requiredFields = ["assetNames", "destId"];
    /* Validate request */
    if (!__.requiredFields(req, requiredFields)) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }

    try {
      let result = await Promise.all(
        req.body.assetNames.map(x =>
          Asset.findOne({
            assetName: x,
            hierarchies: req.body.destId
          })
          .select("assetName")
          .exec()
        )
      );

      result = result.filter(Boolean).map(x => x.assetName);

      return res.status(200).json({
        message: "Duplicates",
        duplicates: result
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  moveAssets: async (req, res) => {
    let requiredFields = ["assetId", "sourceId", "destId"];

    /* Validate request */
    if (!__.requiredFields(req, requiredFields)) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }

    try {
      /* Update asset's node */
      await Asset.update({
        _id: {
          $in: req.body.assetId
        }
      }, {
        $set: {
          hierarchies: [req.body.destId]
        }
      }, {
        multi: true
      });
      /* Remove source node's association of the asset */
      await Hierarchy.update({
        _id: req.body.sourceId
      }, {
        $set: {
          hierarchies: []
        }
      }, {
        multi: true
      });

      return res.status(200).json({
        message: "File moved successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  deleteAssets: async (req, res) => {
    let requiredFields = ["assetId"];

    /* Validate request */
    if (!__.requiredFields(req, requiredFields)) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }
    try {
      /* Update asset's node */
      await Asset.update({
        _id: req.body.assetId
      }, {
        $set: {
          hierarchies: []
        }
      });

      return res.status(200).json({
        message: "File deleted successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  cloneAssets: async (req, res) => {
    try {
      let requiredFields = ["assetId", "hierarchyId"];

      /* Validate request */
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }

      /* Get asset docs */

      let assetDocs = await Asset.find({
          _id: {
            $in: req.body.assetId
          }
        })
        .select("-hierarchies -created")
        .lean();

      assetDocs = assetDocs.map(x => {
        x.hierarchies = [req.body.hierarchyId];
        delete x._id;
        return x;
      });

      let insertStatus = await Asset.insertMany(assetDocs);

      return res.status(200).json({
        message: "File(s) have been copied successfully",
        data: insertStatus
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  viewHierarchy: async (req, res) => {
    try {
      if (!req.params.hierarchyId) {
        return res.status(400).json({
          message: "hierarchyId fields missing"
        });
      }

      let folders = await Hierarchy.findOne({
          _id: req.params.hierarchyId,
          isDeleted: false
        })
        .select("name children tags")
        .populate({
          path: "children",
          match: {
            isDeleted: false
          }
        })
        .lean();
      console.log("folders", folders)
      let files = await Asset.find({
        hierarchies: req.params.hierarchyId
      }).lean();

      /* Breadcrumb data */
      let breadcrumbs = folders == null ? [] : [folders];
      let getBreadCrumb = async id => {
        let data = await Hierarchy.findOne({
          children: id
        }).lean();
        if (data) {
          breadcrumbs.unshift(data);
          return getBreadCrumb(data._id);
        } else {
          return;
        }
      };

      await getBreadCrumb(req.params.hierarchyId);

      return res.status(200).json({
        message: "Success",
        files,
        folders: folders == null ? [] : folders.children,
        breadcrumbs: breadcrumbs
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  saveHierarchyTree: async (req, res) => {
    try {
      let {
        hierarchies
      } = await Project.findOne({
          _id: req.params.projectId
        })
        .select("hierarchies")
        .lean();

      let hierarchyTree = await Hierarchy.find({
          _id: {
            $in: hierarchies
          }
        })
        .select("-_id -__v -createdAt -updatedAt")
        .lean();

      let newTemplate = new HierarchyTemplate({
        name: req.body.name,
        companyId: req.user.companyId,
        hierarchy: hierarchyTree
      });

      await newTemplate.save();

      return res.status(200).json({
        message: "Hierarchy saved as a tempalate successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  loadHierarchyTree: async (req, res) => {
    try {
      let requiredFields = ["templateId", "projectId"];
      /* Validate request */
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }

      let {
        hierarchy
      } = await HierarchyTemplate.findOne({
        _id: req.body.templateId
      }).lean();
      let rootFolders = [];

      for (let h of hierarchy) {
        delete h._id;
        let children = h.children && h.children.length > 0 ? h.children : [];

        delete h.children;
        let newHierarchy = new Hierarchy(h);

        newHierarchy = await newHierarchy.save();
        rootFolders.push(newHierarchy._id);
        let insertChildren = async (childrenArray, parent) => {
          if (!childrenArray.length) {
            return;
          }
          let data = await saveChildren(
            childrenArray.map(x => {
              delete x._id;
              return x;
            })
          );
          parent.children = data.cursor.map(x => x._id);

          await parent.save();

          for (let i = 0; i < data.cursor.length; i++) {
            await insertChildren(data.children[i], data.cursor[i]);
          }
        };

        await insertChildren(children, newHierarchy);

        async function saveChildren(childrenArray) {
          let data = await Hierarchy.insertMany(childrenArray);

          return {
            cursor: data,
            children: childrenArray.map(x => x.children)
          };
        }
      }

      /* update root folders to project */

      await Project.update({
        _id: req.body.projectId
      }, {
        $set: {
          hierarchies: rootFolders
        }
      });

      return res.status(200).json({
        message: "Hierarchy added to project"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getHierarchyTemplate: async (req, res) => {
    try {
      let templateList = await HierarchyTemplate.find({
          companyId: req.user.companyId
        })
        .select("name hierarchy")
        .lean();

      return res.status(200).json({
        message: "Template list loaded successfully",
        data: templateList
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },
  deleteHierarchy: async (req, res) => {
    try {
      /* Validate request */
      if (!req.params.hierarchyId) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }
      let templateList = await Hierarchy.findOneAndUpdate({
        _id: req.params.hierarchyId
      }, {
        $set: {
          isDeleted: true
        }
      })

      return res.status(200).json({
        message: "Deleted Successfully"
        // data: templateList
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },
  uploadFileInFileManager: async (req, res) => {
    try {
      console.log("inside")
      let requiredFields = ["hierarchyId", "projectId"];

      /* Validate request */
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }

      let files = req.files;
      files = files.map((x, i) => {
        x.companyId = req.user._id;
        x.assetName = x.originalname;
        x.hierarchies = [req.body.hierarchyId];
        x.projectId = req.body.projectId;
        x.providerData = {
          name: req.user.displayName
        };
        return x;
      });
      console.log("files", files)

      let status = await Asset.insertMany(files);
      console.log(status)
      return res.status(200).json({
        message: "Files were added successfully",
        data: status
      });
    } catch (e) {
      console.log(JSON.stringify(e));
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  changeProjectTemplate: async (req, res) => {
    try {
      let requiredFields = ["templateId", "projectId"];

      /* Validate request */
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }
      /* Remove templates to backup */
      let {
        hierarchies
      } = await Project.findOne({
          _id: req.body.projectId
        })
        .select("hierarchies")
        .lean();

      await Project.update({
        _id: req.body.projectId
      }, {
        $push: {
          backupFolders: {
            name: `backup_${Date.now()}`,
            hierarchies
          }
        }
      });

      /* Call load hierarchy tree API */
      await projectController.loadHierarchyTree(req, res);
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  showProjectFiles: async (req, res) => {
    try {
      if (!req.params.projectId) {
        return res.status(400).json({
          message: "hierarchyId fields missing"
        });
      }

      let limit = Number(req.query.limit) === NaN ? 0 : Number(req.query.limit);
      let assets = await Asset.find({
          projectId: req.params.projectId,
          "providerData.name": req.user.displayName
        })
        .select("assetName format")
        .sort({
          updatedAt: -1
        })
        .limit(limit)
        .lean();

      return res.status(200).json({
        message: "Files loaded successfully",
        data: assets
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },
  getProject3dArFiles: async (req, res) => {
    try {
      if (!req.params.projectId) {
        return res.status(400).json({
          message: "ProjectId is missing"
        });
      }

      let {
        hierarchies
      } = await Project.findOne({
          _id: req.params.projectId
        })

        .populate({
          path: "hierarchies",
          match: {
            name: "3D Models and AR"
          }
        })
        .lean();

      if (hierarchies.length) {
        let files = await Asset.find({
          hierarchies: hierarchies[0]._id
        }).lean();

        return res.status(200).json({
          message: "Files loaded successfully",
          files
        });
      } else {
        return res.status(200).json({
          message: "3D Models and AR folder not found",
          files: null
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  insertDrawingData: (DrawingModel, type, data) => {
    return new Promise((resolve, reject) => {
      let newDrawingData = new DrawingModel(data);
      newDrawingData
        .save()
        .then(savedData => {
          return savedData.toObject();
        })
        .then(savedData => {
          return Project.update({
            _id: savedData.projectId
          }, {
            $set: {
              [type]: savedData._id
            }
          });
        })
        .then(_ => {
          resolve(true);
        })
        .catch(e => {
          reject(e);
        });
    });
  },

  saveProj2dData: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        projectId: Joi.string().required(),
        calibration: Joi.object().keys({
          value: Joi.number(),
          unit: Joi.string()
        }),
        jsonString: Joi.string(),
        levels: Joi.string()
      });
      let {
        error,
        value
      } = Joi.validate(req.body, schema);

      if (error) return __.inputValidationError(error, res);

      await projectController.insertDrawingData(Proj2d, "proj2d", value);

      return res.status(200).json({
        message: "Proj2d data has been saved successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  saveProjVpData: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        projectId: Joi.string().required(),
        calibration: Joi.object().keys({
          value: Joi.number(),
          unit: Joi.string()
        }),
        jsonString: Joi.string(),
        levels: Joi.string()
      });
      let {
        error,
        value
      } = Joi.validate(req.body, schema);

      if (error) return __.inputValidationError(error, res);

      await projectController.insertDrawingData(ProjVp, "projVp", value);

      return res.status(200).json({
        message: "ProjVp data has been saved successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },
  getProj2dData: async (req, res) => {
    try {
      if (!req.params.projectId) {
        return res.status(400).json({
          message: "Project ID missing"
        });
      }

      let {
        proj2d
      } = await Project.findOne({
          _id: req.params.projectId
        })
        .select("proj2d")
        .populate({
          path: "proj2d",
          select: "-__v"
        })
        .lean();

      return res.status(200).json({
        message: "Project 2d data loaded successfully",
        data: proj2d
      });
    } catch (e) {
      console.loe(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },
  getProjVpData: async (req, res) => {
    try {
      if (!req.params.projectId) {
        return res.status(400).json({
          message: "Project ID missing"
        });
      }

      let {
        projVp
      } = await Project.findOne({
          _id: req.params.projectId
        })
        .select("projVp")
        .populate({
          path: "projVp",
          select: "-__v"
        })
        .lean();

      return res.status(200).json({
        message: "Project Vp data loaded successfully",
        data: projVp
      });
    } catch (e) {
      console.loe(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  fileManagerAssignTags: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        key: Joi.string()
          .valid("file", "folder")
          .required(),
        id: Joi.string().required(),
        tags: Joi.array().items(Joi.string())
      });
      let {
        error,
        value
      } = Joi.validate(req.body, schema);

      if (error) return __.inputValidationError(error, res);

      let model = value.key === "file" ? Asset : Hierarchy;

      let {
        tags
      } = await model.findOneAndUpdate({
        _id: value.id
      }, {
        $addToSet: {
          tags: {
            $each: value.tags
          }
        }
      }, {
        new: true
      });

      return res.status(200).json({
        message: "Tags added successfully",
        tags
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },
  listOfInventoryForDrawing: async (req, res) => {
    let drawingId = req.params.drawingId;

    console.log("drawingId", drawingId);
    res.send({});
  },

  createServiceProjectInvoice: async (req, res) => {
    let invoice = req.body;
    if (req.body.currency) {
      let currencyData = {
        date: moment().format(),
        conversionFactor: req.body.currency.conversionFactor,
        currencyCode: req.body.currency.currencyCode
      };

      invoice.currency = currencyData;
    }

    let user = req.user.firstName;
    invoice.createdBy = user;

    try {
      projectserviceinvoice(invoice).save((err, invoice) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            err: 500,
            message: err.message
          });
        } else {
          console.log(invoice);
          return res.json(invoice);
        }
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  deleteProjectRoofPlans: async (req, res) => {
    if (!req.params.id) {
      return res.status(400).json({
        message: "Project ID missing"
      });
    }

    try {
      let Data = await RoofPlan.findOneAndUpdate({
        _id: req.params.id
      }, {
        $set: {
          isActive: 3
        }
      }, {
        new: true
      });
      return res.status(200).json({
        message: "Roofplan Data Deleted"
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  add2DPlan: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        assetId: Joi.array().label("assetId"),
        projectId: Joi.string()
          .trim()
          .label("projectId")
      });
      let {
        error,
        value
      } = Joi.validate(req.body, schema);
      if (error) return __.inputValidationError(error, res);
      let status = [];

      if (req.files && req.files.length) {
        let files = req.files;
        files = files.map((x, i) => {

          x.companyId = req.user._id;
          x.assetName = x.originalname;
          x.projectId = value.projectId;
          x.mimetype = x.mimetype;
          x.providerData = {
            name: req.user.displayName
          };
          return x;
        });
        status = await Asset.insertMany(files);
      }

      if (value.assetId && value.assetId.length) {
        let assetDocs = await Asset.find({
            _id: {
              $in: value.assetId
            }
          })
          .select("-hierarchies -created")
          .lean();
        assetDocs.forEach(element => {
          status.push(element);
        });
      }
      let roofPlanData = status.map((x, i) => {
        let data = {
          projectId: value.projectId,
          assetObj: {
            title: x.assetName,
            description: x.assetDescription,
            url: x.secure_url
          },
          mimetype: x.mimetype,
          parentAsset: x._id,
          isActive: 1
        };
        return data;
      });

      let newRoofPlanData = await RoofPlan.insertMany(roofPlanData);

      return res.status(200).json({
        message: "Roof plans added",
        data: newRoofPlanData
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateProjectMob: async (req, res) => {
    let id = req.params.p_id;
    let project = req.body;
     let dataimages=[];let datadoc=[];
    if (id) {
      /* Check if currency code changed */
      try {
        let projectData;
        if (project.currentCurrency) {
          projectData = await Project.findOne({
            _id: id,
            "currentCurrency.currencyCode": project.currentCurrency.currencyCode,
            "currentCurrency.conversionFactor": project.currentCurrency.conversionFactor
          }).lean();
        }

        if (!projectData && project.currentCurrency) {
          project.currentCurrency.date = moment().format();
        }

        let updatedData = await Project.findOneAndUpdate({
            _id: id
          },
          project
        );

        if (req.files && req.files.length > 0) {

          let files = req.files;
          files = files.map((element, i) => {
            element.providerData = {
              _id: req.user["_id"],
              email: req.user["email"],
              name: req.user["firstName"] + " " + req.user["lastName"]
            };
            element.assetName = element.originalname;
            element.secure_url = element.url = element.location;

            element.companyId = req.user.companyId;
            /* To attach element with props such as title and description */
            return element;
          });

          let projectAssets = await Asset.insertMany(files);
          if (req.body.assignedTo) {
            updatedData.serviceProjectData.assignedTo = req.body.assignedTo;
          }
          projectAssets.serviceProjectData={};
          projectAssets.serviceProjectData.files = projectAssets.reduce(
            (acc, x) => {
              /* Split docs and images */
              if (/png|jpg|jpeg|gif/.test(x.format)) {
                acc.images.push(x._id);
              } else {
                acc.docs.push(x._id);
              }
              return acc;
            }, {
              images: [],
              docs: []
            }
          );

          updatedData.serviceProjectData.files = {
            images: [...updatedData.serviceProjectData.files.images, ...projectAssets.serviceProjectData.files.images],
            docs: [...updatedData.serviceProjectData.files.docs, ...projectAssets.serviceProjectData.files.docs]
          };
        }

        if (!projectData && project.currentCurrency) {
          /* currency code updated in this case */
          updatedData.projectCurrencyLog.push(project.currentCurrency);

        }
        await updatedData.save();

        return res.status(200).json({
          message: "Project updated successfully",
       });
      } catch (e) {
        console.log(e);
        res.status(500).json({
          message: "Internal server error"
        });
      }
    } else {
      return res.status(401).json({
        errorTag: 101,
        message: "parameter error"
      });
    }
  },
};

module.exports = projectController;