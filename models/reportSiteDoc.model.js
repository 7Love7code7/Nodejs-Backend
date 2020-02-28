"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const reportSiteDocSchema = new Schema(
  {
    systemTag: {
      type: String,
      required: true
    },
    approvalStatus: {
      type: String,
      enum: ["Approved", "Declined"]
    },
    controlPlanItems: [],
    group: [{ type: String }],
    documents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Asset"
      }
    ],
    comments: [
      {
        comment: { type: String },
        userName: { type: String },
        pic: { type: String },
        addTime: { type: Date, default: Date.now },
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

module.exports = mongoose.model("ReportSiteDoc", reportSiteDocSchema);
