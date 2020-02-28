"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const reportSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    systemTag: {
      type: String,
      required: true
    },
    reportType: {
      type: String,
      enum: ["Safety", "Quality", "Issue", "Other"]
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project"
    },
    deadline: {
      type: Date
    },
    subContractors: [
      {
        type: Schema.Types.ObjectId,
        ref: "Subcontractor"
      }
    ],
    registrationInterval: {
      type: Number
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    aboutCompany: {
      type: String,
      default: ""
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client"
    },
    /* Client logo is a separate field due to custom logos for a report */
    clientLogo: {
      type: String
    },
    subContractorLogo: {
      type: String
    },
    controlPlans: [
      {
        type: Schema.Types.ObjectId,
        ref: "controlplan"
      }
    ],
    checkList: {
      type: Schema.Types.ObjectId,
      ref: "CheckList"
    },
    status: {
      type: String,
      enum: ["InProcess", "Completed"],
      default: "InProcess"
    },
    drawings: [
      {
        type: Schema.Types.ObjectId,
        ref: "Asset"
      }
    ],
    siteDocs: [
      {
        type: Schema.Types.ObjectId,
        ref: "ReportSiteDoc"
      }
    ],
    registrations: [
      {
        type: Schema.Types.ObjectId,
        ref: "ReportRegistration"
      }
    ],
    comments: [
      {
        comment: { type: String },
        userName: { type: String },
        pic: { type: String },
        addTime: {
          type: Date,
          default: Date.now
        },
        images: [
          {
            type: Schema.Types.ObjectId,
            ref: "Asset"
          }
        ]
      }
    ],
    exportHistory: [
      {
        generatedAt: {
          type: Date,
          default: Date.now
        },
        doc: {
          type: String
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
