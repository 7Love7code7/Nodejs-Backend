"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

  var groupSchema = new Schema(
    {
      name:{
        type:String,
        required:true
      },
      systemTag: {
        type: String,
        required: true
      },
      teamleader:{
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      skills:[],
      workerslist:[{
        type: Schema.Types.ObjectId,
        ref: "User",
      }],
      created: {
        type: Date,
        default: Date.now
      },
      companyId: {
        type: Schema.Types.ObjectId,
        ref: "Company",
        required: true
      }
    }
    
  );
  
  module.exports = mongoose.model("employeeGroup", groupSchema);