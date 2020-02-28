"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Issues Schema
 */

var MediaPlanetSchema = new Schema({
  cloudesMediaPlanetId: {
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
  name: {
    type: String,
    required: true
  },
  url: {
      type: String,
      required: true
  },
  size: {
    width: {
        type: Number
    },
    height: {
        type: Number
    }
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

module.exports = mongoose.model("MediaPlanet", MediaPlanetSchema);
