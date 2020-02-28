"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Entity Tag Schema
 */

var EntityTagSchema = new Schema(
  {
    name: {
      type: String,
      default: ""
    },
    prefix: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

/**
 * Hook a pre save method
 */

EntityTagSchema.pre("save", next => {
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

let validateToken = token => {
  //validate token
  return true;
};

module.exports = mongoose.model("EntityTag", EntityTagSchema);
