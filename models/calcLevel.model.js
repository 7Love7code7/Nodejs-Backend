"use strict";
const calcItem = require("/calcItem.model");
var mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  crypto = require("crypto");
  
  var calcLevelSchema = new Schema({
    isEdit:Boolean,
    slopeAndArea:Number,
    sumProfit:Number,
    sumHours:Number,
    sumSalesPrice:Number,
    name:String,
    custompath:String,
    id:Number,
    calcItems:{
        type: [
            {
                type: Schema.Types.ObjectId,
                ref: "calcItem",
            }]
    },
    sublevel:{
        type: [
            {
                type: Schema.Types.ObjectId,
                ref: "calcLevel",
            }]
    }
   
  });
  module.exports = model = mongoose.model("calcLevel", calcLevelSchema);

