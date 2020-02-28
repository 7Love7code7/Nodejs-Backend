"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Material Schema
 */

var AssetSchema = new Schema({
  companyId: {
    type: String
  },
  projectId: {
    type: String
  },
  assetName: {
    type: String,
    default: "untitled"
  },
  assetCategory: {
    type: String,
    default: "untitled"
  },
  assetDescription: {
    type: String,
    default: "not provided"
  },
  originalname: {
    type: String
  },
  version: {
    type: String
  },
  resource_type: {
    type: String,
    enum: ["image", "3d_ifc", "3d_bcf", "3d_bvf", "3d_jszip"]
  },
  etag: {
    type: String
  },
  mimetype: {
    type: String
  },
  encoding: {
    type: String
  },
  width: {
    type: String
  },
  height: {
    type: String
  },
  format: {
    type: String
  },
  bytes: {
    type: String
  },
  url: {
    type: String
  },
  secure_url: {
    type: String
  },
  thumbnail: {
    type: String,
    default: ""
  },
  pages: {
    type: Number,
    default: 1
  },
  hierarchies: [{
    type: Schema.Types.ObjectId,
    ref: "Hierarchy"
  }],
  providerData: {},
  isActive: {
    type: Boolean,
    default: true
  },
  updated: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  },
  /* Markings info */
  serializedData: {
    type: String
  },
  /* Store reference of original image in marked image for updation */
  originalImage: {
    type: Schema.Types.ObjectId,
    ref: "Asset",
    default: null
  },
  /* Roofplan info */
  planDocument: {
    type: Boolean,
    default: false
  },
  planImages: {
    type: [{
      type: String
    }]
  },
  meetingRoomId: {
    type: Schema.Types.ObjectId,
    ref: "MeetingRoom",
    default: null
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

/**
 * Hook a pre save method
 */

AssetSchema.pre("save", next => {
  console.log(this);
  next();
});

/**
 * Hook validations for saving data
 */
let validateName = name => {
  //check for invalid names
  return /^[a-zA-Z ]{3,}$/.test(name);
};

module.exports = mongoose.model("Asset", AssetSchema);