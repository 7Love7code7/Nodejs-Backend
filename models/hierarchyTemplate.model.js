"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Hierarchy Schema
 */

var hierarchyTemplateSchema = new Schema(
  {
    name: {
      type: String,
      default: "untitled"
    },
    hierarchy: {
      type: {},
      required: true
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("HierarchyTemplate", hierarchyTemplateSchema);
