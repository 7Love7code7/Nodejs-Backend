const Group = require("../models/employeeGroups.model");
const entityTagController = require("./entityTag.controller");
const User = require("../models/user.model");
const EntityTag = require('../models/entityTag.model');
const Asset = require("../models/asset.model");
const Company = require("../models/company.model");
const __ = require("../helper/globals");


module.exports = {
  saveGroup: async (req, res) => {

    try {
      let group = req.body;

      group.companyId = req.user.companyId;


      let existingEntityTag = await EntityTag.findOne({
        prefix: 'EGRP'
      });

      let currentEntityTag;
      if (!existingEntityTag) {
        /* first time check */
        let newTag = new EntityTag({
          prefix: 'EGRP',
          count: 7000
        });
        currentEntityTag = await newTag.save();
      } else {
        currentEntityTag = existingEntityTag;
      }
      currentEntityTag.count++;
      let updatedEntityTag = await currentEntityTag.save();
      updatedEntityTag = updatedEntityTag.toObject();

      group.systemTag = `${updatedEntityTag.prefix}${updatedEntityTag.count}`;

      let newgroup = new Group(group);
      console.log("newgroup: ", newgroup);
      let newGroup = await newgroup.save();
      if (!newGroup) {
        // return res.status(400).json({
        //     message: "Coudn't save Employee Group",
        //     data: newGroup
        //   });
        console.log("not saved");
      }
      return res.status(200).json({
        message: "Employee group created successfully",
        data: newGroup
      });

    } catch (e) {
      return res.status(500).json({
        message: "Something went wrong",
        data: e
      });
    }
  },


  getAllEmplGroups: async (req, res) => {
    console.log("req.query.search");
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
      console.log("sort", req.query.sort);
      console.log("sort type", req.query.sortType);
      sortObj[req.query.sort] = req.query.sortType === "true" ? 1 : -1;
    } else {
      sortObj = null;
    }

    try {
      console.log("check in req.query=={} in try", req.user.companyId);
      let groupCount = await Group.count({
        name: regex,
        companyId: req.user.companyId
      });
      let groupList = await Group.find({
          $or: [{
              name: regex
            },
            {
              systemTag: regex
            }
          ]
        })
        .populate("workerslist")
        .populate("teamleader")
        .where({
          companyId: req.user.companyId
        })
        .skip(s)
        .limit(chunk)

        .sort('-created')
        .lean();

      /* Get company's default currency */

      return res.json({
        total: groupCount,
        list: groupList
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },
  getgroupById: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          message: "Group ID is missing"
        });
      }
      let groupList = await Group.findOne({
          _id: req.params.id
        })
        .populate("workerslist")
        .populate("teamleader")
        .where({
          companyId: req.user.companyId
        }).lean()

      return res.json({
        message: 'Fetched Details',
        list: groupList
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  }
};