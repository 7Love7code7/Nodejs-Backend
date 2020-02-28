require("dotenv");

const Quote = require("../models/quote.model");
const _ = require("lodash");
const __ = require("../helper/globals");
const Joi = require("joi");
const AWS = require("aws-sdk");
AWS.config.loadFromPath("./helper/awsconfig.json");
const s3 = new AWS.S3();
const jsr = require("jsreport-client")("http://13.233.49.113:5488", "admin", "cloudes@123");
const mailer = require("./sendGrid.controller");
const moment = require("moment");
const User = require('../models/user.model')

function salesController() {
  /* Private vars */

  const methods = {
    generateReportPdf: data => {
      //console.log("data", data)
      return new Promise((resolve, reject) => {
        jsr
          .render({
            template: {
              shortid: "BJ5wYnRsE",
              recipe: "chrome-pdf",
              engine: "handlebars"
            },
            data: data
          })
          .then(pdf => {
            return Promise.all([
              s3
              .upload({
                Bucket: "3dfilesdata",
                Key: `quotes/${data.quoteName}_${Date.now()}.pdf`,
                Body: pdf
              })
              .promise()
            ]);
          })
          .then(([resp]) => {
            return Promise.all([
              mailer.sendQuotesMail(data, pdf, resp.Location),

              Quote.update({
                _id: data._id
              }, {
                $set: {
                  pdfObjectAssign: resp.Location
                }
              }).exec(),
              resp
            ]);
          })
          .then(([_, resp]) => {
            resolve(resp);
          })
          .catch(e => {
            console.log(e);
            reject(e);
          });
      });
    },
    createQuote: async (req, res) => {
      try {
        const schema = Joi.object().keys({
          quoteName: Joi.string().required(),
          project: Joi.string(),
          date: Joi.date(),
          validTill: Joi.date(),
          responsiblePerson: Joi.string(),
          description: Joi.string(),
          termsAndConditions: Joi.string(),
          totalNetAmount: Joi.number(),
          totalTaxAmount: Joi.number(),
          quoteTotal: Joi.number(),
          projectName: Joi.string(),
          clients: Joi.array().items(
            Joi.object({
              clientId: Joi.string(),
              firstName: Joi.string(),
              lastName: Joi.string(),
              companyName: Joi.string(),
              location: Joi.string(),
              email: Joi.string().email(),
              acceptStatus: Joi.string().valid("Accepted", "Declined", "ReEstimation"),
              processingState: Joi.string().valid("Created", "Sent")
            })
          ),
          quoteDetails: Joi.array().items(
            Joi.object({
              productId: Joi.string(),
              productName: Joi.string(),
              productDescription: Joi.string(),
              unitPrice: Joi.number(),
              currency: Joi.string(),
              unitQuantity: Joi.number(),
              total: Joi.number()
            })
          )
        });

        let {
          error,
          value
        } = Joi.validate(req.body, schema);

        if (error)
          return __.inputValidationError(error, res);

        let data = [];
        await Promise.all(
          await value.clients.map(async (val, i) => {
            await new Promise(async (res, rej) => {
              data.push({
                ...value,
                ...{
                  clients: val
                }
              });
              return res(data);
            });
          })
        );

        let quoteDataSaved = await Quote.insertMany(data);

        let userData = await User.findOne({
          _id: value.responsiblePerson
        }).select('firstName lastName middleName').lean()
        quoteDataSaved = await quoteDataSaved.map(x => {
          x = x.toObject()
          x.date = moment(x.date).format("LL");
          x.validTill = moment(x.validTill).format('LL')
          x.userName = `${userData.firstName} ${userData.middleName} ${userData.lastName}`
          // x.projectName = value.projectName
          return x
        })
        quoteDataSaved.map(element => {
          methods.generateReportPdf(element);
        });

        return res.status(200).json({
          message: "Added Quote",
          success: true
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },

    listAllQuotes: async (req, res) => {
      let chunk = null,
        page = null;
      if (req.query.chunk && req.query.page) {
        chunk = parseInt(req.query.chunk);
        page = parseInt(req.query.page);
      }
      let s = (page - 1) * chunk;
      let search = "";
      let regex = null;
      if (req.query.search) {
        regex = new RegExp(req.query.search, "gi");
      } else {
        regex = new RegExp();
      }
      /* Sort handling */
      let sortObj = {
        createdAt: -1
      };
      try {
        let quotesCount = await Quote.count({
          $or: [{
              "clients.firstName": regex
            },
            {
              "clients.lastName": regex
            }
          ],
          isActive: 1,
          "clients.processingState": "Created"
        });
        let quotesList = await Quote.find({
            $or: [{
                "clients.firstName": regex
              },
              {
                "clients.lastName": regex
              }
            ],
            isActive: 1,
            "clients.processingState": "Created"
          })
          .skip(s)
          .limit(chunk)
          .sort(sortObj)
          .lean();

        // quoteList = await quotesList.map(x => {
        //   x.date = moment(x.date).format('DD-MM-YYYY')
        //   x.validTill = moment(x.validTill).format('DD-MM-YYYY')
        //   return x
        // })
        return res.json({
          total: quotesCount,
          list: quotesList
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },
    listSentQuotes: async (req, res) => {
      let chunk = null,
        page = null;
      if (req.query.chunk && req.query.page) {
        chunk = parseInt(req.query.chunk);
        page = parseInt(req.query.page);
      }
      let s = (page - 1) * chunk;
      let search = "";
      let regex = null;
      if (req.query.search) {
        regex = new RegExp(req.query.search, "gi");
      } else {
        regex = new RegExp();
      }
      /* Sort handling */
      let sortObj = {
        createdAt: -1
      };
      try {
        let quotesCount = await Quote.count({
          $or: [{
              "clients.firstName": regex
            },
            {
              "clients.lastName": regex
            }
          ],
          isActive: 1,
          "clients.processingState": "Sent"
        });
        let quotesList = await Quote.find({
            $or: [{
                "clients.firstName": regex
              },
              {
                "clients.lastName": regex
              }
            ],
            isActive: 1,
            "clients.processingState": "Sent"
          })
          .skip(s)
          .limit(chunk)
          .sort(sortObj)
          .lean();

        return res.json({
          total: quotesCount,
          list: quotesList
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },
    listQuote: async (req, res) => {
      try {
        const schema = Joi.object().keys({
          quoteId: Joi.string()
        });

        let {
          error,
          value
        } = Joi.validate(req.params, schema);

        if (error)
          return __.inputValidationError(error, res);

        //console.log("value", value);
        let quotesList = await Quote.findOne({
          _id: value.quoteId,
          isActive: 1
        }).lean()
        // .populate({
        //   path: 'responsiblePerson',
        //   select: 'displayName _id'
        // }).
        //lean();
        return res.json({
          success: true,
          list: quotesList
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    },
    updateQuote: async (req, res) => {
      try {
        if (!req.params.quoteId) {
          return res.status(400).json({
            message: "Requires quoteId"
          });
        }
        const schema = Joi.object().keys({
          quoteName: Joi.string().required(),
          project: Joi.string(),
          date: Joi.string(),
          validTill: Joi.string(),
          responsiblePerson: Joi.string(),
          description: Joi.string(),
          termsAndConditions: Joi.string(),
          totalNetAmount: Joi.number(),
          totalTaxAmount: Joi.number(),
          quoteTotal: Joi.number(),
          projectName: Joi.string(),
          clients: Joi.object({
            clientId: Joi.string(),
            firstName: Joi.string(),
            lastName: Joi.string(),
            companyName: Joi.string(),
            location: Joi.string(),
            email: Joi.string().email(),
            acceptStatus: Joi.string().valid("Accepted", "Declined", "ReEstimation"),
            processingState: Joi.string().valid("Created", "Sent")
          }),

          quoteDetails: Joi.array().items(
            Joi.object({
              productId: Joi.string(),
              productName: Joi.string(),
              productDescription: Joi.string(),
              unitPrice: Joi.number(),
              currency: Joi.string(),
              unitQuantity: Joi.number(),
              total: Joi.number(),
              _id: Joi.string().allow('')

            })
          )
        });

        let {
          error,
          value
        } = Joi.validate(req.body, schema);

        if (error)
          return __.inputValidationError(error, res);

        let quoteDataUpdated = await Quote.findOneAndUpdate({
          _id: req.params.quoteId
        }, {
          $set: value
        }, {
          new: true
        }).lean()

        quoteDataUpdated.date = moment(quoteDataUpdated.date).format("LL");
        quoteDataUpdated.validTill = moment(quoteDataUpdated.validTill).format('LL')
        // quoteDataUpdated.projectName = value.projectName

        methods.generateReportPdf(quoteDataUpdated);

        return res.status(200).json({
          message: "updated Quote",
          quoteData: quoteDataUpdated
        });
      } catch (e) {
        console.log(e);
        return res.status(500).json({
          message: "Internal server error"
        });
      }
    }
  };
  return Object.freeze(methods);
}

module.exports = salesController();