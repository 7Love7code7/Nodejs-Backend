const Material = require("../models/material.model");
const Equipment = require("../models/equipment.model");
const ComboMaterial = require("../models/comboMaterial.model");
const ComboMaterialList = require("../models/comboMaterialList.model");
const Company = require("../models/company.model");
const User = require("../models/user.model");
const Asset = require("../models/asset.model");
const entityTagController = require("../controllers/entityTag.controller");
const _ = require("lodash");
const __ = require("../helper/globals");
const mongoose = require("mongoose");
const mongoXlsx = require("mongo-xlsx");
const async = require("async");
const fs = require("fs");
const mime = require("mime-types");
var Excel = require("exceljs");
var XLSX = require("xlsx");
const fx = require("money"),
  moment = require("moment"),
  Joi = require("joi");
var multer = require("multer");
const EntityTag = require("../models/entityTag.model");
var randomColor = require('randomcolor');

var Storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, "./Files");
  },
  filename: function(req, file, callback) {
    callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  }
});
var upload = multer({
  storage: Storage
}).array("file", 1);

module.exports = {
  createMaterial: async (req, res) => {
    try {
      let existingMaterial = await Material.findOne({
        name: new RegExp(req.body.name, "i"),
        companyId: req.user.companyId
      });

      if (existingMaterial) {
        return res.status(300).send({
          message: "Material Name already exists"
        });
      }

      let material = req.body;

      material.companyId = req.user.companyId;

      material.systemTag = await entityTagController.generateTag("MATRL");

      material.cost = material.cost;
      let currentRate = material.cost
        ? material.cost.filter(x => x.isDefault == "true")[0]
        : material.materialCost;
      material.currentRate = {
        materialCost: material.materialCost ? material.materialCost : currentRate.materialCost ? currentRate.materialCost : currentRate,
        rooferCost: material.rooferCost ? material.rooferCost : undefined,
        date: moment().format()
      };

      material.rateLog = [material.currentRate];
      material.providerData = {};
      material.providerData.updatedBy = {
        _id: req.user["_id"],
        email: req.user["email"],
        name: req.user["firstName"] + " " + req.user["lastName"]
      };

      if (req.files && req.files.length > 0) {
        let files = req.files;
        files = files.map((element, i) => {
          element.providerData = {
            _id: req.user["_id"],
            email: req.user["email"],
            name: req.user["firstName"] + " " + req.user["lastName"]
          };
          element.assetName = element.originalname;
          element.secure_url = element.url = element.location;
          element.bytes = element.size.toString();
          element.format = mime.extension(element.mimetype);
          element.companyId = req.user.companyId;
          /* To attach element with props such as title and description */
          element = { ...element, ...req.body.assetObj[i] };
          return element;
        });

        let materialAssets = await Asset.insertMany(files);
        material.files = materialAssets.reduce(
          (acc, x) => {
            /* Split docs and images */
            if (/png|jpg|jpeg|gif/.test(x.format)) {
              acc.images.push(x._id);
            } else {
              acc.docs.push(x._id);
            }
            return acc;
          },
          { images: [], docs: [] }
        );
      }

      // allot randomcolor
      
      let isExist = true;
      let color, count = 0;
      while(isExist && count < 5) {
        color = randomColor();
        isExist = await Material.findOne({
          hexHtmlColourCode: color,
          companyId: req.user.companyId
        });
        count ++;
      }
      if(count < 5 && isExist == null) {
        material.hexHtmlColourCode = color;
        console.log(color);
      } else {
        material.hexHtmlColourCode = null;
      }

      /* Save material  */
      let materialData = new Material(material);
      await materialData.save();

      return res.status(200).json({
        message: "Material created successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  createEquipment: async (req, res) => {
    try {
      let existingEquipment = await Equipment.findOne({
        name: req.body.name,
        companyId: req.user.companyId
      });

      if (existingEquipment) {
        return res.status(300).send({ message: "Equipment name already exists" });
      }

      let equipment = req.body;
      equipment.companyId = req.user.companyId;
      /* Assign Entity tag */
      let existingEntityTag = await EntityTag.findOne({
        prefix: "EQPMT"
      });

      let currentEntityTag;
      if (!existingEntityTag) {
        /* first time check */
        let newTag = new EntityTag({
          prefix: "EQPMT",
          count: 1000
        });
        currentEntityTag = await newTag.save();
      } else {
        currentEntityTag = existingEntityTag;
      }
      currentEntityTag.count++;
      let updatedEntityTag = await currentEntityTag.save();
      updatedEntityTag = updatedEntityTag.toObject();

      equipment.systemTag = `${updatedEntityTag.prefix}${updatedEntityTag.count}`;

      let newRate = {
        date: moment().format(),
        equipmentCost: req.body.equipmentCost,
        rooferCost: req.body.rooferCost
      };
      equipment.currentRate = newRate;
      equipment.workers = req.body.workers;
      equipment.locationEq = req.body.locationEq;
      equipment.totalCountEq = req.body.totalCountEq;
      equipment.owned = req.body.owned;
      equipment.chargingUnit =
        typeof req.body.chargingUnit === "string" ? req.body.chargingUnit : "";
      equipment.rateLog = [newRate];
      equipment.providerData = {};
      equipment.providerData.updatedBy = {
        _id: req.user["_id"],
        email: req.user["email"],
        name: req.user["firstName"] + " " + req.user["lastName"]
      };

      if (req.files && req.files.length > 0) {
        let files = req.files;
        files = files.map((element, i) => {
          element.providerData = {
            _id: req.user["_id"],
            email: req.user["email"],
            name: req.user["firstName"] + " " + req.user["lastName"]
          };
          element.assetName = element.originalname;
          element.secure_url = element.url = element.location;
          element.bytes = element.size.toString();
          element.format = mime.extension(element.mimetype);
          element.companyId = req.user.companyId;
          return element;
        });

        let equipmentAssets = await Asset.insertMany(files);

        equipment.files = equipmentAssets.reduce(
          (acc, x) => {
            /* Split docs and images */
            if (/png|jpg|jpeg|gif/.test(x.format)) {
              acc.images.push(x._id);
            } else {
              acc.docs.push(x._id);
            }
            return acc;
          },
          { images: [], docs: [] }
        );
      }

      let isExist = true;
      let color, count = 0;
      while(isExist && count < 5) {
        color = randomColor();
        isExist = await Material.findOne({
          hexHtmlColourCode: color,
          companyId: req.user.companyId
        });
        count ++;
      }
      if(count < 5 && isExist == null) {
        equipment.hexHtmlColourCode = color;
        console.log(color);
      } else {
        equipment.hexHtmlColourCode = null;
      }

      /* Save material */
      let equipmentData = new Equipment(equipment);

      await equipmentData.save();

      return res.status(200).json({
        message: "Equipment created successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateEquipmentById: async (req, res) => {
    let id = req.params.e_id;
    let eq = req.body;

    try {
      /* Check if material currency changed or not */
      let equipmentData = await Equipment.findOne({
        "currentRate.equipmentCost.value": eq.currentRate.equipmentCost.value,
        "currentRate.rooferCost.value": eq.currentRate.rooferCost.value
      });

      if (!equipmentData) {
        /* Add to rate log if value has been changed */
        eq.currentRate.date = moment().format();
      }

      let updatedEquipment = await Equipment.findOneAndUpdate(
        {
          _id: id
        },
        {
          $set: eq
        },
        {
          new: true
        }
      );

      /* Push files if added */

      console.log("req.files >>>>>>>>>", req.files);
      if (req.files && req.files.length > 0) {
        let files = req.files;
        console.log("req.files >>>>>>>>>", files);
        files = files.map((element, i) => {
          element.providerData = {
            _id: req.user["_id"],
            email: req.user["email"],
            name: req.user["firstName"] + " " + req.user["lastName"]
          };
          element.assetName = element.originalname;
          element.secure_url = element.url = element.location;
          element.bytes = element.size.toString();
          element.format = mime.extension(element.mimetype);
          element.companyId = req.user.companyId;
          /* To attach element with props such as title and description */
          //element = { ...element, ...req.body.assetObj[i] };
          return element;
        });

        let equipmentAssets = await Asset.insertMany(files);

        equipmentAssets.files = equipmentAssets.reduce(
          (acc, x) => {
            /* Split docs and images */
            if (/png|jpg|jpeg|gif/.test(x.format)) {
              acc.images.push(x._id);
            } else {
              acc.docs.push(x._id);
            }
            return acc;
          },
          { images: [], docs: [] }
        );

        updatedEquipment.files = {
          images: [...updatedEquipment.files.images, ...equipmentAssets.files.images],
          docs: [...updatedEquipment.files.docs, ...equipmentAssets.files.docs]
        };
      }

      if (req.body.removedFiles && req.body.removedFiles.length > 0) {
        updatedEquipment.files.images = updatedEquipment.files.images.filter(x => {
          if (req.body.removedFiles.indexOf(x.toString()) > -1) {
            return false;
          }
          return true;
        });
        updatedEquipment.files.docs = updatedEquipment.files.docs.filter(x => {
          if (req.body.removedFiles.indexOf(x.toString()) > -1) {
            return false;
          }
          return true;
        });
      }

      if (!equipmentData) {
        /* Push into rate log if changed */
        updatedEquipment.rateLog.push(eq.currentRate);
      }

      /* Save all changes */
      await updatedEquipment.save();

      return res.status(200).json({
        message: "Equipment updated successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  listAllEquipments: async (req, res) => {
    let chunk = null,
      page = null;
    if (req.query.chunk && req.query.page) {
      chunk = parseInt(req.query.chunk);
      page = parseInt(req.query.page);
    }
    let search = "";
    let regex = null;
    if (req.query.search && req.query.search != "undefined") {
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
      let equipmentCount = await Equipment.count({
        name: regex,
        companyId: req.user.companyId,
        isActive: true
      });

      let equipmentList = await Equipment.find({
        $or: [
          {
            name: regex
          },
          {
            systemTag: regex
          }
        ]
      })
        .populate([
          { path: "files.images" },
          { path: "files.docs" },
          { path: "workers", select: "displayName" }
        ])
        .where({
          companyId: req.user.companyId, isActive: true
        })
        .skip(s)
        .limit(chunk)
        .sort(sortObj)
        .lean();

      return res.json({
        total: equipmentCount,
        list: equipmentList
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  listAllMaterials: async (req, res) => {
    let chunk = null,
      page = null;
    if (req.query.chunk && req.query.page) {
      chunk = parseInt(req.query.chunk);
      page = parseInt(req.query.page);
    }
    let search = "";
    let regex = null;
    if (req.query.search && req.query.search != "undefined") {
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
      let materialCount = await Material.count({
        $or: [
          {
            name: regex
          },
          {
            systemTag: regex
          }
        ],
        companyId: req.user.companyId, isActive: true
      });

      let materialList = await Material.find({
        $or: [
          {
            name: regex
          },
          {
            systemTag: regex
          }
        ]
      })
        .populate([{ path: "files.images" }, { path: "files.docs" }])
        .where({
          companyId: req.user.companyId, isActive: true
        })
        .skip(s)
        .limit(chunk)
        .sort(sortObj)
        .lean();

      /* Get company's default currency */
      console.log("mterialcount", materialCount);
      return res.json({
        total: materialCount,
        list: materialList
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getMaterialById: (req, res) => {
    console.log("getMaterialById");
    let id = req.params.m_id;
    console.log(id);
    if (id) {
      Material.findById(id)
        .populate([
          { path: "files.images" },
          { path: "files.docs" },
          {
            path: "cost.supplier"
          }
        ])
        .exec((err, material) => {
          if (material) {
            return res.json(material);
          } else {
            return res.status(500).json({
              err: 500,
              message: "error fetching list"
            });
          }
        });
    } else {
      return res.status(401).json({
        errorTag: 101,
        message: "parametre error"
      });
    }
  },

  getEquipmentById: (req, res) => {
    let id = req.params.e_id;
    console.log(id);
    if (id) {
      Equipment.findById(id)
        .populate([
          { path: "files.images" },
          { path: "files.docs" },
          { path: "workers", select: "displayName" }
        ])
        .populate("worker")
        .exec((err, equipment) => {
          if (equipment) {
            return res.json(equipment);
          } else {
            return res.status(500).json({
              err: 500,
              message: "error fetching list"
            });
          }
        });
    } else {
      return res.status(401).json({
        errorTag: 101,
        message: "parametre error"
      });
    }
  },

  deleteMaterialById: (req, res) => {
    console.log("deleteMaterialById start");
    console.log(req.params.h_id);
    if (req.params)
      Material.findByIdAndUpdate(req.params.h_id, { isActive: false }, {new : true}, 
      (err, result) => {
        if (result) return res.status(200).json({message: "ComboMaterial Deleted Successfully"});
        else return res.status(500).json(err);
      });
  },
  
  createBulkMaterial: (req, res) => {
    if (!req.user.companyId) {
      return res.json({
        error: "this user can't do that"
      });
    }
    let admin = req.user;
    var reported = 0;
    materialList = req.body;
    materialList.map(material => {
      material.companyId = admin.companyId;
      material.providerData = {
        addedBy: {
          _id: admin._id,
          name: admin.firstName + " " + admin.lastName
        }
      };
    });
    let report = () => {
      reported = reported + 1;
      if (reported == materialList.length) return res.send(reported + " added");
    };
    materialList.forEach(function(material) {
      Material(material).save((err, mat) => {
        console.log(mat);
        if (mat) {
          Company.findByIdAndUpdate(
            admin.companyId,
            {
              $push: {
                materials: mat._id
              },
              $set: {
                updated: Date.now()
              }
            },
            {
              safe: true,
              upsert: true,
              new: true
            },
            (err, result) => {
              if (result) {
                report();
              } else {
                return res.status(500).json({
                  error: 500,
                  message: err.message
                });
              }
            }
          );
        } else {
          return res.status(403).json({
            error: 403,
            message: err.message
          });
        }
      });
    });
  },

  updateSupplierById: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          message: "Supplier ID missing"
        });
      }
      let supplier = req.body;

      await Material.update(
        {
          "cost._id": req.params.id
        },
        {
          $set: {
            "cost.$": supplier
          }
        }
      );
      return res.status(200).json({
        message: "Supplier updated successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateMaterialById: async (req, res) => {
    let id = req.params.m_id;
    let mat = req.body;
    console.log("mat >>>>>>>>>>>>", mat);
    if (!id) {
      return res.status(400).json({
        message: "Material ID is missing"
      });
    }

    try {
      console.log("mat.cost%%%%%%%%%%%%%", mat.cost);
      if(mat.cost) {
        mat.cost = mat.cost.filter(x => {
          x.materialCost.value = x.materialCost.value == "NaN" ? undefined : x.materialCost.value;
          x.supplier = x.supplier == "null" ? delete x.supplier : x.supplier;
          delete x["$hashKey"];
          return x;
        });
      }
      console.log("mat.cost&&&&&&&&&&77", mat.cost);
      let currentRate = mat.cost
        ? mat.cost.filter(x => x.isDefault == "true")[0]
        : mat.materialCost;
      console.log("currentRate $$$$$$$$$$$$$$$$$$$$$$$$", currentRate);

      // material.cost = material.cost;
      // let currentRate = material.cost
      //   ? material.cost.filter(x => x.isDefault == "true")[0]
      //   : material.materialCost;
      // console.log("currentRate ++++++++++", currentRate);
      // material.currentRate = {
      //   materialCost: currentRate.materialCost ? currentRate.materialCost : currentRate,
      //   rooferCost: material.rooferCost ? material.rooferCost : undefined,
      //   date: moment().format()
      // };

      /* Check if material currency changed or not */
      let materialData = await Material.findOne({
        "currentRate.materialCost.value": currentRate.materialCost
          ? currentRate.materialCost.value
          : currentRate.value,
        "currentRate.rooferCost.value": mat.rooferCost ? mat.rooferCost.value : undefined
      });

      mat.currentRate = {
        materialCost: currentRate.materialCost ? currentRate.materialCost : currentRate,
        rooferCost: mat.rooferCost ? mat.rooferCost : undefined
      };

      if (!materialData) {
        /* Add to rate log if value has been changed */
        mat.currentRate.date = moment().format();
      }

      let updatedMaterial = await Material.findOneAndUpdate(
        {
          _id: id
        },
        {
          $set: mat
        },
        {
          new: true
        }
      );

      /* Push files if added */

      if (req.files && req.files.length > 0) {
        let files = req.files;
        files = files.map((element, i) => {
          element.providerData = {
            _id: req.user["_id"],
            email: req.user["email"],
            name: req.user["firstName"] + " " + req.user["lastName"]
          };
          element.assetName = element.originalname;
          element.secure_url = element.url = element.location;
          element.bytes = element.size.toString();
          element.format = mime.extension(element.mimetype);
          element.companyId = req.user.companyId;
          /* To attach element with props such as title and description */
          element = { ...element, ...req.body.assetObj[i] };
          return element;
        });

        let materialAssets = await Asset.insertMany(files);

        materialAssets.files = materialAssets.reduce(
          (acc, x) => {
            /* Split docs and images */
            if (/png|jpg|jpeg|gif/.test(x.format)) {
              acc.images.push(x._id);
            } else {
              acc.docs.push(x._id);
            }
            return acc;
          },
          { images: [], docs: [] }
        );

        updatedMaterial.files = {
          images: [...updatedMaterial.files.images, ...materialAssets.files.images],
          docs: [...updatedMaterial.files.docs, ...materialAssets.files.docs]
        };
      }

      if (req.body.removedFiles && req.body.removedFiles.length > 0) {
        updatedMaterial.files.images = updatedMaterial.files.images.filter(x => {
          if (req.body.removedFiles.indexOf(x.toString()) > -1) {
            return false;
          }
          return true;
        });
        updatedMaterial.files.docs = updatedMaterial.files.docs.filter(x => {
          if (req.body.removedFiles.indexOf(x.toString()) > -1) {
            return false;
          }
          return true;
        });
      }

      if (!materialData) {
        /* Push into rate log if changed */
        updatedMaterial.rateLog.push(mat.currentRate);
      }

      /* Save all changes */
      await updatedMaterial.save();

      return res.status(200).json({
        message: "Material updated successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  listComboMaterials: async (req, res) => {
    let currentCurrency;
    await Company.findById({ _id: req.user.companyId }, function(err, currentCompany) {
      if (!err) {
        currentCurrency = currentCompany.currentCurrency.currencyCode;
      } else {
        return res.status(404).json({
          message: "Company not found"
        });
      }
    });

    let chunk = null,
      page = null;
    if (req.query.chunk && req.query.page) {
      chunk = parseInt(req.query.chunk);
      page = parseInt(req.query.page);
    }
    let search = "";
    let regex = null;
    if (req.query.search && req.query.search != "undefined") {
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

    ComboMaterial.find({
      name: regex
    })
      .where({
        companyId: req.user.companyId,
        isActive: true
      })
      .skip(s)
      .limit(chunk)
      .populate([
        {
          path: "comboMaterialList",
          populate: [
            {
              path: "materialId",
              populate: [
                {
                  path: "files.images",
                  path: "files.docs"
                }
              ]
            },
            {
              path: "equipmentId",
              populate: [
                {
                  path: "files.images",
                  path: "files.docs"
                }
              ]
            }
          ]
        },
        { path: "files.images" },
        { path: "files.docs" }
      ])
      .sort(sortObj)
      .lean()
      .exec((err, list) => {
        if (err) {
          return res.status(500).json({
            errorTag: 100,
            message: err.message
          });
        }
        ComboMaterial.count(
          {
            $or: [
              {
                name: regex
              },
              {
                systemTag: regex
              }
            ],
            companyId: req.user.companyId,
            isActive: true
          },
          (err, count) => {
            if (err) {
              return res.status(500).json({
                errorTag: 100,
                message: err.message
              });
            } else {
              let result = list;
              result = result.map(x => {
                let materialTotal = 0,
                  rooferTotal = 0;

                for (let item of x.comboMaterialList) {
                  if (
                    item.materialId &&
                    typeof item.materialId !== "String" &&
                    item.materialId.currentRate
                  ) {
                    if (
                      item.materialId.currentRate.materialCost == null ||
                      !item.materialId.currentRate.materialCost
                    ) {
                      item.materialId.currentRate.materialCost = {
                        currencyCode: currentCurrency,
                        value: 0
                      };
                    }
                    if (
                      item.materialId.currentRate.rooferCost == null ||
                      !item.materialId.currentRate.rooferCost
                    ) {
                      item.materialId.currentRate.rooferCost = {
                        currencyCode: currentCurrency,
                        value: 0
                      };
                    }
                    if (item.materialId.currentRate.rooferCost) {
                      rooferTotal +=
                        item.materialId.currentRate.rooferCost.value *
                        item.quantity *
                        item.percentageAdditions.reduce((acc, x) => {
                          acc = acc * (1 + x.value / 100);
                          return acc;
                        }, 1);
                    }
                    materialTotal +=
                      item.materialId.currentRate.materialCost.value *
                      item.quantity *
                      item.percentageAdditions.reduce((acc, x) => {
                        acc = acc * (1 + x.value / 100);
                        return acc;
                      }, 1);
                  } else if (
                    item.equipmentId &&
                    typeof item.equipmentId !== "String" &&
                    item.equipmentId.currentRate
                  ) {
                    rooferTotal +=
                      item.equipmentId.currentRate.rooferCost.value *
                      item.quantity *
                      item.percentageAdditions.reduce((acc, x) => {
                        acc = acc * (1 + x.value / 100);
                        return acc;
                      }, 1);
                    materialTotal +=
                      item.equipmentId.currentRate.equipmentCost.value *
                      item.quantity *
                      item.percentageAdditions.reduce((acc, x) => {
                        acc = acc * (1 + x.value / 100);
                        return acc;
                      }, 1);
                  }
                }
                /* NOTE: Material total contains both material and equipment costs */
                x.materialTotal = {
                  value: materialTotal
                };
                x.rooferTotal = {
                  value: rooferTotal
                };
                return x;
              });

              return res.json({
                total: count,
                list: result
              });
            }
          }
        );
      });
  },

  getComboMaterialById: async (req, res) => {
    if (!req.params.comboId) {
      return res.status(400).json({
        message: "Missing combo Id"
      });
    }

    let comboMaterial = await ComboMaterial.findOne({
      _id: req.params.comboId
    })
      .populate([
        {
          path: "comboMaterialList",
          populate: [
            {
              path: "materialId"
            },
            {
              path: "equipmentId"
            }
          ]
        },
        { path: "files.images" },
        { path: "files.docs" }
      ])
      .lean();

    if (!comboMaterial) {
      return res.status(404).json({
        message: "Combo material not found"
      });
    }

    return res.status(200).json({
      message: "Combo material loaded successfully",
      data: comboMaterial
    });
  },
  /* Creating comboMaterial list */

  createComboMaterial: async (req, res) => {
    let existingComboMaterial = await ComboMaterial.findOne({
      name: req.body.name,
      companyId: req.user.companyId
    });

    if (existingComboMaterial) {
      return res.status(300).send({
        message: "ComboMaterial name already exists"
      });
    }

    let requiredFields = ["name", "unit", "systemTag"];
    if (!__.requiredFields(req, requiredFields)) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }

    try {
      /* Combo List data */

      let insert = {
        name: req.body.name,
        companyId: req.user.companyId,
        description: req.body.description,
        unit: req.body.unit,
        systemTag: req.body.systemTag,
        comboMaterialList: [],
        isAcitve: true,
        providerData: {
          updatedBy: {
            _id: req.user["_id"],
            email: req.user["email"],
            name: req.user["firstName"] + " " + req.user["lastName"]
          }
        },
        customMaterialList: req.body.customMaterialList || []
      };

      if (req.files && req.files.length > 0) {
        let files = req.files;
        files = files.map((element, i) => {
          element.providerData = {
            _id: req.user["_id"],
            email: req.user["email"],
            name: req.user["firstName"] + " " + req.user["lastName"]
          };
          element.assetName = element.originalname;
          element.secure_url = element.url = element.location;
          element.bytes = element.size.toString();
          element.format = mime.extension(element.mimetype);
          element.companyId = req.user.companyId;
          /* To attach element with props such as title and description */
          element = { ...element, ...req.body.assetObj[i] };
          return element;
        });
        let materialAssets = await Asset.insertMany(files);

        insert.files = materialAssets.reduce(
          (acc, x) => {
            /* Split docs and images */
            if (/png|jpg|jpeg|gif/.test(x.format)) {
              acc.images.push(x._id);
            } else {
              acc.docs.push(x._id);
            }
            return acc;
          },
          { images: [], docs: [] }
        );
      }
      /* Create combo materials */

      let savedData = await ComboMaterialList.insertMany(req.body.comboMaterialList);

      insert.comboMaterialList = savedData.map(x => x._id);

      let isExist = true;
      let color, count = 0;
      while(isExist && count < 5) {
        color = randomColor();
        isExist = await ComboMaterial.findOne({
          hexHtmlColourCode: color,
          companyId: req.user.companyId
        });
        count ++;
      }
      if(count < 5 && isExist == null) {
        insert.hexHtmlColourCode = color;
        console.log(color);
      } else {
        insert.hexHtmlColourCode = null;
      }

      let newComboList = new ComboMaterial(insert);

      await newComboList.save();

      return res.status(200).json({
        message: "ComboMaterial has been saved successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateComboMaterial: async (req, res) => {
    if (!req.params.comboId) {
      return res.status(400).json({
        message: "Invalid ID"
      });
    }
    let comboId = req.params.comboId;
    try {
      let insert = {};
      if (req.body.name) {
        insert.name = req.body.name;
      }
      if (req.body.description) {
        insert.description = req.body.description;
      }
      if (req.body.unitSymbol) {
        insert.unitSymbol = req.body.unitSymbol;
      }

      if (req.body.customMaterialList) {
        insert.customMaterialList = req.body.customMaterialList || [];
      }

      let updatedCombo = await ComboMaterial.findOneAndUpdate(
        {
          _id: comboId
        },
        {
          $set: insert
        }
      );

      /* Push files if added */

      if (req.files && req.files.length > 0) {
        let files = req.files;
        files = files.map((element, i) => {
          element.providerData = {
            _id: req.user["_id"],
            email: req.user["email"],
            name: req.user["firstName"] + " " + req.user["lastName"]
          };
          element.assetName = element.originalname;
          element.secure_url = element.url = element.location;
          element.bytes = element.size.toString();
          element.format = mime.extension(element.mimetype);
          element.companyId = req.user.companyId;
          /* To attach element with props such as title and description */
          element = { ...element, ...req.body.assetObj[i] };
          return element;
        });

        let comboAssets = await Asset.insertMany(files);

        comboAssets.files = comboAssets.reduce(
          (acc, x) => {
            /* Split docs and images */
            if (/png|jpg|jpeg|gif/.test(x.format)) {
              acc.images.push(x._id);
            } else {
              acc.docs.push(x._id);
            }
            return acc;
          },
          { images: [], docs: [] }
        );

        updatedCombo.files = {
          images: [...updatedCombo.files.images, ...comboAssets.files.images],
          docs: [...updatedCombo.files.docs, ...comboAssets.files.docs]
        };
      }

      if (req.body.removedFiles && req.body.removedFiles.length > 0) {
        updatedCombo.files.images = updatedCombo.files.images.filter(x => {
          if (req.body.removedFiles.indexOf(x.toString()) > -1) {
            return false;
          }
          return true;
        });
        updatedCombo.files.docs = updatedCombo.files.docs.filter(x => {
          if (req.body.removedFiles.indexOf(x.toString()) > -1) {
            return false;
          }
          return true;
        });
      }

      await updatedCombo.save();

      return res.status(200).json({
        message: "ComboMaterial updated successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  deleteComboMaterialById: async (req, res) => {
    console.log("deleteComboMaterialById");
    console.log(req.params.h_id);
    await ComboMaterial.findOneAndUpdate(
        { _id: req.params.h_id }, 
        {
          isActive : false,
        }
     ).then(resp => {
       return res.status(200).json({
         message: "ComboMaterial has deleted successfully"
       })
     });
 
  },

  updateComboMaterialList: async (req, res) => {
    if (!req.params.comboId) {
      return res.status(400).json({
        message: "Invalid ID"
      });
    }
    let comboId = req.params.comboId;

    try {
      let comboListArray = req.body.comboListArray;
      console.log("combo list array", req.body.comboListArray);
      let comboMaterialIds = [];

      /* Add/Update combo material list */
      for (let doc of comboListArray) {
        if (doc._id) {
          let updatedDoc = await ComboMaterialList.findOneAndUpdate(
            {
              _id: doc._id
            },
            {
              $set: doc
            },
            {
              new: true
            }
          ).lean();
          comboMaterialIds.push(updatedDoc._id);
        } else {
          let newComboMaterialList = new ComboMaterialList(doc);
          let savedComboMaterialList = await newComboMaterialList.save();
          savedComboMaterialList = savedComboMaterialList.toObject();
          comboMaterialIds.push(savedComboMaterialList._id);
        }
      }

      /* Add inserted Combo material list IDs to combo material */

      await ComboMaterial.update(
        {
          _id: comboId
        },
        {
          $addToSet: {
            comboMaterialList: {
              $each: comboMaterialIds
            }
          }
        }
      );

      if (req.body.deletedComboList && req.body.deletedComboList.length) {
        await ComboMaterialList.remove({
          _id: { $in: req.body.deletedComboList }
        });
      }

      return res.status(200).json({
        message: "ComboMaterial updated successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  showConversionRate: async (req, res) => {
    let requiredFields = ["from", "to"];
    if (!__.requiredFields(req, requiredFields)) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }

    try {
      let oxr = __.currencyHelper();

      let currenyData = JSON.parse(await oxr.getLatest()).rates;

      fx.rates = currenyData;

      let conversionFactor = fx(1)
        .from(req.body.from)
        .to(req.body.to);

      return res.status(200).json({
        conversionFactor
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  saveMaterialFromCsv: (req, res) => {
    console.log("in save mat info function");
    try {
      upload(req, res, async function(err) {
        console.log("req file: ", req.user.companyId);
        // added async here
        if (err) {
          return res.end("Something went wrong!" + err);
        }
        var File = req.files[0].path;
        var workbook = XLSX.readFile(File);
        var sheet_name_list = workbook.SheetNames;
        console.log("sheet name is: ", sheet_name_list);
        // removed the wrapper function and simply using for each loops. didn't change much
        for (sheet of sheet_name_list) {
          var excelsheet = workbook.Sheets[sheet];
          if (sheet == "Materials") {
            var sheetRows = XLSX.utils.sheet_to_json(excelsheet);

            for (row of sheetRows) {
              if (row.Id && !row.systemTag) {
                // console.log("no system tag do nothing");
              } else if (row.Id && row.systemTag) {
                // console.log("ROW with systemTag is", row);
                // console.log("row has system tag");
                await Material.findOne(
                  {
                    systemTag: row.systemTag
                  },
                  async function(err, mat) {
                    // console.log("material", mat);
                    // console.log("ROW", row);
                    if (err) {
                      console.log("cannot find material with same systemtag");
                    } else {
                      var currentRoofCost = row.currentRateRooferCost.split(",");
                      var currentMaterialCost = row.currentRateMaterialCost.split(",");

                      mat.name = row.Name;
                      mat.unit = row.Unit;
                      mat.companyId = req.user.companyId;
                      if (mat.currentRate) {
                        mat.currentRate.rooferCost.currencyCode = currentRoofCost[0];
                        mat.currentRate.rooferCost.value = currentRoofCost[1];
                        mat.currentRate.materialCost.currencyCode = currentMaterialCost[0];
                        mat.currentRate.materialCost.value = currentMaterialCost[1];
                      } else {
                        mat.rooferCost.currencyCode = currentRoofCost[0];
                        mat.rooferCost.value = currentRoofCost[1];
                        mat.materialCost.currencyCode = currentMaterialCost[0];
                        mat.materialCost.value = currentMaterialCost[1];
                      }
                      await mat.save();
                      console.log("updated material");
                    }
                  }
                );
              } else {
                console.log("neither both");

                let existingEntityTag = await EntityTag.findOne({
                  prefix: "MATRL"
                });
                let currentEntityTag;
                if (!existingEntityTag) {
                  /* first time check */
                  let newTag = new EntityTag({
                    prefix: "MATRL",
                    count: 1000
                  });
                  currentEntityTag = await newTag.save();
                } else {
                  currentEntityTag = existingEntityTag;
                }
                currentEntityTag.count++;
                let updatedEntityTag = await currentEntityTag.save();
                updatedEntityTag = updatedEntityTag.toObject();

                let systemTag = `${updatedEntityTag.prefix}${updatedEntityTag.count}`;

                var currentRoofCost = row.currentRateRooferCost.split(",");
                var currentMaterialCost = row.currentRateMaterialCost.split(",");
                let insert = {
                  name: row.Name,
                  companyId: req.user.companyId,
                  unit: row.Unit,
                  providerData: {
                    updatedBy: {
                      name: req.user.name,
                      email: req.user.email,
                      _id: req.user._id
                    }
                  },
                  currentRate: {
                    date: moment().format(),
                    rooferCost: {
                      currencyCode: currentRoofCost[0],
                      value: currentRoofCost[1]
                    },
                    materialCost: {
                      currencyCode: currentMaterialCost[0],
                      value: currentMaterialCost[1]
                    }
                  },
                  systemTag: systemTag
                };
                Material.create(insert, function(err, newMaterial) {
                  if (err) {
                    //res.send("cannot create new material");
                    console.log("couldent save new material", err);
                    // Removed the err response here, because you are already sending a res below this loop. It caused an issue
                  } else {
                    console.log("new materrila saved");
                  }
                });
              }
            }
          } else {
            console.log("Files sheet");
          }
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

  saveComboMaterialsFromCsv: (req, res) => {
    console.log("in save mat info function");
    let currentCmbMat = {};
    // var txt = "I expect five hundred dollars ($500). and new brackets ($600)";
    var regExp = /\(([^)]+)\)/g;
    // var matches = txt.match(regExp);
    // for (var i = 0; i < matches.length; i++) {
    //   var str = matches[i];
    //   console.log(str);
    // }
    try {
      upload(req, res, async function(err) {
        // added async here
        if (err) {
          return res.end("Something went wrong!" + err);
        }
        var File = req.files[0].path;
        var workbook = XLSX.readFile(File);
        var sheet_name_list = workbook.SheetNames;

        // removed the wrapper function and simply using for each loops. didn't change much
        for (sheet of sheet_name_list) {
          var excelsheet = workbook.Sheets[sheet];
          if (sheet == "DCP") {
            var sheetRows = XLSX.utils.sheet_to_json(excelsheet);
            for (row of sheetRows) {
              if (row.systemTag.includes("COMBOMAT")) {
                let testno = hasNumber(row.systemTag);
                if (testno == true) {
                  console.log("row data is already present. nothing to do");
                  let foundComboMat = await ComboMaterial.findOne({
                    systemTag: row.systemTag
                  })

                    .populate([
                      {
                        path: "comboMaterialList",
                        populate: {
                          path: "materialId"
                        }
                      }
                    ])
                    .lean();

                  // console.log("CURRENT MAT Found os  : ",foundComboMat);
                  currentCmbMat = foundComboMat;
                  console.log("CURRENT MAT DECIDE IS : ", currentCmbMat);
                } else {
                  //Create new Combo material and then take object as a currentCmb Mat
                  let existingEntityTag = await EntityTag.findOne({
                    prefix: "COMBOMAT"
                  });
                  let currentEntityTag;
                  if (!existingEntityTag) {
                    /* first time check */
                    let newTag = new EntityTag({
                      prefix: "COMBOMAT",
                      count: 1000
                    });
                    currentEntityTag = await newTag.save();
                  } else {
                    currentEntityTag = existingEntityTag;
                  }
                  currentEntityTag.count++;
                  let updatedEntityTag = await currentEntityTag.save();
                  updatedEntityTag = updatedEntityTag.toObject();

                  let systemTag = `${updatedEntityTag.prefix}${updatedEntityTag.count}`;

                  let insert = {
                    name: row.Name,
                    companyId: req.user.companyId,
                    unit: row.Unit,
                    providerData: {
                      updatedBy: {
                        name: req.user.name,
                        email: req.user.email,
                        _id: req.user._id
                      }
                    },
                    systemTag: systemTag
                  };
                  ComboMaterial.create(insert, function(err, newCmbMaterial) {
                    if (err) {
                      //res.send("cannot create new material");
                      console.log("couldent save new material", err);
                      // Removed the err response here, because you are already sending a res below this loop. It caused an issue
                    } else {
                      currentCmbMat = newCmbMaterial;
                      console.log("new combo material  saved");
                    }
                  });
                }
              } else if (row.systemTag.includes("MATRL")) {
                console.log("Current COmbo mat is: ", currentCmbMat);
                let testno = hasNumber(row.systemTag);
                if (testno == true) {
                  console.log("row data is already present. nothing to do");
                } else {
                  let foundMat = await Material.findOne({
                    name: row.Materials
                  });
                  let Quantity = 0;
                  let percertAdd = [];
                  if (foundMat) {
                    if (row.Quantity) {
                      Quantity = row.Quantity;
                    }
                    if (row.PercentAdditions) {
                      var matches = row.PercentAdditions.match(regExp);
                      for (var i = 0; i < matches.length; i++) {
                        var str = matches[i];
                        var strSplit = str.split(",");
                        percertAdd.push({
                          percentageType: strSplit[0],
                          value: parseInt(strSplit[1])
                        });
                        console.log("STRT", str);
                      }
                    }
                    let matCombObj = {
                      materialId: foundMat._id,
                      quantity: Quantity
                    };
                    let newComboList = new ComboMaterialList(matCombObj);
                    let combolist = await newComboList.save();
                    await ComboMaterial.findOne(
                      {
                        systemTag: currentCmbMat.systemTag
                      },
                      function(err, cmb) {
                        cmb.comboMaterialList.push(combolist._id);
                        cmb.save();
                      }
                    );
                  } else {
                    let existingEntityTag = await EntityTag.findOne({
                      prefix: "MATRL"
                    });
                    let currentEntityTag;
                    if (!existingEntityTag) {
                      /* first time check */
                      let newTag = new EntityTag({
                        prefix: "MATRL",
                        count: 1000
                      });
                      currentEntityTag = await newTag.save();
                    } else {
                      currentEntityTag = existingEntityTag;
                    }
                    currentEntityTag.count++;
                    let updatedEntityTag = await currentEntityTag.save();
                    updatedEntityTag = updatedEntityTag.toObject();

                    let systemTag = `${updatedEntityTag.prefix}${updatedEntityTag.count}`;

                    let materialnew = {
                      name: row.Materials,
                      companyId: req.user.companyId,
                      unit: "unit",
                      currentRate: {
                        date: moment().format(),
                        rooferCost: {
                          currencyCode: "DKK",
                          value: 0
                        },
                        materialCost: {
                          currencyCode: "DKK",
                          value: 0
                        }
                      },
                      providerData: {
                        updatedBy: {
                          name: req.user.name,
                          email: req.user.email,
                          _id: req.user._id
                        }
                      },
                      systemTag: systemTag
                    };

                    let newMat = await Material(materialnew);
                    let savedMaterial = await newMat.save();
                    let Quantity = 0;
                    let percertAdd = [];
                    console.log("saved material is :", savedMaterial);
                    if (row.Quantity) {
                      Quantity = row.Quantity;
                    }
                    if (row.PercentAdditions) {
                      var matches = row.PercentAdditions.match(regExp);
                      for (var i = 0; i < matches.length; i++) {
                        var str = matches[i];
                        var strSplit = str.split(",");
                        percertAdd.push({
                          percentageType: strSplit[0],
                          value: parseInt(strSplit[1])
                        });
                        console.log("STRT", str);
                      }
                    }
                    let matCombObj = {
                      materialId: savedMaterial._id,
                      quantity: Quantity,
                      percentageAdditions: percertAdd
                    };
                    let newComboList = new ComboMaterialList(matCombObj);
                    let combolist = await newComboList.save();
                    await ComboMaterial.findOne(
                      {
                        systemTag: currentCmbMat.systemTag
                      },
                      function(err, material) {
                        material.comboMaterialList.push(combolist._id);
                        material.save();
                      }
                    );
                  }
                }
              } else {
                return res.status(401).json({
                  message: "Please enter System Tag in each row."
                });
              }
            }
          } else {
            console.log("Files sheet");
          }
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

  saveEquimentsFromCsv: (req, res) => {
    console.log("in save eq info function");
    try {
      upload(req, res, async function(err) {
        console.log("req file: ", req.user.companyId);
        // added async here
        if (err) {
          return res.end("Something went wrong!" + err);
        }
        var File = req.files[0].path;
        var workbook = XLSX.readFile(File);
        var sheet_name_list = workbook.SheetNames;
        console.log("sheet name is: ", sheet_name_list);
        // removed the wrapper function and simply using for each loops. didn't change much
        for (sheet of sheet_name_list) {
          var excelsheet = workbook.Sheets[sheet];
          if (sheet == "Equipment") {
            var sheetRows = XLSX.utils.sheet_to_json(excelsheet);

            for (row of sheetRows) {
              if (row.Id && !row.systemTag) {
                // console.log("no system tag do nothing");
              } else if (row.Id && row.systemTag) {
                // console.log("ROW with systemTag is", row);
                // console.log("row has system tag");
                await Equipment.findOne(
                  {
                    systemTag: row.systemTag
                  },
                  async function(err, mat) {
                    // console.log("material", mat);
                    // console.log("ROW", row);
                    if (err) {
                      console.log("cannot find material with same systemtag");
                    } else {
                      var currentRoofCost = row.currentRateRooferCost.split(",");
                      var currentEquipmentCost = row.currentRateEquipmentCost.split(",");

                      mat.name = row.Name;

                      mat.companyId = req.user.companyId;
                      if (mat.currentRate) {
                        mat.currentRate.rooferCost.currencyCode = currentRoofCost[0];
                        mat.currentRate.rooferCost.value = currentRoofCost[1];
                        mat.currentRate.equipmentCost.currencyCode = currentEquipmentCost[0];
                        mat.currentRate.equipmentCost.value = currentEquipmentCost[1];
                      } else {
                        mat.rooferCost.currencyCode = currentRoofCost[0];
                        mat.rooferCost.value = currentRoofCost[1];
                        mat.equipmentCost.currencyCode = currentEquipmentCost[0];
                        mat.equipmentCost.value = currentEquipmentCost[1];
                      }
                      await mat.save();
                      console.log("updated material");
                    }
                  }
                );
              } else {
                console.log("neither both");

                let existingEntityTag = await EntityTag.findOne({
                  prefix: "EQPMT"
                });
                let currentEntityTag;
                if (!existingEntityTag) {
                  /* first time check */
                  let newTag = new EntityTag({
                    prefix: "EQPMT",
                    count: 1000
                  });
                  currentEntityTag = await newTag.save();
                } else {
                  currentEntityTag = existingEntityTag;
                }
                currentEntityTag.count++;
                let updatedEntityTag = await currentEntityTag.save();
                updatedEntityTag = updatedEntityTag.toObject();

                let systemTag = `${updatedEntityTag.prefix}${updatedEntityTag.count}`;

                var currentRoofCost = row.currentRateRooferCost.split(",");
                var currentEquipmentCost = row.currentRateEquipmentCost.split(",");
                let insert = {
                  name: row.Name,
                  companyId: req.user.companyId,

                  providerData: {
                    updatedBy: {
                      name: req.user.name,
                      email: req.user.email,
                      _id: req.user._id
                    }
                  },
                  currentRate: {
                    date: moment().format(),
                    rooferCost: {
                      currencyCode: currentRoofCost[0],
                      value: currentRoofCost[1]
                    },
                    equipmentCost: {
                      currencyCode: currentEquipmentCost[0],
                      value: currentEquipmentCost[1]
                    }
                  },
                  systemTag: systemTag
                };
                Equipment.create(insert, function(err, newMaterial) {
                  if (err) {
                    //res.send("cannot create new material");
                    console.log("couldent save new material", err);
                    // Removed the err response here, because you are already sending a res below this loop. It caused an issue
                  } else {
                    console.log("new equipment saved");
                  }
                });
              }
            }
          } else {
            console.log("Files sheet");
          }
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

  exportExcel: (req, res) => {
    console.log("AT EXPORT ESCEl");
    let allAssets = [];
    try {
      Material.find({})

        .where({ companyId: req.user.companyId })
        .populate([{ path: "files.images" }, { path: "files.docs" }])
        .exec(function(err, docs) {
          //Material.find({companyId: req.user.companyId}, function(err, docs) {
          if (err) {
            return res.json(err);
          } else {
            console.log("Materials: ", docs);
            var workbook = new Excel.Workbook();
            var worksheet = workbook.addWorksheet("Materials", {
              pageSetup: {
                paperSize: 9,
                orientation: "landscape"
              },
              views: [{ state: "frozen", ySplit: 1 }]
            });
            worksheet.columns = [
              {
                header: "Id",
                key: "_id",
                width: 10
              },
              {
                header: "updatedAt",
                key: "updatedAt",
                width: 32
              },
              {
                header: "createdAt",
                key: "createdAt",
                width: 10,
                outlineLevel: 1
              },
              {
                header: "Name",
                key: "name",
                width: 32
              },
              {
                header: "Unit",
                key: "unit",
                width: 32
              },
              {
                header: "CompanyId",
                key: "companyId",
                width: 32
              },
              {
                header: "systemTag",
                key: "systemTag",
                width: 32
              },
              {
                header: "updatedByName",
                key: "updatedByName",
                width: 32
              },
              {
                header: "updatedByEmail",
                key: "updatedByEmail",
                width: 32
              },
              {
                header: "updatedBy_id",
                key: "updatedBy_id",
                width: 32
              },
              {
                header: "isActive",
                key: "isActive",
                width: 32
              },
              {
                header: "currentRateDate",
                key: "currentRateDate",
                width: 32
              },
              {
                header: "currentRateRooferCost",
                key: "currentRateRooferCost",
                width: 32
              },
              {
                header: "currentRateMaterialCost",
                key: "currentRateMaterialCost",
                width: 32
              },
              {
                header: "rateLog",
                key: "rateLog",
                width: 32
              }
            ];

            async.each(
              docs,
              function(material, callback) {
                let updatedByName = "";
                let updatedByEmail = "";
                let updatedById = "";
                let roofercurrencycode = "";
                let roofervalue = "";
                let materialcurrencycode = "";
                let materialvalue = "";
                if (material.providerData != undefined) {
                  if (material.providerData.updatedBy) {
                    updatedByEmail = material.providerData.updatedBy.email;
                    updatedByName = material.providerData.updatedBy.name;
                    updatedById = material.providerData.updatedBy._id;
                  }
                  if (material.providerData.addedBy) {
                    updatedByEmail = material.providerData.addedBy.email;
                    updatedByName = material.providerData.addedBy.name;
                    updatedById = material.providerData.addedBy._id;
                  }
                }
                if (material.currentRate.rooferCost.currencyCode == undefined) {
                  roofercurrencycode = "";
                  materialcurrencycode = "";
                } else {
                  roofercurrencycode =
                    material.currentRate.rooferCost.currencyCode +
                    "," +
                    material.currentRate.rooferCost.value;
                  materialcurrencycode =
                    material.currentRate.materialCost.currencyCode +
                    "," +
                    material.currentRate.rooferCost.value;
                }

                if (material.files.docs.length > 0) {
                  material.files.docs.map(document => {
                    allAssets.push(document);
                  });
                }
                if (material.files.images.length > 0) {
                  material.files.images.map(document => {
                    allAssets.push(document);
                  });
                }

                worksheet.addRow({
                  _id: material._id,
                  updatedAt: material.updatedAt,
                  createdAt: material.createdAt,
                  name: material.name,
                  unit: material.unit,
                  companyId: material.companyId,
                  systemTag: material.systemTag,
                  updatedByName: updatedByName,
                  updatedByEmail: updatedByEmail,
                  updatedBy_id: updatedById,
                  isActive: material.isActive,
                  currentRateDate: material.currentRate.date,
                  currentRateRooferCost: roofercurrencycode,
                  currentRateMaterialCost: materialcurrencycode
                });

                callback(err);
              },
              function(err) {
                if (err) console.log("ERROR", err);
                var sheet = workbook.addWorksheet("Files", {
                  pageSetup: {
                    paperSize: 9,
                    orientation: "landscape"
                  }
                });
                sheet.columns = [
                  //{ header: 'materialId', key: 'materialId', width: 10 },
                  {
                    header: "_id",
                    key: "_id",
                    width: 32
                  },
                  {
                    header: "__v",
                    key: "__v",
                    width: 10,
                    outlineLevel: 1
                  },
                  {
                    header: "originalName",
                    key: "originalName",
                    width: 32
                  },
                  {
                    header: "encoding",
                    key: "encoding",
                    width: 32
                  },
                  {
                    header: "mimetype",
                    key: "mimetype",
                    width: 32
                  },
                  {
                    header: "version",
                    key: "version",
                    width: 32
                  },
                  {
                    header: "width",
                    key: "width",
                    width: 32
                  },
                  {
                    header: "height",
                    key: "height",
                    width: 32
                  },
                  {
                    header: "format",
                    key: "format",
                    width: 32
                  },
                  {
                    header: "resource_type",
                    key: "resource_type",
                    width: 32
                  },
                  {
                    header: "bytes",
                    key: "bytes",
                    width: 32
                  },
                  {
                    header: "etag",
                    key: "etag",
                    width: 32
                  },
                  {
                    header: "url",
                    key: "url",
                    width: 32
                  },
                  {
                    header: "secure_url",
                    key: "secure_url",
                    width: 32
                  },
                  {
                    header: "companyId",
                    key: "companyId",
                    width: 32
                  },
                  {
                    header: "created",
                    key: "created",
                    width: 32
                  },
                  {
                    header: "isActive",
                    key: "isActive",
                    width: 32
                  },
                  {
                    header: "pages",
                    key: "pages",
                    width: 32
                  },
                  {
                    header: "assetDescription",
                    key: "assetDescription",
                    width: 32
                  },
                  {
                    header: "assetName",
                    key: "assetName",
                    width: 32
                  }
                ];

                async.each(
                  allAssets,
                  function(asset, callback) {
                    sheet.addRow({
                      _id: asset._id,
                      __v: asset.__v,
                      originalName: asset.originalName,
                      encoding: asset.encoding,
                      mimetype: asset.mimetype,
                      version: asset.version,
                      width: asset.width,
                      height: asset.height,
                      format: asset.format,
                      resource_type: asset.resource_type,
                      bytes: asset.bytes,
                      etag: asset.etag,
                      url: asset.url,
                      secure_url: asset.secure_url,
                      companyId: asset.companyId,
                      created: asset.created,
                      isActive: asset.isActive,
                      pages: asset.pages,
                      assetDescription: asset.assetDescription,
                      assetName: asset.assetName
                    });

                    callback(err);
                  },
                  function(err) {
                    if (err) console.log("ERROR", err);
                    let fileName = "materials.xlsx";
                    res.setHeader("Content-Type", "application/vnd.ms-excel");

                    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
                    return workbook.xlsx.write(res).then(function() {
                      res.end();
                    });

                    // var theFile = workbook.xlsx.writeFile("some.xlsx").then(function () {
                    //     console.log("xls file is written.");
                    //     return res.sendFile(theFile);
                    // });
                  }
                );
              }
            );
          }
        });
    } catch (e) {
      console.log("exceeption ", e);
    }
  },

  getInventoryItems: async (req, res) => {
    try {
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

      let query = {
        companyId: req.user.companyId,
        $or: [{ name: regex }, { systemTag: regex }]
      };

      let inventoryData = await Promise.all([
        Material.aggregate([
          { $match: query },
          {
            $project: {
              name: 1,
              systemTag: 1,
              inventoryCost: "$currentRate.materialCost.value",
              rooferCost: "$currentRate.rooferCost.value"
            }
          }
        ]).exec(),
        Equipment.aggregate([
          { $match: query },
          {
            $project: {
              name: 1,
              systemTag: 1,
              inventoryCost: "$currentRate.equipmentCost.value",
              rooferCost: "$currentRate.rooferCost.value"
            }
          }
        ]).exec(),
        ComboMaterial.find(query)
          .select("name systemTag comboMaterialList")
          .populate({
            path: "comboMaterialList",
            populate: {
              path: "materialId",
              select: "currentRate"
            }
          })
          .skip(s)
          .limit(chunk)
          .sort(sortObj)
          .lean()
          .exec()
      ]);

      inventoryData[2] = inventoryData[2].map(x => {
        x.rooferCost = 0;
        x.inventoryCost = 0;
        for (let list of x.comboMaterialList) {
          if (!list.materialId) {
            continue;
          }
          x.rooferCost +=
            (list.materialId.currentRate.rooferCost
              ? list.materialId.currentRate.rooferCost.value
              : undefined) *
            list.quantity *
            list.percentageAdditions.reduce((acc, x) => {
              acc = acc * (1 + x.value / 100);
              return acc;
            }, 1);
          x.inventoryCost +=
            list.materialId.currentRate.materialCost.value *
            list.quantity *
            list.percentageAdditions.reduce((acc, x) => {
              acc = acc * (1 + x.value / 100);
              return acc;
            }, 1);
        }
        x.comboMaterialList = undefined;
        return x;
      });

      return res.status(200).json({
        message: "Inventory data loaded successfully",
        inventoryData: _.flatten(inventoryData)
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getInventoryAndMaterials: async (req, res) => {
    try {
      let regex = "";
      if (req.query.search) {
        regex = new RegExp(req.query.search, "gi");
      } else {
        regex = new RegExp();
      }

      let query = {
        companyId: req.user.companyId,
        $or: [{ name: regex }, { systemTag: regex }]
      };

      let inventoryData = await Promise.all([
        Material.aggregate([
          { $match: query },
          {
            $project: {
              name: 1,
              systemTag: 1,
              inventoryCost: "$currentRate.materialCost.value",
              rooferCost: "$currentRate.rooferCost.value"
            }
          }
        ]).exec(),
        Equipment.aggregate([
          { $match: query },
          {
            $project: {
              name: 1,
              systemTag: 1,
              inventoryCost: "$currentRate.equipmentCost.value",
              rooferCost: "$currentRate.rooferCost.value"
            }
          }
        ]).exec()
      ]);
      console.log("req.query: ", req.query);
      console.log("inventories: ", inventoryData);
      return res.status(200).json({
        message: "Inventory data loaded successfully",
        inventoryData: _.flatten(inventoryData)
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  exportExcelEquipment: (req, res) => {
    let allAssets = [];
    try {
      Equipment.find({})

        .where({ companyId: req.user.companyId })
        .populate([
          { path: "files.images" },
          { path: "files.docs" },
          { path: "workers", select: "displayName" }
        ])
        .exec(function(err, docs) {
          //Equipment.find({companyId: req.user.companyId}, function(err, docs) {
          if (err) {
            return res.json(err);
          } else {
            var workbook = new Excel.Workbook();
            var worksheet = workbook.addWorksheet("Equipment", {
              pageSetup: {
                paperSize: 9,
                orientation: "landscape"
              },
              views: [{ state: "frozen", ySplit: 1 }]
            });
            worksheet.columns = [
              {
                header: "Id",
                key: "_id",
                width: 10
              },
              {
                header: "updatedAt",
                key: "updatedAt",
                width: 32
              },
              {
                header: "createdAt",
                key: "createdAt",
                width: 10,
                outlineLevel: 1
              },
              {
                header: "Name",
                key: "name",
                width: 32
              },
              {
                header: "CompanyId",
                key: "companyId",
                width: 32
              },
              {
                header: "systemTag",
                key: "systemTag",
                width: 32
              },
              {
                header: "updatedByName",
                key: "updatedByName",
                width: 32
              },
              {
                header: "updatedByEmail",
                key: "updatedByEmail",
                width: 32
              },
              {
                header: "updatedBy_id",
                key: "updatedBy_id",
                width: 32
              },
              {
                header: "isActive",
                key: "isActive",
                width: 32
              },
              {
                header: "currentRateDate",
                key: "currentRateDate",
                width: 32
              },
              {
                header: "currentRateRooferCost",
                key: "currentRateRooferCost",
                width: 32
              },
              {
                header: "currentRateEquipmentCost",
                key: "currentRateEquipmentCost",
                width: 32
              },
              {
                header: "rateLog",
                key: "rateLog",
                width: 32
              }
            ];

            async.each(
              docs,
              function(equipment, callback) {
                let updatedByName = "";
                let updatedByEmail = "";
                let updatedById = "";
                let roofercurrencycode = "";
                let roofervalue = "";
                let materialcurrencycode = "";
                let materialvalue = "";
                if (equipment.providerData != undefined) {
                  if (equipment.providerData.updatedBy) {
                    updatedByEmail = equipment.providerData.updatedBy.email;
                    updatedByName = equipment.providerData.updatedBy.name;
                    updatedById = equipment.providerData.updatedBy._id;
                  }
                  if (equipment.providerData.addedBy) {
                    updatedByEmail = equipment.providerData.addedBy.email;
                    updatedByName = equipment.providerData.addedBy.name;
                    updatedById = equipment.providerData.addedBy._id;
                  }
                }
                if (equipment.currentRate.rooferCost.currencyCode == undefined) {
                  roofercurrencycode = "";
                  equipmentcurrencycode = "";
                } else {
                  roofercurrencycode =
                    equipment.currentRate.rooferCost.currencyCode +
                    "," +
                    equipment.currentRate.rooferCost.value;
                  equipmentcurrencycode =
                    equipment.currentRate.equipmentCost.currencyCode +
                    "," +
                    equipment.currentRate.rooferCost.value;
                }
                if (equipment.files.docs.length > 0) {
                  equipment.files.docs.map(document => {
                    allAssets.push(document);
                  });
                }
                if (equipment.files.images.length > 0) {
                  equipment.files.images.map(document => {
                    allAssets.push(document);
                  });
                }

                worksheet.addRow({
                  _id: equipment._id,
                  updatedAt: equipment.updatedAt,
                  createdAt: equipment.createdAt,
                  name: equipment.name,
                  unit: equipment.unit,
                  companyId: equipment.companyId,
                  systemTag: equipment.systemTag,
                  updatedByName: updatedByName,
                  updatedByEmail: updatedByEmail,
                  updatedBy_id: updatedById,
                  isActive: equipment.isActive,
                  currentRateDate: equipment.currentRate.date,
                  currentRateRooferCost: roofercurrencycode,
                  currentRateEquipmentCost: equipmentcurrencycode
                });

                callback(err);
              },
              function(err) {
                if (err) console.log("ERROR", err);

                var sheet = workbook.addWorksheet("Assets", {
                  pageSetup: {
                    paperSize: 9,
                    orientation: "landscape"
                  }
                });
                sheet.columns = [
                  //{ header: 'materialId', key: 'materialId', width: 10 },
                  {
                    header: "_id",
                    key: "_id",
                    width: 32
                  },
                  {
                    header: "__v",
                    key: "__v",
                    width: 10,
                    outlineLevel: 1
                  },
                  {
                    header: "originalName",
                    key: "originalName",
                    width: 32
                  },
                  {
                    header: "encoding",
                    key: "encoding",
                    width: 32
                  },
                  {
                    header: "mimetype",
                    key: "mimetype",
                    width: 32
                  },
                  {
                    header: "version",
                    key: "version",
                    width: 32
                  },
                  {
                    header: "width",
                    key: "width",
                    width: 32
                  },
                  {
                    header: "height",
                    key: "height",
                    width: 32
                  },
                  {
                    header: "format",
                    key: "format",
                    width: 32
                  },
                  {
                    header: "resource_type",
                    key: "resource_type",
                    width: 32
                  },
                  {
                    header: "bytes",
                    key: "bytes",
                    width: 32
                  },
                  {
                    header: "etag",
                    key: "etag",
                    width: 32
                  },
                  {
                    header: "url",
                    key: "url",
                    width: 32
                  },
                  {
                    header: "secure_url",
                    key: "secure_url",
                    width: 32
                  },
                  {
                    header: "companyId",
                    key: "companyId",
                    width: 32
                  },
                  {
                    header: "created",
                    key: "created",
                    width: 32
                  },
                  {
                    header: "isActive",
                    key: "isActive",
                    width: 32
                  },
                  {
                    header: "pages",
                    key: "pages",
                    width: 32
                  },
                  {
                    header: "assetDescription",
                    key: "assetDescription",
                    width: 32
                  },
                  {
                    header: "assetName",
                    key: "assetName",
                    width: 32
                  }
                ];

                async.each(
                  allAssets,
                  function(asset, callback) {
                    sheet.addRow({
                      _id: asset._id,
                      __v: asset.__v,
                      originalName: asset.originalName,
                      encoding: asset.encoding,
                      mimetype: asset.mimetype,
                      version: asset.version,
                      width: asset.width,
                      height: asset.height,
                      format: asset.format,
                      resource_type: asset.resource_type,
                      bytes: asset.bytes,
                      etag: asset.etag,
                      url: asset.url,
                      secure_url: asset.secure_url,
                      companyId: asset.companyId,
                      created: asset.created,
                      isActive: asset.isActive,
                      pages: asset.pages,
                      assetDescription: asset.assetDescription,
                      assetName: asset.assetName
                    });

                    callback(err);
                  },
                  function(err) {
                    if (err) console.log("ERROR", err);
                    let fileName = "equipment.xlsx";
                    console.log("filename is: ", fileName);
                    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
                    res.setHeader(
                      "Content-Type",
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    );

                    workbook.xlsx.write(res).then(function() {
                      console.log("response file is : ", res);
                      res.end();
                    });
                  }
                );
              }
            );
          }
        });
    } catch (e) {
      console.log("exceeption ", e);
    }
  },

  exportExcelDcp: (req, res) => {
    let allAssets = [];
    try {
      ComboMaterial.find({})

        .where({ companyId: req.user.companyId })
        //  .populate({
        //   path: "comboMaterialList",
        //   populate: {
        //     path: "materialId",
        //   }
        // })
        .populate([
          {
            path: "comboMaterialList",
            populate: {
              path: "materialId",
              populate: [
                {
                  path: "files.images",
                  path: "files.docs"
                }
              ]
            }
          },
          { path: "files.images" },
          { path: "files.docs" }
        ])
        .exec(function(err, docs) {
          if (err) {
            return res.json(err);
          } else {
            console.log(docs);
            var workbook = new Excel.Workbook();
            var worksheet = workbook.addWorksheet("DCP", {
              pageSetup: {
                paperSize: 9,
                orientation: "landscape"
              },
              views: [{ state: "frozen", ySplit: 1 }]
            });
            worksheet.columns = [
              {
                header: "Id",
                key: "_id",
                width: 10
              },
              {
                header: "updatedAt",
                key: "updatedAt",
                width: 32
              },
              {
                header: "createdAt",
                key: "createdAt",
                width: 10,
                outlineLevel: 1
              },
              {
                header: "Name",
                key: "name",
                width: 32
              },
              {
                header: "Unit",
                key: "unit",
                width: 32
              },
              {
                header: "CompanyId",
                key: "companyId",
                width: 32
              },

              {
                header: "systemTag",
                key: "systemTag",
                width: 32
              },
              {
                header: "materialId",
                key: "materialid",
                width: 32
              },
              {
                header: "Materials",
                key: "materials",
                width: 32
              },
              {
                header: "Quantity",
                key: "quantity",
                width: 32
              },
              {
                header: "PercentAdditions",
                key: "percents",
                width: 32
              },
              {
                header: "Roofer Cost",
                key: "rooferTotal",
                width: 32
              },
              {
                header: "materials Cost",
                key: "materialTotal",
                width: 32
              },
              {
                header: "updatedByName",
                key: "updatedByName",
                width: 32
              },
              {
                header: "updatedByEmail",
                key: "updatedByEmail",
                width: 32
              },
              {
                header: "updatedBy_id",
                key: "updatedBy_id",
                width: 32
              },
              {
                header: "isActive",
                key: "isActive",
                width: 32
              }
            ];
            async.each(
              docs,
              function(dcp, callback) {
                let updatedByName = "";
                let updatedByEmail = "";
                let updatedById = "";
                let matsToAdd = [];
                let materialsList = "";
                if (dcp.providerData != undefined) {
                  if (dcp.providerData.updatedBy) {
                    updatedByEmail = dcp.providerData.updatedBy.email;
                    updatedByName = dcp.providerData.updatedBy.name;
                    updatedById = dcp.providerData.updatedBy._id;
                  }
                  if (dcp.providerData.addedBy) {
                    updatedByEmail = dcp.providerData.addedBy.email;
                    updatedByName = dcp.providerData.addedBy.name;
                    updatedById = dcp.providerData.addedBy._id;
                  }
                }
                if (dcp.comboMaterialList.length > 0) {
                  rooferTotal = 0;
                  materialTotal = 0;
                  for (let item of dcp.comboMaterialList) {
                    if (
                      item.materialId &&
                      typeof item.materialId !== "String" &&
                      item.materialId.currentRate
                    ) {
                      rooferTotal +=
                        item.materialId.currentRate.rooferCost.value *
                        item.quantity *
                        item.percentageAdditions.reduce((acc, x) => {
                          acc = acc * (1 + x.value / 100);
                          return acc;
                        }, 1);
                      materialTotal +=
                        item.materialId.currentRate.materialCost.value *
                        item.quantity *
                        item.percentageAdditions.reduce((acc, x) => {
                          acc = acc * (1 + x.value / 100);
                          return acc;
                        }, 1);
                    }
                  }
                  dcp.materialTotal = {
                    value: materialTotal
                  };
                  dcp.rooferTotal = {
                    value: rooferTotal
                  };
                } else {
                  dcp.materialTotal = {
                    value: 0
                  };
                  dcp.rooferTotal = {
                    value: 0
                  };
                }

                if (dcp.files.docs.length > 0) {
                  dcp.files.docs.map(document => {
                    allAssets.push(document);
                  });
                }
                if (dcp.files.images.length > 0) {
                  dcp.files.images.map(document => {
                    allAssets.push(document);
                  });
                }
                worksheet.addRow({
                  _id: dcp._id,
                  updatedAt: dcp.updatedAt,
                  createdAt: dcp.createdAt,
                  name: dcp.name,
                  unit: dcp.unit,
                  companyId: dcp.companyId,
                  systemTag: dcp.systemTag,
                  isActive: dcp.isActive,
                  rooferTotal: dcp.rooferTotal.value,
                  materialTotal: dcp.materialTotal.value,
                  updatedByName: updatedByName,
                  updatedByEmail: updatedByEmail,
                  updatedBy_id: updatedById
                });
                if (dcp.comboMaterialList.length > 0) {
                  for (let item of dcp.comboMaterialList) {
                    if (
                      item.materialId &&
                      typeof item.materialId !== "String" &&
                      item.materialId.currentRate
                    ) {
                      let percent = "";
                      if (item.percentageAdditions.length > 0) {
                        item.percentageAdditions.map((itempercent, i) => {
                          percent =
                            percent +
                            "(" +
                            itempercent.percentageType +
                            "," +
                            itempercent.value +
                            ")";
                          if (i != item.percentageAdditions.length - 1) {
                            percent = percent;
                          }
                        });
                      }

                      worksheet.addRow({
                        systemTag: item.materialId.systemTag,
                        materialid: item.materialId._id,
                        materials: item.materialId.name,
                        quantity: item.quantity,
                        percents: percent
                      });
                    }
                  }
                }
                callback(err);
              },
              function(err) {
                if (err) console.log("ERROR", err);

                //  res.send(assets);
                //return res.json(assets);
                var sheet = workbook.addWorksheet("Assets", {
                  pageSetup: {
                    paperSize: 9,
                    orientation: "landscape"
                  }
                });
                sheet.columns = [
                  //{ header: 'materialId', key: 'materialId', width: 10 },
                  {
                    header: "_id",
                    key: "_id",
                    width: 32
                  },
                  {
                    header: "__v",
                    key: "__v",
                    width: 10,
                    outlineLevel: 1
                  },
                  {
                    header: "originalName",
                    key: "originalName",
                    width: 32
                  },
                  {
                    header: "encoding",
                    key: "encoding",
                    width: 32
                  },
                  {
                    header: "mimetype",
                    key: "mimetype",
                    width: 32
                  },
                  {
                    header: "version",
                    key: "version",
                    width: 32
                  },
                  {
                    header: "width",
                    key: "width",
                    width: 32
                  },
                  {
                    header: "height",
                    key: "height",
                    width: 32
                  },
                  {
                    header: "format",
                    key: "format",
                    width: 32
                  },
                  {
                    header: "resource_type",
                    key: "resource_type",
                    width: 32
                  },
                  {
                    header: "bytes",
                    key: "bytes",
                    width: 32
                  },
                  {
                    header: "etag",
                    key: "etag",
                    width: 32
                  },
                  {
                    header: "url",
                    key: "url",
                    width: 32
                  },
                  {
                    header: "secure_url",
                    key: "secure_url",
                    width: 32
                  },
                  {
                    header: "companyId",
                    key: "companyId",
                    width: 32
                  },
                  {
                    header: "created",
                    key: "created",
                    width: 32
                  },
                  {
                    header: "isActive",
                    key: "isActive",
                    width: 32
                  },
                  {
                    header: "pages",
                    key: "pages",
                    width: 32
                  },
                  {
                    header: "assetDescription",
                    key: "assetDescription",
                    width: 32
                  },
                  {
                    header: "assetName",
                    key: "assetName",
                    width: 32
                  }
                ];

                async.each(
                  allAssets,
                  function(asset, callback) {
                    sheet.addRow({
                      _id: asset._id,
                      __v: asset.__v,
                      originalName: asset.originalName,
                      encoding: asset.encoding,
                      mimetype: asset.mimetype,
                      version: asset.version,
                      width: asset.width,
                      height: asset.height,
                      format: asset.format,
                      resource_type: asset.resource_type,
                      bytes: asset.bytes,
                      etag: asset.etag,
                      url: asset.url,
                      secure_url: asset.secure_url,
                      companyId: asset.companyId,
                      created: asset.created,
                      isActive: asset.isActive,
                      pages: asset.pages,
                      assetDescription: asset.assetDescription,
                      assetName: asset.assetName
                    });

                    callback(err);
                  },
                  function(err) {
                    if (err) console.log("ERROR", err);
                    let fileName = "combo_mats.xlsx";

                    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
                    res.setHeader(
                      "Content-Type",
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    );

                    workbook.xlsx.write(res).then(function() {
                      res.end();
                    });
                  }
                );
              }
            );
          }
        });
    } catch (e) {
      console.log("exception ", e);
    }
  },

  getItemsForDCP: async (req, res) => {
    try {
      let regex = req.query.search ? new RegExp(req.query.search, "gi") : new RegExp(),
        query = {
          companyId: req.user.companyId,
          isActive: true,
          $or: [
            {
              name: regex
            },
            {
              systemTag: regex
            }
          ]
        };

      let inventoryData = await Promise.all([
        Material.find(query)
          .select("name unit currentRate systemTag")
          .lean()
          .exec(),
        Equipment.find(query)
          .select("name unit currentRate systemTag")
          .lean()
          .exec()
      ]);

      inventoryData = Array.prototype.concat.apply([], inventoryData);
      inventoryData = inventoryData.map(x => {
        x.type = /EQPMT/.test(x.systemTag) ? 2 : 1;
        return x;
      });
      return res.status(200).json({
        message: "Items loaded successfully",
        data: inventoryData
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getEquipmentLocations: async (req, res) => {
    try {
      let EquipLocaiontion = await Equipment.find({
        companyId: req.user.companyId
      })
        .select("name systemTag loc")
        .lean();

      return res.status(200).json({
        message: "Equipment Locations loaded success",
        data: EquipLocaiontion
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  setDefaultInventoryCost: async (req, res) => {
    try {
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  addNewInventoryCost: async (req, res) => {
    try {
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getMaterialBySystemTag: async (req, res) => {
    let tag = req.params.systemtag;
    console.log(tag);
    if (tag) {
      Material.findOne({ systemTag: tag }).exec((err, material) => {
        if (material) {
          let matObject = {
            name: material.name,
            systemTag: material.systemTag,
            currentRate: material.currentRate
          };
          return res.json(matObject);
        } else {
          return res.status(500).json({
            err: 500,
            message: "error fetching Material"
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

  getEquipmentBySystemTag: async (req, res) => {
    let tag = req.params.systemtag;
    console.log(tag);
    if (tag) {
      Equipment.findOne({ systemTag: tag }).exec((err, equipment) => {
        if (equipment) {
          let matObject = {
            name: equipment.name,
            systemTag: equipment.systemTag,
            currentRate: equipment.currentRate
          };
          return res.json(matObject);
        } else {
          return res.status(500).json({
            err: 500,
            message: "error fetching Material"
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

  getComboMatBySystemTag: async (req, res) => {
    let tag = req.params.systemtag;
    console.log(tag);

    let comboMaterial = await ComboMaterial.findOne({
      systemTag: tag
    })
      .populate([
        {
          path: "comboMaterialList",
          populate: [
            {
              path: "materialId"
            },
            {
              path: "equipmentId"
            }
          ]
        }
      ])
      .lean();

    if (!comboMaterial) {
      return res.status(404).json({
        message: "Combo material not found"
      });
    }

    return res.status(200).json({
      message: "Combo material loaded successfully",
      data: comboMaterial
    });
  }
};

function hasNumber(myString) {
  return /\d/.test(myString);
}
