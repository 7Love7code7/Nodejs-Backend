const request = require("request");
const Calc = require("../models/calculations.model");
const Tag = require("../models/calcChangeRequest.model");
const ongoingCalc = require('../models/OngoingCalcChangeRequest.model');
const mongoose = require("mongoose");
const __ = require("../helper/globals");
const async = require("async");
const Material = require("../models/material.model");
const Equipment = require("../models/equipment.model");
const ComboMaterial = require("../models/comboMaterial.model");
// var jsondiffpatch = require('jsondiffpatch').create(options);


module.exports = {
  changeReqCalc: async (req, res) => {
    try {
      let reqObject = req.body;
      let calcId = req.params.id;
      reqObject.calcId = calcId;
      reqObject.createdBy = req.user.firstName + " " + req.user.lastName;
      let newReqCalc = new Tag(reqObject);
      let tagObj = await newReqCalc.save();
      return res.status(200).json({
        message: "saved Successfully",
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
        data: e
      });
    }
  },

  getListChangeRequets: async (req, res) => {
    try {
      console.log("Query: ", req.query.status);
      let resObj = []; let arrCount = 0;
      let changerequets = await Tag.find({ calcId: req.params.id }).sort('created').exec(function (err, arrdata) {
        console.log("arrdata", arrdata);
        if (req.query.submitStatus) {
          arrdata.map(data => {
            if (req.query.submitStatus.includes(data.submitStatus)) {
              resObj.push(data);
            } else {
              //do nothing
            }
          });
        } else {
          resObj = arrdata;
        }
      });
      return res.status(200).json({
        data: { count: resObj.length, data: resObj }
      });

    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
        data: e
      });
    }
  },

  getListCountChangeReqCalc: async (req, res) => {
    try {
      let resObj = [];
      let changerequets = await Tag.find({ calcId: req.params.id }).sort('created').exec(function (err, arrdata) {

        if (req.query.submitStatus) {

          arrdata.map(data => {
            if (req.query.submitStatus.includes(data.submitStatus)) {
              resObj.push(data);
            } else {
              //do nothing
            }
          });
        } else {
          resObj = arrdata;
        }
      });
      return res.status(200).json({
        data: resObj.length
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
        data: e
      });
    }
  },

  updateListChangeReqCalc: async (req, res) => {
    try {
      var currentCalcId = req.params.id;
      return res.status(200).json({
        data: "OK"
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
        data: e
      });
    }
  },

  getCalcIfcRows: async (req, res) => {
    return res.status(200).json({
      data: "OK"
    });
  },
  updateCalcIfcRows: async (req, res) => {
    return res.status(200).json({
      data: "OK"
    });
  },

  syncViewerToCalcOngoingCR: async (req, res) => {

    let levelfound;
    let sheet;
    var foundLevel = false;
    let changeRequestData = req.body;

    if (changeRequestData.levelPath == undefined) {
      return res.status(500).json({
        message: "levelPath paramter undefined",
        data: 'error'
      });
    }

    try {
      sheet = await Calc.findById(changeRequestData.calcSheetId);
      if (sheet == undefined) {
        return res.status(500).json({
          message: "Cannot find requested calc-sheet",
          data: 'error'
        });
      }

      for (let root of sheet.RootArray) {
        var level = searchByPath(foundLevel, changeRequestData.levelPath, root);
        console.log("level: ", level);
        if (level !== undefined) {
          levelfound = level;
          break;
        }
      }

      if (!levelfound) {
        return res.status(500).json({
          errorTag: 101,
          message: "Couldn't find level you sent."
        });
      }

      if (levelfound.sublevel) {
        let sublevelFound = undefined;
        console.log("in levelfound else", levelfound.name);

        if (levelfound.sublevel.length > 0) {
          console.log("levelfound.sublevel", levelfound.sublevel);

          for (let sub of levelfound.sublevel) {
            console.log("SUB: ", sub)
            if (sub.hasOwnProperty('modelID') && sub.modelID == changeRequestData.modelID) {
              console.log("found same model id");
              sublevelFound = sub;
              break;
            }
          }
        }

        if (sublevelFound) {
          await changeSublevel(sublevelFound, changeRequestData, sheet);
        } else {
          await addNewSublevel(levelfound, changeRequestData, sheet);
        }

        if (changeRequestData.ongoingCalcChangeReqId) {
          ongoingCalc.findByIdAndUpdate(changeRequestData.ongoingCalcChangeReqId, {
            $set: {
              calcData: sheet.calcData
            },
            $push: {
              listChangeCommits: [{ action: "update", createdBy: req.user.firstName, data: changeRequestData }]
            }
          }, (err, doc) => {
            if (doc) {
              return res.status(200).json({
                message: "updated successfully",
                data: doc
              });
            } else {
              console.log(err);
              return res.status(500).json({
                error: 500
              });
            }
          });
        } else {
          var onGoing = {
            projectId: changeRequestData.projectID,
            calcData: sheet,
            createdBy: req.user.firstName,
            calcSheetId: changeRequestData.calcSheetId,
            calcSheetVersion: changeRequestData.calcVersionSeq,
            modelID: changeRequestData.modelID,
            listChangeCommits: [{ action: "add", createdBy: req.user.firstName }]
          }

          var newOngoing = new ongoingCalc(onGoing);
          console.log("newOngoing", newOngoing)
          newOngoing.save().then((result) => {
            return res.status(200).json({
              message: "calc-sync-request saved.",
              data: result
            });
          }).catch((error) => {
            return res.status(500).json({
              message: "Error saving request",
              data: error
            });
          });
        }
      } else {
        return res.status(500).json({
          errorTag: 101,
          message: "sublevel property does not exist at requested level path."
        });
      }
    } catch (err) {
      return res.status(500).json({
        message: "Error occurred",
        data: err
      });
    }
  },

  TESTJSON: async (req, res) => {
    // sample data
    var country = {
      name: "Argentina",
      cities: [
        {
          name: 'Buenos Aires',
          population: 13028000,
        },
        {
          name: 'Cordoba',
          population: 1430023,
        },
        {
          name: 'Rosario',
          population: 1136286,
        },
        {
          name: 'Mendoza',
          population: 901126,
        },
        {
          name: 'San Miguel de Tucuman',
          population: 800000,
        }
      ]
    };

    // clone country
    var country2 = JSON.parse(JSON.stringify(country));

    // delete Cordoba
    country.cities.splice(1, 1);

    // add La Plata
    country.cities.splice(4, 0, {
      name: 'La Plata'
    });

    // modify Rosario, and move it
    var rosario = country.cities.splice(1, 1)[0];
    rosario.population += 1234;
    country.cities.push(rosario);

    // create a configured instance, match objects by name
    var diffpatcher = jsondiffpatch.create({
      objectHash: function (obj) {
        return obj.name;
      }
    });

    var delta = diffpatcher.diff(country, country2);

    assertSame(delta, {
      "cities": {
        "_t": "a", // indicates this node is an array (not an object)
        "1": [
          // inserted at index 1
          {
            "name": "Cordoba",
            "population": 1430023
          }]
        ,
        "2": {
          // population modified at index 2 (Rosario)
          "population": [
            1137520,
            1136286
          ]
        },
        "_3": [
          // removed from index 3
          {
            "name": "La Plata"
          }, 0, 0],
        "_4": [
          // move from index 4 to index 2
          '', 2, 3]
      }
    });
  },

  updateCalcDataWithCR: async (req, res) => {
    let id = req.params.id;
    await Tag.findById(id, function (err, calcreq) {
      if (err) {
        return res.status(500).json({
          message: "Cannot find requested calc-sheet",
          data: err
        });
      } else {
        let calcId = calcreq.calcData._id;
        Calc.findByIdAndUpdate(calcId, calcreq.calcData, { new: true }, function (err, model) {
          if (err) {
            return res.status(500).json({
              message: "couldn't update calc-data",
              data: err
            });
          } else {
            return res.status(500).json({
              message: "calc-data-updated successfully.",
              data: model
            });
          }
        })
      }
    })

  }
}

var correctLevel;
function searchByPath(iffound, reqPath, level) {
  //console.log("level.name",level.name);
  if (level.custompath) {
    if (level.custompath == reqPath) {

      iffound = true;
      // console.log("ifound id true here",level)
      correctLevel = level

    } else {
      //do nothing , continue the process
    }
  }
  if (level.sublevel != null && level.sublevel.length > 0) {
    level.sublevel.map(sublevel => {
      searchByPath(iffound, reqPath, sublevel);
    })
  }
  return correctLevel;
}

async function changeSublevel(sublevel, queryObj, calcSheet) {
  var splittingStr;

  sublevel.ifcData = queryObj.data;

  while (sublevel.items.length > 0) {
    sublevel.items.pop();
  }

  sublevel.sum = 0;
  sublevel.sumHours = 0;
  sublevel.sumProfit = 0;
  sublevel.sumCompanyCost = 0;
  sublevel.sumCostPrice = 0;

  // console.log("queryObject data: ",queryObject.data);
  let row = await calculateThreedRows(sublevel, queryObj, calcSheet);
  console.log("ROW IS : ", row);
  sublevel.items = row;
  sublevel.items.map(item => {
    sublevel.sum = sublevel.sum + item.currentsalesPrice;
    sublevel.sumHrs = sublevel.sumHours + item.currentLabourHr;
    sublevel.sumProfit = sublevel.sumProfit + item.currentProfit;
    sublevel.sumCompanyCost = sublevel.sumCompanyCost + item.currentCompanyCost;
    sublevel.sumCostPrice = sublevel.sumCostPrice + item.currentCostPrice;
  });

  console.log("level.custompath: ", sublevel.custompath);
  splittingStr = sublevel.custompath.split('/');
  console.log("level.custompath splited aarry: ", splittingStr);
  splittingStr.shift(); splittingStr.pop();

  var sums = { sum: sublevel.sum, Hours: sublevel.sumHours, CompanyCost: sublevel.sumCompanyCost, CostPrice: sublevel.sumCostPrice, profit: sublevel.sumProfit };
  await calcSheet.RootArray.map(root => {
    findAdditionsForUpdateSync(root, splittingStr, sums);
  })

  calcSheet.sum = calcSheet.sum + sums.sum;
  calcSheet.totalWorkHours = calcSheet.totalWorkHours + sums.Hours;
  calcSheet.totalCompanyCost = calcSheet.totalCompanyCost + sums.CompanyCost;
  calcSheet.totalCostPrice = calcSheet.totalCostPrice + sums.CostPrice;
  calcSheet.totalprofit = calcSheet.totalprofit + sums.profit;

  return calcSheet;
}

async function addNewSublevel(level, queryObject, calcSheet) {
  //add new sublevel in this perticular level.
  var rowItems = [];
  var sum = 0;
  var sumHrs = 0;
  var sumProfit = 0;
  var sumCompanyCost = 0;
  var sumCostPrice = 0;

  // console.log("queryObject data: ",queryObject.data);
  let row = await calculateThreedRows(level, queryObject, calcSheet);
  rowItems = row;
  rowItems.map(item => {
    sum = sum + item.currentsalesPrice;
    sumHrs = sumHrs + item.currentLabourHr;
    sumProfit = sumProfit + item.currentProfit;
    sumCompanyCost = sumCompanyCost + item.currentCompanyCost;
    sumCostPrice = sumCostPrice + item.currentCostPrice;
  });

  var grpIdToAdd = calcSheet.lastGroupId + 1;
  calcSheet.lastGroupId = grpIdToAdd;
  level.sublevel.push({
    id: grpIdToAdd,
    custompath: level.custompath + "/" + grpIdToAdd,
    name: queryObject.modelName,
    items: rowItems,
    sublevel: [],
    sum: sum,
    sumHours: sumHrs,
    sumProfit: sumProfit,
    sumCompanyCost: sumCompanyCost,
    sumCostPrice: sumCostPrice,
    slopeAndArea: 0,
    isEdit: false,
    isSelected: true,
    selectedFor: level.selectedFor,
    ifcData: queryObject.data,
    modelID: queryObject.modelID,
    modelType: queryObject.modelType
  });
  var sums = { sum: sum, Hours: sumHrs, CompanyCost: sumCompanyCost, CostPrice: sumCostPrice, profit: sumProfit };

  var splittingStr = level.custompath.split('/');

  splittingStr.shift(); splittingStr.pop();

  //   splittingStr.map((str,i)=>{
  //   console.log("in here yaaaaay!!!!!! line no:2245",i,str);
  await calcSheet.RootArray.map(root => {
    var sumdata = findAdditionsForUpdateSync(root, splittingStr, sums);
  })

  calcSheet.sum = calcSheet.sum + sums.sum;
  calcSheet.totalWorkHours = calcSheet.totalWorkHours + sums.Hours;
  calcSheet.totalCompanyCost = calcSheet.totalCompanyCost + sums.CompanyCost;
  calcSheet.totalCostPrice = calcSheet.totalCostPrice + sums.CostPrice;
  calcSheet.totalprofit = calcSheet.totalprofit + sums.profit;

  return calcSheet;
}


function findAdditionsForUpdateSync(level, rootids, object) {
  console.log("rootIDS are: ", level.id);
  console.log("rootIDSinclude : ", rootids.includes((5).toString()));
  if (level.id) {
    if (rootids.includes(level.id.toString())) {
      console.log("IN TO SERCH OF ROOTID:", level.id);
      level.sum = level.sum + object.sum;
      level.sumHours = level.sumHours + object.Hours;
      level.sumProfit = level.sumProfit + object.profit;
      level.sumCompanyCost = level.sumCompanyCost + object.CompanyCost;
      level.sumCostPrice = level.sumCostPrice + object.CostPrice;
    } else {
      //no operation
    }
  } else {
    //do nothing
  }


  if (level.sublevel != null) {
    level.sublevel.forEach(item => {
      //   console.log("in SUBLEVEL ID: ",rootid);
      findAdditionsForUpdateSync(item, rootids, object);
      //console.log("come to sublevel finding: ",rootid);
    });
  } else {
    //console.log("in ELSE OF SUBLEVEL: ");
    // return rootid;
  }
}

async function calculateThreedRows(level, queryObject, calcSheet) {
  console.log("calcsheet uis:", calcSheet);
  var dataarray = [];

  for (obj of queryObject.data) {
    console.log("calling in each ");
    let currentObject = {};
    currentObject.ifc = obj;

    if (obj.hasOwnProperty("material")) {
      var material = await Material.findById(obj.material);
      console.log("MAT: ", material);

      if (material == null || material == undefined) {
        console.log("IN mat IF");
      } else {
        var MatToSave = {};
        MatToSave.objectID = obj.objectID
        MatToSave.rowStyle = 'Combined';
        MatToSave.isSelected = true;
        MatToSave.matname = material.name;
        MatToSave.workername = 'worker';

        if (obj.objectType == "3d") {
          MatToSave.matAmount = obj.volume;
          MatToSave.workerAmount = obj.volume;
        } else {
          MatToSave.matAmount = obj.area;
          MatToSave.workerAmount = obj.area;
        }

        MatToSave.matunit = obj.unit;
        MatToSave.workerunit = obj.unit;

        if (!material.currentRate) {
          material.currentRate = { materialCost: { value: 1 }, rooferCost: { value: 1 } }
        }

        MatToSave.currentRate = {
          materialCost: { value: material.currentRate.materialCost.value },
          rooferCost: { value: material.currentRate.rooferCost.value }
        };

        MatToSave.selectedFor = level.selectedFor;

        MatToSave.baseInventoryUnitPrice = MatToSave.currentRate.materialCost.value;
        MatToSave.baseWorkerUnitPrice = MatToSave.currentRate.rooferCost.value;
        MatToSave.selectedFor.map(element => {
          if (element.applyTo == "inventory" || element.applyTo == "both") {
            MatToSave.currentRate.materialCost.value = MatToSave.baseInventoryUnitPrice + (MatToSave.baseInventoryUnitPrice * (element.value / 100));

          }
          if (element.applyTo == "worker" || element.applyTo == "both") {
            MatToSave.currentRate.rooferCost.value = MatToSave.baseWorkerUnitPrice + (MatToSave.baseWorkerUnitPrice * (element.value / 100));
          }
        });

        console.log("MATTOSAVE: ", MatToSave);
        if (material.wastePercentage) {
          MatToSave.wastePercent = material.wastePercentage;
          MatToSave.wasteAmount = MatToSave.matAmount * (MatToSave.wastePercent / 100);
        } else {
          MatToSave.wastePercent = 0;
          MatToSave.wasteAmount = MatToSave.matAmount * (MatToSave.wastePercent / 100);
        }
        MatToSave.systemTag = material.systemTag;
        MatToSave.workerCostPrice = MatToSave.currentRate.rooferCost.value * MatToSave.workerAmount;

        //Inventory Cost price calculation
        var matAndWaste = MatToSave.wasteAmount + MatToSave.matAmount;
        MatToSave.inventoryCostPrice = matAndWaste * MatToSave.currentRate.materialCost.value;

        MatToSave.labourHours = MatToSave.workerAmount * (MatToSave.currentRate.rooferCost.value / calcSheet.averageWorkerCost);
        MatToSave.initialPrise = MatToSave.currentRate.materialCost.value + MatToSave.workerCostPrice;

        MatToSave.companyCostForInventory = MatToSave.inventoryCostPrice * (calcSheet.companyCost / 100);
        MatToSave.companyCostForWorker = MatToSave.workerCostPrice * (calcSheet.companyCost / 100);
        MatToSave.InventoryprofitPercent = calcSheet.companyProfit;
        MatToSave.workerprofitPercent = calcSheet.companyProfit;
        var profittempAmt = 0;
        var workerprofAmt = 0;
        MatToSave.selectedFor.map(element => {
          if (element.applyTo == "inventory" || element.applyTo == "both") {
            profittempAmt = profittempAmt + MatToSave.inventoryCostPrice * (element.value / 100);
          }
          if (element.applyTo == "worker" || element.applyTo == "both") {
            workerprofAmt = workerprofAmt + MatToSave.workerCostPrice * (element.value / 100);
          }
        });
        MatToSave.inventoryprofit = (profittempAmt + MatToSave.inventoryCostPrice + MatToSave.companyCostForInventory) * (MatToSave.InventoryprofitPercent / 100);

        MatToSave.workerProfit = (workerprofAmt + MatToSave.workerCostPrice + MatToSave.companyCostForWorker) * (MatToSave.workerprofitPercent / 100);
        MatToSave.s_price = profittempAmt + MatToSave.inventoryCostPrice + MatToSave.companyCostForInventory + MatToSave.inventoryprofit;
        MatToSave.workers_price = workerprofAmt + MatToSave.workerCostPrice + MatToSave.companyCostForWorker + MatToSave.workerProfit;
        MatToSave.currentLabourHr = MatToSave.labourHours;
        MatToSave.currentCostPrice = MatToSave.inventoryCostPrice + MatToSave.workerCostPrice;
        MatToSave.currentCompanyCost = MatToSave.companyCostForInventory + MatToSave.companyCostForWorker;
        MatToSave.currentProfit = MatToSave.inventoryprofit + MatToSave.workerProfit;
        MatToSave.currentsalesPrice = MatToSave.s_price + MatToSave.workers_price;
        dataarray.push(MatToSave);
      }
    }

    if (obj.hasOwnProperty("dcp")) {
      var material = await ComboMaterial.findById(obj.dcp);
      if (material == null || material == undefined) {
        console.log("IN mat IF");
      } else {
        console.log("IN mat fond");
        var MatToSave = {};
        MatToSave.objectID = obj.objectID
        MatToSave.rowStyle = 'Combined';
        MatToSave.isSelected = true;
        MatToSave.matname = material.name;
        MatToSave.workername = 'worker';
        if (obj.objectType == "3d") {
          MatToSave.matAmount = obj.volume;
          MatToSave.workerAmount = obj.volume;
        } else {
          MatToSave.matAmount = obj.area;
          MatToSave.workerAmount = obj.area;
        }

        MatToSave.matunit = obj.unit;
        MatToSave.workerunit = obj.unit;

        if (!material.currentRate) {
          material.currentRate = { materialCost: { value: 0 }, rooferCost: { value: 0 }, materialTotal: {value: 1}, rooferTotal: {value: 1} };
        }

        MatToSave.currentRate = {
          materialCost: { value: material.currentRate.materialTotal.value },
          rooferCost: { value: material.currentRate.rooferTotal.value }
        },

        MatToSave.selectedFor = level.selectedFor;

        MatToSave.baseInventoryUnitPrice = MatToSave.currentRate.materialCost.value;
        MatToSave.baseWorkerUnitPrice = MatToSave.currentRate.rooferCost.value;
        MatToSave.selectedFor.map(element => {
          if (element.applyTo == "inventory" || element.applyTo == "both") {
            MatToSave.currentRate.materialCost.value = MatToSave.baseInventoryUnitPrice + (MatToSave.baseInventoryUnitPrice * (element.value / 100));

          }
          if (element.applyTo == "worker" || element.applyTo == "both") {
            MatToSave.currentRate.rooferCost.value = MatToSave.baseWorkerUnitPrice + (MatToSave.baseWorkerUnitPrice * (element.value / 100));
          }
        });
        console.log("MATTOSAVE: ", MatToSave);
        if (material.wastePercentage) {
          MatToSave.wastePercent = material.wastePercentage;
          MatToSave.wasteAmount = MatToSave.matAmount * (MatToSave.wastePercent / 100);
        } else {
          MatToSave.wastePercent = 0;
          MatToSave.wasteAmount = MatToSave.matAmount * (MatToSave.wastePercent / 100);
        }
        MatToSave.systemTag = material.systemTag;
        MatToSave.workerCostPrice = MatToSave.currentRate.rooferCost.value * MatToSave.workerAmount;
        //Inventory Cost price calculation
        console.log("calcSheet.averageWorkerCost:", calcSheet.averageWorkerCost);
        var matAndWaste = MatToSave.wasteAmount + MatToSave.matAmount;
        MatToSave.inventoryCostPrice = matAndWaste * MatToSave.currentRate.materialCost.value;

        MatToSave.labourHours = MatToSave.workerAmount * (MatToSave.currentRate.rooferCost.value / calcSheet.averageWorkerCost);
        MatToSave.initialPrise = MatToSave.currentRate.materialCost.value + MatToSave.workerCostPrice;

        MatToSave.companyCostForInventory = MatToSave.inventoryCostPrice * (calcSheet.companyCost / 100);
        MatToSave.companyCostForWorker = MatToSave.workerCostPrice * (calcSheet.companyCost / 100);
        MatToSave.InventoryprofitPercent = calcSheet.companyProfit;
        MatToSave.workerprofitPercent = calcSheet.companyProfit;
        var profittempAmt = 0;
        var workerprofAmt = 0;
        MatToSave.selectedFor.map(element => {
          if (element.applyTo == "inventory" || element.applyTo == "both") {
            profittempAmt = profittempAmt + MatToSave.inventoryCostPrice * (element.value / 100);
          }
          if (element.applyTo == "worker" || element.applyTo == "both") {
            workerprofAmt = workerprofAmt + MatToSave.workerCostPrice * (element.value / 100);
          }
        });
        MatToSave.inventoryprofit = (profittempAmt + MatToSave.inventoryCostPrice + MatToSave.companyCostForInventory) * (MatToSave.InventoryprofitPercent / 100);

        MatToSave.workerProfit = (workerprofAmt + MatToSave.workerCostPrice + MatToSave.companyCostForWorker) * (MatToSave.workerprofitPercent / 100);
        MatToSave.s_price = profittempAmt + MatToSave.inventoryCostPrice + MatToSave.companyCostForInventory + MatToSave.inventoryprofit;
        MatToSave.workers_price = workerprofAmt + MatToSave.workerCostPrice + MatToSave.companyCostForWorker + MatToSave.workerProfit;
        MatToSave.currentLabourHr = MatToSave.labourHours;
        MatToSave.currentCostPrice = MatToSave.inventoryCostPrice + MatToSave.workerCostPrice;
        MatToSave.currentCompanyCost = MatToSave.companyCostForInventory + MatToSave.companyCostForWorker;
        MatToSave.currentProfit = MatToSave.inventoryprofit + MatToSave.workerProfit;
        MatToSave.currentsalesPrice = MatToSave.s_price + MatToSave.workers_price;

        dataarray.push(MatToSave);
      }
    }

    if (obj.hasOwnProperty("equipment")) {
      var material = await Equipment.findById(obj.equipment);
      if (material == null || material == undefined) {
        console.log("IN mat IF");
      } else {
        console.log("IN mat fond");

        var MatToSave = {};
        MatToSave.objectID = obj.objectID
        MatToSave.rowStyle = 'Combined';
        MatToSave.isSelected = true;
        MatToSave.matname = material.name;
        MatToSave.workername = 'worker';
        if (obj.objectType == "3d") {
          MatToSave.matAmount = obj.volume;
          MatToSave.workerAmount = obj.volume;
        } else {
          MatToSave.matAmount = obj.area;
          MatToSave.workerAmount = obj.area;
        }

        MatToSave.matunit = obj.unit;
        MatToSave.workerunit = obj.unit;

        if (!material.currentRate.rooferCost) {
          material.currentRate.rooferCost = {};
          material.currentRate.rooferCost.value = 0;
        }
        if (!material.currentRate.equipmentCost) {
          material.currentRate.equipmentCost = {};
          material.currentRate.equipmentCost.value = 0;
        }

        MatToSave.currentRate = {
          rooferCost: { value: material.currentRate.rooferCost.value },
          materialCost: { value: material.currentRate.equipmentCost.value }
        };

        MatToSave.selectedFor = level.selectedFor;

        MatToSave.baseInventoryUnitPrice = MatToSave.currentRate.materialCost.value;
        MatToSave.baseWorkerUnitPrice = MatToSave.currentRate.rooferCost.value;
        MatToSave.selectedFor.map(element => {
          if (element.applyTo == "inventory" || element.applyTo == "both") {
            MatToSave.currentRate.materialCost.value = MatToSave.baseInventoryUnitPrice + (MatToSave.baseInventoryUnitPrice * (element.value / 100));
          }

          if (element.applyTo == "worker" || element.applyTo == "both") {
            MatToSave.currentRate.rooferCost.value = MatToSave.baseWorkerUnitPrice + (MatToSave.baseWorkerUnitPrice * (element.value / 100));
          }
        });
        console.log("MATTOSAVE: ", MatToSave);
        if (material.wastePercentage) {
          MatToSave.wastePercent = material.wastePercentage;
          MatToSave.wasteAmount = MatToSave.matAmount * (MatToSave.wastePercent / 100);
        } else {
          MatToSave.wastePercent = 0;
          MatToSave.wasteAmount = MatToSave.matAmount * (MatToSave.wastePercent / 100);
        }
        MatToSave.systemTag = material.systemTag;
        MatToSave.workerCostPrice = MatToSave.currentRate.rooferCost.value * MatToSave.workerAmount;
        //Inventory Cost price calculation
        console.log("calcSheet.averageWorkerCost:", calcSheet.averageWorkerCost);
        var matAndWaste = MatToSave.wasteAmount + MatToSave.matAmount;
        MatToSave.inventoryCostPrice = matAndWaste * MatToSave.currentRate.materialCost.value;

        MatToSave.labourHours = MatToSave.workerAmount * (MatToSave.currentRate.rooferCost.value / calcSheet.averageWorkerCost);
        MatToSave.initialPrise = MatToSave.currentRate.materialCost.value + MatToSave.workerCostPrice;

        MatToSave.companyCostForInventory = MatToSave.inventoryCostPrice * (calcSheet.companyCost / 100);
        MatToSave.companyCostForWorker = MatToSave.workerCostPrice * (calcSheet.companyCost / 100);
        MatToSave.InventoryprofitPercent = calcSheet.companyProfit;
        MatToSave.workerprofitPercent = calcSheet.companyProfit;
        var profittempAmt = 0;
        var workerprofAmt = 0;
        MatToSave.selectedFor.map(element => {
          if (element.applyTo == "inventory" || element.applyTo == "both") {
            profittempAmt = profittempAmt + MatToSave.inventoryCostPrice * (element.value / 100);
          }
          if (element.applyTo == "worker" || element.applyTo == "both") {
            workerprofAmt = workerprofAmt + MatToSave.workerCostPrice * (element.value / 100);
          }
        });
        MatToSave.inventoryprofit = (profittempAmt + MatToSave.inventoryCostPrice + MatToSave.companyCostForInventory) * (MatToSave.InventoryprofitPercent / 100);

        MatToSave.workerProfit = (workerprofAmt + MatToSave.workerCostPrice + MatToSave.companyCostForWorker) * (MatToSave.workerprofitPercent / 100);
        MatToSave.s_price = profittempAmt + MatToSave.inventoryCostPrice + MatToSave.companyCostForInventory + MatToSave.inventoryprofit;
        MatToSave.workers_price = workerprofAmt + MatToSave.workerCostPrice + MatToSave.companyCostForWorker + MatToSave.workerProfit;
        MatToSave.currentLabourHr = MatToSave.labourHours;
        MatToSave.currentCostPrice = MatToSave.inventoryCostPrice + MatToSave.workerCostPrice;
        MatToSave.currentCompanyCost = MatToSave.companyCostForInventory + MatToSave.companyCostForWorker;
        MatToSave.currentProfit = MatToSave.inventoryprofit + MatToSave.workerProfit;
        MatToSave.currentsalesPrice = MatToSave.s_price + MatToSave.workers_price;
        dataarray.push(MatToSave);
      }
    }
  }

  return dataarray;
}

function createFn() {
  console.log("in create function");


}
function updateFn() {
  console.log("in update function");
}