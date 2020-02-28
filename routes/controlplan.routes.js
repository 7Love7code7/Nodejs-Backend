const plan = require("../controllers/controlplans.controller");
const policy = require("../helper/policy");
const uid = require("uid-safe");
const async = require("async");

module.exports = (openRoutes, apiRoutes) => {
  apiRoutes.route("/newcontrolplan").post(plan.createControlPlan);

  apiRoutes.route("/getprojectcontrolplans").get(plan.getControlPlanByProjectId);

  apiRoutes.route("/getCompanyControlPlans").get(plan.getCompanyControlPlans);

  apiRoutes.route("/getcontrolPlanById/:id").get(plan.getcontrolPlanById);

  apiRoutes.route("/updatecontrolplan/:id").put(plan.updateContolPlan);
};
