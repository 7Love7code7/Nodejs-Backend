const request = require("request");
const Calc = require("../models/calculations.model");
const async = require("async");
const mongoose = require("mongoose");
const __ = require("../helper/globals");
const proj = require("../models/project.model");
const ongoingCalc = require("../models/OngoingCalcChangeRequest.model");

module.exports = {
  syncTimelineToCalcOngoingCR: async (req, res) => {
    let changeRequestData = req.body; var objectIds = [];
    changeRequestData.data.objects.map(object => {
      objectIds.push(object.objectId);
    });

    if (!changeRequestData.levelpath || !changeRequestData.modelID) {
      return res.status(500).json({
        errorTag: 101,
        message: "can not find modelID or levelpath in req object."
      });
    }

    if (changeRequestData.ongoingCalcChangeReqId) {
      let sheet = await ongoingCalc.findById({ _id: changeRequestData.ongoingCalcChangeReqId });
      console.log("shett", sheet);
      if (!sheet) {
        return res.status(500).json({
          errorTag: 101,
          message: "can not find object."
        });
      } else {
        //find level with same modelId
        checkSameModel(sheet.calcData.RootArray, changeRequestData);

        ongoingCalc.findByIdAndUpdate(req.params.id, {
          $set: {
            calcData: sheet.calcData
          },
          $push: {
            listChangeCommits: [{ action: "update", createdBy: req.user.firstName, data: changeRequestData }]
          }
        }, (err, doc) => {
          if (doc) {
            return res.status(200).json(doc);
          } else {
            console.log(err);
            return res.status(500).json({
              error: 500
            });
          }
        })
      }
    } else {
      let sheet = await Calc.findOne({ projectId: changeRequestData.projectId });
      if (!sheet) {
        return res.status(500).json({
          errorTag: 101,
          message: "can not find sheet from req."
        });
      } else {
        //find level with same modelId
        checkSameModel(sheet.RootArray, changeRequestData);

        var onGoing = {
          projectId: changeRequestData.projectId,
          calcData: sheet,
          createdBy: req.user.firstName,
          calcSheetId: sheet._id,
          modelID: changeRequestData.modelID,
          listChangeCommits: [{ action: "add", createdBy: req.user.firstName, data: changeRequestData }]
        }
        var newOngoing = new ongoingCalc(onGoing);
        console.log("newOngoing", newOngoing)
        var createdObj = await newOngoing.save();
        return res.status(200).json({
          message: "calc-timeline request saved!",
          data: createdObj
        });
      }
    }
  },

  getCalcInTimeline: async (req, res) => {
    let resObject = [];
    try {
      let sheet = await Calc.findById(req.params.id);
      if (!sheet) {
        return res.status(500).json({
          errorTag: 101,
          message: "cannot find calc-sheet requested",
        });
      }
      await sheet.RootArray.forEach(level => {
        findLevelWithModelIds(level, resObject);
      });
      console.log("done with all: ", resObject);
      return res.status(200).json({
        message: "Found model data",
        data: resObject
      });
    } catch (e) {
      return res.status(500).json({
        errorTag: 101,
        message: "Error getting result",
      });
    }
  }
};

function findLevelWithModelIds(level, array) {
  if (level.modelID) {
    array.push(level);
  }
  if (level.sublevel) {
    if (level.sublevel != null || level.sublevel.length > 0) {
      level.sublevel.map(sublevel => {
        findLevelWithModelIds(sublevel, array)
      })
    }
  }
}

function checkSameModel(levels, reqdata) {
  if (levels) {
    let i = 0;
    for (i = 0; i < levels.length; i++) {
      let level = levels[i];
      if (level.modelID && level.modelID == reqdata.modelID && level.custompath == reqdata.levelpath) {
        if (level.ifcData && level.ifcData.length > 0) {
          level.ifcData.forEach(item => {
            setDateToItem(reqdata.data.objects, item);
          });
        }
        if (level.items && level.items.length > 0) {
          level.items.forEach(item => {
            setWorkerToItem(reqdata.data.objects, item);
          });
        }
        return true;
      }

      if (checkSameModel(level.sublevel, reqdata)) {
        return true;
      }
    }
  }
  return false;
}

function setDateToItem(array, item) {
  array.map(arr => {
    if (item.objectID) {
      if (item.objectID == arr.objectId) {
        item.startdate = arr.startTime;
        item.enddate = arr.endTime;
      }
    }
  });
}

function setWorkerToItem(array, item) {
  array.map(arr => {
    if (item.objectID) {
      if (item.objectID == arr.objectId) {
        if (arr.workers && arr.workers.length > 0) {
          let name = '';
          let index = 0;
          arr.workers.forEach(worker => {
            if (index > 0) {
              name = name + ", ";
            }
            name = name + worker.displayName
            index ++;
          });
          item.workername = name;
        }
      }
    }
  });
}