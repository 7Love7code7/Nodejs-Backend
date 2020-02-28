const Billing = require("../models/billing.model");
const Company = require("../models/company.model");
const Asset = require("../models/asset.model");
const mime = require("mime");
const __ = require("../helper/globals");
const Joi = require("joi");
const entityTagController = require("./entityTag.controller");

module.exports = {
  createNewBilling: async (req, res) => {
    try {
      let billingData = req.body;

      if (!req.file) {
        return res.status(400).json({
          message: "Please upload bill"
        });
      }

      let file = {
        ...req.file,
        ...{
          providerData: { name: req.user.displayName },
          assetName: req.file.originalname,
          secure_url: req.file.location,
          url: req.file.location,
          byles: req.file.size.toString(),
          format: mime.extension(req.file.mimetype)
        }
      };

      let newBill = new Asset(file);
      newBill = await newBill.save();
      billingData.bill = newBill._id;

      billingData.companyId = req.user.companyId;
      billingData.thumbnail = file.location.replace(/pdf$/, "jpg");
      billingData.systemTag = await entityTagController.generateTag("BILL");
      Billing(billingData).save((err, billData) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ err: 500, message: err.message });
        } else {
          return res.status(200).json({
            message: "Billing details added successfully",
            data: billData
          });
        }
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "internal server error"
      });
    }
  },

  getAllBillings: async (req, res) => {
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

    let findQuery = {
      companyId: req.user.companyId
    };

    if (req.query.project && req.query.project != "undefined") {
      findQuery.projectId = req.query.project;
    }

    if (req.query.approval) {
      findQuery.approvalStatus = req.query.approval;
    }

    Billing.find(findQuery)
      .populate([
        { path: "bill", select: "secure_url" },
        { path: "approver", select: "displayName" },
        {
          path: "supplier",
          populate: {
            path: "supplies"
          }
        }
      ])
      .skip(s)
      .limit(chunk)
      .sort({ createdAt: -1 })
      .exec((err, list) => {
        if (err) {
          return res.status(500).json({ errorTag: 100, message: err.message });
        }
        Billing.count(findQuery, (err, count) => {
          if (err) {
            return res.status(500).json({ errorTag: 100, message: err.message });
          } else {
            // for (let l of list) {
            //   let pdfUrl = await s3.getSignedUrl("getObject", {
            //       Bucket: "3dfilesdata",
            //       Key: `billingData/${invoice.invoiceTag}.pdf`,
            //       ContentType: "application/pdf",
            //       Expires: 86400
            //     });

            //     l.bill.secure_url = pdfUrl;
            // }

            return res.json({ total: count, list: list });
          }
        });
      });
  },

  getBillDetails: async (req, res) => {
    try {
      if (!req.params.billId) {
        return res.status(400).json({
          message: "Bill Id is missing"
        });
      }

      let billData = await Billing.findOne({ _id: req.params.billId })
        .populate([
          { path: "bill", select: "secure_url" },
          { path: "approver", select: "displayName" },
          { path: "supplier" }
        ])
        .lean();

      return res.status(200).json({
        message: "Bill data loaded successfully",
        data: billData
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  approveBill: async (req, res) => {
    try {
      /* Get list of company's bill approvers */
      let { billApprovers } = await Company.findOne({
        _id: req.user.companyId
      })
        .select("billApprovers")
        .lean();
      /* Get the total bill amount for comparision */
      let { totalAmount } = await Billing.findOne({ _id: req.body.billId })
        .select("totalAmount")
        .lean();

      /* Validate if the user is indeed a bill approver */

      let isApprover = billApprovers.reduce((acc, x) => {
        if (String(x.approver) === String(req.user._id)) {
          if (totalAmount > x.limit) {
            acc = acc || false;
          } else {
            acc = acc || true;
          }
        }
        return acc;
      }, false);

      if (!isApprover) {
        return res.status(403).json({
          message: "Insufficient privileges"
        });
      }

      await Billing.update({ _id: req.body.billId }, { $set: { approvalStatus: req.body.status } });

      return res.status(200).json({
        message: `Billing ${req.body.status} successfully`
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  addCustomBillSupplierInfo: async (req, res) => {
    try {
      if (!req.params.billId) {
        return res.status(400).json({
          message: "Bill id is missing"
        });
      }

      await Billing.update({ _id: req.params.billId }, { $set: req.body });

      return res.status(200).json({
        message: "Bill data updated successfully"
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  addCompanyBillType: async (req, res) => {
    try {
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  beginNavigation: async (req, res) => {
    try {
      let visitId = req.params.visitId;
      let id = req.user._id;
      let visit = await Visit.findOneAndUpdate({ _id: visitId }, { $set: { visitStatus: 3 } });

      if (!visit) return error(res, 400, "Invalid Visit Id");

      return res.status(200).json({
        message: "Timeline created successfully"
      });
    } catch (e) {
      return errors(res, 500, e);
    }
  }
};
