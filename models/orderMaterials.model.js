"use strict";

var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

  /**
 * Material Order Schema
 */

var MaterialOrderSchema = new Schema(
    {

        Title:{
            type:String
        },
        materials:[
         {
            material: {
                type: Schema.Types.ObjectId,
                ref: "Material"
              },
            quantity: Number
         }
        ],
        projectId:{
            type: Schema.Types.ObjectId,
            ref: "Project"
        },
        priority:{
            type: String,
            enum: ["High", "Medium","Low"],
        },
        requiredDate:{
            type:Date
        },
        status:{
            type: String,
            enum: ["complete", "pending"],
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

    }
);

module.exports = mongoose.model("MaterialOrder", MaterialOrderSchema);