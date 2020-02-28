require("dotenv");

const TimelineHierarchy = require("../models/timelineHierarchy.model"),
  TimelineTask = require("../models/timelineTask.model"),
  TimelineLink = require("../models/timelineLink.model"),
  timelineNotification = require("../models/timelineNotification.model"),
  Project = require("../models/project.model"),
  Calculation = require("../models/calculations.model"),
  _ = require("lodash"),
  __ = require("../helper/globals"),
  axios = require("axios"),
  mongoose = require("mongoose"),
  moment = require("moment"),
  request = require("request"),
  Joi = require("joi"),
  d2d = require("degrees-to-direction");

function timelineController() {
  function totalNumberOfDays(workers, taskHours, dailyHours = 8) {
    return taskHours / (workers * dailyHours);
  }

  const methods = {
    initializeTimeline: async (req, res) => {
      try {
        const schema = Joi.object().keys({
          projectId: Joi.string().required(),
          workersPerTask: Joi.number().required()
        });
        let {
          error,
          value
        } = Joi.validate(req.body, schema);

        if (error) return __.inputValidationError(error, res);

        /* Check if timeline has been initialized */

        let {
          timelineInit,
          calcSheetId,
          startDate
        } = await Project.findById(
          value.projectId
        ).lean();

        /* Return if timeline already initiated */
        if (timelineInit) {
          return res.status(400).json({
            message: "Timeline already initiated"
          });
        }

        /* Return if calcsheet for a project doesn't exist */
        if (!calcSheetId) {
          return res.status(400).json({
            message: "Calcsheet for project doesn't exist already initiated"
          });
        }

        let {
          RootArray
        } = await Calculation.findById(calcSheetId).lean();

        let tasks = [],
          rootDuration = 0; // To be incremented for subsequent root tasks
        /**
         * @param {Object[]} arr - Root array or Summary task
         * @param {Object} parent - always null for rootArrays , Will contain parent info for recursive calls
         * @param {String} rootTaskId - To categorize tasks based on rootTasks (For task combine screen )
         */

        async function calculateTotalDaysDeep(arr, parent = null, rootTaskId = "") {
          // Iterating through the root array initially

          for (let elem of arr) {
            if (elem.items) {
              // create root task

              let rootTaskData = {
                projectId: value.projectId,
                companyId: req.user.companyId
              };
              // Calculate duration
              rootTaskData.durationNumber = totalNumberOfDays(value.workersPerTask, elem.sumHours);
              rootTaskData.text = elem.name;
              rootTaskData.duration = Math.round(rootTaskData.durationNumber).toString();
              // Case where a task contains a parent
              if (parent) {
                rootTaskData.start_date = moment(startDate).format("DD-MM-YYYY HH:mm");
                rootTaskData.root = rootTaskId;
                // Set the task as project if it contains sub tasks
                rootTaskData.type = elem.items.filter(Boolean).length > 0 ? "project" : "task";
                rootTaskData.parent = parent._id;
                rootTaskData.summaryTask = rootTaskId === parent._id;
              } else {
                // Case for root tasks (Set a custom type)
                rootTaskData.type = "rootTask";
                rootTaskData.start_date = moment(startDate)
                  .add(rootDuration, "days")
                  .format("DD-MM-YYYY HH:mm");
              }
              let newRootTask = new TimelineTask(rootTaskData);

              newRootTask = await newRootTask.save();
              newRootTask = newRootTask.toObject();

              // Post save actions
              // if the created task is a new roottask, set it as 'rootTaskId' for further task creations
              if (!parent) {
                rootTaskId = newRootTask._id;
                tasks.push(rootTaskId);
              } else {
                // if not, then assign the root key to the subtasks
                tasks.push(newRootTask._id);
                tasks.root = rootTaskId;
              }

              // Created child tasks for the above summary/root tasks

              for (eachElem of elem.items) {
                if (eachElem === null) continue;

                let taskData = {
                  taskMeta: eachElem,
                  projectId: value.projectId,
                  companyId: req.user.companyId
                };

                taskData.durationNumber = totalNumberOfDays(
                  value.workersPerTask,
                  eachElem.labourHours
                );
                taskData.text = eachElem.name;
                taskData.duration = Math.round(taskData.durationNumber).toString();
                // Adjust start dates based on root duration
                taskData.start_date = moment(startDate)
                  .add(rootDuration, "days")
                  .format("DD-MM-YYYY HH:mm");
                taskData.parent = parent ? newRootTask._id : rootTaskId;
                taskData.root = rootTaskId;
                let newTimelineTask = new TimelineTask(taskData);
                newTimelineTask = await newTimelineTask.save();
                newTimelineTask = newTimelineTask.toObject();

                tasks.push(newTimelineTask._id);
              }

              // Recursively call the function for sublevels
              if (elem.sublevel && elem.sublevel.length) {
                await calculateTotalDaysDeep(
                  elem.sublevel, {
                    _id: newRootTask._id
                  },
                  rootTaskId
                );
              }

              /**
               * IMPORTANT: Increment the root duration only after the end of recursive calls for all
               * subtasks. The 'await' keyword is necessary
               */
              if (!parent) {
                rootDuration += rootTaskData.durationNumber;
              }
            }
          }
        }

        await calculateTotalDaysDeep(RootArray);

        // Create timeline object

        let newTimeLineHierarchy = new TimelineHierarchy({
          projectId: value.projectId,
          companyId: req.user.companyId,
          calcSheetId: calcSheetId,
          initialWorkersPerTask: value.workersPerTask,
          tasks: tasks
        });

        newTimeLineHierarchy = await newTimeLineHierarchy.save();

        // Assign created timeline to the project

        await Project.update({
          _id: value.projectId
        }, {
          $set: {
            timelineInit: true,
            timeline: newTimeLineHierarchy._id
          }
        });

        return res.status(200).json({
          message: "Timeline created successfully",
          data: newTimeLineHierarchy
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },
    /* Gantt data for project timeline screen */
    getTimelineTasks: async (req, res) => {
      try {
        if (!req.params.projectId) {
          return res.status(400).json({
            success: false,
            message: "Project id is missing"
          });
        }

        let {
          timelineInit,
          timeline
        } = await Project.findOne({
            _id: req.params.projectId
          })
          .select("timelineInit timeline")
          .lean();

        if (!timelineInit) {
          return res.status(200).json({
            success: false,
            message: "Timeline for this project has not been initialized"
          });
        }

        let timelineData = await methods.loadGantData(timeline);

        return res.status(200).json({
          message: "Tasks loaded successfully",
          success: true,
          data: timelineData
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    /* Utility function to load gantt data for project timeline */
    loadGantData: timelineId => {
      return new Promise(async (resolve, reject) => {
        try {
          let timelineData = await TimelineHierarchy.findOne({
              _id: timelineId
            })
            .populate([{
                path: "tasks",
                select: "-taskMeta -companyId -projectId -createdAt -updatedAt -__v"
              },
              {
                path: "links",
                select: "-companyId -projectId -createdAt -updatedAt -__v"
              }
            ])
            .lean();

          timelineData.tasks = timelineData.tasks.map(x => {
            x.id = x._id;
            return x;
          });
          console.log("  timelineData.tasks", timelineData.tasks)
          /* Get unique root Ids */
          let rootIds = [
            ...new Set(timelineData.tasks.map(x => (x.root ? String(x.root) : undefined)))
          ].filter(Boolean);

          timelineData.rootIds = timelineData.tasks.filter(
            x => rootIds.indexOf(String(x._id)) > -1
          );

          resolve(timelineData);
        } catch (e) {
          reject(e);
        }
      });
    },

    /* Getting specific root level gantt data in task combine screen */
    getData: async (req, res) => {
      try {
        if (!req.query.project) {
          return res.status(400).json({
            message: "Invalid project ID"
          });
        }

        let populateArray = [{
            path: "tasks",
            select: "-taskMeta -companyId -projectId -createdAt -updatedAt -__v"
          },
          {
            path: "links",
            select: "-companyId -projectId -createdAt -updatedAt -__v"
          }
        ];

        /* Filter data based on roots if root Id is available in the query */

        if (req.query.root) {
          populateArray = populateArray.map(x => {
            x.match = {
              root: req.query.root
            };
            return x;
          });
        }

        let {
          timeline
        } = await Project.findOne({
            _id: req.query.project,
            timelineInit: true
          })
          .select("timeline")
          .populate([{
            path: "timeline",
            select: "tasks links",
            populate: populateArray
          }])
          .lean();

        if (!timeline) {
          return res.status(400).json({
            message: "Timeline not initialized"
          });
        }

        timeline.tasks = timeline.tasks.map(x => {
          x.id = x._id;
          if (String(x.parent) === String(x.root) || x.summaryTask) {
            x.parent = "0";
          }
          return x;
        });

        return res.status(200).json({
          data: timeline.tasks,
          collection: {
            links: timeline.links || []
          }
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    addTask: async (req, res) => {
      try {
        let {
          timeline
        } = await Project.findOne({
          _id: req.projectId
        });

        let task = {
          text: req.body.text,
          start_date: moment(req.body.start_date, "DD-MM-YYYY HH:mm").format("DD-MM-YYYY HH:mm"),
          duration: req.body.duration,
          progress: req.body.progress || 0,
          parent: req.body.parent === "0" ? null : req.body.parent,
          root: req.rootId
        };

        let newTask = new TimelineTask(task);

        newTask = await newTask.save();
        newTask = newTask.toObject();

        await TimelineHierarchy.update({
          _id: timeline
        }, {
          $push: {
            tasks: newTask._id
          }
        });

        return res.status(200).json({
          action: "Task Inserted",
          tid: newTask._id
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    addLink: async (req, res) => {
      try {
        let {
          timeline
        } = await Project.findOne({
          _id: req.projectId
        });

        let link = {
          source: req.body.source,
          target: req.body.target,
          type: req.body.type,
          root: req.rootId
        };

        let newLink = new TimelineLink(link);

        newLink = await newLink.save();
        newLink = newLink.toObject();

        await TimelineHierarchy.update({
          _id: timeline
        }, {
          $push: {
            links: newLink._id
          }
        });

        return res.status(200).json({
          action: "inserted",
          tid: newLink._id
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    updateTask: async (req, res) => {
      try {
        let task = {
          text: req.body.text,
          start_date: moment(req.body.start_date, "DD-MM-YYYY HH:mm").format("DD-MM-YYYY HH:mm"),
          duration: req.body.duration,
          progress: req.body.progress || 0,
          parent: req.body.parent === "0" ? null : req.body.parent
        };

        await TimelineTask.update({
          _id: req.params.id
        }, {
          $set: task
        });

        return res.status(200).json({
          action: "updated"
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    updateLink: async (req, res) => {
      try {
        let link = {
          source: req.body.source,
          target: req.body.target,
          type: req.body.type
        };

        await TimelineLink.update({
          _id: req.params.id
        }, {
          $set: link
        });

        return res.status(200).json({
          action: "updated"
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    deleteTask: async (req, res) => {
      try {
        await TimelineTask.remove({
          _id: req.params.id
        });

        return res.status(200).json({
          action: "deleted"
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    deleteLink: async (req, res) => {
      try {
        await TimelineLink.remove({
          _id: req.params.id
        });

        return res.status(200).json({
          action: "deleted"
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    createSummaryTask: async (req, res) => {
      try {
        const schema = Joi.object().keys({
          projectId: Joi.string().required(),
          rootId: Joi.string().required(),
          tasks: Joi.array()
            .items(
              Joi.object().keys({
                id: Joi.string().required(),
                start_date: Joi.string().required(),
                duration: Joi.number().required()
              })
            )
            .required()
        });
        let {
          error,
          value
        } = Joi.validate(req.body, schema);

        if (error) return __.inputValidationError(error, res);

        /* Choose the lowest startdate and the highest enddate among the tasks */

        let lowestStartDate = moment(value.tasks[0].start_date, "DD-MM-YYYY HH:mm").isAfter(
            moment(value.tasks[1].start_date, "DD-MM-YYYY HH:mm")
          ) ?
          value.tasks[1].start_date :
          value.tasks[0].start_date;

        let highestEndDate = moment(value.tasks[0].start_date, "DD-MM-YYYY HH:mm")
          .add(value.tasks[0].duration, "days")
          .isAfter(
            moment(value.tasks[1].start_date, "DD-MM-YYYY HH:mm").add(
              value.tasks[1].duration,
              "days"
            )
          ) ?
          moment(value.tasks[0].start_date, "DD-MM-YYYY HH:mm")
          .add(value.tasks[0].duration, "days")
          .format("DD-MM-YYYY HH:mm") :
          moment(value.tasks[1].start_date, "DD-MM-YYYY HH:mm")
          .add(value.tasks[1].duration, "days")
          .format("DD-MM-YYYY HH:mm");

        let newSummaryTask = new TimelineTask({
          text: "Summary Task",
          start_date: lowestStartDate,
          end_date: highestEndDate,
          type: "project",
          root: value.rootId,
          summaryTask: true
        });

        newSummaryTask = await newSummaryTask.save();
        newSummaryTask = newSummaryTask.toObject();
        /* Update the tasks with the new parent */

        await TimelineTask.update({
          _id: {
            $in: value.tasks.map(x => x.id)
          }
        }, {
          $set: {
            parent: newSummaryTask._id
          }
        }, {
          multi: true
        });

        /* Update project's timeline with new task */

        let {
          timeline
        } = await Project.findOne({
            _id: value.projectId
          })
          .select("timeline")
          .lean();

        await TimelineHierarchy.update({
          _id: timeline
        }, {
          $push: {
            tasks: newSummaryTask._id
          }
        });

        /* fetching timeline data */

        req.query.project = value.projectId;
        req.query.root = value.rootId;

        await methods.getData(req, res);
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    createFixedCostJob: async (req, res) => {
      try {
        const schema = Joi.object().keys({
          timelineId: Joi.string().required(),
          subContractor: Joi.string().required(),
          startDate: Joi.string().required(),
          workingDays: Joi.number().required(),
          budget: Joi.number().required(),
          status: Joi.string().required()
        });

        let {
          error,
          value
        } = Joi.validate(req.body, schema);

        if (error) return __.inputValidationError(error, res);

        let task = {
          text: "Fixed cost job",
          start_date: moment(value.startDate).format("DD-MM-YYYY HH:mm"),
          duration: value.workingDays.toString(),
          type: "fcj",
          taskMeta: {
            subContractor: value.subContractor,
            budget: value.budget,
            status: value.status
          }
        };

        let newTask = new TimelineTask(task);

        newTask = await newTask.save();
        newTask = newTask.toObject();

        await TimelineHierarchy.update({
          _id: value.timelineId
        }, {
          $push: {
            tasks: newTask._id
          }
        });

        let timelineData = await methods.loadGantData(value.timelineId);

        return res.status(200).json({
          message: "Fixed cost job created successfully",
          data: timelineData
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    wind: (speedVal, degreeVal) => {
      let speed = parseInt(Math.floor(speedVal * (18 / 5)));
      let direction = methods.directionFind(degreeVal);
      //return direction;
      switch (true) {
        case speed < 1:
          return `Calm Wind breeze,${speedVal}m/s from ${direction} `;
          break;

        case speed >= 1 && speed <= 5:
          return `Light  Wind breeze,${speedVal}m/s from ${direction} `;
          break;

        case speed >= 6 && speed <= 11:
          return `Light  Wind breeze,${speedVal}m/s from ${direction} `;
          break;

        case speed >= 12 && speed <= 19:
          return `Gentle Wind breeze,${speedVal}m/s from ${direction} `;
          break;

        case speed >= 20 && speed <= 28:
          return `Moderate Wind breeze,${speedVal}m/s from ${direction} `;
          break;

        case speed >= 29 && speed <= 38:
          return `Fresh Wind breeze,${speedVal}m/s from ${direction} `;
          break;

        case speed >= 39 && speed <= 49:
          return `Strong gale	 Wind breeze,${speedVal}m/s from ${direction} `;
          break;

        case speed >= 50 && speed <= 61:
          return `Fresh Breeze	 gale	 Wind breeze,${speedVal}m/s from ${direction} `;
          break;
        case speed >= 62 && speed <= 74:
          return `Fresh gale Wind breeze,${speedVal}m/s from ${direction} `;
          break;

        case speed >= 75 && speed <= 88:
          return `Stong gale Wind breeze,${speedVal}m/s from ${direction} `;
          break;

        case speed >= 89 && speed <= 102:
          return `Whole gale Wind breeze,${speedVal}m/s from ${direction} `;
          break;

        case speed >= 103 && speed < 117:
          return `Storm	 breeze,${speedVal}m/s from ${direction} `;
          break;

        case speed >= 117:
          return `Hurricane  breeze,${speedVal}m/s from ${direction} `;
          break;
      }
    },
    directionFind: degreeVal => {
      let deg = d2d(degreeVal);
      switch (deg) {
        case "N":
          return "North";
          break;

        case "NbE":
          return "North-east";
          break;

        case "NNE":
          return "North-northeast";
          break;

        case "NEbN":
          return "Northeast-east";
          break;

        case "ENE":
          return "East-northeast";
          break;

        case "EbN":
          return "East-north	";
          break;

        case "E":
          return "East";
          break;

        case "EbS":
          return "East-south	";
          break;
        case "ESE":
          return "East-southeast";
          break;

        case "SEbE":
          return "Southeast-east	";
          break;

        case "SE":
          return "South-east";
          break;

        case "SEbS":
          return "Southeast-south	";
          break;

        case "SSE":
          return "South-southeast";
          break;

        case "SbE":
          return "South-east	";
          break;

        case "S":
          return "South";
          break;

        case "SbW":
          return "South-west";
          break;
        case "SSW":
          return "South-southwest";
          break;

        case "SWbS":
          return "Southwest-south";
          break;

        case "SW":
          return "Southwest";
          break;

        case "SWbW":
          return "Southwest-west	";
          break;

        case "WSW":
          return "West-southwest";
          break;

        case "WbS":
          return "West-south	";
          break;

        case "W":
          return "West";
          break;

        case "WbN":
          return "West by north";
          break;

        case "WNW":
          return "West-northwest";
          break;

        case "NWbW":
          return "Northwest-west";
          break;

        case "NW":
          return "Northwest";
          break;

        case "NWbN":
          return "Northwest-north";
          break;

        case "NWbN":
          return "Northwest-north";
          break;

        case "NNW":
          return "North-northwest";
          break;

        case "NbW":
          return "North-west";
          break;

        case "N":
          return "North";
          break;
      }
    },

    getTimelineWeatherInfo: async (req, res) => {
      try {
        const schema = Joi.object().keys({
          latitude: Joi.number().required(),
          longitude: Joi.number().required()
        });

        let {
          error,
          value
        } = Joi.validate(req.body, schema);

        if (error) return __.inputValidationError(error, res);

        let {
          data
        } = await axios({
          url: `https://api.openweathermap.org/data/2.5/forecast?lat=${value.latitude}&lon=${
            value.longitude
          }&units=metric&APPID=bf9508a34f493c5b191ea5092e8f048f`,
          method: "GET",
          responseType: "json"
        });
        weatherData = data.list
          // Split 3 hour forecast based on days
          .reduce((acc, x) => {
            let day = x.dt_txt.split(" ")[0];
            acc[day] = acc[day] ? acc[day].concat(x) : [x];
            return acc;
          }, {});
        /* Compile  average data */
        weatherData = Object.keys(weatherData).map(x => {
          let obj = {
            // calculate averate temp
            temp: (
              weatherData[x].reduce((acc, x) => acc + x.main.temp, 0) / weatherData[x].length
            ).toFixed(2),

            // get weekday
            date: x,
            day: moment(x, "YYYY-MM-DD").format("ddd"),
            // generate icon // TODO: Getting the first index for icon, ideally need to get mid day
            icon: `https://openweathermap.org/img/w/${weatherData[x][0].weather[0].icon}.png`,
            threeHour: weatherData[x].map(z => ({
              // Wind : z.wind.speed,
              wind: methods.wind(z.wind.speed, z.wind.deg),
              precipitation: (z.rain ? (z.rain["3h"] ? z.rain["3h"] : 0.0) : 0.0).toFixed(2),
              temp: z.main.temp.toFixed(2),
              type: z.weather[0].main,
              time: moment(z.dt_txt, "YYYY-MM-DD HH:mm:ss").format("hh:mm a")
            }))
          };
          return obj;
        });

        return res
          .status(200)
          .json({
            message: "Weather data loaded successfully",
            data: weatherData
          });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    createNotification: (taskId, projectId, type) => {
      return new Promise(async (resolve, reject) => {
        let newNotification = new TimelineLink({
          projectId,
          taskId,
          type
        });

        newNotification = await newNotification.save();
        newNotification = newNotification.toObject();

        return res.status(200).json({
          message: "Notification added successfully"
        });
      });
    },

    // Notification api for task

    getnotificationTask: async (req, res) => {
      try {
        let pageNo = parseInt(req.query.pageNo ? req.query.pageNo : 1);
        let size = parseInt(req.query.size ? req.query.size : 2);
        let query = {};
        query.skip = size * (pageNo - 1);
        query.limit = size;
        newTask = await timelineNotification
          .find({
            projectId: req.params.projectID
          }, {}, query)
          .populate("taskId", "text");
        return res.json({
          action: newTask
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },
    listTimelineNotifications: async (req, res) => {
      try {} catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    }
  };

  return Object.freeze(methods);
}

module.exports = timelineController();