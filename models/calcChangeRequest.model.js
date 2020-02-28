"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  crypto = require("crypto");

/**
 * User Schema
 */

var model;
var calcChangeReqSchema = new Schema({
    projectId: {
      type: String,
    },
    versionSeq:Number,
    calcData :{
      
    },
    createdBy:{
        type:String
    },
    created:{
        type:Date,
        default:Date.now
    },
    calcId:{
        type: Schema.Types.ObjectId,
        ref: "calcSheet"
    },
    submitStatus:{
        type: String,
        enum: ["PendingMerge", "Merged", "Rejected"],
        default:"PendingMerge"
    },
    updatedBy:{
        type:String
    },
    updatedDate:{
        type:Date
    },
    comments:[
        {
            commentTitle:String,
            createdBy:String,
            createdDate:{
                type:Date,
                default:Date.now
            }

        }
    ],
    modelId:{
        type:String
    }
    

});



module.exports = model = mongoose.model("calcChangeReq", calcChangeReqSchema);