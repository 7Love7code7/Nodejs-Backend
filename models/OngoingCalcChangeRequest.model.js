"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/**
 * Issues Schema
 */

var ongoingCalcChangeReqSchema = new Schema({
    projectId: {
        type: String,
        required: true
      },
      modelID:{
        type: String,
        required: true
      },
      calcData :{

      },
      createdBy:{
          type:String
      },
      createdDate:{
          type:Date,
          default:Date.now
      },
      calcSheetId:{
          type: Schema.Types.ObjectId,
          ref: "calcSheet"
      },
      calcSheetVersion:Number,

      updatedBy:{
          type:String
      },
      updatedDate:{
          type:Date
      },
      listChangeCommits:[
          {
              action:{
                  type:String,
                  enum:["add","update","delete","addUpdate"],
              },
              createdBy:String,
              createdDate:{
                  type:Date,
                  default:Date.now
              },
              data:[]

          }
      ]
});

module.exports = mongoose.model("ongoingCalcChangeReq", ongoingCalcChangeReqSchema);
