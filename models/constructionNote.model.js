"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Issues Schema
 */

var ConstructionNoteSchema = new Schema({
  cloudesConstructionNoteId: {
    type: String
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: "Project"
  },
  title: {
    type: String,
    required: true
  },
  public_id: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String
  },
  description: {
    type: String
  },
  updated: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String
  }
});
/**
 * Hook a pre save method
 */

/**
 * Hook validations for saving data
 */

module.exports = mongoose.model("ContructionNote", ConstructionNoteSchema);
