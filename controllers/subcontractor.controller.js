const request = require("request");
const Subcontractor = require("../models/subcontractor.model");
const EntityTag = require("../models/entityTag.model");
const mongoose = require("mongoose");
const __ = require("../helper/globals");
const entityTagController = require("./entityTag.controller");
const jwt = require("jsonwebtoken");
const mailer = require("./sendGrid.controller");
const Asset = require("../models/asset.model");
const user = require("../models/user.model");
const Joi = require("joi");
module.exports = {
  saveSubcontractor: async (req, res) => {
    try {
      let subcontractor = {};

      /* Check if subcontractor is unique */
      let exists = await Subcontractor.findOne({
        email: req.body.email,
        isDeleted: false,
        "contact.phoneNumber": req.body.phoneNumber,
        "contact.dialCode": req.body.dialCode
      })
        .select("_id")
        .lean();

      if (exists) {
        return res.status(400).json({
          message: "Subcontractor email/mobile already exists"
        });
      }

      subcontractor.systemTag = await entityTagController.generateTag("SUBC");
      subcontractor.companyId = req.user.companyId;
      subcontractor.userId = req.user._id;
      subcontractor.createdBy = req.user.firstName + " " + req.user.lastName;
      subcontractor.name = req.body.name;
      subcontractor.contact = {
        dialCode: req.body.dialCode,
        phoneNumber: req.body.phoneNumber
      };
      subcontractor.email = req.body.email;
      subcontractor.address = req.body.address;
      subcontractor.vat = req.body.vat;
      subcontractor.paymentConditions = req.body.paymentConditions;
      subcontractor.attributes = req.body.attributes;

      subcontractor.staff = req.body.staff;
      subcontractor.bankDetails = req.body.bankDetails;

      if (req.files && req.files.length > 0) {
        let file = req.files[0];

        file.companyId = req.user.companyId;

        let subcontractorAsset = new Asset(file);
        let AssetObj = await subcontractorAsset.save();
        subcontractor.profilePic = AssetObj.secure_url;
        subcontractor.assetId = AssetObj._id;
      }

      /**save supplier object */
      let subcontractorData = new Subcontractor(subcontractor);

      let createdSupplier = await subcontractorData.save();

      /**Mail code for Subcontractor */
      //generate and sve token
      let token = jwt.sign(
        {
          _id: createdSupplier._id
        },
        __.secret,
        {
          expiresIn: "10h"
        }
      );
      //mail send
      let mailData = {
        name: createdSupplier.name,
        email: createdSupplier.email,
        id: createdSupplier._id,
        link: `${__.baseUrl()}/reset_password?id=${createdSupplier._id}`
      };
      await mailer.sendAppLinkToSubcontrator(mailData);

      return res.status(200).json({
        message: "Subcontractor created successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getAllSubcontractors: async (req, res) => {
    console.log("req.query.search");
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

    try {
      console.log("check in req.query=={} in try", req.user.companyId);
      let subcontractorCount = await Subcontractor.count({
        name: regex,
        companyId: req.user.companyId,
        isDeleted: { $ne: true }
      });
      let subcontractorsList = await Subcontractor.find({
        $or: [
          {
            name: regex
          }
        ],
        companyId: req.user.companyId,
        isDeleted: { $ne: true }
      })
        .populate("supplies")
        .where({
          companyId: req.user.companyId
        })
        .skip(s)
        .limit(chunk)

        .sort("-created")
        .lean();

      /* Get company's default currency */

      return res.json({
        total: subcontractorCount,
        list: subcontractorsList
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getSubcontractor: async (req, res) => {
    let id = req.params.id;
    console.log(id);
    if (id) {
      Subcontractor.findById(id)
        .populate("attributes")
        .populate("assetId")
        .exec((err, contractorrdata) => {
          if (contractorrdata) {
            return res.json(contractorrdata);
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
        message: "parameter error"
      });
    }
  },

  editSubContractorProfile: async (req, res) => {
    if (!req.params.id) {
      return res.status(400).json({
        message: " requested subcontractor ID is missing"
      });
    }

    try {
      let contractor = {};
      if (req.files && req.files.length > 0) {
        let assetdata = Asset.findByIdAndRemove({ _id: req.body.assetId });
        let file = req.files[0];

        file.companyId = req.user.companyId;

        let supplierAsset = new Asset(file);
        let AssetObj = await supplierAsset.save();

        contractor.profilePic = AssetObj.secure_url;
        contractor.assetId = AssetObj._id;
      }

      contractor.name = req.body.name;
      contractor.contact = req.body.contact;
      contractor.email = req.body.email;
      contractor.address = req.body.address;

      await Subcontractor.update(
        {
          _id: req.params.id
        },
        {
          $set: contractor
        },
        {
          new: true
        }
      );

      return res.status(200).json({
        message: "Subcontrctor's details updated successfully."
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateSubcontractor: async (req, res) => {
    let id = req.params.id;
    let contractor = {};
    console.log("body: ", req.body);

    contractor.companyId = req.user.companyId;
    contractor.userId = req.user._id;
    contractor.createdBy = req.user.firstName + " " + req.user.lastName;
    contractor.name = req.body.name;
    contractor.contact = {
      dialCode: req.body.contact.dialCode,
      phoneNumber: req.body.contact.phoneNumber
    };
    contractor.email = req.body.email;
    contractor.address = req.body.address;
    contractor.attributes = req.body.attributes;
    contractor.staff = req.body.staff;
    contractor.bankDetails = req.body.bankDetails;
    contractor.paymentConditions = req.body.paymentConditions;
    contractor.vat = req.body.vat || 0;
    if (!id) {
      return res.status(400).json({
        message: " requested subcontractor ID is missing"
      });
    }

    try {
      if (req.files && req.files.length > 0) {
        let assetdata = Asset.findByIdAndRemove({ _id: req.body.assetId });
        let file = req.files[0];

        file.companyId = req.user.companyId;

        let supplierAsset = new Asset(file);
        let AssetObj = await supplierAsset.save();
        contractor.profilePic = AssetObj.secure_url;
        contractor.assetId = AssetObj._id;
      }

      let updatedcontractor = await Subcontractor.findOneAndUpdate(
        {
          _id: id
        },
        {
          $set: contractor
        },
        {
          new: true
        }
      );

      /* Save all changes */
      await updatedcontractor.save();

      return await res.status(200).json({
        message: "Subcontrctor's details updated successfully."
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateSubContractorPaymentTerms: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          message: "Subcontractor ID is missing"
        });
      }

      const schema = Joi.object().keys({
        paymentConditions: Joi.array(),
        vat: Joi.number()
      });

      let { error, value } = Joi.validate(req.body, schema);

      if (error) return __.inputValidationError(error, res);

      await Subcontractor.update({ _id: req.params.id }, { $set: value });

      return res.status(200).json({
        message: "Terms updated successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  deleteSubcontractor: async (req, res) => {
    let id = req.params.id;

    if (!id) {
      return res.status(400).json({
        message: " requested subcontractor ID is missing"
      });
    }
    try {
      await Subcontractor.update(
        {
          _id: id
        },
        { $set: { isDeleted: true } }
      );

      return res.status(200).json({
        message: "Subcontractor deleted successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  setPassword: async (req, res) => {
    let id = req.params.id;
    Subcontractor.findOne(
      {
        _id: id
      },
      (err, subcontractor) => {
        if (err) {
          return res.status(500).json({
            errorTag: 500,
            message: "Internal server error"
          });
        }
        let newPassword = req.body.password;
        let newSaltAndPass = Subcontractor(subcontractor).getSaltAndPassword(newPassword);
        subcontractor.salt = newSaltAndPass.salt;
        subcontractor.password = newSaltAndPass.password;
        subcontractor.webToken = newSaltAndPass.salt;
        Subcontractor.findByIdAndUpdate(
          { _id: id },
          {
            $set: {
              salt: newSaltAndPass.salt,
              password: newSaltAndPass.password,
              webToken: newSaltAndPass.salt
            }
          },
          function(err, subcontractorUpdated) {
            if (err)
              return res.status(500).json({
                errorTag: 500,
                message: "Internal server error"
              });
            return res.status(200).json({
              message: "Password was successfully reset. Please login to continue."
            });
          }
        );
      }
    );
    // console.log("password body :",req.body);
    // if (!id) {
    //     return res.status(400).json({
    //         message: " requested subcontractor ID is missing"
    //     })
    // }

    // try {

    //     let pass = req.body.password;
    //        let updatedcontractor = await Subcontractor.findOneAndUpdate({
    //            _id: id
    //        }, {
    //            $set: {
    //             password: pass,

    //           }
    //        }, {
    //            new: true
    //        })

    //        /* Save all changes */
    //        await updatedcontractor.save();

    //        return await res.status(200).json({
    //            message: "Subcontrctor's details updated successfully."

    //        })
    //    } catch (e) {
    //        console.log(e)
    //        return res.status(500).json({
    //            message: "Internal server error"
    //        })
    //    }
  },

  addStaffToSubContractor: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          message: "Sub contractor id is missing"
        });
      }
      console.log("rr", req.body);
      const schema = Joi.object().keys({
        name: Joi.string().required(),
        contact: Joi.object().keys({
          dialCode: Joi.string().required(),
          phoneNumber: Joi.string().required()
        }),
        email: Joi.string().required()
      });

      let { error, value } = Joi.validate(req.body, schema);
      if (error) return __.inputValidationError(error, res);

      let subContractorData = await Subcontractor.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { staff: value } },
        { new: true }
      )
        .populate([{ path: "attributes", model: "Tag" }, { path: "assetId", model: "Asset" }])
        .lean();

      return res.status(200).json({
        message: "Staff added successfully",
        data: subContractorData
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  }
};
