const Company = require("../models/company.model");
const User = require("../models/user.model");
const calcversion = require("../models/CalcSheetVersion.model")
const Project = require("../models/project.model");
const Material = require("../models/material.model");
const Equipment = require("../models/equipment.model");
const Calc = require("../models/calculations.model");
const companyAdmin = require("../models/companyAdmin.model");
const crypto = require("crypto");
const mailer = require("./sendGrid.controller");
const jwt = require("jsonwebtoken");
const __ = require("../helper/globals");
const moment = require("moment");
const util = require("util");
const fx = require("money");
const Joi = require("joi");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const mime = require("mime-types");
const request = require("request");

module.exports = {
  createCompany: async (req, res) => {
    try {
      //create a company (super admin)
      let data = req.body;
      data.providerData = {};
      data.providerData.addedBy = {
        _id: req.user["_id"],
        email: req.user["email"],
        name: req.user["firstName"] + " " + req.user["lastName"]
      };

      await Company(data).save();
      return res.status(200).json({
        message: "Company created successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  listAllCompany: (req, res) => {
    //list all employees in company (super admin)
    //TODO : pagination
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
    Company.find({
      $or: [
        {
          companyName: regex
        },
        {
          email: regex
        },
        {
          "address1.line1": regex
        },
        {
          "address1.line2": regex
        },
        {
          "address1.line3": regex
        },
        {
          "address1.city": regex
        }
      ]
    })
      .populate([
        { path: "billApprovers.approver", select: "displayName" },
        { path: "billApprovalAdmin", select: "displayName" }
      ])
      .sort({
        isActive: 1,
        companyName: 1
      })
      .skip(s)
      .limit(chunk)
      .exec((err, list) => {
        if (list) return res.status(200).json(list);
        else {
          return res.status(500).json({
            errorTag: 100,
            message: "couldn't fetch from database",
            server: err
          });
        }
      });
  },

  getEmployeeById: (req, res) => {
    if (req.params.emp_id) {
      User.findById(req.params.emp_id, (err, emp) => {
        if (emp) {
          //remove sensitive data
          emp.password = emp.salt = emp.created = emp.updated = undefined;
          emp.webToken = emp.mobileToken = emp.authorizationCode = undefined;
          if (emp.companyId == req.user.companyId || req.user.authorizationCode == 15)
            return res.json(emp);
          else
            return res.json({
              errorTag: 106,
              message: "You can not access this data"
            });
        } else {
          return res.json({
            error: 200,
            message: "no params found"
          });
        }
      });
    } else {
      return res.status(400).json({
        errorTag: 101,
        message: "no params found"
      });
    }
  },

  getCompany: (req, res) => {
    if (req.user.companyId)
      Company.findById(req.user.companyId).exec((err, company) => {
        if (err) {
          return res.json({
            errorTag: 100,
            message: err
          });
        }
        if (company == null) {
          return res.status(404).json({
            errorTag: 101,
            message: "no Company found"
          });
        } else {
          Project.count(
            {
              companyId: req.user.companyId
            },
            (err, count) => {
              company = company.toObject();
              if (count) company.projectCount = count;
              else company.projectCount = 0;

              return res.json(company);
            }
          );
        }
      });
    else {
      return res.status(400).json({
        errorTag: 101,
        message: "no params found"
      });
    }
  },

  getCompanyById: (req, res) => {
    const companyId = req.params.cmp_id;
    if (companyId)
      Company.findById(companyId)
        .populate([
          { path: "billApprovers.approver", select: "displayName" },
          { path: "billApprovalAdmin", select: "displayName" }
        ])
        .exec((err, company) => {
          if (err) {
            return res.json({
              errorTag: 100,
              message: err
            });
          }
          if (company == null) {
            return res.status(404).json({
              errorTag: 101,
              message: "no Company found"
            });
          } else {
            Project.count(
              {
                companyId: companyId
              },
              (err, count) => {
                company = company.toObject();
                if (count) company.projectCount = count;
                else company.projectCount = 0;

                return res.json(company);
              }
            );
          }
        });
    else {
      return res.status(400).json({
        errorTag: 101,
        message: "no params found"
      });
    }
  },

  updateCompanyById: (req, res) => {
    //update 1 employee using _id
    let data = req.body;
    let cmp_id = req.params.cmp_id;
    data.providerData = {};
    data.providerData.updatedBy = {
      _id: req.user["_id"],
      email: req.user["email"],
      name: req.user["firstName"] + " " + req.user["lastName"]
    };
    if (cmp_id) {
      Company.findOneAndUpdate(
        {
          _id: cmp_id
        },
        data,
        {
          new: true
        },
        (err, result) => {
          if (result) {
            return res.json(result);
          } else
            return res.status(500).json({
              errorTag: 100,
              message: err.message
            });
        }
      );
    } else {
      return res.status(400).json({
        errorTag: 101,
        message: "INVALID REQUEST"
      });
    }
  },

  createCompanyAdmin: (req, res) => {
    //(super admin)
    let admin = req.body;
    admin.designation = "admin";
    admin.companyId = req.params.cmp_id;

    if (req.params.cmp_id) {
      Company.findById(req.params.cmp_id, (err, company) => {
        if (company) {
          if (company.companyAdmin)
            return res.json({
              error: 400,
              message: "Admin for this company already exist"
            });
          else {
            let pass = crypto.randomBytes(6).toString("base64");
            admin.password = pass;

            User(admin).save((err, user) => {
              console.log("USER", user);
              if (user) {
                let token = jwt.sign(
                  {
                    _id: user._id
                  },
                  __.secret,
                  {
                    expiresIn: "10h"
                  }
                );
                let mailData = {
                  name: user.firstName,
                  email: user.email,
                  link: `https://cloudes-company-staging.firebaseapp.com/set_password?token=${token}`,
                  logo: company.companyLogo
                };
                //send mail
                mailer.welcomeMail(mailData);
                Company.update(
                  {
                    _id: req.params.cmp_id
                  },
                  {
                    companyAdmin: user._id
                  },
                  (err, company) => {
                    if (company) return res.json(company);
                    else
                      return res.status(500).json({
                        errorTag: 100,
                        message: "DB operation failed"
                      });
                  }
                );
              } else
                return res.status(400).json({
                  errorTag: 100,
                  message: err.message
                });
            });
          }
        } else {
          return res.status(403).json(err);
        }
      });
    } else {
      return res.status(400).json({
        errorTag: 101,
        message: "No params found"
      });
    }
  },

  updateCompanyAdminById: (req, res) => {
    //update admin details of a company (super admin)
    let adm = req.params.adm_id;
    let newAdmin = req.body;
    if (!newAdmin)
      return res.status(403).json({
        errorTag: 102,
        message: "no admin data found in REQUEST"
      });
    User.findByIdAndUpdate(adm, newAdmin, (err, result) => {
      if (result) return res.json(result);
      else
        return res.status(500).json({
          errorTag: 100,
          message: "DB operation failed",
          extra: err.message
        });
    });
  },

  createManager: (req, res) => {
    //create a manager in company (company admin)

    User.findOne(
      {
        email: req.body.email
      },
      function(err, doesUserExist) {
        if (doesUserExist) {
          return res.status(400).json({
            errorTag: 102,
            message: "Email already registered"
          });
        } else {
          let admin = req.user;
          let manager = req.body;
          manager.designation = "manager";
          manager.companyId = admin.companyId;
          manager.providerData = {
            addedBy: {
              _id: admin._id,
              name: admin.firstName + " " + admin.lastName
            }
          };

          console.log("uuuu", manager);
          new User(manager).save((err, user) => {
            if (user) {
              Company.findByIdAndUpdate(
                admin.companyId,
                {
                  $push: {
                    companyManagers: user._id
                  }
                },
                {
                  safe: true,
                  upsert: true,
                  new: true
                },
                {
                  $set: {
                    updated: Date.now()
                  }
                },
                (err, result) => {
                  if (result) {
                    let token = jwt.sign(
                      {
                        _id: user._id
                      },
                      __.secret,
                      {
                        expiresIn: "10h"
                      }
                    );

                    let mailData = {
                      name: user.firstName + " " + user.lastName,
                      email: user.email,
                      link: `https://cloudes-company-staging.firebaseapp.com/set_password?token=${token}`
                    };
                    //send mail
                    mailer.welcomeMail(mailData);
                    return res.json(result);
                  } else {
                    console.log("managerErr", err);
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
        }
      }
    );
  },

  updateManager: (req, res) => {
    let admin = req.user;
    let manager_id = req.params.manager_id;
    let manager = req.body;
    manager.updated = Date.now();
    if (manager_id) {
      User.findOneAndUpdate(
        {
          _id: manager_id
        },
        manager,
        (err, result) => {
          if (result) {
            return res.json(result);
          } else
            return res.json({
              error: 500,
              message: err.message
            });
        }
      );
    } else {
      return res.json({
        error: 403,
        message: "INVALID REQUEST"
      });
    }
  },

  createRoofer: (req, res) => {
    let admin = req.user;
    let roofer = req.body;
    roofer.designation = "roofer";
    roofer.companyId = admin.companyId;
    roofer.password = null;
    roofer.providerData = {
      addedBy: {
        _id: admin._id,
        name: admin.firstName + " " + admin.lastName
      }
    };
    User(roofer).save((err, user) => {
      if (user) {
        Company.findByIdAndUpdate(
          admin.companyId,
          {
            $push: {
              companyRoofers: user._id
            },
            safe: true,
            upsert: true,
            new: true,
            $set: {
              updated: Date.now()
            }
          },
          (err, result) => {
            if (result) return res.json(result);
            else
              return res.status(500).json({
                error: 500,
                message: err.message
              });
          }
        );
      } else {
        return res.status(403).json({
          error: 403,
          message: err.message
        });
      }
    });
  },

  updateRoofer: (req, res) => {
    let updater = req.user;
    let roofer_id = req.params.roofer_id;
    let roofer = req.body;
    roofer.updated = Date.now();
    roofer.providerData = {};
    roofer.providerData.lastUpdatedBy = {
      _id: updater._id,
      name: updater.displayName
    };
    if (roofer_id) {
      User.findOneAndUpdate(
        {
          _id: roofer_id
        },
        roofer,
        (err, result) => {
          if (result) {
            return res.json(result);
          } else
            return res.json({
              error: 500,
              message: err.message
            });
        }
      );
    } else {
      return res.json({
        error: 403,
        message: "INVALID REQUEST"
      });
    }
  },

  updateCompanyLogo: (req, res) => {
    let file = req.file;
    if (file) {
      Company.findByIdAndUpdate(
        {
          _id: req.user.companyId
        },
        {
          $set: {
            companyLogo: file.secure_url
          }
        },
        {
          $set: {
            updated: Date.now()
          }
        },
        (err, result) => {
          if (result) return res.json(result);
          else return res.json(err);
        }
      );
    } else {
      return res.status(500).json({
        error: 500,
        message: "couldnt upload"
      });
    }
  },

  /* Setting up company currency by admin */
  changeCompanyCurrency: async (req, res) => {
    let requiredFields = ["currencyCode", "conversionFactor"];
    if (!__.requiredFields(req, requiredFields)) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }

    try {
      let user = req.user;
      let currencyObj = {
        currencyCode: req.body.currencyCode,
        date: moment().format(),
        conversionFactor: req.body.conversionFactor
      };

      /*change company level costs
      /* Push new currency into company */

      let compdata = await Company.findOne({
        _id: req.user.companyId
      });

      let globalWorkerCost = compdata.averageWorkerCost;
      await Company.findOneAndUpdate(
        {
          _id: req.user.companyId
        },
        {
          $set: {
            currentCurrency: currencyObj,
            //average workercost
            averageWorkerCost: globalWorkerCost * req.body.conversionFactor
          },
          $push: {
            currencyLog: currencyObj
          }
        }
      );

      /* Update currency of materials */

      let companyMaterials = await Material.find({
        companyId: req.user.companyId
      })
        // .snapshot()
        .lean();

      for (let doc of companyMaterials) {
        if (doc.currentRate && doc.currentRate.materialCost && doc.currentRate.rooferCost) {
          /* Only do this for old materials */
          let newRate = {
            date: moment().format(),
            materialCost: {
              currencyCode: req.body.currencyCode,
              value: doc.currentRate.materialCost.value * req.body.conversionFactor
            },
            rooferCost: {
              currencyCode: req.body.currencyCode,
              value: doc.currentRate.rooferCost.value * req.body.conversionFactor
            }
          };

          let pushOperation = {
            $push: {
              rateLog: newRate
            }
          };

          let setOperation = {
            $set: {
              currentRate: newRate
            }
          };
          /* Updating materials with new currency data */

          await Material.bulkWrite([
            {
              updateOne: {
                filter: {
                  _id: doc._id
                },
                update: pushOperation
              }
            },
            {
              updateOne: {
                filter: {
                  _id: doc._id
                },
                update: setOperation
              }
            }
          ]);
        }
      }

      /* Update currency of equipment */

      let companyEquipment = await Equipment.find({
        companyId: req.user.companyId
      })
        // .snapshot()
        .lean();

      for (let doc of companyEquipment) {
        if (
          doc.currentRate &&
          doc.currentRate.equipmentCost &&
          doc.currentRate.equipmentCost.value
        ) {
          /* Only do this for old materials */
          let newRate = {
            date: moment().format(),
            equipmentCost: {
              currencyCode: req.body.currencyCode,
              value: doc.currentRate.equipmentCost.value * req.body.conversionFactor
            },
            rooferCost: {
              currencyCode: req.body.currencyCode,
              value: doc.currentRate.rooferCost.value * req.body.conversionFactor
            }
          };

          let pushOperation = {
            $push: {
              rateLog: newRate
            }
          };

          let setOperation = {
            $set: {
              currentRate: newRate
            }
          };
          /* Updating equipment with new currency data */

          await Equipment.bulkWrite([
            {
              updateOne: {
                filter: {
                  _id: doc._id
                },
                update: pushOperation
              }
            },
            {
              updateOne: {
                filter: {
                  _id: doc._id
                },
                update: setOperation
              }
            }
          ]);
        }
      }

      let calcSheets = await Calc.find({
        companyId: req.user.companyId
      }).lean();

      for (let sheet of calcSheets) {
         let activeSheet = sheet;
         var calcOldData = {
          RootArray : activeSheet.RootArray,
          rateLog : activeSheet.rateLog,
          projectId : activeSheet.projectId,
          companyId : activeSheet.companyId,
          hierarchicalCostSeqLast : activeSheet.hierarchicalCostSeqLast,
          lastGroupId:activeSheet.lastGroupId,
          companyCurrency:activeSheet.companyCurrency,
          companyProfit:activeSheet.companyProfit,
          companyCost:activeSheet.companyCost,
          sum:activeSheet.sum,
          totalprofit:activeSheet.totalprofit,
          totalAdminCost:activeSheet.totalAdminCost,
          totalWorkHours:activeSheet.totalWorkHours,
          totalCompanyCost:activeSheet.totalCompanyCost,
          totalCostPrice:activeSheet.totalCostPrice,
          averageWorkerCost:activeSheet.averageWorkerCost,
          additionalCosts:activeSheet.additionalCosts,
          created:activeSheet.created
        }
        //console.log("calcOldData",calcOldData);
         let newVersionSheet = new calcversion(calcOldData);
         newVersionSheet.save();

        sheet.averageWorkerCost = sheet.averageWorkerCost * req.body.conversionFactor;
        sheet.sum = 0;sheet.totalCompanyCost=0;sheet.totalWorkHours=0;sheet.totalProfit=0;sheet.totalCostPrice=0;
        var conversionFactor = req.body.conversionFactor;
        var companyCostper = sheet.companyCost;
        var companyProfitper = sheet.companyProfit;
        var companyworkerCost = sheet.averageWorkerCost;
        var versionObj ={};
        sheet.RootArray.forEach(group => {
          let searchingGrp = group;
          let elementafterrecursion = CalcinventoryRefresh(
            group,
            searchingGrp,
            conversionFactor,
            companyCostper,
            companyworkerCost,
            companyProfitper
          );
          sheet.sum = sheet.sum + group.sum;
          sheet.totalCompanyCost = sheet.totalCompanyCost+group.sumCompanyCost;
          sheet.totalWorkHours = sheet.totalWorkHours + group.sumHours;
          sheet.totalProfit = sheet.totalProfit+group.sumProfit;
          sheet.totalCostPrice=sheet.totalCostPrice+group.sumCostPrice
        });
        
        if(sheet.versioning && sheet.versioning.length>0){
          var versiondata = sheet.versioning[sheet.versioning.length-1].versionSeq;
         let versioning = {
            versionSeq:versiondata+1,
            savedBy: user.firstName +" "+user.lastName,
            olderCalcSheetVersionId:newVersionSheet._id,
            sum:sheet.sum,
            totalCompanyCost: sheet.totalCompanyCost,
            totalWorkHours: sheet.totalWorkHours,
            totalProfit: sheet.totalprofit,
            totalCostPrice: sheet.totalCostPrice
          }
          versionObj = versioning;
        }else{
            let versioning = {
              versionSeq:1,
              savedBy: user.firstName +" "+user.lastName,
              sum:sheet.sum,
              totalCompanyCost: sheet.totalCompanyCost,
              totalWorkHours:sheet.totalWorkHours,
              totalProfit: sheet.totalprofit,
              totalCostPrice:sheet.totalCostPrice
            }
            versionObj = versioning;
        }
        

        let pushOperation = {
          $push: {
            rateLog: currencyObj,
            versioning : versionObj
          }
        };
        let setOperation = {
          $set: {
            averageWorkerCost: sheet.averageWorkerCost,
            sum: sheet.sum,
            RootArray: sheet.RootArray,
            companyCurrency: req.body.currentCurrency
          }
        };

        await Calc.bulkWrite([
          {
            updateOne: {
              filter: {
                _id: sheet._id
              },
              update: pushOperation
            }
          },
          {
            updateOne: {
              filter: {
                _id: sheet._id
              },
              update: setOperation
            }
          }
        ]);
      }

      return res.status(200).json({
        message: "Currency has been updated",
        data: currencyObj
      });
    
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  bulkInsertRoofers: (req, res) => {
    if (!req.user.companyId) {
      return res.json({
        error: "Super Admin Can't do that"
      });
    }
    let rooferList = req.body;
    var admin = req.user;
    rooferList.map(roofer => {
      roofer.designation = "roofer";
      roofer.companyId = admin.companyId;
      roofer.password = null;
      roofer.providerData = {
        addedBy: {
          _id: admin._id,
          name: admin.firstName + " " + admin.lastName
        }
      };
    });
    var reported = 0;
    let report = () => {
      reported = reported + 1;
      if (reported == rooferList.length) return res.send(reported + " added");
    };
    rooferList.forEach(function(roofer) {
      User(roofer).save((err, user) => {
        if (user) {
          Company.findByIdAndUpdate(
            admin.companyId,
            {
              $push: {
                companyRoofers: user._id
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
              } else
                return res.status(500).json({
                  error: 500,
                  message: err.message
                });
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

  toggleCompanyIsActiveById: (req, res) => {
    let c_id = req.params.c_id;
    Company.findById(c_id, (err, company) => {
      if (company) {
        Company.findByIdAndUpdate(
          c_id,
          {
            $set: {
              isActive: !company.isActive,
              updated: Date.now()
            }
          },
          (err, newCompany) => {
            return res.json(newCompany);
          }
        );
      } else
        return res.json({
          message: "company not found"
        });
    });
  },

  /**Registratioon of a company. */
  registerCompany: (req, res) => {
    //register a company
    console.log("rrrrrr");
    let data = req.body;
    console.log("in registration company");
    console.log(data);
    Company(req.body).save((err, company) => {
      if (company) {
        var uuid = guid();
        var referenceData = {
          companyId: company._id,
          generatedUuid: uuid
        };
        companyAdmin(referenceData).save((err, compadmindata) => {
          if (compadmindata) {
            //sending mail on company provided E-mail Id.

            let mailData = {
              name: company.companyName,
              email: company.email,
              id: compadmindata.generatedUuid,
              link: `${__.baseUrl()}`
              // logo: result.companyLogo
            };
            console.log(mailData);
            //send mail
            mailer.sendAdminFormLinkToCompany(mailData);
            return res.json(company);
          } else {
            return res.json(err);
          }
        });
      } else {
        return res.json(err);
      }
    });
  },

  registerCompanyAdmin: (req, res) => {
    let admin = req.body;
    console.log(admin);
    admin.designation = "admin";
    if (req.params.cmp_id) {
      companyAdmin.findOne(
        {
          generatedUuid: req.params.cmp_id
        },
        (err, companyAdmin) => {
          if (companyAdmin) {
            console.log("companyAdmin data", companyAdmin);
            var companyid = companyAdmin.companyId;
            admin.companyId = companyid;

            Company.findById(companyid, (err, company) => {
              if (company) {
                console.log("company found");
                if (company.companyAdmin) {
                  console.log("company admin already exists");
                  return res.status(107).json({
                    errorTag: 100,
                    message: "Admin for this company already exist."
                  });
                } else {
                  console.log("in else of company.companyadmin");
                  let pass = crypto.randomBytes(6).toString("base64");
                  admin.password = pass;

                  User(admin).save((err, user) => {
                    console.log("USER", user);
                    if (user) {
                      let token = jwt.sign(
                        {
                          _id: user._id
                        },
                        __.secret,
                        {
                          expiresIn: "10h"
                        }
                      );
                      let mailData = {
                        name: user.firstName,
                        email: user.email,
                        link: `https://cloudes-company-staging.firebaseapp.com/set_password?token=${token}`,
                        logo: company.companyLogo
                      };
                      //send mail
                      mailer.welcomeMail(mailData);
                      Company.update(
                        {
                          _id: companyid
                        },
                        {
                          companyAdmin: user._id
                        },
                        (err, company) => {
                          if (company) {
                            /**make company admin isActive false */
                            // companyAdmin.isActive = false;
                            companyAdmin.remove();
                            return res.json(company);
                          } else {
                            return res.status(500).json({
                              errorTag: 100,
                              message: "DB operation failed"
                            });
                          }
                        }
                      );
                    } else
                      return res.status(400).json({
                        errorTag: 100,
                        message: err.message
                      });
                  });
                }
              } else {
                return res.status(500).json({
                  errorTag: 100,
                  message: "company not found"
                });
              }
            });
          } else {
            return res.status(500).json({
              errorTag: 100,
              message: "Requsted params data did not found"
            });
          }
        }
      );
    } else {
      return res.status(500).json({
        errorTag: 100,
        message: "did not found params."
      });
    }
  },

  /* Configure settings for companies dashboard*/

  dashboardSettings: async (req, res) => {
    try {
      if (!req.params.companyId) {
        return res.status(400).json({
          message: "Company ID is missing"
        });
      }

      let settingsData = req.body;
      await Company.update(
        {
          _id: req.params.companyId
        },
        {
          $set: {
            dashboardSettings: settingsData
          }
        }
      );

      return res.status(200).json({
        message: "Settings updated successfully"
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  /* Register company admin through new dashboard */

  dashboardRegistration: async (req, res) => {
    try {
      let requiredFields = [
        "companyName",
        "name",
        "email",
        "dialCode",
        "phoneNumber",
        "description",
        "addressLine1",
        "addressLine2",
        "city",
        "postalCode",
        "countryCode"
      ];

      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }

      /* Check if email ID exists */

      let emailExists = await User.findOne({ email: req.body.email }).lean();

      if (emailExists) {
        return res.status(400).json({
          message: "Email Id already registered"
        });
      }

      /* Create company first */

      let companyData = {
        companyName: req.body.companyName,
        email: req.body.email,
        companyContact: {
          dialCode: req.body.dialCode,
          phoneNumber: req.body.phoneNumber
        },
        description: req.body.description,
        address1: {
          line1: req.body.addressLine1,
          line2: req.body.addressLine2,
          city: req.body.city,
          postalCode: req.body.postalCode,
          countryCode: req.body.postalCode
        }
      };

      let newCompany = new Company(companyData);

      newCompany = await newCompany.save();

      /* Create company admin */
      const names = req.body.name.split(" ");
      let admin = {
        firstName: names[0],
        displayName: names[0],
        lastName: names[1] || "",
        designation: "admin",
        email: req.body.email,
        mobile: {
          dialCode: req.body.dialCode,
          phoneNumber: req.body.phoneNumber
        },
        companyId: newCompany._id,
        password: crypto.randomBytes(6).toString("base64")
      };

      let newAdmin = new User(admin);

      newAdmin = await newAdmin.save();

      newAdmin = newAdmin.toObject();

      let token = jwt.sign(
        {
          _id: newAdmin._id,
          new: true
        },
        __.secret,
        {
          expiresIn: "10h"
        }
      );
      let mailData = {
        name: newAdmin.firstName,
        email: newAdmin.email,
        link: `${__.baseUrl()}/set_password?token=${token}`,
        logo: newCompany.companyLogo
      };

      /* Send welcome mail */

      mailer.welcomeMail(mailData);

      /* Update company admin in company data */

      newCompany.companyAdmin = newAdmin._id;

      await newCompany.save();

      return res.status(200).json({
        message: "Company created successfully. Please check your email"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  /* Change role based access */

  updateRoleBasedAccess: async (req, res) => {
    let privileges = req.body;

    try {
      await Company.update({ _id: req.user.companyId }, { $set: { privileges: privileges } });

      return res.status(200).json({
        message: "Privileges updated successfully"
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  /* Company economic settings */
  companyEconomicSettings: async (req, res) => {
    try {
      /* Create asset object if file included */
      if (req.file) {
        req.body.termsAndConditions = req.file.secure_url;
      }

      const schema = Joi.object().keys({
        termsAndConditions: Joi.string(),
        billApprovalAdmin: Joi.string().required(),
        billAutoAggregation: Joi.object().keys({
          email: Joi.string(),
          subjectLineCode: Joi.string()
        }),
        paymentInfo: Joi.array().items(
          Joi.object().keys({
            accountNumber: Joi.string(),
            accountName: Joi.string(),
            bankDetails: Joi.string(),
            subcontractors: Joi.string()
            // isDefault: Joi.boolean(),
            // companyId: Joi.string()
          })
        )
      });

      let { error, value } = Joi.validate(req.body, schema);

      await Company.update({ _id: req.user.companyId }, { $set: { economicSettings: value } });
      console.log("value>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", value);
      // if (error) {
      //   console.log(error);
      //   return res.status(400).json({
      //     message: "Input validation error"
      //   });
      // }

      return res.status(200).json({
        message: "Economic settings updated successfully",
        value
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  addOrRemoveBillingApprover: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        userId: Joi.string().required(),
        limit: Joi.number()
          .min(1)
          .required()
      });

      let { error, value } = Joi.validate(req.body, schema);

      if (error) {
        console.log(error);
        return res.status(400).json({
          message: "Required fields missing/invalid",
          error
        });
      }

      /* Check if the user belongs in the company */

      let { companyManagers, billApprovers } = await Company.findOne({
        _id: req.user.companyId
      })
        .select("companyManagers billApprovers")
        .lean();

      if (companyManagers.indexOf(value.userId) < 0) {
        return res.status(400).json({
          message: "This user doesn't belong to your company"
        });
      }

      /* Check if user is already a billing approver */

      let approverArray = billApprovers ? billApprovers.map(x => String(x.approver)) : [];

      if (approverArray.indexOf(value.userId) > -1) {
        return res.status(200).json({
          message: "This user is already a bill approver"
        });
      }

      /* Make the user an approver otherwise */

      await Company.update(
        { _id: req.user.companyId },
        {
          $push: {
            billApprovers: {
              approver: value.userId,
              limit: value.limit
            }
          }
        }
      );

      return res.status(200).json({
        message: "Bill approver added successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  createPaymentTerm: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        from: Joi.number().required(),
        to: Joi.number().required(),
        percentage: Joi.number()
          .min(1)
          .max(100)
          .required()
      });

      let { error, value } = Joi.validate(req.body, schema);

      if (error) {
        console.log(error);
        return res.status(400).json({
          message: "Required fields missing/invalid",
          error
        });
      }

      await Company.update({ _id: req.user.companyId }, { $push: { paymentConditions: value } });

      return res.status(200).json({
        message: "Payment term created successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  saveCalcCompanyInfo: async (req, res) => {
    try {
      let companyCost = req.body.companyCost;
      let profit = req.body.profit;
      let averageWorkerCost = req.body.averageWorkerCost;
      await Company.findOneAndUpdate(
        {
          _id: req.user.companyId
        },
        {
          $set: {
            averageWorkerCost: averageWorkerCost,
            profit: profit,
            companyCost: companyCost
          }
        }
      );
      return res.status(200).json({
        message: "Company has been updated",
        data: {
          averageWorkerCost: averageWorkerCost,
          profit: profit,
          companyCost: companyCost
        }
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateCompanyInputMethod: async (req, res) => {
    try {
      let companyInputMethod = req.body.companyInputMethod;

      await Company.findOneAndUpdate(
        {
          _id: req.user.companyId
        },
        {
          $set: {
            companyInputMethod: companyInputMethod
          }
        }
      );
      return res.status(200).json({
        message: "Company has been updated",
        data: {
          companyInputMethod: companyInputMethod
        }
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateEmployeeSettings: async (req, res) => {
    try {
      let defaultEmployeeSettings = req.body;
      console.log("default emp: ", defaultEmployeeSettings);
      await Company.findOneAndUpdate(
        {
          _id: req.user.companyId
        },
        {
          $set: {
            employee: defaultEmployeeSettings
          }
        }
      );
      return res.status(200).json({
        message: "Company has been updated",
        data: defaultEmployeeSettings
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateControlPlans: async (req, res) => {
    try {
      let controlplan = req.body;
      console.log("default emp: ", controlplan);
      await Company.findOneAndUpdate(
        {
          _id: req.user.companyId
        },
        {
          $set: {
            controlPlans: controlplan
          }
        }
      );
      return res.status(200).json({
        message: "Company has been updated",
        data: controlplan
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  sendSimpleMail: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        mailTo: Joi.string().required(),
        subject: Joi.string().required(),
        attachmentUrl: Joi.string().required()
      });

      let { error, value } = Joi.validate(req.body, schema);

      if (error) return __.inputValidationError(error, res);

      let transporter = nodemailer.createTransport(
        smtpTransport({
          service: "gmail",
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: "cloudsdevelopment@gmail.com",
            pass: "clouds123"
          }
        })
      );
      // create a pass through stream
      let fileStream = request(value.attachmentUrl).pipe(require("stream").PassThrough());

      let mailOptions = {
        from: "cloudsdevelopment@gmail.com",
        to: value.mailTo,
        subject: value.subject,
        html: "",
        attachments: [
          {
            filename: `attachment.${mime.extension(mime.lookup(value.attachmentUrl))}`,
            content: fileStream,
            contentType: mime.lookup(value.attachmentUrl) || undefined
          }
        ]
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log("eee", err);
          return res.status(500).json({
            message: "Error occured",
            success: false
          });
        } else {
          return res.status(200).json({
            message: "Mail sent successfully",
            success: true
          });
        }
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  }
};

//calculation got calc sheet when company currency chnges
function CalcinventoryRefresh(
  level,
  serchingGrp,
  conversionFactor,
  companyCostper,
  companyworkerCost,
  companyProfitper
) {
  level.sum = 0;
  level.sumHours = 0;
  level.sumProfit = 0;
  level.sumCompanyCost = 0;
  level.sumCostPrice = 0;

  if (level.items) {
    level.items.map(selectedMaterial => {
      if (selectedMaterial != null && selectedMaterial.matname) {
        let path = level.custompath;
        var splittedpath = path.split("/");

        //Row calculations
        selectedMaterial.currentRate.materialCost.value =
          selectedMaterial.currentRate.materialCost.value * conversionFactor;
        selectedMaterial.currentRate.rooferCost.value =
          selectedMaterial.currentRate.rooferCost.value * conversionFactor;

        selectedMaterial.wasteAmount =
          selectedMaterial.matAmount * (selectedMaterial.wastePercent / 100);
        selectedMaterial.workerCostPrice =
          selectedMaterial.currentRate.rooferCost.value * selectedMaterial.workerAmount;
        //Inventory Cost price calculation
        selectedMaterial.inventoryCostPrice =
          (selectedMaterial.wasteAmount + selectedMaterial.matAmount) *
          selectedMaterial.currentRate.materialCost.value;
        selectedMaterial.labourHours =
          selectedMaterial.workerAmount *
          (selectedMaterial.currentRate.rooferCost.value / companyworkerCost);
        selectedMaterial.initialPrise =
          selectedMaterial.currentRate.materialCost.value + selectedMaterial.workerCostPrice;
        selectedMaterial.companyCostForInventory =
          selectedMaterial.inventoryCostPrice * (companyCostper / 100);
        selectedMaterial.companyCostForWorker =
          selectedMaterial.workerCostPrice * (companyCostper / 100);
        var profittempAmt = 0;
        var workerprofAmt = 0;
        selectedMaterial.selectedFor.map(element => {
          if (element.applyTo == "inventory" || element.applyTo == "both") {
            profittempAmt =
              profittempAmt + selectedMaterial.inventoryCostPrice * (element.value / 100);
          }
          if (element.applyTo == "worker" || element.applyTo == "both") {
            workerprofAmt =
              workerprofAmt + selectedMaterial.workerCostPrice * (element.value / 100);
          }
        });

        selectedMaterial.inventoryprofit =
          (profittempAmt +
            selectedMaterial.inventoryCostPrice +
            selectedMaterial.companyCostForInventory) *
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

        if (selectedMaterial.rowStyle == "Inventory") {
          //  selectedMaterial.currentLabourHr=selectedMaterial.labourHours;
          selectedMaterial.currentCostPrice = 0;
          selectedMaterial.currentCompanyCost = selectedMaterial.companyCostForInventory;
          selectedMaterial.currentProfit = selectedMaterial.inventoryprofit;
          selectedMaterial.currentsalesPrice = selectedMaterial.s_price;
        } else if (selectedMaterial.rowStyle == "Worker") {
          selectedMaterial.currentLabourHr = selectedMaterial.labourHours;
          selectedMaterial.currentCostPrice = selectedMaterial.workerCostPrice;
          selectedMaterial.currentCompanyCost = selectedMaterial.companyCostForWorker;
          selectedMaterial.currentProfit = selectedMaterial.workerProfit;
          selectedMaterial.currentsalesPrice = selectedMaterial.workers_price;
        } else {
          selectedMaterial.currentLabourHr = selectedMaterial.labourHours;
          selectedMaterial.currentCostPrice =
            selectedMaterial.inventoryCostPrice + selectedMaterial.workerCostPrice;
          selectedMaterial.currentCompanyCost =
            selectedMaterial.companyCostForInventory + selectedMaterial.companyCostForWorker;
          selectedMaterial.currentProfit =
            selectedMaterial.inventoryprofit + selectedMaterial.workerProfit;
          selectedMaterial.currentsalesPrice =
            selectedMaterial.s_price + selectedMaterial.workers_price;
        }

        splittedpath.map(id => {
          searchTreeId(serchingGrp, id, selectedMaterial);
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
      CalcinventoryRefresh(
        item,
        serchingGrp,
        conversionFactor,
        companyCostper,
        companyworkerCost,
        companyProfitper
      );
    });
  } else {
    // console.log("in else of sublevel",level);
    return level;
  }
}

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
}

function guid() {
  return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}
