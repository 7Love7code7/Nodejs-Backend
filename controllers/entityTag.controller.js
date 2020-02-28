const EntityTag = require("../models/entityTag.model");
const _ = require("lodash");

module.exports = {
  getComboSystemTag: async (req, res) => {
    try {
      let existingEntityTag = await EntityTag.findOne({
        prefix: "COMBOMAT"
      });
      let currentEntityTag;
      if (!existingEntityTag) {
        /* first time check */
        let newTag = new EntityTag({
          prefix: "COMBOMAT",
          count: 1000
        });
        currentEntityTag = await newTag.save();
      } else {
        currentEntityTag = existingEntityTag;
      }
      currentEntityTag.count++;
      let updatedEntityTag = await currentEntityTag.save();
      updatedEntityTag = updatedEntityTag.toObject();

      let comboSystemTag = `${updatedEntityTag.prefix}${updatedEntityTag.count}`;

      return res.status(200).json({
        comboTag: comboSystemTag
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },
  getAllSystemTags: async (req, res) => {
    try {
      //   let systemTags = await EntityTag.aggregate([
      //     {
      //       $convert: { input: "$count", to: "string" }
      //     },
      //     {
      //       $project: {
      //         name: 1,
      //         currentTag: {
      //           $concat: ["$prefix", "$countString"]
      //         }
      //       }
      //     }
      //   ]);

      let systemTags = (await EntityTag.find({}).lean()).map(x => {
        x.currentTag = `${x.prefix}${x.count}`;
        return x;
      });
      return res.status(200).json({
        message: "Systems tags obtained successfully",
        data: systemTags
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  generateTag: prefix => {
    return new Promise((resolve, reject) => {
      EntityTag.findOne({ prefix: prefix })
        .then(data => {
          if (!data) throw new Error("Invalid System tag Prefix");
          data.count++;
          return data.save();
        })
        .then(tag => {
          tag = tag.toObject();
          resolve(`${tag.prefix}${tag.count}`);
        })
        .catch(e => {
          reject(e);
        });
    });
  }
};
