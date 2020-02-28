"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Material Schema
 */

var HolidaySchema = new Schema({
  name: {
    type: String
  },
  // date : {
  //     type : Date
  // },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  companyId: {
    type: String
  },
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
  createdBy: {
    type: String
  },
  updatedBy: {
    type: String
  }
});

/**
 * Hook a pre save method
 */

HolidaySchema.pre("save", next => {
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

module.exports = mongoose.model("Holiday", HolidaySchema);
