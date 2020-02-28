"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Company Schema
 */

var controlPlanSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project"
    },
    systemTag: {
      type: String,
      required: true
    },
    plan: [],
    responsibleUsers: [],
    created: {
      type: Date,
      default: Date.now
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("controlplan", controlPlanSchema);
