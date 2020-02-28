const Todo = require("../models/todo.model");
const __ = require("../helper/globals");
module.exports = {
  /**
   * Create Todo list
   */
  createTodoList: async (req, res) => {
    try {
      let todo = req.body;
      todo.createdBy = req.user;
      // let lObjTodoList = await Todo.create({
      //   title: req.body.title,
      //   description: req.body.description,
      //   createdBy: req.user,
      //   assignedTo: req.body.assignedTo,
      //   date: req.body.date,
      //   channelUrl: req.body.channelUrl || "",
      //   time: req.body.time
      // });
      // console.log(lObjTodoList);

      todo = await Todo(todo).save();

      todo = await Todo.findById(todo._id).lean();

      let createdDate = moment(),
        assignedDate = moment(todo.date);

      if (!!assignedDate) {
        let duration = moment.duration(assignedDate.diff(createdDate));
        duration = duration.asHours();
        todo.durationTime = Math.round(duration);
      }

      return res.status(200).json({
        message: "ToDo created successfully",
        data: todo
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },
  createMeetingTodoList: async (req, res) => {
    try {
      let todo = req.body;
      todo.createdBy = req.user;
      await Todo(todo).save();
      return res.status(200).json({
        message: "ToDo created successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },
  /**
   * Update the todo list by adding some more users
   */
  updateTodoList: async (req, res) => {
    try {
      let lObjTodoId = req.params.todoId;

      let lObjTodoResponse = await Todo.findOne({
        _id: lObjTodoId
      }).lean();
      if (!lObjTodoResponse) return res.status(400).json({
        message: "Todo not found"
      });
      let lObjUpdatedTodo = Object.assign({}, lObjTodoResponse, req.body);
      console.log(lObjUpdatedTodo)
      let lObjResponse = await Todo.findOneAndUpdate({
        _id: lObjTodoId
      }, lObjUpdatedTodo, {
        new: true
      }).lean();

      let createdDate = moment(),
        assignedDate = moment(lObjResponse.date);

      // console.log(assignedDate, createdDate);

      if (!!assignedDate) {
        let duration = moment.duration(assignedDate.diff(createdDate));
        duration = duration.asHours();
        lObjResponse.durationTime = Math.round(duration);
      }

      // let lObjResponse = await Todo.findOneAndUpdate({_id:lObjGetId}, { $addToSet: { assignedTo: { $each:  req.body.assignedTo } } }, {new: true}).lean()
      // console.log(lObjResponse);
      return res.status(200).send({
        message: "Todo updated successfully",
        data: lObjResponse
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send({
        message: "Error",
        data: err
      });
    }
  },
  // updateMeetingTodo: async (req, res) => {
  //   try {
  //     let lObjTodoId = req.params.todoId;

  //     let lObjTodoResponse = await Todo.findOne({
  //       _id: lObjTodoId
  //     }).lean();
  //     if (!lObjTodoResponse) return res.status(400).json({
  //       message: "Todo not found"
  //     });
  //     let lObjUpdatedTodo = Object.assign({}, lObjTodoResponse, req.body);
  //     let lObjResponse = await Todo.findOneAndUpdate({
  //       _id: lObjTodoId
  //     }, lObjUpdatedTodo, {
  //       new: true
  //     }).lean();

  //     let createdDate = moment(),
  //       assignedDate = moment(lObjResponse.date);

  //     console.log(assignedDate, createdDate);

  //     if (!!assignedDate) {
  //       let duration = moment.duration(assignedDate.diff(createdDate));
  //       duration = duration.asHours();
  //       lObjResponse.durationTime = Math.round(duration);
  //     }

  //     // let lObjResponse = await Todo.findOneAndUpdate({_id:lObjGetId}, { $addToSet: { assignedTo: { $each:  req.body.assignedTo } } }, {new: true}).lean()
  //     console.log(lObjResponse);
  //     return res.status(200).send({
  //       message: "Todo updated successfully",
  //       data: lObjResponse
  //     });
  //   } catch (err) {
  //     console.log(err);
  //     return res.status(500).send({
  //       message: "Error",
  //       data: err
  //     });
  //   }
  // },
  /**
   *  list the todo that are created by the user / have been assigned to user
   */
  getTodoList: async (req, res) => {
    try {
      console.log("Todo List------------");
      let lObjTodoId = req.query.todoId;
      //lObjTodoId = "5cfe4ee078efd86c4a313a31"
      let data;
      let todoCount;
      if (!!lObjTodoId) {
        data = await Todo.findOne({
          _id: lObjTodoId
        }).lean();

        /*let lDateAssignedDate = moment(data.date).format( 'YYYY-MM-DD');
          let fullDate     = lDateAssignedDate +' '+data.time; 
          let createdDate  = moment().format('YYYY-MM-DD hh:mm:ss a'),
          assignedDate = moment(data.date).format('YYYY-MM-DD hh:mm:ss a');
          createdDate  = moment(createdDate);
          assignedDate = moment(assignedDate); */
        let createdDate = moment(),
          assignedDate = moment(data.date);

        //console.log("ssssssss", assignedDate, createdDate);

        if (!!assignedDate) {
          let duration = moment.duration(assignedDate.diff(createdDate));
          duration = duration.asHours();
          data.durationTime = Math.round(duration);
          // console.log("ssssssss", Math.round(duration));

        }
      } else {
        console.log("***** Get All Todo List *****");

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
        console.log(sortObj)
        todoCount = await Todo.count({
          $or: [{
              title: regex
            },
            {
              createdBy: req.user
            },
            {
              assignedTo: req.user
            }
          ],
          projectId: req.query.projectId
        });

        data = await Todo.find({
            $or: [{
                title: regex
              },
              {
                createdBy: req.user
              },
              {
                assignedTo: req.user
              }
            ],
            projectId: req.query.projectId
          })
          .skip(s)
          .limit(chunk)
          .sort(sortObj)
          //.sort("-createdAt")
          .lean();
      }

      if (data.length > 0) {
        for (let v of data) {
          let createdDate = moment(),
            assignedDate = moment(v.date);
          if (!!assignedDate) {
            //console.log("assignedDate", assignedDate)
            //console.log("createdDate", createdDate)
            let duration = moment.duration(assignedDate.diff(createdDate));
            //console.log("duration", duration)
            duration = duration.asHours();
            v.durationTime = Math.round(duration);
          }
        }
      }

      return res.status(200).send({
        message: "Todo List",
        data: data,
        total: todoCount
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send({
        message: "Error",
        data: err
      });
    }
  },

  getMeetingTodo: async (req, res) => {
    //console.log("sss", req)
    /* Validate request */
    if (!req.params.meetingRoomId) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }
    try {

      let todoList = await Todo.find({
          meetingRoomId: req.params.meetingRoomId
        })
        .populate([{
          path: "assignedTo",
          select: "firstName email displayName"
        }])
        .sort({
          createdAt: -1
        })
        .lean();

      return res.status(200).json({
        message: "Todo loaded successfully",
        todoList: todoList
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  }
};