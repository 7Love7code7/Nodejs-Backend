"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  crypto = require("crypto");

/**
 * User Schema
 */

var model;


var calcSchema = new Schema({
  projectId: {
    type: String,
  },
  companyId : {
		type : String,
		required : true
  },
  rateLog: [
    {
      currencyCode: {
        type: String
      },
      conversionFactor: {
        type: Number
      },
      date: {
        type: Date
      }
    }
  ],
  RootArray:[{
      
  }],
  currentVersion:{
    type:Number,
    default:0
  },
  versioning:[
    {
      versionSeq:Number,
      savedBy:{
        type:String,
      },
      saveDate:{
        type: Date,
        default: Date.now
      },
      //version related id's
       olderCalcSheetVersionId :{
         type: Schema.Types.ObjectId,
         ref: "calcSheetVersion"
      },
      sum:Number,
      totalCompanyCost:Number,
      totalWorkHours:Number,
      totalProfit:Number,
      totalCostPrice:Number,
      versionMessage:String,
    }
  ],
  hierarchicalCostSeqLast:Number,
  lastGroupId:Number,
  companyCurrency:{},
  companyProfit:Number,
  companyCost:Number,
  sum:Number,
 // totalSalesPrice:Number,
  totalprofit:Number,
  totalAdminCost:Number,
  totalRisk:Number,
  totalWorkHours:Number,
  totalCompanyCost:Number,
  totalCostPrice:Number,
  averageWorkerCost:Number,
  adminCost:Number,
  riskProfile:Number,
  additionalCosts:[],
  created: {
    type: Date,
    default: Date.now
  },

  

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

module.exports = model = mongoose.model("calcSheet", calcSchema);
