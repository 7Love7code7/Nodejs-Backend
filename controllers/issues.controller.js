const request = require("request");
const Issue = require("../models/issues.model");
const EntityTag = require("../models/entityTag.model");
const Project = require("../models/project.model");
const __ = require("../helper/globals");
const Asset = require("../models/asset.model");
const user = require("../models/user.model");
const mongoose = require("mongoose");
const mime = require("mime-types");
const _ = require("lodash");
moment = require("moment");

module.exports = {
  newIssueTest: async (req, res) => {
    console.log("BODY: ", req.body);
    console("FILES entered", req.files);
  },

  createIssue: async (req, res) => {
    console.log("issue: ", req.body);
    console.log("issue: ", req.files);
    try {
      let issue = new Issue();
      issue.companyId = req.user.companyId;
      issue.userId = req.user._id;
      issue.createdBy = req.user.firstName + " " + req.user.lastName;
      let Activity = {
        userName: req.user.firstName + " " + req.user.lastName,
        pic: req.user.profilePic,
        activity: "created_issue"
      };

      let existingEntityTag = await EntityTag.findOne({
        prefix: "ISSUE"
      });

      let currentEntityTag;
      if (!existingEntityTag) {
        /* first time check */
        let newTag = new EntityTag({
          prefix: "ISSUE",
          count: 2000
        });
        currentEntityTag = await newTag.save();
      } else {
        currentEntityTag = existingEntityTag;
      }
      currentEntityTag.count++;
      let updatedEntityTag = await currentEntityTag.save();
      updatedEntityTag = updatedEntityTag.toObject();

      issue.systemTag = `${updatedEntityTag.prefix}${updatedEntityTag.count}`;
      let project = await Project.findOne({
        _id: req.body.project
      });
      issue.projectId = req.body.projectId;
      issue.title = req.body.title;
      issue.description = req.body.description;
      issue.issueCategory = req.body.issueCategory;
      issue.ownerId = req.body.ownerId;
      issue.issueStatus = req.body.issueStatus;
      issue.dependencyOn = req.body.dependencyOn;

      if (req.body.assignedTo) {
        issue.assignedTo = req.body.assignedTo;
      }
      if (req.body.deadLine) {
        issue.deadLine = req.body.deadLine._d;
      }

      issue.issueActivity.push(Activity);
      let imageResponse = [];
      if (req.files && req.files.length > 0) {
        let files = req.files;
        files = files.map((element, i) => {
          element.providerData = {
            _id: req.user["_id"],
            email: req.user["email"],
            name: req.user["firstName"] + " " + req.user["lastName"]
          };
          element.assetName = element.originalname;
          element.companyId = req.user.companyId;
          /* To attach element with props such as title and description */
          // element = { ...element, ...req.body.assetObj[i] };

          /* Split pdf and save as separate asset objects */

          // if (element.format === "pdf") {
          //   element = [...Array(element.pages)].reduce((acc, x, i) => {
          //     let imageObj = { ...element };
          //     imageObj.format = "jpg";
          //     imageObj.mimetype = "image/jpeg";
          //     imageObj.secure_url = imageObj.secure_url
          //       .replace(/upload/, `upload/pg_${i + 1}`)
          //       .replace(/pdf$/, "jpg");
          //     acc.push(imageObj);
          //     return acc;
          //   }, []);
          // }

          return element;
        });

        files = _.flatten(files);

        let isssueAssets = await Asset.insertMany(files);

        issue.listAssets = isssueAssets.reduce(
          (acc, x) => {
            /* Split docs and images */
            if (/png|jpg|jpeg|gif/.test(x.format)) {
              acc.images.push(x._id);
              /* Push image reponse to a separate array for marker editing purpose*/
              imageResponse.push(x);
            } else {
              acc.docs.push(x._id);
            }
            return acc;
          },
          { images: [], docs: [] }
        );

        /* Adding list assets to marking images while creation */
        issue.markedImages = issue.listAssets.images;
      }

      /* Save material  */
      let issueData = new Issue(issue);
      let createdIssue = await issueData.save();

      return res.status(200).json({
        message: "Issue created successfully",
        data: createdIssue,
        images: imageResponse
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  issueImage: async (req, res) => {
    console.log("FILES: ", req.files);
    console.log("body:  ", req.body);
    try {
      if (req.files && req.files.length > 0) {
        let files = req.files;
        files.forEach((element, i) => {
          req.body.files.forEach((fileObj, j) => {
            if (i == j) {
              console.log("same index of both found");
              element.companyId = req.user.companyId;
              element.assetDescription = fileObj.comment;
            } else {
              console.log("do nothing");
            }
          });
        });

        let issueAssets = await Asset.insertMany(files);

        // issue.listAssets = issueAssets.map(x => x._id);
        return res.status(200).json({
          message: "Small files were added successfully.",
          data: issueAssets
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  addDrawingAssetForIssue: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          message: "Issue ID missing"
        });
      }

      if (req.files && req.files.length > 0) {
        let files = req.files;
        files = files.map((element, i) => {
          /* Split pdf and save as separate asset objects */

          if (element.format === "pdf") {
            element = [...Array(element.pages)].reduce((acc, x, i) => {
              let imageObj = { ...element };
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

        let issueDrawings = await Asset.insertMany(files);

        await Issue.update(
          { _id: req.params.id },
          { $push: { drawings: { $each: issueDrawings.map(x => x._id) } } }
        );
        return res.status(200).json({
          messages: "Drawings added successfully",
          data: issueDrawings
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

  generateAssetUrlForIssue: async (req, res) => {
    if (req.files && req.files.length > 0) {
      let files = req.files;
      files = files.map((element, i) => {
        /* Split pdf and save as separate asset objects */

        if (element.format === "pdf") {
          element = [...Array(element.pages)].reduce((acc, x, i) => {
            let imageObj = { ...element };
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

      let issueDrawings = await Asset.insertMany(files);
      return res.status(200).json({
        messages: "Drawings added successfully",
        data: issueDrawings
      });
    } else {
      return res.status(400).json({
        messages: "Input files are empty"
      });
    }
  },

  updateAssetIds: async (req, res) => {
    try {
      let obj = req.body;
      let Id = obj.id;
      let updateAsset = issue.findById({ _id: Id }, function(err, object) {
        if (err) {
          return res.status(500).json({
            message: "requested issue object not found"
          });
        } else {
          object.listAssets = obj.assetIds;
          issue.save(object);
          return res.status(500).json({
            message: "Asset ids updated"
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

  listAllissues: async (req, res) => {
    /* Pagination */
    let chunk = null,
      page = null;
    if (req.query.chunk && req.query.page) {
      chunk = parseInt(req.query.chunk);
      page = parseInt(req.query.page);
    }
    let s = (page - 1) * chunk;
    /* Sort handling */
    let sortObj = {};
    if (req.query.sort && req.query.sortType) {
      sortObj[req.query.sort] = req.query.sortType === "true" ? 1 : -1;
    } else {
      sortObj = null;
    }
    /* Query */
    let search = "";
    let regex = null;

    if (req.query.search) {
      regex = new RegExp(req.query.search, "gi");
    } else {
      regex = new RegExp();
    }

    let queryObj = {
      $or: [
        {
          title: regex
        },
        {
          systemTag: regex
        }
      ],
      companyId: req.user.companyId
    };

    if (req.query.project) {
      queryObj.projectId = req.query.project;
    }

    try {
      let issueCount = await Issue.count(queryObj);

      let issuesList = await Issue.find(queryObj)
        .skip(s)
        .limit(chunk)
        .sort(sortObj)
        .populate([{ path: "listAssets.images" }, { path: "listAssets.docs" }])
        .populate("projectId")
        .populate("assignedTo")
        .populate("ownerId")
        .populate("userId")
        .populate("dependencyOn")
        .populate({
          path: "markedImages",
          select: "assetName secure_url"
        })
        .lean();

      return res.json({
        total: issueCount,
        list: issuesList
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  listIssuesFromFilter: async (req, res) => {
    console.log("req.query.search", req.query);
    let chunk = null,
      page = null;
    if (req.query.chunk && req.query.page) {
      chunk = parseInt(req.query.chunk);
      page = parseInt(req.query.page);
    }

    let minDate = new Date(-8640000000000000);
    let maxDate = new Date(8640000000000000);

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
    let s = (page - 1) * chunk;

    try {
      console.log("req.query!=undefined");
      let issuesList = await Issue.find({
        // 'name': regex
      })
        .populate("listAssets")
        .where({
          companyId: req.user.companyId
        })
        .where({
          projectId: req.query.search
        })
        .populate("projectId")
        .populate("ownerId")
        .populate("userId")
        .skip(s)
        .limit(chunk)
        .lean();

      /* Get company's default currency */
      console.log("issuelist", issuesList);
      return res.json({
        total: issuesList.length,
        list: issuesList
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateIssue: async (req, res) => {
    let id = req.params.id;
    let issue = req.body;

    // issue.title = req.body.Title;
    // issue.discription = req.body.description;
    // issue.issueStatus = req.body.issueStatus;

    //issue.deadLine = new Date(req.body.deadLine);
    console.log("removedFiles", req.body.removedFiles);
    if (!id) {
      return res.status(400).json({
        message: " requested Issue ID is missing"
      });
    }

    try {
      let updatedIssue = await Issue.findOneAndUpdate(
        {
          _id: id
        },
        {
          $set: issue
        },
        {
          new: true
        }
      );

      /* Push files if added */

      if (req.files && req.files.length > 0) {
        let files = req.files;
        files.forEach((element, i) => {
          req.files.forEach((fileObj, j) => {
            if (i == j) {
              element.companyId = req.user.companyId;
              element.assetDescription = fileObj.comment;
            } else {
            }
          });
        });

        let issueAssets = await Asset.insertMany(files);

        issueAssets.listAssets = issueAssets.reduce(
          (acc, x) => {
            /* Split docs and images */
            if (/png|jpg|jpeg|gif/.test(x.format)) {
              acc.images.push(x._id);
            } else {
              acc.docs.push(x._id);
            }
            return acc;
          },
          { images: [], docs: [] }
        );

        updatedIssue.listAssets = {
          images: [...updatedIssue.listAssets.images, ...issueAssets.listAssets.images],
          docs: [...updatedIssue.listAssets.docs, ...issueAssets.listAssets.docs]
        };
      }

      if (req.body.removedFiles && req.body.removedFiles.length > 0) {
        updatedIssue.listAssets.images = updatedIssue.listAssets.images.filter(x => {
          if (req.body.removedFiles.indexOf(x.toString()) > -1) {
            return false;
          }
          return true;
        });
        updatedIssue.listAssets.docs = updatedIssue.listAssets.docs.filter(x => {
          if (req.body.removedFiles.indexOf(x.toString()) > -1) {
            return false;
          }
          return true;
        });
      }

      /* Save all changes */
      await updatedIssue.save();

      return res.status(200).json({
        message: "issuedetails updated successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getIssueById: async (req, res) => {
    let id = req.params.id;
    console.log(id);
    if (id) {
      Issue.findById(id)
        .populate([
          { path: "listAssets.images" },
          { path: "listAssets.docs" },
          { path: "projectId" },
          { path: "assignedTo" },
          { path: "ownerId" },
          { path: "markedImages" },
          { path: "comments.files.images", select: "secure_url" },
          { path: "comments.files.docs", select: "secure_url" }
        ])
        .exec((err, issuedata) => {
          if (issuedata) {
            return res.json(issuedata);
          } else {
            return res.status(500).json({
              err: 500,
              message: "error fetching list"
            });
          }
        });
    } else {
      return res.status(401).json({
        errorTag: 101,
        message: "parametre error"
      });
    }
  },

  getAllIssues: async (req, res) => {
    let companyId = req.user.companyId;
    try {
      let allissuesList = await Issue.find({
        // 'name': regex
      })
        .where({
          companyId: req.user.companyId
        })
        .lean();
      return res.json({
        total: allissuesList.length,
        list: allissuesList
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  listAllAdminUsers: async (req, res) => {
    let companyId = req.user.companyId;
    try {
      console.log("check in req.query=={} in try");

      let adminList = await user
        .find({
          // 'name': regex
        })
        .where({
          designation: { $in: ["admin", "manager"] },
          companyId: req.user.companyId
        })
        .lean();

      console.log("ADMINlist", adminList.length);
      return res.json({
        total: adminList.length,
        list: adminList
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateComment: async (req, res) => {
    try {
      let Id = req.params.id;
      let userName = req.user.firstName + " " + req.user.lastName;
      let userPic = req.user.profilePic;

      let Activity = {
        userName: userName,
        pic: userPic,
        activity: "added_comment"
      };

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
        // commentObj.images = commentAssets.map(x => x._id);
        commentObj.files = commentAssets.reduce(
          (acc, x) => {
            /* Split docs and images */
            if (/png|jpg|jpeg|gif/.test(x.format)) {
              acc.images.push(x._id);
            } else {
              acc.docs.push(x._id);
            }
            return acc;
          },
          { images: [], docs: [] }
        );
      }

      let addComment = await Issue.findOne({ _id: Id });

      if (addComment) {
        if (req.body.comment) {
          addComment.comments = addComment.comments.concat([commentObj]);
        }
        addComment.issueActivity = addComment.issueActivity.concat([Activity]);
        addComment.save();
        console.log("addComment>>>>>>>>>>>????????", addComment);
        return res.status(200).json({
          message: "Comment added successfully..",
          data: addComment
        });
      } else {
        return res.status(500).json({
          message: "Issue not found."
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  markIssueAsComplete: async (req, res) => {
    console.log("complete status api", req.body);
    try {
      let Id = req.params.id;
      let userName = req.user.firstName + " " + req.user.lastName;
      let userPic = req.user.profilePic;

      let Activity = {
        userName: userName,
        pic: userPic,
        activity: "closed_issue"
      };

      let commentObj = {
        comment: req.body.comment,
        userName: userName,
        pic: userPic
      };

      let updateObject = await Issue.findById({ _id: Id });

      if (updateObject) {
        if (req.files) {
          let files = req.files;
          console.log("files: ", files);
          files.forEach((element, i) => {
            element.companyId = req.user.companyId;
          });

          let commentAssets = await Asset.insertMany(files);

          commentObj.files = commentAssets.reduce(
            (acc, x) => {
              /* Split docs and images */
              if (/png|jpg|jpeg|gif/.test(x.format)) {
                acc.images.push(x._id);
              } else {
                acc.docs.push(x._id);
              }
              return acc;
            },
            { images: [], docs: [] }
          );
        }

        if (req.body.comment) {
          updateObject.comments = updateObject.comments.concat([commentObj]);
        }
        updateObject.issueActivity = updateObject.issueActivity.concat([Activity]);

        updateObject.completionStatus = "RESOLVED";
        console.log("afterresolved", updateObject);
        updateObject.save();
        return res.status(200).json({
          message: "updated successfully..",
          data: updateObject
        });
      } else {
        return res.status(500).json({
          message: "Issue not found."
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  rejectIssue:async(req,res)=>{
    try {
      let Id = req.params.id;
      let userName = req.user.firstName + " " + req.user.lastName;
      let userPic = req.user.profilePic;

      let Activity = {
        userName: userName,
        pic: userPic,
        activity: "rejected_issue"
      };

      let updateObject = await Issue.findById({ _id: Id });

      if (updateObject) {
        
        updateObject.issueActivity = updateObject.issueActivity.concat([Activity]);

        updateObject.rejectIssue = true;

        console.log("afterresolved", updateObject);
        updateObject.save();
        return res.status(200).json({
          message: "updated successfully..",
          data: updateObject
        });
      } else {
        return res.status(500).json({
          message: "Issue not found."
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  reopenStatus: async (req, res) => {
    try {
      let Id = req.params.id;
      let userName = req.user.firstName + " " + req.user.lastName;
      let userPic = req.user.profilePic;

      let Activity = {
        userName: userName,
        pic: userPic,
        activity: "reopened_issue"
      };

      let addComment = Issue.findOne({ _id: Id }, function(err, object) {
        if (err) {
          return res.status(500).json({
            message: "requested issue object not found"
          });
        } else {
          object.completionStatus = "OPEN";
          object.issueActivity = object.issueActivity.concat([Activity]);

          object.save();
          return res.status(200).json({
            message: "updated successfully.."
            //data : object.comments
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

  saveLocalIssueAsset: async (req, res) => {
    try {
      if (req.files && req.files.length > 0) {
        let files = req.files;
        files.forEach(element => {
          element.companyId = req.user.companyId;
        });

        let issueAssets = await Asset.insertMany(files);

        let assetIds = issueAssets.map(x => x._id);
        /* Update marking data to issue */

        await Issue.update(
          { _id: req.body.issueId },
          { $push: { markedImages: { $each: assetIds } } }
        );

        return res.status(200).json({
          message: "files were added successfully.",
          data: issueAssets
        });
      }
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  MarkIssues: async (req, res) => {
    try {
      let requiredFields = ["fileData"];
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }

      let files = req.files;

      /* Store info about original assets in new marking data */

      files = files.map((x, i) => {
        x.companyId = req.user.companyId;
        x = Object.assign(x, req.body.fileData[i]);
        return x;
      });

      let issueAssets = await Asset.insertMany(files);

      /* Store info about marking in original image */

      for (let i = 0; i < req.body.fileData.length; i++) {
        await Asset.update(
          { _id: req.body.fileData[i].originalImage },
          {
            $set: {
              serializedData: req.body.fileData[i].serializedData
            }
          }
        );
      }

      let assetIds = issueAssets.map(x => x._id);
      /* Update marking data to issue */

      await Issue.update(
        { _id: req.body.issueId },
        { $push: { markedImages: { $each: assetIds } } }
      );

      return res.status(200).json({
        message: "Marked images added to issues successfully"
      });
    } catch (e) {
      console.log(JSON.stringify(e));
      return res.status(500).json({
        e,
        message: "Internal server error"
      });
    }
  },

  editIssueMarkings: async (req, res) => {
    let requiredFields = ["fileData"];
    if (!__.requiredFields(req, requiredFields)) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }

    try {
      let files = req.files.map(x => {
        x.companyId = req.user.companyId;
        return x;
      });
      /* Loop over file data and update asset object */
      for (let i = 0; i < req.body.fileData.length; i++) {
        let updateObj = Object.assign(req.body.fileData[i], files[i]);
        /* Update marking file with new URL */
        await Asset.update({ originalImage: req.body.fileData[i].assetId }, updateObj);
        /* Update original file with new serialized data */
        await Asset.update(
          { _id: req.body.fileData[i].assetId },
          { $set: { serializedData: req.body.fileData[i].serializedData } }
        );
      }
      return res.status(200).json({
        message: "Markings have been updated successfully"
      });
      /* find */
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  resetMarkings: async (req, res) => {
    try {
      let requiredFields = ["assetId"];
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }
      /* Reset markings */
      await Asset.update({ _id: req.body.assetId }, { $set: { serializedData: "" } });

      /* Remove previous marked Asset */

      await Asset.remove({ originalImage: req.body.assetId });

      return res.status(200).json({
        message: "Markings have been reset successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  }
};
