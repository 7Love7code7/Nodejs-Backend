const Checklist = require("../models/checkList.model");
const entityTagController = require("../controllers/entityTag.controller");
const __ = require("../helper/globals");
const Joi = require("joi");

let checklistController = {
  createChecklist: async (req, res) => {
    try {
      let data = await checklistController.newCheckList(
        req.body,
        req.user.companyId,
        res
      );
      if (!data) {
        throw "Error creating new checklist";
      }
      return res.status(200).json({
        message: "Checklist added ...",
        data: data
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  newCheckList: async (checklistObj, companyId, res) => {
    try {
      const objectSchema = Joi.object({
        titleList: Joi.string().required(),
        descriptionList: Joi.string(),
        statusList: Joi.string().valid(["Yes", "No", "N/A"]),
        remarksList: Joi.string()
      });

      const schema = Joi.object().keys({
        title: Joi.string().required(),
        description: Joi.string().required(),
        checkListItem: Joi.array()
          .items(objectSchema)
          .required()
      });

      let { error, value } = Joi.validate(checklistObj, schema);

      if (error) return __.inputValidationError(error, res);

      value.companyId = companyId;
      value.systemTag = await entityTagController.generateTag("CLIST");

      let list = await Checklist(value).save();
      return list.toObject();
    } catch (e) {
      console.log(e);
      return;
    }
  },

  getChecklistById: async (req, res) => {
    try {
      let list = await Checklist.findById(req.params.id).exec();
      console.log("getChecklistById >>>", list);
      return res.json({
        message: "Fetching single data ...",
        data: list
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getAllChecklist: async (req, res) => {
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

      let checkListCount = await Checklist.count({
        $or: [{ title: regex }],
        companyId: req.user.companyId
      });

      let checkList = await Checklist.find({
        $or: [{ title: regex }]
      })
        .where({
          companyId: req.user.companyId
        })
        .skip(s)
        .limit(chunk)
        .sort(sortObj)
        .lean();

      console.log("checkListCount", checkListCount);
      return res.status(200).json({
        total: checkListCount,
        list: checkList
      });
    } catch (e) {
      console.log("error >>", e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateChecklistById: async (req, res) => {
    try {
      const objectSchema = Joi.object({
        titleList: Joi.string().required(),
        descriptionList: Joi.string(),
        statusList: Joi.string().valid(["Yes", "No", "N/A"]),
        remarksList: Joi.string()
      });

      const schema = Joi.object()
        .keys({
          title: Joi.string().required(),
          description: Joi.string().required(),
          checkListItem: Joi.array()
            .items(objectSchema)
            .required()
        })
        .unknown(true);
      let { error, value } = Joi.validate(req.body, schema);
      // if (error) return __.inputValidationError(error, res);

      await Checklist.findByIdAndUpdate(req.params.id, value);

      return res.status(200).json({
        message: "Checklist Updated successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  deleteChecklistById: async (req, res) => {
    try {
      if (req.params.id) {
        await Checklist.findByIdAndRemove(req.params.id);
        return res.status(200).json({
          message: "Checklist data Deleted..."
        });
      } else return res.status(500).json(err);
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  }
};

module.exports = checklistController;
