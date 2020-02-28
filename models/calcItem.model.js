"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  crypto = require("crypto");
  
  var calcItemSchema = new Schema({
    type:[{
        name:String,
        unit:String,
        currentRate:{
          materialCost:{
            value:Number
          },
          rooferCost:{
            value:Number
          }
        },
        systemTag:String,
        effectiveLabourCost:Number,
        initialPrice:Number,
        priceInclCompanyCost:Number,
        profit:Number,
        s_price:Number,
        Amount:Number,
        companyCostPercent:Number,
        profitPercent:Number,
        LabourHours:Number
      }]

  });

  module.exports = model = mongoose.model("calcItem", calcItemSchema);