const checkListController = require("../controllers/checkList.controller");

module.exports = (openRoutes, apiRoutes) => {
  apiRoutes.route("/createChecklist").post(checkListController.createChecklist);
  apiRoutes.route("/getAllChecklist").get(checkListController.getAllChecklist);

  apiRoutes
    .route("/getChecklist/:id")
    .get(checkListController.getChecklistById);

  apiRoutes
    .route("/updateChecklist/:id")
    .put(checkListController.updateChecklistById);

  apiRoutes
    .route("/deleteChecklist/:id")
    .delete(checkListController.deleteChecklistById);
};
