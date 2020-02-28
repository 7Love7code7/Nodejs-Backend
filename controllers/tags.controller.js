const Tag = require("../models/tags.model");
const __ = require("../helper/globals");
const Joi = require("joi");

let tagsController = {
  createTag: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        tagName: Joi.string().required()
      });

      let { error, value } = Joi.validate(req.body, schema);

      if (error) return __.inputValidationError(error, res);

      value.companyId = req.user.companyId;
      let newTag = new Tag(value);
      await newTag.save();
      let data = await tagsController._loadTags(req);
      return res.status(200).json({
        message: "System Tag created successfully",
        list: data.list,
        total: data.total
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  _loadTags: req => {
    return new Promise(async (resolve, reject) => {
      try {
        let tagList = await Tag.find({ companyId: req.user.companyId });
        resolve({
          total: tagList.length,
          list: tagList
        });
      } catch (e) {
        reject(e);
      }
    });
  },

  getAllTags: async (req, res) => {
    try {
      let data = await tagsController._loadTags(req);

      return res.status(200).json({
        message: "Tags loaded successfully",
        list: data.list,
        total: data.total
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  deleteTag: async (req, res) => {
    try {
      Tag.findByIdAndRemove(req.params.id, (err, todo) => {
        // As always, handle any potential errors:
        if (err) {
          return res.status(500).json({
            message: "Requested tag is not present"
          });
        }
        const response = {
          message: "Tag successfully deleted"
        };
        return res.status(200).send(response);
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  }
};

module.exports = tagsController;
