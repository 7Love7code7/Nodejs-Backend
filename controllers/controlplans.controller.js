const Plan = require("../models/controlplan.model");
const entityTagController = require("./entityTag.controller");

const __ = require("../helper/globals");

let controlPlanController = {
  createControlPlan: async (req, res) => {
    try {
      let planObj = await controlPlanController.newControlPlan(req.body, req.user);

      if (!planObj) {
        throw "Something went wrong";
      }

      return res.status(200).json({
        message: "Control plan created successfully",
        data: planObj
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
        data: e
      });
    }
  },

  newControlPlan: async (planObj, user) => {
    try {
      let plan = planObj;

      plan.companyId = user.companyId;
      plan.createdBy = user.firstName + " " + user.lastName;

      plan.systemTag = await entityTagController.generateTag("CPLAN");

      let newplan = new Plan(plan);

      let newPlan = await newplan.save();
      return newPlan.toObject();
    } catch (e) {
      console.log(e);
      return;
    }
  },

  getCompanyControlPlans: async (req, res) => {
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
    try {
      let plansCount = await Plan.count({
        $or: [
          {
            systemTag: regex
          },
          {
            title: regex
          }
        ],
        companyId: req.user.companyId
      });
      let plans = await Plan.find({
        $or: [
          {
            systemTag: regex
          },
          {
            title: regex
          }
        ],
        companyId: req.user.companyId
      })
        .skip(s)
        .limit(chunk)
        .sort(sortObj)
        .lean();
      if (!plans) {
        return res.status(200).json({
          message: "No Plans found."
        });
      } else {
        return res.status(200).json({
          message: "plans found.",
          total: plansCount,
          list: plans
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getControlPlanByProjectId: async (req, res) => {
    let id = req.query.projectid;
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
      let plansCount = await Plan.count({
        title: regex,
        projectId: id
      });
      let plans = await Plan.find({
        $or: [
          {
            systemTag: regex
          }
        ]
      }).where({
        projectId: id
      });
      if (!plans) {
        return res.status(200).json({
          message: "No Plans found."
        });
      } else {
        return res.status(200).json({
          message: "plans found.",
          total: plansCount,
          list: plans
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getcontrolPlanById: async (req, res) => {
    let id = req.params.id;
    if (id) {
      Plan.findById(id).exec((err, plan) => {
        if (plan) {
          return res.json(plan);
        } else {
          return res.status(500).json({
            err: 500,
            message: "error fetching plan details"
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

  updateContolPlan: async (req, res) => {
    let id = req.params.id;
    let newplan = req.body;
    if (id) {
      Plan.findById(id).exec((err, plan) => {
        if (plan) {
          plan.plan = newplan.plan;
          plan.responsibleUsers = newplan.responsibleUsers;
          plan.save();
          return res.status(200).json({
            message: "plan updated successfully."
          });
        } else {
          return res.status(500).json({
            err: 304,
            message: " requested plan does not found."
          });
        }
      });
    } else {
      return res.status(401).json({
        errorTag: 101,
        message: "parameter error"
      });
    }
  }
};

module.exports = controlPlanController;
