const request = require("request");
const Supplier = require("../models/supplier.model");
const EntityTag = require("../models/entityTag.model");
const Asset = require("../models/asset.model");
const mongoose = require("mongoose");
const __ = require("../helper/globals");
const user = require("../models/user.model");
const Joi = require("joi");

module.exports = {
  saveSupplier: async (req, res) => {
    try {
      let supplier = {};
      let existingEntityTag = await EntityTag.findOne({
        prefix: "SUPP"
      });

      let currentEntityTag;
      if (!existingEntityTag) {
        /* first time check */
        let newTag = new EntityTag({
          prefix: "SUPP",
          count: 3000
        });
        currentEntityTag = await newTag.save();
      } else {
        currentEntityTag = existingEntityTag;
      }
      currentEntityTag.count++;
      let updatedEntityTag = await currentEntityTag.save();
      updatedEntityTag = updatedEntityTag.toObject();

      supplier.systemTag = `${updatedEntityTag.prefix}${updatedEntityTag.count}`;

      supplier.companyId = req.user.companyId;
      supplier.userId = req.user._id;
      supplier.createdBy = req.user.firstName + " " + req.user.lastName;
      supplier.name = req.body.name;
      supplier.contact = {
        dialCode: req.body.dialCode,
        phoneNumber: req.body.phoneNumber
      };
      supplier.email = req.body.email;
      supplier.address = req.body.address;
      supplier.supplies = req.body.supplies;
      supplier.vat = req.body.vat;
      supplier.paymentConditions = req.body.paymentConditions;
      supplier.staff = req.body.staff;
      supplier.bankDetails = req.body.bankDetails;

      if (req.files && req.files.length > 0) {
        let file = req.files[0];

        file.companyId = req.user.companyId;

        let supplierAsset = new Asset(file);
        let AssetObj = await supplierAsset.save();
        supplier.profilePic = AssetObj.secure_url;
        supplier.assetId = AssetObj._id;
      }

      /**save supplier object */
      let supplierData = new Supplier(supplier);

      let createdSupplier = await supplierData.save();

      return res.status(200).json({
        message: "Supplier created successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getAllSuppliers: async (req, res) => {
    console.log(req.query.search);
    let chunk = null,
      page = null;
    if (req.query.chunk && req.query.page) {
      chunk = parseInt(req.query.chunk);
      page = parseInt(req.query.page);
    }
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
      let supplierCount = await Supplier.count({
        $or: [
          {
            name: regex
          },
          { systemTag: regex }
        ],
        companyId: req.user.companyId
      });
      let suppliersList = await Supplier.find({
        $or: [
          {
            name: regex
          },
          { systemTag: regex }
        ],
        companyId: req.user.companyId
      })
        .populate("supplies")
        .skip(s)
        .limit(chunk)

        .sort("-created")
        .lean();

      /* Get company's default currency */
      console.log("count"+supplierCount);

      return res.json({
        total: supplierCount,
        list: suppliersList
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getSupplier: async (req, res) => {
    let id = req.params.id;
    console.log(id);
    if (id) {
      Supplier.findById(id)
        .populate("supplies")
        .exec((err, supplierdata) => {
          if (supplierdata) {
            return res.json(supplierdata);
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

  addSupplierStaffMember: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          message: "Supplier ID is missing"
        });
      }
      const schema = Joi.object().keys({
        name: Joi.string().required(),
        contact: Joi.object().keys({
          dialCode: Joi.string(),
          phoneNumber: Joi.string()
        }),
        email: Joi.string().required()
      });

      let { error, value } = Joi.validate(req.body, schema);

      if (error) return __.inputValidationError(error, res);

      let { staff } = await Supplier.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { staff: value } }
      );

      return res.status(200).json({
        message: "Staff member added successfully",
        staffs: staff
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateSupplier: async (req, res) => {
    let id = req.params.id;
    let supplier = {};
    console.log(req.body);
    supplier.companyId = req.user.companyId;
    supplier.userId = req.user._id;
    supplier.createdBy = req.user.firstName + " " + req.user.lastName;
    supplier.name = req.body.name;
    supplier.contact = {
      dialCode: req.body.contact.dialCode,
      phoneNumber: req.body.contact.phoneNumber
    };
    supplier.email = req.body.email;
    supplier.address = req.body.address;
    supplier.supplies = req.body.supplies;
    supplier.staff = req.body.staff;
    supplier.bankDetails = req.body.bankDetails;
    supplier.paymentConditions = req.body.paymentConditions;
    supplier.vat = req.body.vat || 0;
    if (!id) {
      return res.status(400).json({
        message: " requested Supplier ID is missing"
      });
    }

    try {
      if (req.files && req.files.length > 0) {
        let assetdata = Asset.findByIdAndRemove({ _id: req.body.assetId });
        let file = req.files[0];

        file.companyId = req.user.companyId;

        let supplierAsset = new Asset(file);
        let AssetObj = await supplierAsset.save();
        supplier.profilePic = AssetObj.secure_url;
        supplier.assetId = AssetObj._id;
      }
      let updatedSupplier = await Supplier.findOneAndUpdate(
        {
          _id: id
        },
        {
          $set: supplier
        },
        {
          new: true
        }
      );

      /* Save all changes */
      await updatedSupplier.save();

      return res.status(200).json({
        message: "supplier's details updated successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },
  editSupplierProfile: async (req, res) => {
    if (!req.params.id) {
      return res.status(400).json({
        message: " requested subcontractor ID is missing"
      });
    }

    try {
      let supplier = {};
      if (req.files && req.files.length > 0) {
        let assetdata = Asset.findByIdAndRemove({ _id: req.body.assetId });
        let file = req.files[0];

        file.companyId = req.user.companyId;

        let supplierAsset = new Asset(file);
        let AssetObj = await supplierAsset.save();

        supplier.profilePic = AssetObj.secure_url;
        supplier.assetId = AssetObj._id;
      }

      supplier.name = req.body.name;
      supplier.contact = req.body.contact;
      supplier.email = req.body.email;
      supplier.address = req.body.address;

      console.log("ssss", supplier);
      await Supplier.update(
        {
          _id: req.params.id
        },
        {
          $set: supplier
        },
        {
          new: true
        }
      );

      return res.status(200).json({
        message: "Supplier's details updated successfully."
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },
  updateSupplierPaymentTerms: async (req, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          message: "Supplier ID is missing"
        });
      }

      const schema = Joi.object().keys({
        paymentConditions: Joi.array(),
        vat: Joi.number()
      });

      let { error, value } = Joi.validate(req.body, schema);

      if (error) return __.inputValidationError(error, res);

      await Supplier.update({ _id: req.params.id }, { $set: value });

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

  deleteSupplier: async (req, res) => {
    let id = req.params.id;

    if (!id) {
      return res.status(400).json({
        message: " requested Supplier ID is missing"
      });
    }
    try {
      await Supplier.update(
        {
          _id: id
        },
        { $set: { isDeleted: true } }
      );

      return res.status(200).json({
        message: "supplier's details deleted successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  }
};
