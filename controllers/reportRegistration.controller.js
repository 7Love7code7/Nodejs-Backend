const ReportRegistration = require("../models/reportRegistration.model.js");
const EntityTag = require("../models/entityTag.model");
const Asset = require("../models/asset.model");
const Joi = require("joi");
const _ = require("lodash");

module.exports = {
  createRegistration: async (req, res) => {
    try {
      let registration = req.body;
      let registrationTag = await EntityTag.findOne({ prefix: "RGST" });
      registrationTag.count++;
      let saveRegistrationTag = await registrationTag.save();
      saveRegistrationTag = saveRegistrationTag.toObject();

      registration.systemTag = `${saveRegistrationTag.prefix}${
        saveRegistrationTag.count
      }`;
      let registrationList = await ReportRegistration(registration).save();
      return res.status(200).json({
        message: "Registration added ..",
        list: registrationList
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
        error: e
      });
    }
  },

  getAllRegistration: async (req, res) => {
    try {
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

      let registrationCount = await ReportRegistration.count({
        systemTag: regex
      });

      let registrationList = await ReportRegistration.find({
        $or: [
          {
            systemTag: regex
          }
        ]
      })
        .skip(s)
        .limit(chunk)
        .sort(sortObj)
        .lean();

      return res.status(200).json({
        message: "All Registration list ..",
        total: registrationCount,
        list: registrationList
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
        error: e
      });
    }
  },

  getRegistrationById: async (req, res) => {
    try {
      let id = req.params.id;
      let registrationList = await ReportRegistration.findById(id).exec();
      return res.status(200).json({
        message: "Registration list...",
        list: registrationList
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
        error: e
      });
    }
  },

  addReportRegistrationComment: async (req, res) => {
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

      let addComment = await ReportRegistration.findOne({
        _id: Id
      });

      if (addComment) {
       
        if (req.body.comment) {
         
          addComment.comments = addComment.comments.concat([commentObj]);
         
        }
        var newComment = await addComment.save();
      
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

  

};
