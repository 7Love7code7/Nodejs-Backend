"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * User Schema
 */

var model;

var tagsSchema = new Schema(
  {
    tagName: {
      type: String,
      trim: true,
      required: "Please provide Tag Identifier name"
    },
    companyId: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = model = mongoose.model("Tag", tagsSchema);
