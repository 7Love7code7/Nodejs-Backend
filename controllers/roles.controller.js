const Company = require("../models/company.model");
const Role = require("../models/role.model");
const uuid = require("uuid/v4");
const _ = require("lodash");
const __ = require("../helper/globals");
const moment = require("moment");
const Joi = require("joi");

function rolesController() {
  /* To find and insert a role in a role tree */
  function peekAndPush(arr, parent, insert) {
    for (let item of arr) {
      if (item.nodeId === parent) {
        item.children.push({ nodeId: insert, children: [] });
        return;
      } else {
        peekAndPush(item.children, parent, insert);
      }
    }
  }

  function populateTree(tree, roles) {
    for (let branch of tree) {
      let matchingRole = roles[roles.findIndex(x => x.nodeId === branch.nodeId)];
      branch.roleName = matchingRole.roleName;
      branch._id = matchingRole._id;
      populateTree(branch.children, roles);
    }
  }

  const methods = {
    addRoles: async (req, res) => {
      try {
        const schema = Joi.object().keys({
          roleName: Joi.string().required(),
          parentNodeId: Joi.string()
        });
        let { error, value } = Joi.validate(req.body, schema);
        if (error) return __.inputValidationError(error, res);
        /* If no parent, the given task is added at the root */

        value.nodeId = uuid();
        let { roleTree } = await Company.findOne({ _id: req.user.companyId })
          .select("roleTree")
          .lean();
        /* The company might not have a role tree initially */
        roleTree = roleTree ? roleTree : [];

        if (value.parentNodeId) {
          peekAndPush(roleTree, value.parentNodeId, value.nodeId);
        } else {
          roleTree.push({ nodeId: value.nodeId, children: [] });
        }

        await Company.update({ _id: req.user.companyId }, { $set: { roleTree } });

        let newRole = new Role({
          ...value,
          companyId: req.user.companyId
        });

        await newRole.save();

        return res.status(200).json({ message: "Role added successfully", roleTree });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Inernal server error"
        });
      }
    },

    getCompanyRoles: async (req, res) => {
      try {
        let { roleTree } = await Company.findOne({ _id: req.user.companyId })
          .select("roleTree")
          .lean();

        let roles = await Role.find({ companyId: req.user.companyId, status: 1 })
          .select("roleName nodeId children")
          .lean();

        roleTree = roleTree ? roleTree : [];

        populateTree(roleTree, roles);

        return res.status(200).json({
          message: "Company role tree loaded successfully",
          roles: roleTree
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    deleteRols: async (req, res) => {
      try {
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    }
  };
  return Object.freeze(methods);
}

module.exports = rolesController();
