const timelineController = require("../controllers/timeline.controller");

module.exports = (openRoutes, apiRoutes) => {
  apiRoutes.route("/initializeTimeline").post(timelineController.initializeTimeline);

  apiRoutes.route("/getTimelineTasks/:projectId").get(timelineController.getTimelineTasks);

  /* Gantt chart routes */

  apiRoutes.route("/gantt").get(timelineController.getData);
  apiRoutes
    .route("/gantt/task")
    .all(checkProjectId)
    .post(timelineController.addTask);

  apiRoutes
    .route("/gantt/task/:id")
    .all(checkProjectId)
    .put(timelineController.updateTask)
    .delete(timelineController.deleteTask);

  apiRoutes
    .route("/gantt/link")
    .all(checkProjectId)
    .post(timelineController.addLink);

  apiRoutes
    .route("/gantt/link/:id")
    .all(checkProjectId)
    .put(timelineController.updateLink)
    .delete(timelineController.deleteLink);

  apiRoutes.route("/gantt/createSummaryTask").post(timelineController.createSummaryTask);

  apiRoutes.route("/createFixedCostJob").post(timelineController.createFixedCostJob);

  apiRoutes.route("/getTimelineWeatherInfo").post(timelineController.getTimelineWeatherInfo);

  //Check if project id is available in header for gantt routes
  function checkProjectId(req, res, next) {
    const projectId = req.headers["project"],
      rootId = req.headers["root"];

    if (projectId) {
      req.projectId = projectId;
      req.rootId = projectId;
      next();
    } else {
      return res.status(400).json({
        message: "Invalid project ID / Root ID"
      });
    }
  }
};
