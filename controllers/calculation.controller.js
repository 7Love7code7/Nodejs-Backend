const request = require("request");
const Tag = require("../models/calculations.model");
const calcversion = require("../models/CalcSheetVersion.model")
const mongoose = require("mongoose");
const __ = require("../helper/globals");
const proj = require("../models/project.model");
const mongoXlsx = require("mongo-xlsx");
const async = require("async");
const fs = require("fs");
const Material = require("../models/material.model");
const Equipment = require("../models/equipment.model");
const ComboMaterial = require("../models/comboMaterial.model");
const mime = require("mime-types");
var Excel = require("exceljs");
var XLSX = require("xlsx");
const fx = require("money"),
  moment = require("moment");
var multer = require("multer");
const _ = require("lodash");
const EntityTag = require("../models/entityTag.model");
const ongoingCalc = require("../models/OngoingCalcChangeRequest.model");
const calcChangeRequest = require("../models/calcChangeRequest.model");
const Company = require("../models/company.model");

let searchArr = [];
let calcArry = [];
let subLevelAdded = '';
let sublevelRoot = '';
let arraylevelUpdate = {}; let sumToChange = {};
var Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./Files");
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  }
});
var upload = multer({
  storage: Storage
}).array("file", 1);


module.exports = {
  createSheet: async (req, res) => {
    console.log("CREATE ");
    try {
      //check if corresponding sheet already exists.
      let sheet = await Tag.findOne({ projectId: req.body.projectId });
      if (sheet) {
        console.log("sheet found");
        let user = req.user;
        var calcVersions = [];
        var version;
        let calcSheet = sheet;

        var calcOldData = {
          RootArray: calcSheet.RootArray,
          rateLog: calcSheet.rateLog,
          projectId: calcSheet.projectId,
          companyId: calcSheet.companyId,
          hierarchicalCostSeqLast: calcSheet.hierarchicalCostSeqLast,
          lastGroupId: calcSheet.lastGroupId,
          companyCurrency: calcSheet.companyCurrency,
          companyProfit: calcSheet.companyProfit,
          companyCost: calcSheet.companyCost,
          sum: calcSheet.sum,
          totalprofit: calcSheet.totalprofit,
          totalAdminCost: calcSheet.totalAdminCost,
          totalWorkHours: calcSheet.totalWorkHours,
          totalCompanyCost: calcSheet.totalCompanyCost,
          totalCostPrice: calcSheet.totalCostPrice,
          averageWorkerCost: calcSheet.averageWorkerCost,
          additionalCosts: calcSheet.additionalCosts,
          created: calcSheet.created
        }

        // save to version list
        let newVersionSheet = new calcversion(calcOldData);
        console.log("newVersionSheet", newVersionSheet);
        newVersionSheet.save();

        if (calcSheet.currentVersion) {
          version = calcSheet.currentVersion + 1;
        } else {
          version = calcSheet.versioning.length;
        }

        console.log("version: ", version);
        let versioning = {
          versionSeq: version,
          savedBy: user.firstName + " " + user.lastName,
          olderCalcSheetVersionId: newVersionSheet._id,
          sum: req.body.sum,
          totalCompanyCost: req.body.totalCompanyCost,
          totalWorkHours: req.body.totalWorkHours,
          totalProfit: req.body.totalprofit,
          totalCostPrice: req.body.totalCostPrice
        };
        calcSheet.versioning.push(versioning);

        calcVersions = calcSheet.versioning;
        console.log("calcversionnis: ", calcVersions);

        let currentData = req.body;
        currentData.currentVersion = version;
        currentData.versioning = calcVersions;

        let updatedSheet = await Tag.findOneAndUpdate({ _id: sheet._id }, currentData);
        if (updatedSheet) {
          return res.status(200).json({
            message: "Sheet updated successfully",
            data: updatedSheet
          });
        } else {
          return res.status(500).json({
            message: "Couldn't update sheet.",
            data: 'error'
          });
        }
      } else {
        console.log("create new sheet");

        let user = req.user;
        let currencyObj = {
          currencyCode: req.body.companyCurrency.cc,
          date: moment().format(),
        };
        let versioning = {
          versionSeq: 1,
          savedBy: user.firstName + " " + user.lastName,
          sum: req.body.sum,
          totalCompanyCost: req.body.totalCompanyCost,
          totalWorkHours: req.body.totalWorkHours,
          totalProfit: req.body.totalprofit,
          totalCostPrice: req.body.totalCostPrice,
          versionMessage: req.body.verionMessage
        };
        let tag = {};
        tag = req.body;
        tag.companyId = user.companyId;
        tag.rateLog = [currencyObj];
        tag.currentVersion = 1,
        tag.versioning = [versioning];

        let newTag = new Tag(tag);
        let tagObj = await newTag.save();
        console.log("CREATED ");
        /**update project with calc-sheet Id */
        let project = await proj.findByIdAndUpdate({ _id: req.body.projectId }, {
          $set: {
            "calcSheetId": tagObj._id
          }
        });
        return res.status(200).json({
          message: "Sheet created successfully",
          data: tagObj
        });
      }
    } catch (e) {
      console.error(e);
      return res.status(500).json({
        message: "Internal server error",
        data: e
      });
    }
  },
  getVersions: async (req, res) => {

    try {
      let id = req.params.id;
      await Tag.findById(id, function (err, calcdata) {
        if (err) {
          return res.status(500).json({
            message: "requested data not found"
          });
        } else {

          var versions = calcdata.versioning;
          return res.status(200).json({
            message: "versioning found.",
            data: versions
          });

        }
      })
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error", data: e
      });
    }
  },

  getSheet: async (req, res) => {
    console.log("REACHED HERE..", req.params.id);
    try {
      let id = req.params.id;
      let project = await proj.findById({ _id: id });
      console.log("project:", project.projectName);
      if (!project) {
        console.log("project:", project.projectName);
        return res.status(200).json({
          message: "requested project Id not found"
        });
      } else {
        console.log("reached in else:", project._id);
        if (!project.calcSheetId) {
          return res.status(200).json({
            message: "Sheet for request project does not exists."
          });
        } else {
          let sheet = await Tag.findById({ _id: project.calcSheetId })
          if (!sheet) {
            return res.status(200).json({
              message: "No sheet found."
            });
          } else {

            return res.status(200).json({
              message: "sheet found.",
              data: sheet
            });
          }
        }
      }
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error", data: e
      });
    }
  },

  deleteSheet: async (req, res) => {
    try {

    } catch (e) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getOrCreateSheet: async (req, res) => {
    console.log("REACHED HERE..", req.params.id);
    try {
      let id = req.params.id;
      let project = await proj.findById({ _id: id });
      console.log("project:", project.projectName);
      if (!project) {
        console.log("project:", project.projectName);
        return res.status(200).json({
          message: "requested project Id not found"
        });
      } else {
        console.log("reached in else:", project._id);
        if (project.calcSheetId) {
          let sheet = await Tag.findById({ _id: project.calcSheetId })
          if (sheet) {
            return res.status(200).json({
              message: "sheet found.",
              data: sheet
            });
          }
        }

        // create calculation sheet
        let user = req.user;
        let currencyObj = {
          currencyCode: "INR",
          date: moment().format(),
        };
        let versioning = {
          versionSeq: 1,
          savedBy: user.firstName + " " + user.lastName,
          sum: 0,
          totalCompanyCost: 0,
          totalWorkHours: 0,
          totalProfit: 0,
          totalCostPrice: 0,
          versionMessage: "1"
        };
        let tag = {
          RootArray: [
            {
              custompath: "Root/1",
              id: 1,
              isEdit: false,
              isSelected: true,
              items: [{ rowStyle: "Inventory" }, { rowStyle: "Inventory" }],
              name: "Group_1",
              selectedFor: [
                { addCostSeq: 1, applyTo: "both", value: 0, name: "Administrators cost" },
                { addCostSeq: 2, applyTo: "both", value: 0, name: "Risk profile" },
                { addCostSeq: 3, applyTo: "both", value: 10, name: "Company Cost" }
              ],
              slopeAndArea: 0,
              sublevel: [],
              sum: 0,
              sumCompanyCost: 0,
              sumCostPrice: 0,
              sumHours: 0,
              sumProfit: 0
            },
            {
              custompath: "Root/2",
              id: 1,
              isEdit: false,
              isSelected: true,
              items: [{ rowStyle: "Inventory" }, { rowStyle: "Inventory" }],
              name: "Group_2",
              selectedFor: [
                { addCostSeq: 1, applyTo: "both", value: 0, name: "Administrators cost" },
                { addCostSeq: 2, applyTo: "both", value: 0, name: "Risk profile" },
                { addCostSeq: 3, applyTo: "both", value: 10, name: "Company Cost" }
              ],
              slopeAndArea: 0,
              sublevel: [],
              sum: 0,
              sumCompanyCost: 0,
              sumCostPrice: 0,
              sumHours: 0,
              sumProfit: 0
            }
          ],
          additionalCosts: [
            {addCostSeq: 1, name: "Administrators cost", value: 0, applyTo: "both"},
            {addCostSeq: 2, name: "Risk profile", value: 0, applyTo: "both"},
            {addCostSeq: 3, name: "Company Cost", value: 10, applyTo: "both"}
          ],
          averageWorkerCost: 20743.036697484058,
          companyCost: 10,
          companyCurrency: {cc: "INR", symbol: "₹", name: "Indian rupee"},
          companyProfit: 15,
          hierarchicalCostSeqLast: 3,
          lastGroupId: 2,
          sum: 0,
          totalCompanyCost: 0,
          totalCostPrice: 0,
          totalWorkHours: 0,
          totalprofit: 0,
          versionMessage: "1",
          companyId: user.companyId,
          rateLog: [currencyObj],
          currentVersion: 1,
          versioning: [versioning],
          projectId: id
        };

        let newTag = new Tag(tag);
        let tagObj = await newTag.save();
        console.log("CREATED ");
        /**update project with calc-sheet Id */
        await proj.findByIdAndUpdate({ _id: id }, {
          $set: {
            "calcSheetId": tagObj._id
          }
        });
        return res.status(200).json({
          message: "sheet found.",
          data: tagObj
        });
      }
    } catch (e) {
      console.error("error", e);
      return res.status(500).json({
        message: "Internal server error", data: e
      });
    }
  },

  calcDataStats: async (req, res) => {
    try {
      let id = req.params.id;
      let project = await proj.findById({ _id: id });
      if (!project) {
        return res.status(500).json({
          message: "requested project Id not found"
        });
      } else {
        let sheet = await Tag.findById({ _id: project.calcSheetId })

        if (sheet) {

          await sheet.RootArray.forEach(level => {
            console.log("LEVEL HERE", level.name);
            searchTree(level);
          });

          var grouped = searchArr.reduce((acc, obj) => {
            var existItem = acc.find(item => item.name === obj.name);
            if (existItem) {
              existItem.totalAmount += obj.totalAmount;
              existItem.totalSalesPrice += obj.totalSalesPrice;
              return acc;
            }
            acc.push(obj);
            return acc;
          }, []);

          return res.status(200).json({
            message: "data stat",
            data: grouped
          });
        } else {
          return res.status(200).json({
            message: "Sheet for requested project does not exist."
          });
        }
      }
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
        data: e
      });
    }
  },
  getQuoteDataFromCalc: async (req, res) => {
    try {
      let id = req.params.id;
      let project = await proj.findById({ _id: id });
      if (!project) {
        return res.status(500).json({
          message: "requested project Id not found"
        });
      } else {
        let sheet = await Tag.findById({ _id: project.calcSheetId });
        let QueteObj = {};
        let totalNetAmount = 0;
        if (sheet) {
          let groups = [];
          sheet.RootArray.map(level => {
            let lvlObject = {};
            let groupSum = 0;
            let groupNet = 0;
            lvlObject.groupName = level.name;
            if (level.items) {
              let Items = [];
              console.log("items in if");
              var allItems = findAndCalculateItems(level, groupSum, groupNet, Items);
              console.log("allItems", allItems);
              //  level.items.map(item=>{
              //       var itemObj={};
              //       if(item!=null){
              //           itemObj.name = item.name;
              //           itemObj.totalAmount = item.Amount;
              //           itemObj.totalSalesPrice = item.s_price;
              //           groupSum = groupSum+item.s_price;
              //           groupNet = groupSum *(1+(sheet.adminCost /100))*(1+(sheet.riskProfile/100));

              //       }else{
              //           console.log("no item found");
              //       }
              //       Items.push(itemObj);
              //   });

              lvlObject.groupSum = allItems.levelSum;
              lvlObject.groupNet = allItems.levelNet
              lvlObject.Items = allItems.Items;
              totalNetAmount = totalNetAmount + lvlObject.groupNet;

            } else {
              console.log("No items exists.");
            }

            groups.push(lvlObject);

          });


          QueteObj.currency = sheet.companyCurrency,
            QueteObj.totalNetAmount = totalNetAmount,
            QueteObj.groups = groups;
          console.log("QUOTE OBJ: ", QueteObj);
          return res.status(200).json({
            message: "data",
            data: QueteObj
          });
        }
        else {
          return res.status(304).json({
            message: "No data sheet"

          });
        }
      }
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
        data: e
      });
    }
  },

  getTotalSales: async (req, res) => {
    try {
      let id = req.params.id;
      let project = await proj.findById({ _id: id });
      if (!project) {
        return res.status(500).json({
          message: "requested project Id not found"
        });
      } else {
        let sheet = await Tag.findById({ _id: project.calcSheetId })
        if (sheet) {
          let salesPrice = { totalSalesPrice: sheet.totalSalesPrice, TotalSales: sheet.sum };
          return res.status(200).json({
            data: salesPrice
          });
        } else {
          return res.status(404).json({
            message: "Sheet for requested project does not exist."
          });
        }
      }
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getCalcSheetExcel: async (req, res) => {
    try {
      let id = req.params.id;
      console.log("id is:", id);
      let sheet = await Tag.findById({ _id: id });
      if (!sheet) {
        return res.status(200).json({
          message: "No sheet found."
        });
      }
      var workbook = new Excel.Workbook();
      console.log("WORKBOOK: ", workbook);
      var worksheet = workbook.addWorksheet(sheet._id, {
        pageSetup: {
          paperSize: 9,
          orientation: "landscape"
        },
        views: [{ state: "frozen", ySplit: 1 }]
      });

      worksheet.columns = [
        {
          header: "LevelId",
          key: "levelId",
          width: 10
        },
        {
          header: "Level",
          key: "id",
          width: 10
        },
        {
          header: "RowStyle",
          key: "rowStyle",
          width: 32
        },
        {
          header: "ItemName",
          key: "name",
          width: 32
        },
        {
          header: "EntityTag",
          key: "systemTag",
          width: 32
        },
        {
          header: "Amount",
          key: "Amount",
          width: 10,
          outlineLevel: 1
        },
        {
          header: "Unit",
          key: "unit",
          width: 32
        },
        {
          header: "unitCost",
          key: "unitcost",
          width: 32
        },
        {
          header: "AdditionalCostKeys",
          key: "additionalCost",
          width: 32
        },
        {
          header: "WastePercent",
          key: "wastePercent",
          width: 32
        },
        {
          header: "LabourHours",
          key: "labourHours",
          width: 32
        },
        {
          header: "costPrice",
          key: "costPrice",
          width: 32
        },
        {
          header: "Companycost",
          key: "companyCost",
          width: 32
        },
        {
          header: "ProfitPercent",
          key: "profitPercent",
          width: 32
        },
        {
          header: "Profit",
          key: "profit",
          width: 32
        },
        {
          header: "SalesPrice",
          key: "s_price",
          width: 32
        },

      ];


      await sheet.RootArray.forEach(async (level, index) => {

        if (calcArry.length > 0) {
          calcArry = [];
        }
        var levelname = worksheet.addRow({
          id: index + 1 + "-" + level.name
        });
        levelname.font = {
          size: 12,
          bold: true
        };
        searchTreeToAddRow(level, index);
        async.each(
          calcArry,
          function (item, callback) {
            if (item.rowStyle == "Combined") {
              worksheet.addRow({
                levelId: item.levelId,
                id: item.id,
                rowStyle: item.rowStyle + '-Material',
                name: item.matname,
                systemTag: item.systemTag,
                Amount: item.matAmount,
                unit: item.matUnit,
                unitcost: item.matm_cost.value,
                wastePercent: item.matwaste,
                additionalCost: item.additionalCost,
                labourHours: "",
                costPrice: item.matcostPrice,
                companyCost: item.matcompanyCost,
                profitPercent: item.matprofitper,
                profit: item.matprofit,
                s_price: item.matsalesPrice
              });
              worksheet.addRow({
                levelId: item.levelId,
                id: item.id,
                rowStyle: item.rowStyle + '-Worker',
                name: item.workername,
                systemTag: item.systemTag,
                Amount: item.workerAmount,
                unit: item.workerUnit,
                unitcost: item.worker_cost.value,
                wastePercent: "",
                additionalCost: item.additionalCost,
                labourHours: item.labourHr,
                costPrice: item.workercostPrice,
                companyCost: item.workercompanyCost,
                profitPercent: item.workerprofitper,
                profit: item.workerprofit,
                s_price: item.workersalesPrice
              });
              worksheet.addRow({});
            }
            if (item.rowStyle == "Inventory") {
              worksheet.addRow({
                levelId: item.levelId,
                id: item.id,
                rowStyle: item.rowStyle,
                name: item.matname,
                systemTag: item.systemTag,
                Amount: item.matAmount,
                unit: item.matUnit,
                unitcost: item.matm_cost.value,
                wastePercent: item.matwaste,
                additionalCost: item.additionalCost,
                labourHours: "",
                costPrice: item.matcostPrice,
                companyCost: item.matcompanyCost,
                profitPercent: item.matprofitper,
                profit: item.matprofit,
                s_price: item.matsalesPrice
              });
              worksheet.addRow({});
            }
            if (item.rowStyle == "Worker") {
              worksheet.addRow({
                levelId: item.levelId,
                id: item.id,
                rowStyle: item.rowStyle,
                name: item.workername,
                systemTag: item.systemTag,
                Amount: item.workerAmount,
                unit: item.workerUnit,
                unitcost: item.worker_cost.value,
                wastePercent: "",
                additionalCost: item.additionalCost,
                labourHours: item.labourHr,
                costPrice: item.workercostPrice,
                companyCost: item.workercompanyCost,
                profitPercent: item.workerprofitper,
                profit: item.workerprofit,
                s_price: item.workersalesPrice
              });
              worksheet.addRow({});
            }

          });
        var totalrow = worksheet.addRow({
          id: level.name,
          rowStyle: 'Total',
          costPrice: level.sumCostPrice,
          labourHours: level.sumHours,
          companyCost: level.sumCompanyCost,
          profit: level.sumProfit,
          s_price: level.sum
        });
        totalrow.font = {
          bold: true
        };
        totalrow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'cccccc' }
        };

        worksheet.addRow({});
        console.log("Added blank row");
      });
      let final = worksheet.addRow({
        id: 'GrandTotal',
        s_price: sheet.sum
      });
      final.font = {
        bold: true
      }
      final.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'cccccc' }
      };
      worksheet.addRow({});
      worksheet.addRow({});

      var workerCostdata = worksheet.addRow({
        id: "Average worker cost",
        rowStyle: sheet.averageWorkerCost
      });
      workerCostdata.font = {
        bold: true
      };
      var workerCostdata = worksheet.addRow({
        id: "Global profit",
        rowStyle: sheet.companyProfit
      });
      workerCostdata.font = {
        bold: true
      };

      var workerCostdata = worksheet.addRow({
        id: "Compnay cost",
        rowStyle: sheet.companyCost
      });
      workerCostdata.font = {
        bold: true
      };
      worksheet.addRow({});
      var workerCostdata = worksheet.addRow({
        id: "Additional Costs",
      });
      workerCostdata.font = {
        bold: true
      };
      var workerCostdata = worksheet.addRow({
        id: "Key Number",
        rowStyle: "Name",
        name: "value",
        systemTag: "Apply To",

      });
      workerCostdata.font = {
        size: 12,
        bold: true
      };
      sheet.additionalCosts.map(cost => {
        var workerCostdata = worksheet.addRow({
          id: cost.addCostSeq,
          rowStyle: cost.name,
          name: cost.value,
          systemTag: cost.applyTo,

        });
        workerCostdata.font = {
          bold: true
        };
      })
      worksheet.addRow({});


      console.log("DONE WITH ALL ROWS ,,,,");
      let fileName = "calc.xlsx";
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + fileName
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      workbook.xlsx.write(res).then(function () {

        res.end()

      });


    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
        data: e
      });
    }
  },



  uploadCalculationData: async (req, res) => {
    let SHEETARR = [];
    try {
      upload(req, res, async function (err) {
        // added async here
        if (err) {
          return res.end("Something went wrong!" + err);
        }
        var File = req.files[0].path;
        var workbook = XLSX.readFile(File);
        var sheet_name_list = workbook.SheetNames;

        let sheetToUpdate = await Tag.findById({ _id: sheet_name_list[0] });

        if (!sheetToUpdate) {
          return res.status(200).json({
            message: "No sheet found."
          });
        }
        else {
          let Costs = [];
          let GlobalAverageWorkerCost = 0; let GlobalProfit = 0; let GlobalCompanyCost = 0;
          var currentLevel = ''; var currentLevelId = 0;
          var excelsheet = workbook.Sheets[sheet_name_list[0]];
          var sheetRows = XLSX.utils.sheet_to_json(excelsheet);
          await sheetRows.map((row, index) => {
            if (row.Level == "Average worker cost") {
              GlobalAverageWorkerCost = row.RowStyle;
            }
            if (row.Level == "Global profit") {
              GlobalProfit = row.RowStyle;
            }
            if (row.Level == "Compnay cost") {
              GlobalCompanyCost = row.RowStyle;
            }

            if (row.EntityTag == 'both' || row.EntityTag == 'inventory' || row.EntityTag == 'worker') {
              Costs.push({
                addCostSeq: parseInt(row.Level),
                name: row.RowStyle,
                value: parseInt(row.ItemName),
                applyTo: row.EntityTag
              })
            }
            sheetToUpdate.additionalCosts = Costs
          });

          await sheetRows.map((row, index) => {
            console.log("ITERATION:", index);
            var salesPriceTotal = 0;
            // if(!row.LevelId && row.Level && !row.RowStyle && !row.ItemName && !row.EntityTag ){
            //   if(row.Level.includes('-')){
            //     var lvl=row.Level.split('-');
            //     currentLevelId=lvl[0];
            //     currentLevel =lvl[1];
            //   }
            // }
            if (row.LevelId) {
              console.log("current row is: ", row);
              var itemIndex = row.LevelId;

              //console.log("row level id found ",row.LevelId);
              if (row.LevelId == 'sublevel') {
                console.log("new Sublevel");
                let sublevelName = row.Level.split('/');

                sheetToUpdate.RootArray.forEach(grp => {
                  addSublevel(row, sublevelName, grp, sheetToUpdate.lastGroupId);
                })

              }
              if (row.LevelId == 'group') {
                sheetToUpdate.RootArray.push({
                  id: ++sheetToUpdate.lastGroupId,
                  custompath: "Root/" + sheetToUpdate.lastGroupId,
                  name: row.Level,
                  items: [{ rowStyle: "Inventory" }, { rowStyle: "Inventory" }],
                  sublevel: [],
                  sum: 0,
                  sumHours: 0,
                  sumProfit: 0,
                  sumCompanyCost: 0,
                  sumCostPrice: 0,
                  slopeAndArea: 0,
                  isEdit: false,
                  isSelected: true,
                  selectedFor: Costs
                });
              }
              else {
                if (!row.AdditionalCostKeys) {
                  row.AdditionalCostKeys = '1,2,3'
                }
                var selectedCosts = row.AdditionalCostKeys.split(',');
                sheetToUpdate.RootArray.map(group => {
                  if (row.RowStyle == 'Inventory' || row.RowStyle == 'Combined-Material') {
                    var addingItemInArray = addingItem(row, group, itemIndex, Costs, selectedCosts, 'mat', sheetToUpdate.companyProfit);
                  } else if (row.RowStyle == 'Worker' || row.RowStyle == 'Combined-Worker') {
                    var addingItemInArray = addingItem(row, group, itemIndex, Costs, selectedCosts, 'worker', sheetToUpdate.companyProfit);
                  } else {
                    //not adding item
                  }
                  // else if(row.RowStyle=='Combined-Material'){
                  //     var addingItemInArray = addingItem(row,group,itemIndex,Costs,selectedCosts,'mat',sheetToUpdate.companyProfit,currentLevel,currentLevelId);
                  // }else if(row.RowStyle=='Combined-Worker'){
                  //     var addingItemInArray = addingItem(row,group,itemIndex,Costs,selectedCosts,'worker',sheetToUpdate.companyProfit,currentLevel,currentLevelId);
                  // }
                })
              }
            } else {
              //console.log("in els eof level Id")
            }
          });
          console.log("checked with all rows");
          sheetToUpdate.sum = 0; var companyworkerCost = sheetToUpdate.averageWorkerCost; var companyProfitper = sheetToUpdate.companyProfit
          var companyCostper = sheetToUpdate.companyCost;

          await sheetToUpdate.RootArray.forEach(group => {
            //  console.log("IN GRoup",sheetToUpdate.sum);
            let searchingGrp = group;
            let elementafterrecursion = CalcinventoryRefresh(group, searchingGrp, companyCostper, companyworkerCost, companyProfitper);
            sheetToUpdate.sum = sheetToUpdate.sum + group.sum;
            //console.log("IN GRoupcompletes",sheetToUpdate.sum);
          });
          let setOperation = {
            $set: {
              averageWorkerCost: sheetToUpdate.averageWorkerCost,
              sum: sheetToUpdate.sum,
              RootArray: sheetToUpdate.RootArray,
              lastGroupId: sheetToUpdate.lastGroupId,
              additionalCosts: sheetToUpdate.additionalCosts
            }
          };
          await Tag.bulkWrite([
            {
              updateOne: {
                filter: {
                  _id: sheetToUpdate._id
                },
                update: setOperation
              }
            }
          ])
          //await sheetToUpdate.save();
          console.log("SAVED!!");
        }
        var fs = require("fs");
        var filePath = File;
        fs.unlinkSync(filePath);
        return res.status(200).json({
          message: "file imported successfully."
        });
      });
    } catch (e) {
      res.json(e);
    }
  },

  createOngoingCalcChangeReq: async (req, res) => {
    console.log("req.company", req.user.companyId);
    let changeRequestData = req.body;

    let levelfound; var foundLevel = false;
    if (!changeRequestData.calcSheetId) {
      //If no calcsheet Id in request is sent create new calc object.
      var company = await Company.findById({ _id: req.user.companyId });
      if (company) {
        let calcObj = {
          additionalCosts: [
            { addCostSeq: 1, name: "Administrators cost", value: 0, applyTo: "both" },
            { addCostSeq: 2, name: "Risk profile", value: 0, applyTo: "both" },
            { addCostSeq: 3, name: "Company Cost", value: 0, applyTo: "both" }
          ],
          companyCurrency: { cc: company.currentCurrency.currencyCode },
          projectId: changeRequestData.projectID,
          averageWorkerCost: company.averageWorkerCost,
          companyProfit: company.profit,
          companyCost: company.companyCost,
          hierarchicalCostSeqLast: 3,
          lastGroupId: 2,
          companyId: company._id,
          RootArray: [
            {
              id: 1,
              custompath: "Root/1",
              name: "",
              items: [{ rowStyle: "Inventory" }, { rowStyle: "Inventory" }],
              sublevel: [],
              sum: 0,
              sumHours: 0,
              sumProfit: 0,
              sumCompanyCost: 0,
              sumCostPrice: 0,
              slopeAndArea: 0,
              isEdit: false,
              isSelected: true,
              selectedFor: [
                { addCostSeq: 1, name: "Administrators cost", value: 0, applyTo: "both" },
                { addCostSeq: 2, name: "Risk profile", value: 0, applyTo: "both" },
                { addCostSeq: 3, name: "Company Cost", value: 0, applyTo: "both" }
              ]
            },
            {
              id: 2,
              custompath: "Root/2",
              name: "",
              items: [{ rowStyle: "Inventory" }, { rowStyle: "Inventory" }],
              sublevel: [],
              sum: 0,
              sumHours: 0,
              sumProfit: 0,
              sumCompanyCost: 0,
              sumCostPrice: 0,
              slopeAndArea: 0,
              isEdit: false,
              isSelected: true,
              selectedFor: [
                { addCostSeq: 1, name: "Administrators cost", value: 0, applyTo: "both" },
                { addCostSeq: 2, name: "Risk profile", value: 0, applyTo: "both" },
                { addCostSeq: 3, name: "Company Cost", value: 0, applyTo: "both" }
              ]
            }
          ],
          versioning: [
            {
              versionSeq: 1,
              savedBy: req.user.firstName, sum: 0, totalCompanyCost: 0, totalCostPrice: 0, totalProfit: 0, totalWorkHours: 0
            }
          ],
          currentVersion: 1,
          sum: 0, totalCompanyCost: 0, totalCostPrice: 0, totalProfit: 0, totalWorkHours: 0
        }

        let newCalcObj = new Tag(calcObj);
        var sheet = await newCalcObj.save();

        var rowItems = []; var sum = 0; var sumHrs = 0; var sumProfit = 0; var sumCompanyCost = 0; var sumCostPrice = 0;
        // console.log("queryObject data: ",queryObject.data);
        let level = { selectedFor: sheet.additionalCosts };
        await calculateThreedRows(level, changeRequestData, sheet, function (err, row, callback) {
          if (err) {
            return done(Error(err));
          } else {
            rowItems = row;
            rowItems.map(item => {
              sum = sum + item.currentsalesPrice;
              sumHrs = sumHrs + item.currentLabourHr;
              sumProfit = sumProfit + item.currentProfit;
              sumCompanyCost = sumCompanyCost + item.currentCompanyCost;
              sumCostPrice = sumCostPrice + item.currentCostPrice;
            })
          }
        });

        //add new Group at root level.
        var grpIdToAdd = sheet.lastGroupId + 1;
        sheet.lastGroupId = grpIdToAdd;
        sheet.RootArray.push({
          id: grpIdToAdd,
          custompath: "Root/" + grpIdToAdd,
          name: changeRequestData.modelName,
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
          selectedFor: sheet.additionalCosts,
          ifcData: changeRequestData.data,
          modelID: changeRequestData.modelID
        });
        sheet.sum = sheet.sum + sum;
        sheet.totalprofit = sheet.totalprofit + sumProfit;
        sheet.totalWorkHours = sheet.totalWorkHours + sumHrs;
        sheet.totalCompanyCost = sheet.totalCompanyCost + sumCompanyCost;
        sheet.totalCostPrice = sheet.totalCostPrice + sumCostPrice;

        //create new ongoing calc-change request
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
        var createdObj = newOngoing.save();
        console.log("createdObj", createdObj)
        createdObj.then((result) => {
          return res.status(200).json({
            message: "calc-sync-request saved.",
            data: result
          });
        }).catch((error) => {
          return res.status(200).json({
            message: "Error saving request",
            data: error
          });
        })
      } else {
        return res.status(401).json({
          errorTag: 101,
          message: "please send correct user request."
        })
      }
    }
    else if (!changeRequestData.levelPath) {
      //create new calc sheet for projectId send in request
      let sheet = await Tag.findById({ _id: changeRequestData.calcSheetId });
      if (sheet) {
        var rowItems = []; var sum = 0; var sumHrs = 0; var sumProfit = 0; var sumCompanyCost = 0; var sumCostPrice = 0;
        // console.log("queryObject data: ",queryObject.data);
        let level = { selectedFor: sheet.additionalCosts };
        await calculateThreedRows(level, changeRequestData, sheet, function (err, row, callback) {
          if (err) {
            return done(Error(err));
          } else {
            rowItems = row;
            rowItems.map(item => {
              sum = sum + item.currentsalesPrice;
              sumHrs = sumHrs + item.currentLabourHr;
              sumProfit = sumProfit + item.currentProfit;
              sumCompanyCost = sumCompanyCost + item.currentCompanyCost;
              sumCostPrice = sumCostPrice + item.currentCostPrice;
            })
          }
        });

        //add new Group at root level.
        var grpIdToAdd = sheet.lastGroupId + 1;
        sheet.lastGroupId = grpIdToAdd;
        sheet.RootArray.push({
          id: grpIdToAdd,
          custompath: "Root/" + grpIdToAdd,
          name: changeRequestData.modelName,
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
          selectedFor: sheet.additionalCosts,
          ifcData: changeRequestData.data,
          modelID: changeRequestData.modelID
        });
        sheet.sum = sheet.sum + sum;
        sheet.totalprofit = sheet.totalprofit + sumProfit;
        sheet.totalWorkHours = sheet.totalWorkHours + sumHrs;
        sheet.totalCompanyCost = sheet.totalCompanyCost + sumCompanyCost;
        sheet.totalCostPrice = sheet.totalCostPrice + sumCostPrice;

        //create new ongoing calc-change request
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
        var createdObj = newOngoing.save();
        console.log("createdObj", createdObj)
        createdObj.then((result) => {
          return res.status(200).json({
            message: "calc-sync-request saved.",
            data: result
          });
        }).catch((error) => {
          return res.status(200).json({
            message: "Error saving request",
            data: error
          });
        })

      } else {
        //do nothing
      }

    }

    else if (!changeRequestData.modelID) {
      return res.status(500).json({
        errorTag: 101,
        message: "can not find modalID in req object."
      });
    }
    else if (changeRequestData.calcSheetId) {
      let sheet = await Tag.findById({ _id: changeRequestData.calcSheetId });
      if (sheet) {
        await sheet.RootArray.forEach(root => {
          var level = searchByPath(foundLevel, changeRequestData.levelPath, root);
          //console.log("level: ",level);
          if (level !== undefined) {
            levelfound = level;
            //console.log("in if of levelfound: ",levelfound);
            return;
          }
        })

        if (levelfound == undefined) {
          return res.status(500).json({
            errorTag: 101,
            message: "Couldn't find level you sent."
          });
        } else {

          if (levelfound.sublevel) {
            console.log("levelfound's sublevel: ", levelfound.sublevel);
            if (levelfound.sublevel.length > 0) {
              levelfound.sublevel.forEach((sub, index) => {
                if (sub.hasOwnProperty('modelID')) {
                  if (sub.modelID == changeRequestData.modelID) {
                    console.log("found same model id");
                    //if modal has this same modelId as given in request perform the update operation of that specified found sublevel
                    //  things need to perform are-call this function
                    changeSublevelData(sub, changeRequestData, sheet, function (err, result, done) {
                      if (err) {
                        return res.status(500).json({
                          errorTag: 101,
                          message: "couldn't save calc-sync data",
                          data: err
                        });
                      } else {
                        console.log("console.log");
                        var onGoing = {
                          projectId: changeRequestData.projectID,
                          calcData: result,
                          createdBy: req.user.firstName,
                          calcSheetId: changeRequestData.calcSheetId,
                          calcSheetVersion: changeRequestData.calcVersionSeq,
                          modelID: changeRequestData.modelID,
                          listChangeCommits: [{ action: "add", createdBy: req.user.firstName }]
                        }
                        var newOngoing = new ongoingCalc(onGoing);
                        console.log("newOngoing", newOngoing)
                        var createdObj = newOngoing.save();
                        console.log("createdObj", createdObj)
                        createdObj.then((result) => {
                          return res.status(200).json({
                            message: "calc-sync-request saved.",
                            data: result
                          });
                        }).catch((error) => {
                          return res.status(200).json({
                            message: "Error saving request",
                            data: error
                          });
                        })
                      }
                    });
                    // return returnObject;
                  } else {
                    //not same modelId Found
                    console.log("found same model not id");
                  }
                } else {
                  console.log("model Id does not present", level.sublevel.length, "INDEX: ", index);
                  //find if it is a last element of an array
                  //If yes -> go to function and add new sublevel in this perticular level
                  if (levelfound.sublevel.length - 1 == index) {
                    console.log("in check of last element", index);
                    addNewSublevel(levelfound, changeRequestData, sheet, function (err, result, done) {
                      if (err) {
                        return res.status(500).json({
                          errorTag: 101,
                          message: "err"
                        });
                      } else {
                        console.log("console.log");
                        var onGoing = {
                          projectId: changeRequestData.projectID,
                          calcData: result,
                          createdBy: req.user.firstName,
                          calcSheetId: changeRequestData.calcSheetId,
                          calcSheetVersion: changeRequestData.calcVersionSeq,
                          modelID: changeRequestData.modelID,
                          listChangeCommits: [{ action: "add", createdBy: req.user.firstName }]
                        }
                        var newOngoing = new ongoingCalc(onGoing);
                        console.log("newOngoing", newOngoing)
                        var createdObj = newOngoing.save();
                        console.log("createdObj", createdObj)
                        createdObj.then((result) => {
                          return res.status(200).json({
                            message: "calc-sync-request saved.",
                            data: result
                          });
                        }).catch((error) => {
                          return res.status(200).json({
                            message: "Error saving request",
                            data: error
                          });
                        })


                      }
                    });
                    // return returnObject;
                  }
                }


              });
            } else {
              //does not contains sublevel
              addNewSublevel(levelfound, changeRequestData, sheet, function (err, result, done) {
                if (err) {
                  return res.status(500).json({
                    errorTag: 101,
                    message: "err"
                  });
                } else {
                  console.log("console.log");

                  var onGoing = {
                    projectId: changeRequestData.projectID,
                    calcData: result,
                    createdBy: req.user.firstName,
                    calcSheetId: changeRequestData.calcSheetId,
                    calcSheetVersion: changeRequestData.calcVersionSeq,
                    modelID: changeRequestData.modelID,
                    listChangeCommits: [{ action: "add", createdBy: req.user.firstName }]
                  }
                  var newOngoing = new ongoingCalc(onGoing);
                  console.log("newOngoing", newOngoing)
                  var createdObj = newOngoing.save();
                  console.log("createdObj", createdObj)
                  createdObj.then((result) => {
                    return res.status(200).json({
                      message: "calc-sync-request saved.",
                      data: result
                    });
                  }).catch((error) => {
                    return res.status(200).json({
                      message: "Error saving request",
                      data: error
                    });
                  })

                }
              });
            }
          } else {
            return res.status(500).json({
              errorTag: 101,
              message: "sublevel property does not exist at requested level path."
            });
          }
        }
      }
      else {
        return res.status(500).json({
          errorTag: 101,
          message: "requested calc-sheet data not found."
        });
      }

    } else {
      return res.status(500).json({
        errorTag: 101,
        message: "calc-sheet ID couldn't found."
      });
    }
  },

  getOngoingCalcChangeReq: async (req, res) => {
    let ID = req.params.id;
    console.log("ID :", ID);
    let ongoingCalcData = await ongoingCalc.findById({ _id: ID });
    if (!ongoingCalcData) {
      return res.status(500).json({
        message: "requested calc-sync request Id not found"
      });
    } else {
      return res.status(200).json({
        message: "requested calc-sync request found",
        data: ongoingCalcData
      });
    }

  },

  updateOngoingCalcChangeReq: async (req, res) => {
    let changeRequestData = req.body;
    let levelfound; var foundLevel = false;
    let ID = req.params.id;
    if (!changeRequestData.levelPath) {
      return res.status(500).json({
        errorTag: 101,
        message: "can not find levelpath in req object."
      });
    }
    if (!changeRequestData.modelID) {
      return res.status(500).json({
        errorTag: 101,
        message: "can not find modalID in req object."
      });
    }
    if (ID) {
      let sheet = await ongoingCalc.findById({ _id: ID });
      if (sheet) {
        await sheet.calcData.RootArray.forEach(root => {
          var level = searchByPath(foundLevel, changeRequestData.levelPath, root);
          //console.log("level: ",level);
          if (level !== undefined) {
            levelfound = level;
            //console.log("in if of levelfound: ",levelfound);
            return;
          }
        })

        if (levelfound == undefined) {
          return res.status(500).json({
            errorTag: 101,
            message: "Couldn't find level you sent."
          });
        } else {

          if (levelfound.sublevel) {
            //console.log("levelfound's sublevel: ",levelfound.sublevel);
            if (levelfound.sublevel.length > 0) {
              levelfound.sublevel.forEach((sub, index) => {
                if (sub.hasOwnProperty('modelID')) {
                  if (sub.modelID == changeRequestData.modelID) {
                    // console.log("found same model id");
                    //if modal has this same modelId as given in request perform the update operation of that specified found sublevel
                    //  things need to perform are-call this function
                    changeSublevelData(sub, changeRequestData, sheet.calcData, function (err, result, done) {
                      if (err) {
                        return res.status(500).json({
                          errorTag: 101,
                          message: "couldn't save calc-sync data",
                          data: err
                        });
                      } else {
                        console.log("console.log");
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
                        }
                        )

                        // let onGoing = {
                        //   $set: {
                        //    calcData:sheet.calcData,
                        //   },
                        //   $push:{
                        //     listChangeCommits:[{action:"update",createdBy:req.user.firstName}]
                        //   }
                        // };
                        // var createdObj= sheet.save();

                        // createdObj.then((result)=>{
                        //   return res.status(200).json({
                        //     message: "calc-sync-request saved.",

                        //   });
                        // }).catch((error)=>{
                        //   return res.status(200).json({
                        //     message: "Error saving request",
                        //     data:error
                        //   });
                        // })
                      }
                    });
                    // return returnObject;
                  } else {
                    //not same modelId Found
                    console.log("found same model not id");
                  }
                } else {
                  console.log("model Id does not present", level.sublevel.length, "INDEX: ", index);
                  //find if it is a last element of an array
                  //If yes -> go to function and add new sublevel in this perticular level
                  if (levelfound.sublevel.length - 1 == index) {
                    console.log("in check of last element", index);
                    addNewSublevel(levelfound, changeRequestData, sheet.calcData, function (err, result, done) {
                      if (err) {
                        return res.status(500).json({
                          errorTag: 101,
                          message: "err"
                        });
                      } else {
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
                        }
                        )
                        // console.log("console.log");
                        // let onGoing = {
                        //   $set: {
                        //    calcData:sheet.calcData,
                        //    listChangeCommits:[{action:"update",createdBy:req.user.firstName}]
                        //   }
                        // };
                        // var createdObj= sheet.save();
                        // // var newOngoing = new ongoingCalc(onGoing);

                        // // console.log("newOngoing",newOngoing)
                        // // var createdObj= newOngoing.save();
                        // // console.log("createdObj",createdObj)
                        // createdObj.then((result)=>{
                        //   return res.status(200).json({
                        //     message: "calc-sync-request saved.",

                        //   });
                        // }).catch((error)=>{
                        //   return res.status(200).json({
                        //     message: "Error saving request",
                        //     data:error
                        //   });
                        // })


                      }
                    });
                    // return returnObject;
                  }
                }


              });
            } else {
              //does not contains sublevel
              addNewSublevel(levelfound, changeRequestData, sheet.calcData, function (err, result, done) {
                if (err) {
                  return res.status(500).json({
                    errorTag: 101,
                    message: "err"
                  });
                } else {

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
                  }
                  )
                  // console.log("console.log");
                  // let onGoing = {
                  //   $set: {
                  //    calcData:sheet.calcData,
                  //    listChangeCommits:[{action:"update",createdBy:req.user.firstName}]
                  //   }
                  // };
                  // var createdObj= sheet.save();
                  // // var onGoing={
                  // //   projectId:changeRequestData.projectID,
                  // //   calcData:result,
                  // //   createdBy:req.user.firstName,
                  // //   calcSheetId:changeRequestData.calcSheetId,
                  // //   calcSheetVersion:changeRequestData.calcVersionSeq,
                  // //   listChangeCommits:[{action:"update",createdBy:req.user.firstName}]
                  // // }
                  // // var newOngoing = new ongoingCalc(onGoing);
                  // // console.log("newOngoing",newOngoing)
                  // // var createdObj= newOngoing.save();
                  // // console.log("createdObj",createdObj)
                  // createdObj.then((result)=>{
                  //   return res.status(200).json({
                  //     message: "calc-sync-request saved.",

                  //   });
                  // }).catch((error)=>{
                  //   return res.status(200).json({
                  //     message: "Error saving request",
                  //     data:error
                  //   });
                  // })

                }
              });
            }
          } else {
            return res.status(500).json({
              errorTag: 101,
              message: "sublevel property does not exist at requested level path."
            });
          }

        }
      }
      else {
        return res.status(500).json({
          errorTag: 101,
          message: "requested calc-sheet data not found."
        });
      }
    } else {
      return res.status(500).json({
        errorTag: 101,
        message: "calc-sheet ID couldn't found."
      });
    }

  },

  submitOngoingCalcChangeReq: async (req, res) => {
    let mergeid = req.params.id;
    try {
      ongoingCalc.findById({ _id: mergeid }, async function (err, result) {
        if (err) {
          return res.status(500).json({
            errorTag: 401,
            message: "requested calc-ongoing request not found."
          })
        } else {
          let calcNewData = {
            projectId: result.projectId,
            calcData: result.calcData,
            createdBy: req.user.firstName,
            calcId: result.calcSheetId,
            modelId: result.modelID,
          }
          let newReqCalc = new calcChangeRequest(calcNewData);
          let tagObj = await newReqCalc.save();
          return res.status(200).json({
            errorTag: 200,
            message: "calc data updated successfully.",
            data: tagObj
          })
        }
      })
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
        data: e
      });
    }
  },

  submitOngoingToCalc: async (req, res) => {
    let mergeid = req.params.id;
    try {
      let ongoingSheet = await ongoingCalc.findById({ _id: mergeid });
      if (!ongoingSheet) {
        return res.status(500).json({
          errorTag: 401,
          message: "requested calc-ongoing request not found."
        });
      }

      let sheet = await Tag.findOne({ _id: ongoingSheet.calcSheetId });
      if (!sheet) {
        return res.status(500).json({
          errorTag: 401,
          message: "Couldn't update sheet."
        });
      }

      // save to version list
      let newVersionSheet = new calcversion({
        RootArray: sheet.RootArray,
        rateLog: sheet.rateLog,
        projectId: sheet.projectId,
        companyId: sheet.companyId,
        hierarchicalCostSeqLast: sheet.hierarchicalCostSeqLast,
        lastGroupId: sheet.lastGroupId,
        companyCurrency: sheet.companyCurrency,
        companyProfit: sheet.companyProfit,
        companyCost: sheet.companyCost,
        sum: sheet.sum,
        totalprofit: sheet.totalprofit,
        totalAdminCost: sheet.totalAdminCost,
        totalWorkHours: sheet.totalWorkHours,
        totalCompanyCost: sheet.totalCompanyCost,
        totalCostPrice: sheet.totalCostPrice,
        averageWorkerCost: sheet.averageWorkerCost,
        additionalCosts: sheet.additionalCosts,
        created: sheet.created
      });
      newVersionSheet.save();

      let currentData = ongoingSheet.calcData;
      let user = req.user;
      let version = sheet.currentVersion ? sheet.currentVersion + 1 : sheet.versioning.length;

      let versioning = {
        versionSeq: version,
        savedBy: user.firstName + " " + user.lastName,
        olderCalcSheetVersionId: newVersionSheet._id,
        sum: currentData.sum,
        totalCompanyCost: currentData.totalCompanyCost,
        totalWorkHours: currentData.totalWorkHours,
        totalProfit: currentData.totalprofit,
        totalCostPrice: currentData.totalCostPrice
      };
      sheet.versioning.push(versioning);
      currentData.currentVersion = version;
      currentData.versioning = sheet.versioning;

      let updatedSheet = await Tag.findOneAndUpdate({ _id: ongoingSheet.calcSheetId }, currentData);
      if (updatedSheet) {
        return res.status(200).json({
          errorTag: 200,
          message: "calc data updated successfully.",
          data: updatedSheet
        });
      } else {
        return res.status(200).json({
          message: "Couldn't update sheet.",
          data: 'error'
        });
      }
    } catch (err) {
      console.log("error", err);
      return res.status(500).json({
        message: "Internal server error",
        data: err
      });
    }
  },

  getCalcIfcRows: async (req, res) => {
    console.log(req.body);
    let resData = []; let Arr = [];
    let project_id = req.body.projectId;
    let model_id = req.body.modelID;
    let sheet = await Tag.findOne({ projectId: project_id });
    if (sheet) {
      var sublevel = await sheet.RootArray.forEach(root => {
        console.log("Root is:", root.name);
        var foundsublevel = findModelIdSublevel(root, model_id, resData);

        Arr = foundsublevel;
        //  foundsublevel.map(sub=>{
        //    Arr.push("sub: ",sub);
        //  })

      });
      return res.status(200).json({
        message: "data sent successfully.",
        data: Arr
      });
    } else {
      return res.status(500).json({
        message: "calc-sheet with requested projectId does not exist"
      });
    }


  },

  testCalcOngoing: async (req, res) => {
    try {
      let A = 200, B = 500, C = 100;
      console.log("going to call it");
      // div (6, 3, function (err, result) {
      //   // *always* check for err
      //   if (err)
      //     console.log ('error', err.message, err.stack)
      //   else
      //     console.log ('result', result)
      // })
      getResult(A, B, C, function (err, result) {
        if (err) {
          return res.status(501).json({
            errorTag: 502,
            message: "error occured",
            data: err
          });
        } else {
          console.log("in if o parent: ", result);
          return res.status(200).json({
            errorTag: 200,
            message: "saved",
            data: result
          });
        }
      })
      // getResult(A,B).then((result)=>{
      //   console.log("get result i parent: ",result);
      //     if(result){
      //       console.log("in if o parent: ",result);
      //       return res.status(200).json({
      //         errorTag: 200,
      //         message: "saved",
      //         data:result
      //       });
      //     }
      // }).catch(error=>{
      //   let errdata=error;
      //   return res.status(501).json({
      //     errorTag: 502,
      //     message: "error occured",
      //     data:errdata
      //   });
      // });
    } catch (e) {
      return res.status(500).json({
        errorTag: 101,
        message: "calc-sheet ID couldn't found.",

      });
    }
  },



};

//for getcal ifc rows method
function findModelIdSublevel(root, modelid, dataarr) {
  console.log("root path is: ", root.custompath);
  if (root.modelID) {
    console.log("found model ID");
    if (root.modelID == modelid) {
      console.log("in model id to check model id");
      dataarr.push(root);
      console.log("in model id to check model id", dataarr);
      // return root;
    }
  }
  if (root.sublevel) {
    if (root.sublevel != null || root.sublevel.length > 0) {
      console.log("here finding sublevel of root");
      root.sublevel.forEach(level => {
        findModelIdSublevel(level, modelid, dataarr);
      })
    }
  }
  console.log("dataarr is at last:", dataarr);
  return dataarr;
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
function div(x, y, done) {
  if (x % y == 0)
    return done(Error('Cannot divide by zero'))
  else
    return done(null, x / y)
}

function getResult(a, b, c, done) {
  console.log("in get result function");
  if (a == 100) {
    getThirdSqrt(a, b, c, function (err, result) {
      if (err) {
        return done(Error('Error occured..'));
      } else {
        return done(null, result);
      }
    })
  } else {
    getThirdSqrtwo(a, b, c, function (err, result) {
      if (err) {
        return done(Error('Error occured..'));
      } else {
        return done(null, result);
      }
    })
  }

  //  getThirdSqrt(a,b).then(result=>{
  //    console.log("result found: ",result);
  //     return result;
  //  }).catch(error=>{
  //   throw new Error("error occured");
  //  })
}

function getThirdSqrtwo(a, b, c, done) {
  console.log("in getThirdSqrttwo function");
  var result = a + b + c;

  if (result < 700) {
    console.log("first condition");
    return done(Error('result is bigger'));

  } else if (result == 800) {
    console.log("second condition");
    return done(Error('error found'));
  }
  else {
    return done(null, result);
  }

}
function getThirdSqrt(a, b, c, done) {
  console.log("in getThirdSqrt function");
  var result = a + b + c;

  if (result < 700) {
    console.log("first condition");
    return done(Error('result is bigger'));

  } else if (result == 800) {
    console.log("second condition");
    return done(Error('error found'));
  }
  else {
    return done(null, result);
  }

}
function findAndCalculateItems(level, groupSum, groupNet, Items) {
  console.log("in findAndCalculateItems");
  if (level.items != null) {
    level.items.map(item => {
      var itemObj = {};
      if (item != null) {
        if (!item.matAmount) {
          item.matAmount = 0;
        }
        if (!item.workerAmount) {
          item.workerAmount = 0;
        }
        if (!item.s_price) {
          item.s_price = 0;
        }
        if (!item.workers_price) {
          item.workers_price = 0;
        }
        itemObj.name = item.matname;
        if (item.rowStyle == 'Combined') {
          itemObj.totalAmount = item.matAmount + item.workerAmount;
          itemObj.totalSalesPrice = item.s_price + item.workers_price;
          groupSum = groupSum + item.s_price + item.workers_price;
          if (item.selectedFor && item.selectedFor.length > 0) {
            var netvalue = 1;
            item.selectedFor.forEach(element => {
              netvalue = netvalue * (1 + (element.value / 100));
            });
            groupNet = groupSum * netvalue;
          } else {
            groupNet = 0;
          }
        }
        if (item.rowStyle == 'Inventory') {
          itemObj.totalAmount = item.matAmount;
          itemObj.totalSalesPrice = item.s_price;
          groupSum = groupSum + item.s_price;
          if (item.selectedFor && item.selectedFor.length > 0) {
            var netvalue = 1;
            item.selectedFor.forEach(element => {
              netvalue = netvalue * (1 + (element.value / 100));
            });
            groupNet = groupSum * netvalue;
          }
          else {
            groupNet = 0;
          }
        }
        if (item.rowStyle == 'Worker') {
          itemObj.totalAmount = item.workerAmount;
          itemObj.totalSalesPrice = item.workers_price;
          groupSum = groupSum + item.workers_price;
          if (item.selectedFor && item.selectedFor.length > 0) {
            var netvalue = 1;
            item.selectedFor.forEach(element => {
              netvalue = netvalue * (1 + (element.value / 100));
            });
            groupNet = groupSum * netvalue;
          }
          else {
            groupNet = 0;
          }
        }


        //groupNet = groupSum *(1+(sheet.adminCost /100))*(1+(sheet.riskProfile/100));

      } else {
        console.log("no item found");
      }
      Items.push(itemObj);
    });
  }
  if (level.sublevel && level.sublevel.length > 0) {
    level.sublevel.map(sublevel => {
      findAndCalculateItems(sublevel, groupSum, groupNet, Items)
    })
  } else {

  }

  var returnObject = { levelSum: groupSum, levelNet: groupNet, Items: Items };
  return returnObject;

}

function addingItem(row, level, index, costs, selectedCosts, type, profitper) {
  console.log("currentlavel is: ", level, "profit perc:", profitper);
  // level.items[index-1].selectedFor=[];
  if (level.name == row.Level) {
    if (level.items[index - 1] == undefined || !level.items[index - 1].matname) {
      level.items[index - 1] = { rowStyle: "Combined", selectedFor: [] }
      level.items[index - 1].currentRate = {
        rooferCost: { value: 0 },
        materialCost: { value: 0 }
      }
      level.items[index - 1].selectedFor = costs;
    }
    if (!row.WastePercent) {
      row.WastePercent = 0;
    }
    if (!row.ProfitPercent) {
      row.ProfitPercent = profitper;
    }
    if (!row.Amount) {
      row.Amount = 1;
    }
    if (!row.AdditionalCostKeys) {
      level.items[index - 1].selectedFor = costs
    } else {
      level.items[index - 1].selectedFor = [];
      selectedCosts.map(key => {
        console.log("key found: ", key);
        const result = costs.find(cost => cost.addCostSeq == key);
        console.log("result found: ", result);
        level.items[index - 1].selectedFor.push(result);
      })

    }

    if (type == 'mat') {
      level.items[index - 1].matname = row.ItemName;
      level.items[index - 1].matAmount = parseInt(row.Amount);
      level.items[index - 1].matunit = row.Unit;
      level.items[index - 1].currentRate.materialCost.value = parseFloat(row.unitCost);
      if (!level.items[index - 1].currentRate.rooferCost.value) {
        level.items[index - 1].currentRate.rooferCost.value = 0
      }
      level.items[index - 1].wastePercent = parseInt(row.WastePercent);
      level.items[index - 1].InventoryprofitPercent = parseInt(row.ProfitPercent);
    }
    else {
      level.items[index - 1].workername = row.ItemName;
      level.items[index - 1].workerAmount = parseInt(row.Amount);
      level.items[index - 1].workerunit = row.Unit;
      level.items[index - 1].currentRate.rooferCost.value = parseFloat(row.unitCost);
      if (!level.items[index - 1].currentRate.materialCost.value) {
        level.items[index - 1].currentRate.materialCost.value = 0
      }
      level.items[index - 1].workerprofitPercent = parseInt(row.ProfitPercent);
    }
  }
  else {
    if (level.sublevel != null) {
      level.sublevel.forEach(item => {
        addingItem(row, item, index, costs, selectedCosts, type, profitper);
      });
    } else {
      console.log("NOT FOUND");
    }

  }

}


function hasNumber(myString) {
  return /\d/.test(myString);
}

function travelToAddItem(group, row, levelIndex, itemIndex) {
  if (group.id == levelIndex) {
    if (group.items) {
      if (row.RowStyle == 'Combined-Material' || row.RowStyle == 'Inventory') {
        group.items[itemIndex].matname = row.ItemName;
        group.items[itemIndex].matAmount = row.Amount;
        group.items[itemIndex].matunit = row.Unit;
        group.items[itemIndex].currentRate.materialCost.value = row.unitCost;
        additionalCosts.forEach(cost => {
          if (selected.includes(cost.addCostSeq)) {
            //already there
          } else {
            group.items[itemIndex].selectedFor.push({
              addCostSeq: parseInt(cost.addCostSeq),
              name: cost.name,
              value: parseInt(cost.value),
              applyTo: cost.applyTo
            })

          }
        });
        group.items[itemIndex].wastePercent = row.WastePercent;
      } else {
        group.items[itemIndex].workername = row.ItemName;
        group.items[itemIndex].workerAmount = row.Amount;
        group.items[itemIndex].workerunit = row.Unit;
        group.items[itemIndex].currentRate.rooferCost.value = row.unitCost;
        additionalCosts.forEach(cost => {
          if (selected.includes(cost.addCostSeq)) {
            //already there
          } else {
            group.items[itemIndex].selectedFor.push({
              addCostSeq: parseInt(cost.addCostSeq),
              name: cost.name,
              value: parseInt(cost.value),
              applyTo: cost.applyTo
            })

          }
        });
      }

    } else {
      //no items
    }
  }
  else {
    if (group.sublevel != null) {
      group.sublevel.forEach(item => {
        travelToAddItem(item, row, levelIndex, itemIndex);
      });
    } else {
      console.log("at sending object here: ", root);
      // return root;
    }

  }
}

function addSums(mainarray, custompath, toSaveObject) {
  let SD = [];
  custompath.map(path => {
    SD.push(parseInt(path));
  });

  if (SD.includes(mainarray.id)) {
    mainarray.sumHours = mainarray.sumHours + toSaveObject.labourHours;
    mainarray.sumProfit = mainarray.sumProfit + toSaveObject.profit,
      mainarray.sum = mainarray.sum + toSaveObject.s_price;
  } else {
    if (root.sublevel != null) {
      root.sublevel.forEach(item => {
        travelToAddItem(matchingName, toSaveObject, item, mainarray);
      });
    } else {

    }
  }
}

function searchTreeByName(arraytocheck, matchingTitle) {
  arraytocheck.map(element => {
    if (element.name == matchingTitle) {
      console.log("element to search: ", element.name);
      return element;
    } else if (element.sublevel != null) {

      element.sublevel.forEach(item => {
        searchTreeByName(item, matchingTitle);
      });

    }
    return "not found";
  })

};


function searchTree(level) {
  console.log("Found Array is: ", searchArr);
  if (level.items) {
    level.items.map(item => {
      if (item != null) {
        searchArr.push({ name: item.name, totalAmount: item.Amount, totalSalesPrice: item.s_price });
      }
      else {
        console.log("fount item as null");
      }
    });
  } else {
    console.log("NOT");
  }
  // console.log("entering search tree sum: ",array);
  if (level.sublevel != null) {
    // console.log("in if of sublevel");
    level.sublevel.forEach(item => {
      searchTree(item);
    });
  } else {
    console.log("in else of sublevel", searchArr);
    return searchArr;
  }
};


function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key))
      return false;
  }
  return true;
}

function searchTreeToAddRow(level, index) {
  if (level.items) {
    var itemcount = 0;
    level.items.map(item => {
      if (item) {
        if (!item.matname) {
          // Object is empty (Would return true in this example)
        } else {
          itemcount = itemcount + 1;
          var costSeqNumbers = "";
          item.selectedFor.forEach(function (costitem, index) {
            if (index == item.selectedFor.length - 1) {
              costSeqNumbers = costSeqNumbers + costitem.addCostSeq;
            } else {
              costSeqNumbers = costSeqNumbers + costitem.addCostSeq + ",";
            }
          });

          if (item.rowStyle == 'Combined') {
            calcArry.push({
              levelId: itemcount, id: level.name, rowStyle: item.rowStyle, matname: item.matname, systemTag: item.systemTag, matAmount: item.matAmount, matUnit: item.matunit, matm_cost: item.currentRate.materialCost,
              matwaste: item.wastePercent, matcostPrice: item.inventoryCostPrice, matcompanyCost: item.companyCostForInventory,
              additionalCost: costSeqNumbers,
              matprofitper: item.InventoryprofitPercent, matprofit: item.inventoryprofit, matsalesPrice: item.s_price, workername: item.workername, systemTag: item.systemTag, workerAmount: item.workerAmount, workerUnit: item.workerunit,
              worker_cost: item.currentRate.rooferCost, labourHr: item.labourHours, workercostPrice: item.workerCostPrice, workercompanyCost: item.companyCostForWorker,
              workerprofitper: item.workerprofitPercent, workerprofit: item.workerProfit, workersalesPrice: item.workers_price
            });
          } else if (item.rowStyle == 'Inventory') {
            calcArry.push({
              levelId: itemcount, id: level.name, rowStyle: item.rowStyle, matname: item.matname, systemTag: item.systemTag, matAmount: item.matAmount, matUnit: item.matunit, matm_cost: item.currentRate.materialCost,
              matwaste: item.wastePercent, matcostPrice: item.inventoryCostPrice, matcompanyCost: item.companyCostForInventory, additionalCost: costSeqNumbers,
              matprofitper: item.InventoryprofitPercent, matprofit: item.inventoryprofit, matsalesPrice: item.s_price
            });
          } else {
            calcArry.push({
              levelId: itemcount, id: level.name, rowStyle: item.rowStyle, workername: item.workername, systemTag: item.systemTag, additionalCost: costSeqNumbers, workerAmount: item.workerAmount, workerUnit: item.workerunit,
              worker_cost: item.currentRate.rooferCost, labourHr: item.labourHours, workercostPrice: item.workerCostPrice, workercompanyCost: item.companyCostForWorker,
              workerprofitper: item.workerprofitPercent, workerprofit: item.workerProfit, workersalesPrice: item.workers_price
            });
          }

        }
      }
      else {
        //console.log("fount item as null");
      }
    });
  } else {
    //console.log("NOT");
  }
  if (level.sublevel != null) {
    calcArry.push({})
    level.sublevel.forEach(item => {
      searchTreeToAddRow(item);
    });
    return calcArry;
  } else {
    return calcArry;
  }
};



//search tree to additions of levels
function searchTreeId(level, rootid, selectedMaterial) {
  if (rootid == "Root") {
    //console.log("root");
  } else if (level.id == rootid) {
    level.sum = level.sum + selectedMaterial.currentsalesPrice;
    level.sumHours = level.sumHours + selectedMaterial.currentLabourHr;
    level.sumProfit = level.sumProfit + selectedMaterial.currentProfit;
    level.sumCompanyCost = level.sumCompanyCost + selectedMaterial.currentCompanyCost;
    level.sumCostPrice = level.sumCostPrice + selectedMaterial.currentCostPrice;
  } else {
    //do nothing
    //console.log("in else")
  }
  if (level.sublevel != null) {
    level.sublevel.forEach(item => {
      //   console.log("in SUBLEVEL ID: ",rootid);
      searchTreeId(item, rootid, selectedMaterial);
      //console.log("come to sublevel finding: ",rootid);
    });
  } else {
    //console.log("in ELSE OF SUBLEVEL: ");
    // return rootid;
  }
};

//add new sublevel from excel sheet method
function addSublevel(row, sublevelName, element, lastGroupId) {
  console.log("array : ", sublevelName);
  console.log("element name is : ", element.name);
  if (element.name == sublevelName[0]) {
    console.log("IN IF : ", sublevelName[0]);
    element.sublevel.push({
      id: ++lastGroupId,
      custompath: element.custompath + "/" + lastGroupId,
      name: sublevelName[1],
      items: [{ rowStyle: "Inventory" }, { rowStyle: "Inventory" }],
      sublevel: [],
      sum: 0,
      sumHours: 0,
      sumProfit: 0,
      sumCompanyCost: 0,
      sumCostPrice: 0,
      slopeAndArea: 0,
      isEdit: false,
      isSelected: true,
      selectedFor: element.selectedFor
    })

  } else {
    console.log("IN else : ", sublevelName[0]);
    if (element.sublevel !== null) {
      element.sublevel.forEach(item => {
        addSublevel(row, sublevelName, item, lastGroupId)
      })
    } else {
      //no sublevel
    }
  }

};


//calculation got calc sheet when company currency chnges
function CalcinventoryRefresh(level, searchingGrp, companyCostper, companyworkerCost, companyProfitper) {

  level.sum = 0;
  level.sumHours = 0;
  level.sumProfit = 0;
  level.sumCompanyCost = 0;
  level.sumCostPrice = 0;

  if (level.items) {
    level.items.map(selectedMaterial => {
      console.log("current material here : ", selectedMaterial.matname);
      console.log("current material seleted for : ", selectedMaterial.selectedFor);
      if (selectedMaterial != null && selectedMaterial.matname) {
        let path = level.custompath;
        var splittedpath = path.split("/");

        //Row calculations
        selectedMaterial.currentRate.materialCost.value = selectedMaterial.currentRate.materialCost.value;
        selectedMaterial.currentRate.rooferCost.value = selectedMaterial.currentRate.rooferCost.value;

        selectedMaterial.wasteAmount =
          selectedMaterial.matAmount * (selectedMaterial.wastePercent / 100);
        selectedMaterial.workerCostPrice = selectedMaterial.currentRate.rooferCost.value * selectedMaterial.workerAmount;
        //Inventory Cost price calculation
        selectedMaterial.inventoryCostPrice = (selectedMaterial.wasteAmount + selectedMaterial.matAmount) * selectedMaterial.currentRate.materialCost.value;
        selectedMaterial.labourHours = selectedMaterial.workerAmount * (selectedMaterial.currentRate.rooferCost.value / companyworkerCost);
        selectedMaterial.initialPrise = selectedMaterial.currentRate.materialCost.value + selectedMaterial.workerCostPrice;
        selectedMaterial.companyCostForInventory = selectedMaterial.inventoryCostPrice * (companyCostper / 100);
        selectedMaterial.companyCostForWorker = selectedMaterial.workerCostPrice * (companyCostper / 100);
        var profittempAmt = 0;
        var workerprofAmt = 0;

        selectedMaterial.selectedFor.map(element => {
          if (element.applyTo == "inventory" || element.applyTo == "both") {
            profittempAmt =
              profittempAmt +
              selectedMaterial.inventoryCostPrice * (element.value / 100);

          }
          if (element.applyTo == "worker" || element.applyTo == "both") {
            workerprofAmt =
              workerprofAmt +
              selectedMaterial.workerCostPrice * (element.value / 100);
          }
        });

        selectedMaterial.inventoryprofit = (profittempAmt + selectedMaterial.inventoryCostPrice + selectedMaterial.companyCostForInventory) *
          (selectedMaterial.InventoryprofitPercent / 100);
        selectedMaterial.workerProfit =
          (workerprofAmt +
            selectedMaterial.workerCostPrice +
            selectedMaterial.companyCostForWorker) *
          (selectedMaterial.workerprofitPercent / 100);
        selectedMaterial.s_price =
          profittempAmt +
          selectedMaterial.inventoryCostPrice +
          selectedMaterial.companyCostForInventory +
          selectedMaterial.inventoryprofit;
        selectedMaterial.workers_price =
          workerprofAmt +
          selectedMaterial.workerCostPrice +
          selectedMaterial.companyCostForWorker +
          selectedMaterial.workerProfit;

        if (selectedMaterial.rowStyle == 'Inventory') {
          //  selectedMaterial.currentLabourHr=selectedMaterial.labourHours;
          selectedMaterial.currentCostPrice = 0;
          selectedMaterial.currentCompanyCost = selectedMaterial.companyCostForInventory;
          selectedMaterial.currentProfit = selectedMaterial.inventoryprofit;
          selectedMaterial.currentsalesPrice = selectedMaterial.s_price;
        } else if (selectedMaterial.rowStyle == 'Worker') {
          selectedMaterial.currentLabourHr = selectedMaterial.labourHours;
          selectedMaterial.currentCostPrice = selectedMaterial.workerCostPrice;
          selectedMaterial.currentCompanyCost = selectedMaterial.companyCostForWorker;
          selectedMaterial.currentProfit = selectedMaterial.workerProfit;
          selectedMaterial.currentsalesPrice = selectedMaterial.workers_price;
        } else {
          selectedMaterial.currentLabourHr = selectedMaterial.labourHours;
          selectedMaterial.currentCostPrice = selectedMaterial.inventoryCostPrice + selectedMaterial.workerCostPrice;
          selectedMaterial.currentCompanyCost = selectedMaterial.companyCostForInventory + selectedMaterial.companyCostForWorker;
          selectedMaterial.currentProfit = selectedMaterial.inventoryprofit + selectedMaterial.workerProfit;
          selectedMaterial.currentsalesPrice = selectedMaterial.s_price + selectedMaterial.workers_price;
        }

        splittedpath.map(id => {
          searchTreeId(searchingGrp, id, selectedMaterial);
        });
      } else {
        //item not found
      }
    });
  } else {
    //console.log("NOT");
  }
  if (level.sublevel != null) {
    level.sublevel.forEach(item => {
      CalcinventoryRefresh(item, searchingGrp, companyCostper, companyworkerCost, companyProfitper);
    });
  } else {
    // console.log("in else of sublevel",level);
    return level;
  }

}

var nodeByLevelPath;
function serchByLevelPath(level, reqObject, calcSheet) {
  var returnObject;
  if (level.custompath) {
    if (level.custompath == reqObject.levelPath) {
      console.log("here in level", level.custompath + "path is: ", reqObject.levelPath, "level name: ", level.name);
      //nodeByLevelPath=level;
      if (level.sublevel && level.sublevel.length > 0) {
        level.sublevel.forEach((sub, index) => {
          if (sub.hasOwnProperty('modelId')) {
            if (sub.modelID == reqObject.modelID) {
              console.log("found same model id");
              //if modal has this same modelId as given in request perform the update operation of that specified found sublevel
              //  things need to perform are-call this function
              returnObject = changeSublevelData(sub, reqObject, calcSheet);
              // return returnObject;
            } else {
              //not same modelId Found
              console.log("found same model not id");
            }
          } else {
            console.log("model Id does not present", level.sublevel.length, "INDEX: ", index);
            //find if it is a last element of an array
            //If yes -> go to function and add new sublevel in this perticular level
            if (level.sublevel.length - 1 == index) {
              console.log("in check of last element", index);
              returnObject = addNewSublevel(level, reqObject, calcSheet);
              // return returnObject;
            }
          }
          // var checkOfSublevel = checkSublevels(sub,reqObject);
          // console.log("TRUE OR FALSE: ",checkOfSublevel, "sub-level name is: ",sub.name);
          // if(checkOfSublevel==true){

          // }
          // if(checkOfSublevel==false){
          //     //do notihng
          // }
          // if(checkOfSublevel=="notExists"){
          //    //do nothing
          // }

        });
      } else {
        returnObject = addNewSublevel(level, reqObject, calcSheet);
        // return returnObject;
      }

    }
  }
  if (level.sublevel != null) {
    console.log("here in sublevel");
    // console.log("in if of sublevel");
    level.sublevel.forEach(item => {
      serchByLevelPath(item, reqObject, calcSheet);
    });
  } else {
    //No sublevel found
    console.log("no sublevel to this");
  }
  console.log("RETURN OBJECT IS: ", returnObject);
  return returnObject;

}

async function addNewSublevel(level, queryObject, calcSheet, done) {
  //add new sublevel in this perticular level.
  var rowItems = []; var sum = 0; var sumHrs = 0; var sumProfit = 0; var sumCompanyCost = 0; var sumCostPrice = 0;
  // console.log("queryObject data: ",queryObject.data);
  await calculateThreedRows(level, queryObject, calcSheet, function (err, row, callback) {
    if (err) {

      return done(Error(err));
    } else {

      rowItems = row;
      rowItems.map(item => {
        sum = sum + item.currentsalesPrice;
        sumHrs = sumHrs + item.currentLabourHr;
        sumProfit = sumProfit + item.currentProfit;
        sumCompanyCost = sumCompanyCost + item.currentCompanyCost;
        sumCostPrice = sumCostPrice + item.currentCostPrice;
      })

    }
  });
  // console.log("ROWITEMS: ",rowItems);
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
    modelID: queryObject.modelID
  });
  var sums = { sum: sum, Hours: sumHrs, CompanyCost: sumCompanyCost, CostPrice: sumCostPrice, profit: sumProfit };
  console.log("level.custompath: ", level.custompath);
  var splittingStr = level.custompath.split('/');
  console.log("level.custompath splited aarry: ", splittingStr);
  splittingStr.shift(); splittingStr.pop();

  //   splittingStr.map((str,i)=>{
  //   console.log("in here yaaaaay!!!!!! line no:2245",i,str);
  await calcSheet.RootArray.map(root => {
    var sumdata = findAdditionsForUpdateSync(root, splittingStr, sums);
  })

  // });

  calcSheet.sum = calcSheet.sum + sums.sum;
  calcSheet.sumHours = calcSheet.sumHours + sums.Hours;
  calcSheet.sumCompanyCost = calcSheet.sumCompanyCost + sums.CompanyCost;
  calcSheet.sumCostPrice = calcSheet.sumCostPrice + sums.CostPrice;
  calcSheet.sumProfit = calcSheet.sumProfit + sums.profit;
  console.log("CLACHEET SUM IS: ", calcSheet.sum, "+", sums.sum, "=", calcSheet.sum);

  return done(null, calcSheet);

}

async function calculateThreedRows(level, queryObject, calcSheet, done) {
  var dataarray = [];
  var idtopass;
  // await queryObject.data.forEach(async(obj,index)=>{
  for (obj of queryObject.data) {
    console.log("calling in each ");
    let currentObject = {};
    currentObject.ifc = obj;

    if (obj.hasOwnProperty("material")) {
      idtopass = obj.material;
      var material = await Material.findById({ _id: idtopass });
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

        if (material.currentRate) {
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
        MatToSave.inventoryprofit = (profittempAmt + MatToSave.inventoryCostPrice + MatToSave.companyCostForInventory)
          * (MatToSave.InventoryprofitPercent / 100);

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
      idtopass = obj.dcp;
      var material = await ComboMaterial.findById({ _id: idtopass });
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

        if (material.currentRate) {
          material.currentRate = { materialCost: { value: 0 }, rooferCost: { value: 0 } }
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
          MatToSave.wasteAmount =
            MatToSave.matAmount * (MatToSave.wastePercent / 100);
        } else {
          MatToSave.wastePercent = 0;
          MatToSave.wasteAmount =
            MatToSave.matAmount * (MatToSave.wastePercent / 100);
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
            profittempAmt =
              profittempAmt +
              MatToSave.inventoryCostPrice * (element.value / 100);
          }
          if (element.applyTo == "worker" || element.applyTo == "both") {
            workerprofAmt =
              workerprofAmt +
              MatToSave.workerCostPrice * (element.value / 100);
          }
        });
        MatToSave.inventoryprofit = (profittempAmt + MatToSave.inventoryCostPrice + MatToSave.companyCostForInventory)
          * (MatToSave.InventoryprofitPercent / 100);

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
      idtopass = obj.equipment;
      var material = await Equipment.findById({ _id: idtopass });
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
        MatToSave.inventoryprofit = (profittempAmt + MatToSave.inventoryCostPrice + MatToSave.companyCostForInventory)
          * (MatToSave.InventoryprofitPercent / 100);

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

  return done(null, dataarray);
}

async function changeSublevelData(sublevel, queryObj, calcSheet, done) {
  var splittingStr;
  while (sublevel.items.length > 0) {
    sublevel.items.pop();
  }
  var rowItems = []; sublevel.sum = 0; sublevel.sumHours = 0; sublevel.sumProfit = 0; sublevel.sumCompanyCost = 0; sublevel.sumCostPrice = 0;
  // console.log("queryObject data: ",queryObject.data);
  await calculateThreedRows(sublevel, queryObj, calcSheet, function (err, row, callback) {
    if (err) {
      console.log("GETTING NULL ERROR", err);
      return done(Error(err));
    } else {
      console.log("ROW IS : ", row);
      sublevel.items = row;
      sublevel.items.map(item => {
        sublevel.sum = sublevel.sum + item.currentsalesPrice;
        sublevel.sumHrs = sublevel.sumHours + item.currentLabourHr;
        sublevel.sumProfit = sublevel.sumProfit + item.currentProfit;
        sublevel.sumCompanyCost = sublevel.sumCompanyCost + item.currentCompanyCost;
        sublevel.sumCostPrice = sublevel.sumCostPrice + item.currentCostPrice;
      })

    }
    console.log("level.custompath: ", sublevel.custompath);
    splittingStr = sublevel.custompath.split('/');
    console.log("level.custompath splited aarry: ", splittingStr);
    splittingStr.shift(); splittingStr.pop();
  });
  var sums = { sum: sublevel.sum, Hours: sublevel.sumHours, CompanyCost: sublevel.sumCompanyCost, CostPrice: sublevel.sumCostPrice, profit: sublevel.sumProfit };
  //   splittingStr.map((str,i)=>{
  //   console.log("in here yaaaaay!!!!!! line no:2245",i,str);
  await calcSheet.RootArray.map(root => {
    var sumdata = findAdditionsForUpdateSync(root, splittingStr, sums);
  })

  // });

  calcSheet.sum = calcSheet.sum + sums.sum;
  calcSheet.sumHours = calcSheet.sumHours + sums.Hours;
  calcSheet.sumCompanyCost = calcSheet.sumCompanyCost + sums.CompanyCost;
  calcSheet.sumCostPrice = calcSheet.sumCostPrice + sums.CostPrice;
  calcSheet.sumProfit = calcSheet.sumProfit + sums.profit;
  console.log("CLACHEET SUM IS: ", calcSheet.sum, "+", sums.sum, "=", calcSheet.sum);

  return done(null, calcSheet);
}

function findAllSums(level) {
  if (level.sublevel != null && level.subLevelAdded.length > 0) {
    level.sublevel.map(sublevel => {

    })
  }
}

function findInventory(id, name, done) {
  if (name == "Material") {
    Material.findById(id, function (err, material) {
      if (err) {
        return done(Error("Error in finding material"));
      } else {
        console.log("found mat returning here", material);
        return material;
      }
    })
  }
  if (name == "Dcp") {
    ComboMaterial.findById(id, function (err, combo) {
      if (err) {
        return done(Error("Error in finding combo-material"));
      } else {
        return done(null, combo);
      }
    })
  }
  if (name == "Equipment") {
    Equipment.findById(id, function (err, equipment) {
      if (err) {
        return done(Error("Error in finding equipment"));
      } else {
        return done(null, equipment);
      }
    })
  }
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