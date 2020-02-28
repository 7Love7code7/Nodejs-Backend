const todo = require("../controllers/todo.controller");

module.exports = (openRoutes, apiRoutes) => {
  apiRoutes.route("/createTodo").post(todo.createTodoList); // TODO : create todo
  apiRoutes.route("/createMeetingTodo").post(todo.createMeetingTodoList); // TODO : create todo

  apiRoutes
    .route("/updateTodoList/:todoId") // TODO : update todo
    .put(todo.updateTodoList);

  apiRoutes
    .route("/getTodoList") // TODO : update todo
    .get(todo.getTodoList);

  apiRoutes.route("/getMeetingTodo/:meetingRoomId").get(todo.getMeetingTodo);
};