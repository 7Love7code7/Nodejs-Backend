const EntityTag = require("../models/entityTag.model");
const Invoice = require("../models/invoice.model");
const __ = require("../helper/globals");
const jsr = require("jsreport-client")("http://13.233.49.113:5488", "admin", "cloudes@123");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");
const s3 = new AWS.S3();
const mailer = require("./sendGrid.controller");
const methods = {
  createInvoice: async (req, res) => {
    try {
      let requiredFields = [
        "client",
        "date",
        "projectSystemTag",
        "termsAndConditions",
        "calculatedProcess",
        "items",
        "invoiceStatus",
        "variationOrder",
        "email"
      ];

      /* Validate request */
      if (!__.requiredFields(req, requiredFields)) {
        return res.status(400).json({
          message: "Required fields missing"
        });
      }
      /* Get invoice tag */
      let invoiceTag = await EntityTag.findOne({
        prefix: "INVOICE"
      });
      invoiceTag.count++;

      let savedInvoiceTag = await invoiceTag.save();

      savedInvoiceTag = savedInvoiceTag.toObject();

      /* Add invoice data to database */

      let invoiceData = req.body;
      invoiceData.invoiceTag = `${savedInvoiceTag.prefix}${savedInvoiceTag.count}`;
      invoiceData.companyId = req.user.companyId;

      /* Ignore items without a description */
      invoiceData.items = invoiceData.items.filter(x => {
        return x.description ? true : false;
      });

      let newInvoice = new Invoice(invoiceData);
      let data = await newInvoice.save();

      /* Fetch invoice data again for PDF */
      invoiceData = await Invoice.findOne({
          _id: data._id
        })
        .populate({
          path: "client",
          select: "clientName email"
        })
        .lean();
      /* No need of await for now */
      methods.generateInvoiceReport(invoiceData);

      /* Send approval mail for variation order type */

      if (invoiceData.variationOrder) {
        let mailData = {
          name: invoiceData.client.clientName,
          email: invoiceData.client.email,
          link: `${__.baseUrl()}/invoiceApproved?invoiceId=${invoiceData._id}`,
          invoiceTag: invoiceData.invoiceTag
        };

        mailer.sendInvoiceMail(mailData);
      }

      return res.status(200).json({
        message: "Invoice saved successfully",
        data: invoiceData
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },
  /* Generate and save invoice report */
  generateInvoiceReport: data => {
    return new Promise((resolve, reject) => {
      jsr
        .render({
          template: {
            shortid: "rkJTnK2ce",
            recipe: "chrome-pdf",
            engine: "handlebars"
          },
          data: data
        })
        /* Upload stream to s3 */
        .then(pdf => {
          return Promise.all([
            pdf,
            s3
            .upload({
              Bucket: "3dfilesdata",
              Key: `invoices/${data.invoiceTag}.pdf`,
              Body: pdf
            })
            .promise()
          ]);
        })
        /* Save Key to DB */
        .then(([pdf, resp]) => {
          return Promise.all([
            pdf,
            Invoice.update({
              _id: data._id
            }, {
              $set: {
                invoiceDoc: resp.Location
              }
            }).exec(),
            resp.Location
          ]);
        })
        /* Send mail */
        .then(([pdf, _, link]) => {
          data.invoiceDoc = link;
          return mailer.generateProjectInvoice(data, pdf);
        })
        .then(resp => {
          resolve(resp);
        })
        .catch(e => {
          console.log(e);
          reject(e);
        });
    });
  },

  listAllProjectInvoice: type => async (req, res) => {
    try {
      /* if (!req.params.projectTag) {
        return res.status(400).json({ message: "Project ID is required" });
      } */
      let chunk = null,
        page = null;
      if (req.query.chunk && req.query.page) {
        chunk = parseInt(req.query.chunk);
        page = parseInt(req.query.page);
      }

      let s = (page - 1) * chunk;

      let lObjQueryCondition = !!req.params.projectTag ? {
        projectSystemTag: req.params.projectTag,
        variationOrder: type
      } : {
        variationOrder: type
      };
      console.log("lObjQueryCondition", lObjQueryCondition)
      lObjQueryCondition = null;
      let lIntTotalCount = await Invoice.count(lObjQueryCondition);
      let invoiceList = await Invoice.find(lObjQueryCondition)
        .populate({
          path: "client",
          select: "clientName clientLogo address1"
        })
        .skip(s)
        .limit(chunk)
        .sort({
          createdAt: -1
        })
        .lean();

      for (let invoice of invoiceList) {
        let pdfUrl = await s3.getSignedUrl("getObject", {
            Bucket: "3dfilesdata",
            Key: `invoices/${invoice.invoiceTag}.pdf`,
            Expires: 86400
          }),
          thumbUrl = await s3.getSignedUrl("getObject", {
            Bucket: "3dfilesdata",
            Key: `invoices/${invoice.invoiceTag}.png`,
            Expires: 86400
          });

        invoice.invoiceDoc = pdfUrl;
        invoice.thumbnail = thumbUrl;
      }

      return res.status(200).json({
        message: "Invoice loaded successfully",
        list: invoiceList,
        totalCount: lIntTotalCount
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  },

  updateInvoiceData: type => async (req, res) => {
    console.log("updateInvoiceData");
    try {
      console.log(req.body);
      let lObjInvoiceId = req.params.invoiceId;
      console.log(lObjInvoiceId);
      if (!lObjInvoiceId && !type) {
        return res.status(400).json({
          message: "Invoice ID is required"
        });
      }
      let lObjResponse = {};

      if (type) {
        console.log("InvoiceApproved", req.query.invoiceId);
        lObjResponse = await Invoice.findOneAndUpdate({
          _id: req.query.invoiceId
        }, {
          $set: {
            approvalStatus: "approved"
          }
        }, {
          new: true
        }).lean();
      } else {
        let lObjUpdatedDate = req.body;
        lObjResponse = await Invoice.findOneAndUpdate({
          _id: lObjInvoiceId
        }, lObjUpdatedDate, {
          new: true
        }).lean();
      }

      return res.status(200).json({
        message: "Invoice updated successfully",
        list: lObjResponse
      });
    } catch (e) {
      return res.status(500).json({
        message: e
      });
    }
  }
};

module.exports = Object.freeze(methods);