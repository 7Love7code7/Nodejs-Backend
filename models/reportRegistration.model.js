"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const reportRegistrationSchema = new Schema(
  {
    systemTag: {
      type: String,
      required: true
    },
    registrationType: {
      type: String,
      enum: ["QA-Registration", "Safety", "Issue", "Other"]
    },
    controlPlanItems: [
      {
        type: String
      }
    ],
    group: [{ type: String }],

    drawingData: [
      {
        originalImage: {
          type: Schema.Types.ObjectId,
          ref: "Asset"
        },
        serializedData: {
          type: String
        },
        url: {
          type: String
        }
      }
    ],
    approvalStatus: {
      type: String,
      enum: ["Approved", "Declined"]
    },
    comments: [
      {
        comment: { type: String },
        userName: { type: String },
        pic: { type: String },
        addTime: {
          type: Date,
          default: Date.now
        },
        status: {
          type: String
        },
        images: [
          {
            type: Schema.Types.ObjectId,
            ref: "Asset"
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReportRegistration", reportRegistrationSchema);
