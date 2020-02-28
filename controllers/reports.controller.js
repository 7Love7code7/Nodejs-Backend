const Report = require("../models/report.model");
const ReportRegistration = require("../models/reportRegistration.model");
const ReportSiteDoc = require("../models/reportSiteDoc.model");
const CheckList = require("../models/checkList.model");
const checkListController = require("./checkList.controller");
const controlPlanController = require("./controlplans.controller");
const entityTagController = require("./entityTag.controller");
const moment = require("moment");
const Asset = require("../models/asset.model");
const Joi = require("joi");
const _ = require("lodash");
const __ = require("../helper/globals");
const AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");
const s3 = new AWS.S3();
const jsr = require("jsreport-client")("http://13.233.49.113:5488", "admin", "cloudes@123");

let reportsController = {
  createReports: async (req, res) => {
    try {
      const schema = Joi.object()
        .keys({
          title: Joi.string().required(),
          description: Joi.string(),
          reportType: Joi.string().valid(["Safety", "Quality", "Issue", "Other"]),
          drawings: Joi.array().items(Joi.string()),
          projectId: Joi.string().required(),
          registrationInterval: Joi.number(),
          aboutCompany: Joi.string(),
          newCheckList: Joi.boolean().required(),
          // checkList: Joi.string().when("newCheckList", {
          //   is: false,
          //   then: Joi.required()
          // }),
          checkList: Joi.string(),
          client: Joi.string().required(),
          clientLogo: Joi.string(),
          subContractorLogo: Joi.string(),
          admin: Joi.string(),
          subContractors: Joi.array()
            .min(1)
            .items(Joi.string()),

          newControlPlan: Joi.boolean(),
          controlPlans: Joi.array().items(Joi.string())
        })
        .unknown(true);
      let { error, value } = Joi.validate(req.body, schema);

      if (error) return __.inputValidationError(error, res);

      console.log("value>>>>>>>>>>>>>", value);

      value.systemTag = await entityTagController.generateTag("QHSE");

      /* Process checklist */

      if (value.newCheckList && req.body.newCheckListObj) {
        let createdCheckList = await checkListController.newCheckList(
          req.body.newCheckListObj,
          req.user.companyId,
          res
        );
        value.checkList = createdCheckList._id;
      } else {
        value.checkList = value.checkList;
      }

      if (value.newControlPlan && req.body.newControlPlanObj) {
        let createdControlPlan = await controlPlanController.newControlPlan(
          req.body.newControlPlanObj,
          req.user
        );
        value.controlPlans = [createdControlPlan._id];
      }

      if (value.files) {
        value.files.map(x => {
          value.clientLogo = x.clientLogo;
          value.subContractorLogo = x.SubContractorLogo;
        });
      }

      if (req.files && req.files.length > 0) {
        let files = req.files;
        files = files.map((element, i) => {
          return element;
        });
        files = _.flatten(files);
        files.map(x => {
          if (x.fieldname == "files[0][clientLogo]") {
            value.clientLogo = x.secure_url;
          } else if (x.fieldname == "files[0][SubContractorLogo]") {
            value.subContractorLogo = x.secure_url;
          }
        });
      }

      await Report(value).save();
      return res.status(200).json({
        message: "Report created successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  generateAssetUrlForReport: async (req, res) => {
    if (req.files && req.files.length > 0) {
      let files = req.files;
      files = files.map((element, i) => {
        /* Split pdf and save as separate asset objects */

        if (element.format === "pdf") {
          element = [...Array(element.pages)].reduce((acc, x, i) => {
            let imageObj = {
              ...element
            };
            imageObj.format = "jpg";
            imageObj.mimetype = "image/jpeg";
            imageObj.secure_url = imageObj.secure_url
              .replace(/upload/, `upload/pg_${i + 1}`)
              .replace(/pdf$/, "jpg");
            acc.push(imageObj);
            return acc;
          }, []);
        }
        return element;
      });

      files = _.flatten(files);

      let reportDrawings = await Asset.insertMany(files);
      return res.status(200).json({
        messages: "Drawings added successfully",
        data: reportDrawings
      });
    } else {
      return res.status(400).json({
        messages: "Input files are empty"
      });
    }
  },

  addDrawingAssetForReport: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          message: "Report ID missing"
        });
      }

      if (req.files && req.files.length > 0) {
        let files = req.files;
        files = files.map((element, i) => {
          /* Split pdf and save as separate asset objects */

          if (element.format === "pdf") {
            element = [...Array(element.pages)].reduce((acc, x, i) => {
              let imageObj = {
                ...element
              };
              imageObj.format = "jpg";
              imageObj.mimetype = "image/jpeg";
              imageObj.secure_url = imageObj.secure_url
                .replace(/upload/, `upload/pg_${i + 1}`)
                .replace(/pdf$/, "jpg");
              acc.push(imageObj);
              return acc;
            }, []);
          }
          return element;
        });

        files = _.flatten(files);

        let reportDrawings = await Asset.insertMany(files);

        await Report.update(
          {
            _id: req.params.id
          },
          {
            $push: {
              drawings: {
                $each: reportDrawings.map(x => x._id)
              }
            }
          }
        );
        return res.status(200).json({
          messages: "Drawings added successfully",
          data: reportDrawings
        });
      } else {
        return res.status(400).json({
          messages: "Input files are empty"
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  addReportRegistration: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          message: "Report ID missing"
        });
      }

      const schema = Joi.object()
        .keys({
          registrationType: Joi.string()
            .valid(["QA-Registration", "Safety", "Issue", "Other"])
            .required(),
          //drawingData: Joi.array(),
          approvalStatus: Joi.string().valid(["Approved", "Declined"]),

          projectId: Joi.string().required(),
          controlPlanItems: Joi.array().items(Joi.string())
          //markedCheckList: Joi.array().items(Joi.string())
        })
        .unknown(true);
      let { error, value } = Joi.validate(req.body, schema);
      console.log("value>>>>>>>>>>>>>", value);

      if (error) return __.inputValidationError(error, res);

      value.systemTag = await entityTagController.generateTag("RGST");

      if (req.files) {
        let files = req.files;
        files.forEach((element, i) => {
          element.companyId = req.user.companyId;
        });

        let commentAssets = await Asset.insertMany(files);
        value.commentObj.images = commentAssets.map(x => x._id);
        if (req.user.lastName) {
          value.commentObj.userName = req.user.firstName + " " + req.user.lastName;
        } else {
          value.commentObj.userName = req.user.firstName;
        }
        value.commentObj.pic = req.user.profilePic;
      }

      value.comments = [value.commentObj];

      let reportReg = new ReportRegistration(value);

      if (value.markedCheckList) {
        await CheckList.update(
          {
            _id: value.markedCheckList._id
          },
          {
            $set: {
              checklistItems: value.markedCheckList.checklistItems
            }
          }
        );
      }

      let savedRegistration = await reportReg.save();

      /* Changes to report based on added registrations */
      let reportUpdateQuery = {
        $set: {
          status: value.commentObj.status
        },
        $push: {
          registrations: savedRegistration._id
        }
      };

      await Report.update(
        {
          _id: req.params.id
        },
        reportUpdateQuery
      );
      return res.status(200).json({
        message: "Registration added to report successfully",
        data: savedRegistration
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  /* Currently not used anywhere in the report */
  addReportOtherDoc: async (req, res) => {
    try {
      if (!req.params.reportId) {
        return res.status(400).json({
          message: "Report id is missing"
        });
      }
      if (req.files && req.files.length > 0) {
        let files = req.files;
        files = files.map((element, i) => {
          element.companyId = req.user.companyId;
          return element;
        });

        let otherDocs = await Asset.insertMany(files);

        let assetIds = otherDocs.map(x => x._id);

        await Report.update(
          {
            _id: req.params.reportId
          },
          {
            $push: {
              docs: {
                $each: assetIds
              }
            }
          }
        );

        return res.status(200).json({
          message: "Document(s) added successfully"
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  addReportSiteDoc: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          message: "Report ID missing"
        });
      }

      const schema = Joi.object()
        .keys({
          approvalStatus: Joi.string().valid(["Approved", "Declined"]),
          projectId: Joi.string().required(),
          controlPlanItems: Joi.array().items(Joi.string())
          //markedCheckList: Joi.array().items(Joi.string())
        })
        .unknown(true);
      let { error, value } = Joi.validate(req.body, schema);

      console.log("valuevalue >>>>>>???????????", value);

      if (error) return __.inputValidationError(error, res);

      value.systemTag = await entityTagController.generateTag("SDOC");
      if (req.user.lastName) {
        value.commentObj.userName = req.user.firstName + " " + req.user.lastName;
      } else {
        value.commentObj.userName = req.user.firstName;
      }

      value.commentObj.pic = req.user.profilePic;
      if (req.files) {
        let files = req.files;
        files.forEach((element, i) => {
          element.companyId = req.user.companyId;
        });

        let commentAssets = await Asset.insertMany(files);
        commentAssets = commentAssets.reduce(
          (acc, x) => {
            if (x.format === "pdf") {
              acc.documents.push(x._id);
            } else {
              acc.images.push(x._id);
            }
            return acc;
          },
          {
            images: [],
            documents: []
          }
        );
        console.log("commentAssets >>>>>>>>>", commentAssets);
        if (commentAssets.images.length > 0) {
          value.commentObj.images = commentAssets.images;
        }
        value.documents = commentAssets.documents;
      }

      value.comments = [value.commentObj];

      let reportSiteDoc = new ReportSiteDoc(value);

      /* Updated checklist item */

      if (value.markedCheckList) {
        await CheckList.update(
          {
            _id: value.markedCheckList._id
          },
          {
            $set: {
              checklistItems: value.markedCheckList.checklistItems
            }
          }
        );
      }

      let docReport = await reportSiteDoc.save();

      await Report.update(
        {
          _id: req.params.id
        },
        {
          $push: {
            siteDocs: docReport._id
          }
        }
      );
      return res.status(200).json({
        message: "ReportSiteDoc added to report successfully",
        data: docReport
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getReportsById: async (req, res) => {
    try {
      let id = req.params.id;
      let reportData = await Report.findById(id)
        .populate([
          {
            path: "projectId",
            select: "projectName"
          },
          {
            path: "drawings"
          },
          {
            path: "admin",
            select: "firstName email displayName"
          },
          {
            path: "subContractors",
            select: "name"
          },
          {
            path: "comments.images",
            select: "secure_url"
          },
          {
            path: "controlPlans"
          },
          {
            path: "registrations",
            populate: {
              path: "drawingData.originalImage"
            }
          },
          {
            path: "siteDocs",
            populate: {
              path: "documents",
              select: "originalname"
            }
          },
          {
            path: "checkList"
          }
        ])
        .lean();

      reportData.entities = [...reportData.registrations, ...reportData.siteDocs];

      delete reportData.registrations;
      delete reportData.siteDocs;
      reportData.entities = reportData.entities.sort(__.sortByDate);
      console.log("reportData.entities: ", reportData.entities);
      return res.status(200).json({
        message: "Listed one report...",
        data: reportData
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getAllReports: async (req, res) => {
    try {
      if (!req.query.projectId) {
        return res.status(400).json({
          message: "ProjectId is missing"
        });
      }
      let chunk = null,
        page = null;
      if (req.query.chunk && req.query.page) {
        chunk = parseInt(req.query.chunk);
        page = parseInt(req.query.page);
      }
      let search = "";
      let regex = null;

      if (req.query.search) {
        regex = new RegExp(req.query.search, "gi");
      } else {
        regex = new RegExp();
      }
      let s = (page - 1) * chunk;

      /* Sort handling */
      let sortObj = {};
      if (req.query.sort && req.query.sortType) {
        sortObj[req.query.sort] = req.query.sortType === "true" ? 1 : -1;
      } else {
        sortObj = null;
      }

      let reportCount = await Report.count({
        $or: [
          {
            title: regex
          },
          {
            systemTag: regex
          }
        ],
        projectId: req.query.projectId
      });

      let reportList = await Report.find({
        $or: [
          {
            title: regex
          },
          {
            systemTag: regex
          }
        ],
        projectId: req.query.projectId
      })
        .populate([
          {
            path: "projectId",
            select: "projectName"
          },
          {
            path: "drawings"
          },
          {
            path: "admin",
            select: "firstName email displayName"
          },
          {
            path: "subContractors",
            select: "name"
          },
          {
            path: "controlPlans"
          },
          {
            path: "checkList"
          },
          {
            path: "comments.images",
            select: "secure_url"
          }
        ])
        .skip(s)
        .limit(chunk)
        .sort(sortObj)
        .lean();
      console.log("reportCount", reportCount);
      return res.status(200).json({
        message: "Listed all reports ...",
        total: reportCount,
        data: reportList
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateReportsById: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          message: "Report ID is missing"
        });
      }
      const commentSchema = Joi.object({
        comment: Joi.string(),
        userName: Joi.string(),
        pic: Joi.string(),
        addTime: Joi.date()
      });

      const schema = Joi.object()
        .keys({
          title: Joi.string().required(),
          description: Joi.string(),
          systemTag: Joi.string(),
          reportType: Joi.string()
            .valid(["Safety", "Quality", "Issue", "Other"])
            .required(),
          deadline: Joi.date(), //.format('YYYY-MM-DD')
          registrationInterval: Joi.number(), //.min(1).max(9).required()
          aboutCompany: Joi.string(),
          clientLogo: Joi.string(),
          subContractorLogo: Joi.string(),
          statusList: Joi.string().valid(["InProcess", "Completed"])
          // comments: Joi.array().items(commentSchema)
        })
        .unknown(true);

      let { error, value } = Joi.validate(req.body, schema);

      if (error) return __.inputValidationError(error, res);

      await Report.findByIdAndUpdate(req.params.id, value);

      return res.status(200).json({
        message: "Reports Updated successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  deleteReportsById: async (req, res) => {
    try {
      let id = req.params.id;
      if (id) {
        let reports = await Report.findByIdAndRemove(id);
        console.log("deleteReportById >>>>", reports);
        return res.status(200).json({
          message: "Reports Deleted ...",
          data: reports
        });
      } else return res.status(500).json(err);
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateReportComment: async (req, res) => {
    try {
      let Id = req.params.id;
      let userName = req.user.firstName + " " + req.user.lastName;
      let userPic = req.user.profilePic;

      let commentObj = {
        comment: req.body.comment,
        userName: userName,
        pic: userPic
      };

      if (req.files) {
        let files = req.files;
        files.forEach((element, i) => {
          element.companyId = req.user.companyId;
        });

        let commentAssets = await Asset.insertMany(files);
        commentObj.images = commentAssets.map(x => x._id);
      }

      let addComment = await Report.findOne({
        _id: Id
      });

      if (addComment) {
        if (req.body.comment) {
          addComment.comments = addComment.comments.concat([commentObj]);
        }
        addComment.save();
        return res.status(200).json({
          message: "Comment added successfully..",
          data: addComment
        });
      } else {
        return res.status(500).json({
          message: "Report not found."
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateReportEntityComment: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          message: "Entity ID is missing"
        });
      }
      let userName = req.user.firstName + " " + req.user.lastName;
      let userPic = req.user.profilePic;

      let commentObj = {
        comment: req.body.comment,
        userName: userName,
        pic: userPic
      };

      if (req.files) {
        let files = req.files;
        files.forEach((element, i) => {
          element.companyId = req.user.companyId;
        });

        let commentAssets = await Asset.insertMany(files);
        commentObj.images = commentAssets.map(x => x._id);
      }

      const target =
        req.body.type === "registration"
          ? ReportRegistration.findOneAndUpdate(
              {
                _id: req.params.id
              },
              {
                $push: {
                  comments: commentObj
                }
              }
            )
              .populate({
                path: "comments.images",
                select: "secure_url"
              })
              .lean()
          : ReportSiteDoc.findOneAndUpdate(
              {
                _id: req.params.id
              },
              {
                $push: {
                  comments: commentObj
                }
              }
            )
              .populate({
                path: "comments.images",
                select: "secure_url"
              })
              .lean();

      let { comments } = await target;

      return res.status(200).json({
        message: "Comments added successfully",
        comments
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  exportReportData: async (req, res) => {
    try {
      if (!req.params.reportId) {
        return res.status(400).json({
          message: "Report ID is missing"
        });
      }
      const schema = Joi.object()
        .keys({
          registrations: Joi.array().items(Joi.string()),
          siteDocs: Joi.array().items(Joi.string())
        })
        .unknown(true);
      let { error, value } = Joi.validate(req.body, schema);
      if (error) return __.inputValidationError(error, res);

      let reportData = await Report.findOne({
        _id: req.params.reportId
      })
        .populate([
          {
            path: "controlPlans"
          },
          {
            path: "checkList"
          },
          {
            path: "subContractors",
            select: "name"
          },
          {
            path: "client"
          },
          {
            path: "siteDocs",
            populate: [
              {
                path: "comments.images",
                select: "secure_url comment"
              },
              {
                path: "documents",
                select: "secure_url"
              }
            ]
          },
          {
            path: "registrations",
            populate: [
              {
                path: "comments.images",
                select: "secure_url comment"
              },
              {
                path: "drawingData.originalImage"
              }
            ]
          },
          {
            path: "drawings"
          },
          {
            path: "comments.images",
            select: "secure_url"
          },
          {
            path: "projectId",
            populate: [
              {
                path: "companyId",
                select: "companyLogo companyName"
              },
              {
                path: "client"
              }
            ]
          }
        ])
        .lean();

      console.log("reportResponse>>>>>>>>>>", reportData);

      /* Filter out unselected registrations and site docs */

      reportData.registrations = reportData.registrations.filter(x => {
        if (value.registrations.indexOf(x._id.toString()) > -1) {
          return true;
        }
        return false;
      });

      reportData.siteDocs = reportData.siteDocs.filter(x => {
        if (value.siteDocs.indexOf(x._id.toString()) > -1) {
          return true;
        }
        return false;
      });
      /* Build export Obj */

      /* About */
      value["companyLogo"] =
        reportData.projectId && reportData.projectId.companyId
          ? reportData.projectId.companyId.companyLogo
          : "";
      value["clientLogo"] = reportData.clientLogo;
      value["companyName"] =
        reportData.projectId && reportData.projectId.companyId
          ? reportData.projectId.companyId.companyName
          : "";
      value["subContractor"] = reportData.subContractors
        ? reportData.subContractors.length
          ? reportData.subContractors[0].name
          : ""
        : "";
      value["authorName"] = req.user.displayName || req.user.firstName;
      value["invoiceTag"] = reportData.systemTag;
      value["projectName"] = reportData.projectId.projectName;
      value["aboutCompany"] = reportData.aboutCompany;
      value["clientName"] = reportData.client ? reportData.client.clientName : "";
      value["email"] = reportData.client ? reportData.client.email : "";
      value["clientWebsite"] = reportData.client ? reportData.client.clientWebsite : "";
      value["clientContact"] = reportData.client
        ? reportData.client.clientContact
          ? `${reportData.client.clientContact.dialCode}-${
              reportData.client.clientContact.phoneNumber
            }`
          : ""
        : "";

      value["checkList"] = reportData.checkList;

      let lAryRegistrationsData = [];
      let lArySiteDocs = [];

      /* Registrations */
      reportData.registrations.map(x => {
        let lAryImageUrl = _.map(x.drawingData, "originalImage");
        lAryImageUrl = _.flatten(lAryImageUrl);
        lAryRegistrationsData.push({
          projectSerial: x.systemTag,
          registrationType: x.registrationType,
          drawingData: _.compact(lAryImageUrl),
          projectName: reportData.projectId.projectName,
          startDate: moment(reportData.projectId.startDate).format("MMM Do YYYY"),
          comments: x.comments
        });
      });
      value["registrations"] = lAryRegistrationsData;

      /* Site Docs */
      reportData.siteDocs.map(x => {
        lArySiteDocs.push({
          projectName: reportData.projectId.projectName,
          systemTag: x.systemTag,
          group: x.group,
          comments: x.comments,
          approvalStatus: x.approvalStatus === "Approved" ? true : false,
          documents: x.documents
            ? /* Converting doc pages to PDF for rendering  */
              _.flatten(x.documents.map(y => __.pdfToImg(y.secure_url, y.pages)))
            : [],
          startDate: moment(reportData.projectId.startDate).format("MMM Do YYYY")
        });
      });
      value["siteDocs"] = lArySiteDocs;
      console.log("siteDocsss", lArySiteDocs);
      /* Control plans */
      let lAryControlPlans = reportData.controlPlans.map(x => {
        return {
          systemTag: x.systemTag,
          plan: x.plan
        };
      });
      value["controlPlans"] = _.flatten(lAryControlPlans);

      /* Generate report */
      let reportResponse = await reportsController.generateReportPdf(value);

      await Report.update(
        {
          _id: req.params.reportId
        },
        {
          $push: {
            exportHistory: {
              doc: reportResponse[1].Location
            }
          }
        }
      );

      return res.status(200).json({
        link: reportResponse[1].Location,
        message: "Report generated successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  generateReportPdf: data => {
    return new Promise((resolve, reject) => {
      jsr
        .render({
          template: {
            //TODO: add report ID,
            shortid: "HJqVOlkX4",
            recipe: "chrome-pdf",
            engine: "handlebars"
          },
          data: data
        })
        /* Upload stream to s3 */
        .then(pdf => {
          return Promise.all([
            pdf,
            s3
              .upload({
                Bucket: "3dfilesdata",
                Key: `reports/${data.invoiceTag}_${Date.now()}.pdf`,
                Body: pdf
              })
              .promise()
          ]);
        })
        .then(resp => {
          resolve(resp);
        })
        .catch(e => {
          console.log("failed");
          reject(e);
        });
    });
  },

  addReportControlPlan: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        controlPlanId: Joi.string(),
        reportId: Joi.string()
      });

      let { error, value } = Joi.validate(req.body, schema);

      if (error) return __.inputValidationError(error, res);

      await Report.update(
        {
          _id: value.reportId
        },
        {
          $push: {
            controlPlans: value.controlPlanId
          }
        }
      );

      res.status(200).json({
        message: "Report ControlPlan data added"
      });
    } catch (e) {
      res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateReportRegistration: async (req, res) => {
    try {
      if (!req.params.regId) {
        return res.status(400).json({
          message: "Registration ID is missing"
        });
      }
      console.log("body: ",req.body);
      const schema = Joi.object()
        .keys({
          registrationType: Joi.string()
            .valid(["QA-Registration", "Safety", "Issue", "Other"])
            .required(),
          //drawingData: Joi.array(),
          approvalStatus: Joi.string().valid(["Approved", "Declined"]),
          controlPlanItems: Joi.array().items(Joi.string())
          //markedCheckList: Joi.array().items(Joi.string())
        })
        .unknown(true);
      let { error, value } = Joi.validate(req.body, schema);

      if (error) return __.inputValidationError(error, res);

      await ReportRegistration.findByIdAndUpdate(req.params.regId, value);

      /* Update checklist items */

      if (value.markedCheckList) {
        await CheckList.update(
          {
            _id: value.markedCheckList._id
          },
          {
            $set: {
              checklistItems: value.markedCheckList.checklistItems
            }
          }
        );
      }

      return res.status(200).json({
        message: "Updated registration data successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateReportSiteDoc: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          message: "SiteDoc ID is missing"
        });
      }

      const schema = Joi.object()
        .keys({
          approvalStatus: Joi.string().valid(["Approved", "Declined"]),
          controlPlanItems: Joi.array().items(Joi.string())
        })
        .unknown(true);
      let { error, value } = Joi.validate(req.body, schema);

      if (error) return __.inputValidationError(error, res);
      console.log("value>>>>>>>>>>>>", value);

      await ReportSiteDoc.findByIdAndUpdate(req.params.id, value);

      /* Update checklist items */

      if (value.markedCheckList) {
        await CheckList.update(
          {
            _id: value.markedCheckList._id
          },
          {
            $set: {
              checklistItems: value.markedCheckList.checklistItems
            }
          }
        );
      }

      return res.status(200).json({
        message: "Updated SiteDoc data successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getReportsByIdMobile: async (req, res) => {
    try {
      let id = req.params.id;
      let reportData = await Report.findById(id)
        .populate([
          { path: "projectId", select: "projectName" },
          { path: "drawings" },
          { path: "admin", select: "firstName email displayName" },
          { path: "subContractors", select: "name" },
          { path: "comments.images", select: "secure_url" },
          { path: "controlPlans" },
          {
            path: "registrations",
            populate: [
              { path: "drawingData.originalImage" },
              { path: "comments.images", select: "_id secure_url" }
            ]
          },
          {
            path: "siteDocs",
            populate: [
              {
                path: "documents",
                select: "originalname"
              },
              {
                path: "comments.images",
                select: "_id secure_url"
              }
            ]
          },
          { path: "checkList" }
        ])
        .lean();

      reportData.entities = [...reportData.registrations, ...reportData.siteDocs];
      delete reportData.registrations;
      delete reportData.siteDocs;
      reportData.entities = reportData.entities.sort(__.sortByDate);
      return res.status(200).json({
        message: "Listed one report...",
        data: reportData
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateReportMobileRegistration:async(req,res)=>{
    try {
      if (!req.params.regId) {
        return res.status(400).json({
          message: "Registration ID is missing"
        });
      }
      let regObj = req.body;
      let updatedIssue = await ReportRegistration.findOneAndUpdate(
        {
          _id: req.params.regId
        },
        {
          $set: regObj
        },
        {
          new: true
        }
      );
      console.log("REGISTRATION REQUEST IS: ",regObj);
        console.log("REGISTRATION: ",updatedIssue);
      if (req.body.markedCheckList) {
        await CheckList.update(
          {
            _id: req.body.markedCheckList._id
          },
          {
            $set: {
              checklistItems: req.body.markedCheckList.checklistItems
            }
          }
        );
      }

      return res.status(200).json({
        message: "Updated SiteDoc data successfully"
      });
    }catch(e){
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

 

};

module.exports = reportsController;
